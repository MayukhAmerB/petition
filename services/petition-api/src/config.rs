use std::env;

#[derive(Clone, Debug)]
pub enum SmsProviderType {
    Twilio,
    Msg91,
    Mock,
}

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub sms_provider: SmsProviderType,
    pub twilio_account_sid: Option<String>,
    pub twilio_auth_token: Option<String>,
    pub twilio_from_number: Option<String>,
    pub msg91_auth_key: Option<String>,
    pub msg91_flow_id: Option<String>,
    pub server_host: String,
    pub server_port: u16,
    pub admin_username: String,
    pub admin_password: String,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        // Load .env if present
        let _ = dotenvy::dotenv();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://petition_user:postgres@localhost:5433/petition_db".to_string());
        
        let redis_url = env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());

        let jwt_secret = env::var("JWT_SECRET")
            .map_err(|_| "JWT_SECRET environment variable is required".to_string())?;

        let provider_str = env::var("SMS_PROVIDER")
            .unwrap_or_else(|_| "mock".to_string())
            .to_lowercase();

        let sms_provider = match provider_str.as_str() {
            "twilio" => SmsProviderType::Twilio,
            "msg91" => SmsProviderType::Msg91,
            _ => SmsProviderType::Mock,
        };

        let twilio_account_sid = env::var("TWILIO_ACCOUNT_SID").ok();
        let twilio_auth_token = env::var("TWILIO_AUTH_TOKEN").ok();
        let twilio_from_number = env::var("TWILIO_FROM_NUMBER").ok();

        let msg91_auth_key = env::var("MSG91_AUTH_KEY").ok();
        let msg91_flow_id = env::var("MSG91_FLOW_ID").ok();

        let server_host = env::var("SERVER_HOST")
            .unwrap_or_else(|_| "0.0.0.0".to_string());

        let server_port = env::var("SERVER_PORT")
            .ok()
            .and_then(|p| p.parse::<u16>().ok())
            .unwrap_or(3000);

        let admin_username = env::var("ADMIN_USERNAME")
            .unwrap_or_else(|_| "admin".to_string());

        let admin_password = env::var("ADMIN_PASSWORD")
            .map_err(|_| "ADMIN_PASSWORD environment variable is required".to_string())?;

        Ok(Config {
            database_url,
            redis_url,
            jwt_secret,
            sms_provider,
            twilio_account_sid,
            twilio_auth_token,
            twilio_from_number,
            msg91_auth_key,
            msg91_flow_id,
            server_host,
            server_port,
            admin_username,
            admin_password,
        })
    }
}
