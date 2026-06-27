use crate::domain::errors::DomainError;
use time::OffsetDateTime;
use uuid::Uuid;
use async_trait::async_trait;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Petition {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub terms: String,
    pub created_by: Option<Uuid>,
    pub is_active: bool,
    pub signature_count: i32,
    pub created_at: OffsetDateTime,
    pub image_data: Option<String>,
    pub eye_label: Option<String>,
    pub goal: i32,
}

#[async_trait]
pub trait PetitionRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Petition>, DomainError>;
    async fn create(&self, petition: &Petition) -> Result<(), DomainError>;
    async fn update_signature_count(&self, id: Uuid, count: i32) -> Result<(), DomainError>;
    async fn list_active(&self) -> Result<Vec<Petition>, DomainError>;
    async fn list_all(&self) -> Result<Vec<Petition>, DomainError>;
    async fn update_active_status(&self, id: Uuid, is_active: bool) -> Result<(), DomainError>;
    async fn update_goal(&self, id: Uuid, goal: i32) -> Result<(), DomainError>;
    async fn delete(&self, id: Uuid) -> Result<(), DomainError>;
}
