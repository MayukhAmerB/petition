use axum::{
    extract::State,
    Json,
};
use crate::state::AppState;
use crate::presentation::errors::AppError;
use crate::presentation::dto::{OtpRequest, OtpVerifyRequest, OtpVerifyResponse};

pub async fn request_otp(
    State(state): State<AppState>,
    Json(payload): Json<OtpRequest>,
) -> Result<Json<()>, AppError> {
    // Validate phone number format (digits only, 10-15 chars)
    crate::presentation::security::validate_phone(&payload.phone)?;

    state.request_otp_use_case.execute(&payload.phone).await?;
    Ok(Json(()))
}

pub async fn verify_otp(
    State(state): State<AppState>,
    Json(payload): Json<OtpVerifyRequest>,
) -> Result<Json<OtpVerifyResponse>, AppError> {
    // Validate phone number format
    crate::presentation::security::validate_phone(&payload.phone)?;
    // Validate OTP code format (exactly 6 digits)
    crate::presentation::security::validate_otp_code(&payload.code)?;

    let token = state
        .verify_otp_use_case
        .execute(&payload.phone, &payload.code)
        .await?;

    Ok(Json(OtpVerifyResponse { token }))
}
