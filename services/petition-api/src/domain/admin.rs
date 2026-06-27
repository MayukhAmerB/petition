use crate::domain::errors::DomainError;
use time::OffsetDateTime;
use uuid::Uuid;
use async_trait::async_trait;

#[derive(Debug, Clone)]
pub struct AdminUser {
    pub id: Uuid,
    pub username: String,
    pub pass_hash: String,
    pub created_at: OffsetDateTime,
}

#[async_trait]
pub trait AdminRepository: Send + Sync {
    async fn find_by_username(&self, username: &str) -> Result<Option<AdminUser>, DomainError>;
    async fn create(&self, admin: &AdminUser) -> Result<(), DomainError>;
    async fn exists(&self, username: &str) -> Result<bool, DomainError>;
}
