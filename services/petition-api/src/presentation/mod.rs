use axum::{
    routing::{get, post, delete},
    Router,
};
use crate::state::AppState;

pub mod dto;
pub mod errors;
pub mod handlers;
pub mod middleware;
pub mod security;

pub fn create_router(state: AppState) -> Router {
    Router::new()
        // Admin endpoints
        .route("/api/admin/login", post(handlers::admin::login))
        .route("/api/admin/petition/create", post(handlers::admin::create_petition))
        .route("/api/admin/petition/list", get(handlers::admin::list_petitions))
        .route("/api/admin/petition/:id/toggle", post(handlers::admin::toggle_petition))
        .route("/api/admin/petition/:id/update-goal", post(handlers::admin::update_goal))
        .route("/api/admin/petition/:id", delete(handlers::admin::delete_petition))
        .route("/api/admin/signatures/:id", get(handlers::admin::get_signatures))
        
        // Public petition endpoints
        .route("/api/petition/list", get(handlers::petition::list_petitions))
        .route("/api/petition/:id/image", get(handlers::petition::get_petition_image))
        .route("/api/petition/:id", get(handlers::petition::get_petition))
        .route("/api/captcha/generate", get(handlers::captcha::generate_captcha))
        
        // OTP verification endpoints
        .route("/api/otp/request", post(handlers::otp::request_otp))
        .route("/api/otp/verify", post(handlers::otp::verify_otp))
        
        // Petition signature submission
        .route("/api/petition/sign", post(handlers::sign::sign_petition))
        
        // System health check
        .route("/api/health", get(handlers::health::health_check))
        
        .with_state(state)
}
