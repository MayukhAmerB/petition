use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
};
use crate::state::AppState;
use crate::presentation::errors::AppError;
use crate::domain::errors::DomainError;
use crate::infrastructure::crypto::jwt;
use uuid::Uuid;

pub struct AdminClaims {
    pub user_id: Uuid,
}

#[async_trait]
impl<S> FromRequestParts<S> for AdminClaims
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or(AppError(DomainError::InvalidCredentials))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError(DomainError::InvalidCredentials));
        }

        let token = &auth_header[7..];

        let user_id = jwt::decode_token(token, &app_state.config.jwt_secret)
            .map_err(|_| AppError(DomainError::InvalidCredentials))?;

        Ok(AdminClaims { user_id })
    }
}
