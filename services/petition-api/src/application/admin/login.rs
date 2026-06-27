use crate::domain::errors::DomainError;
use crate::domain::admin::AdminRepository;
use crate::infrastructure::crypto::{bcrypt, jwt};
use std::sync::Arc;

pub struct LoginUseCase {
    admin_repo: Arc<dyn AdminRepository>,
    jwt_secret: String,
}

impl LoginUseCase {
    pub fn new(admin_repo: Arc<dyn AdminRepository>, jwt_secret: String) -> Self {
        Self {
            admin_repo,
            jwt_secret,
        }
    }

    pub async fn execute(&self, username: &str, password: &str) -> Result<String, DomainError> {
        let admin = self
            .admin_repo
            .find_by_username(username)
            .await?
            .ok_or(DomainError::InvalidCredentials)?;

        let is_valid = bcrypt::verify(password.to_string(), admin.pass_hash).await?;
        if !is_valid {
            return Err(DomainError::InvalidCredentials);
        }

        // Expire in 24 hours (86400 seconds)
        let token = jwt::encode_token(admin.id, &self.jwt_secret, 86400)?;
        Ok(token)
    }
}
