use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use crate::domain::errors::DomainError;
use serde_json::json;

#[derive(Debug)]
pub struct AppError(pub DomainError);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_code, message) = match &self.0 {
            DomainError::PetitionNotFound => (
                StatusCode::NOT_FOUND,
                "PETITION_NOT_FOUND",
                self.0.to_string(),
            ),
            DomainError::AdminNotFound => (
                StatusCode::NOT_FOUND,
                "ADMIN_NOT_FOUND",
                self.0.to_string(),
            ),
            DomainError::InvalidCredentials => (
                StatusCode::UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                self.0.to_string(),
            ),
            DomainError::OtpExpired => (
                StatusCode::BAD_REQUEST,
                "OTP_EXPIRED",
                self.0.to_string(),
            ),
            DomainError::OtpInvalid => (
                StatusCode::BAD_REQUEST,
                "OTP_INVALID",
                self.0.to_string(),
            ),
            DomainError::OtpTooManyRequests => (
                StatusCode::TOO_MANY_REQUESTS,
                "OTP_RATE_LIMITED",
                self.0.to_string(),
            ),
            DomainError::DuplicateSignature => (
                StatusCode::CONFLICT,
                "DUPLICATE_SIGNATURE",
                self.0.to_string(),
            ),
            DomainError::SignatureValidationError(msg) => (
                StatusCode::BAD_REQUEST,
                "VALIDATION_ERROR",
                msg.clone(),
            ),
            DomainError::ValidationError(msg) => (
                StatusCode::BAD_REQUEST,
                "VALIDATION_ERROR",
                msg.clone(),
            ),
            DomainError::Internal(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                msg.clone(),
            ),
        };

        let body = Json(json!({
            "code": error_code,
            "message": message
        }));

        (status, body).into_response()
    }
}

impl From<DomainError> for AppError {
    fn from(inner: DomainError) -> Self {
        AppError(inner)
    }
}
