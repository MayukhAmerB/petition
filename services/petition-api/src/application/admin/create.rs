use crate::domain::errors::DomainError;
use crate::domain::petition::{Petition, PetitionRepository};
use std::sync::Arc;
use uuid::Uuid;
use time::OffsetDateTime;

pub struct CreatePetitionUseCase {
    petition_repo: Arc<dyn PetitionRepository>,
}

impl CreatePetitionUseCase {
    pub fn new(petition_repo: Arc<dyn PetitionRepository>) -> Self {
        Self { petition_repo }
    }

    pub async fn execute(
        &self,
        title: String,
        description: String,
        image_data: Option<String>,
        eye_label: Option<String>,
        terms: String,
        created_by: Uuid,
        goal: i32,
    ) -> Result<Petition, DomainError> {
        let petition = Petition {
            id: Uuid::new_v4(),
            title,
            description,
            image_data: image_data.and_then(|url| {
                let trimmed = url.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }),
            eye_label: eye_label.and_then(|l| {
                let trimmed = l.trim().to_string();
                if trimmed.is_empty() { None } else { Some(trimmed) }
            }),
            terms,
            created_by: Some(created_by),
            is_active: true,
            signature_count: 0,
            created_at: OffsetDateTime::now_utc(),
            goal,
        };

        self.petition_repo.create(&petition).await?;
        Ok(petition)
    }
}
