use crate::domain::errors::DomainError;
use time::OffsetDateTime;
use uuid::Uuid;
use std::net::IpAddr;
use async_trait::async_trait;

#[derive(Debug, Clone)]
pub struct Signature {
    pub id: Uuid,
    pub petition_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub phone_number: String,
    pub phone_verified: bool,
    pub agreed_terms: bool,
    pub signed_at: OffsetDateTime,
    pub ip_address: Option<IpAddr>,
    pub user_agent: Option<String>,
}

#[async_trait]
pub trait SignatureRepository: Send + Sync {
    async fn find_by_phone(&self, petition_id: Uuid, phone: &str) -> Result<Option<Signature>, DomainError>;
    async fn create(&self, signature: &Signature) -> Result<(), DomainError>;
    async fn list_by_petition(&self, petition_id: Uuid) -> Result<Vec<Signature>, DomainError>;
}
