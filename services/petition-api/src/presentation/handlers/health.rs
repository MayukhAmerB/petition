use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use crate::state::AppState;
use serde_json::{json, Value};

pub async fn health_check(
    State(state): State<AppState>,
) -> (StatusCode, Json<Value>) {
    let mut database_status = "up";
    let mut cache_status = "up";
    let mut exit_code = StatusCode::OK;

    // 1. Verify PostgreSQL connection
    // We check if the repository can successfully query the database.

    match state.admin_repo.exists("health_check_dummy").await {
        Ok(_) => {}
        Err(e) => {
            tracing::error!("Health Check: Database connection failed: {}", e);
            database_status = "down";
            exit_code = StatusCode::INTERNAL_SERVER_ERROR;
        }
    }

    // 2. Verify Redis cache connection
    // Let's acquire a connection from the pool and issue a PING command
    match state.otp_cache.get_otp("health_check_dummy").await {
        Ok(_) => {}
        Err(e) => {
            tracing::error!("Health Check: Redis cache connection failed: {}", e);
            cache_status = "down";
            exit_code = StatusCode::INTERNAL_SERVER_ERROR;
        }
    }

    let response = json!({
        "status": if exit_code == StatusCode::OK { "healthy" } else { "unhealthy" },
        "database": database_status,
        "cache": cache_status
    });

    (exit_code, Json(response))
}
