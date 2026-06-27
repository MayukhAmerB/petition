mod config;
mod domain;
mod infrastructure;
mod application;
mod presentation;
mod state;

use crate::config::{Config, SmsProviderType};
use crate::state::AppState;
use crate::domain::admin::{AdminUser, AdminRepository};
use crate::domain::petition::PetitionRepository;
use crate::domain::signature::SignatureRepository;
use crate::domain::otp::{SmsProvider, OtpCache};
use crate::infrastructure::db::PostgresDb;
use crate::infrastructure::cache::RedisCache;
use crate::infrastructure::sms::{MockSmsProvider, TwilioSmsProvider, Msg91SmsProvider};
use crate::infrastructure::crypto::bcrypt;
use crate::infrastructure::workers::{start_otp_sender, start_count_synchronizer};
use crate::application::admin::{LoginUseCase, CreatePetitionUseCase};
use crate::application::petition::{GetPetitionUseCase, ListActivePetitionsUseCase};
use crate::application::otp::{RequestOtpUseCase, VerifyOtpUseCase};
use crate::application::signature::SignPetitionUseCase;
use crate::presentation::create_router;

use axum::extract::DefaultBodyLimit;
use std::sync::Arc;
use sqlx::postgres::PgPoolOptions;
use tracing::{info, error, Level};
use tracing_subscriber::FmtSubscriber;
use time::OffsetDateTime;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    info!("Starting Petition Web API...");

    // 2. Load configuration from environment
    let config = Config::from_env().map_err(|e| {
        error!("Configuration error: {}", e);
        e
    })?;

    // 3. Connect to PostgreSQL (through PgBouncer - Bottleneck 1)
    info!("Connecting to PostgreSQL database at {}...", config.database_url);
    let pg_pool = PgPoolOptions::new()
        .max_connections(50) // Matches PgBouncer default_pool_size = 60 connection limits
        .connect(&config.database_url)
        .await
        .map_err(|e| {
            error!("Failed to connect to PostgreSQL: {}", e);
            e
        })?;

    // Run database migrations if any (sqlx migrations)
    info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pg_pool)
        .await
        .map_err(|e| {
            error!("Failed to run database migrations: {}", e);
            e
        })?;

    // 4. Connect to Redis (Bottleneck 7)
    info!("Connecting to Redis cache at {}...", config.redis_url);
    let redis_cfg = deadpool_redis::Config::from_url(&config.redis_url);
    let redis_pool = redis_cfg
        .create_pool(Some(deadpool_redis::Runtime::Tokio1))
        .map_err(|e| {
            error!("Failed to create Redis pool: {}", e);
            Box::new(e) as Box<dyn std::error::Error>
        })?;

    // 5. Instantiate Repositories (SOLID Dependency Injection)
    let pg_db = Arc::new(PostgresDb::new(pg_pool));
    let admin_repo = pg_db.clone() as Arc<dyn AdminRepository>;
    let petition_repo = pg_db.clone() as Arc<dyn PetitionRepository>;
    let signature_repo = pg_db.clone() as Arc<dyn SignatureRepository>;

    // 6. Instantiate Redis Cache Adapter
    let redis_cache = Arc::new(RedisCache::new(redis_pool));
    let otp_cache = redis_cache.clone() as Arc<dyn OtpCache>;

    // 7. Instantiate SMS Provider based on environment configuration
    let sms_provider: Arc<dyn SmsProvider> = match config.sms_provider {
        SmsProviderType::Twilio => {
            let sid = config.twilio_account_sid.clone().unwrap_or_default();
            let token = config.twilio_auth_token.clone().unwrap_or_default();
            let from = config.twilio_from_number.clone().unwrap_or_default();
            info!("SMS Provider: Twilio");
            Arc::new(TwilioSmsProvider::new(sid, token, from))
        }
        SmsProviderType::Msg91 => {
            let key = config.msg91_auth_key.clone().unwrap_or_default();
            let flow = config.msg91_flow_id.clone().unwrap_or_default();
            info!("SMS Provider: MSG91");
            Arc::new(Msg91SmsProvider::new(key, flow))
        }
        SmsProviderType::Mock => {
            info!("SMS Provider: Mock (Console logger)");
            Arc::new(MockSmsProvider)
        }
    };

    // 8. Seed default admin user if none exists (Security Seeding requirement)
    let admin_exists = admin_repo.exists(&config.admin_username).await?;
    if !admin_exists {
        info!("No admin users found. Seeding default admin user '{}'...", config.admin_username);
        let hashed_pass = bcrypt::hash(config.admin_password.clone()).await?;
        let default_admin = AdminUser {
            id: Uuid::new_v4(),
            username: config.admin_username.clone(),
            pass_hash: hashed_pass,
            created_at: OffsetDateTime::now_utc(),
        };
        admin_repo.create(&default_admin).await?;
        info!("Default admin user seeded successfully.");
    }



    // 9. Instantiate Application Use Cases
    let login_use_case = Arc::new(LoginUseCase::new(admin_repo.clone(), config.jwt_secret.clone()));
    let create_petition_use_case = Arc::new(CreatePetitionUseCase::new(petition_repo.clone()));
    let get_petition_use_case = Arc::new(GetPetitionUseCase::new(petition_repo.clone(), otp_cache.clone()));
    let list_active_petitions_use_case = Arc::new(ListActivePetitionsUseCase::new(petition_repo.clone(), otp_cache.clone()));
    let request_otp_use_case = Arc::new(RequestOtpUseCase::new(otp_cache.clone()));
    let verify_otp_use_case = Arc::new(VerifyOtpUseCase::new(otp_cache.clone()));
    let sign_petition_use_case = Arc::new(SignPetitionUseCase::new(
        petition_repo.clone(),
        signature_repo.clone(),
        otp_cache.clone(),
    ));

    // 10. Start background workers
    let otp_cache_workers_1 = otp_cache.clone();
    let sms_provider_workers = sms_provider.clone();
    tokio::spawn(async move {
        start_otp_sender(otp_cache_workers_1, sms_provider_workers).await;
    });

    let otp_cache_workers_2 = otp_cache.clone();
    let petition_repo_workers = petition_repo.clone();
    tokio::spawn(async move {
        start_count_synchronizer(otp_cache_workers_2, petition_repo_workers).await;
    });

    // 11. Construct AppState container
    let state = AppState {
        config: config.clone(),
        admin_repo,
        petition_repo,
        signature_repo,
        otp_cache,
        login_use_case,
        create_petition_use_case,
        get_petition_use_case,
        list_active_petitions_use_case,
        request_otp_use_case,
        verify_otp_use_case,
        sign_petition_use_case,
    };

    // 12. Create Axum router and attach common middleware
    let cors = tower_http::cors::CorsLayer::new()
        .allow_origin(tower_http::cors::Any) // Nginx reverse proxy handles origin — API only accessible via localhost:3000 internal Docker network
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::DELETE,
        ])
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
        ])
        .max_age(std::time::Duration::from_secs(3600));

    let app = create_router(state)
        .layer(cors)
        .layer(DefaultBodyLimit::max(150 * 1024 * 1024))
        .layer(tower_http::trace::TraceLayer::new_for_http());

    // 13. Bind server and start listening
    let addr = format!("{}:{}", config.server_host, config.server_port);
    info!("Server listening on {}...", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app.into_make_service_with_connect_info::<std::net::SocketAddr>()).await?;

    Ok(())
}
