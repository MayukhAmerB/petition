use crate::domain::errors::DomainError;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use time::OffsetDateTime;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: i64,
    pub iat: i64,
}

pub fn encode_token(user_id: Uuid, secret: &str, expiry_secs: i64) -> Result<String, DomainError> {
    let now = OffsetDateTime::now_utc();
    let iat = now.unix_timestamp();
    let exp = iat + expiry_secs;

    let claims = Claims {
        sub: user_id.to_string(),
        exp,
        iat,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| DomainError::Internal(format!("JWT encoding failed: {}", e)))
}

pub fn decode_token(token: &str, secret: &str) -> Result<Uuid, DomainError> {
    let validation = Validation::default();
    
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|_| DomainError::InvalidCredentials)?;

    Uuid::parse_str(&token_data.claims.sub)
        .map_err(|_| DomainError::InvalidCredentials)
}
