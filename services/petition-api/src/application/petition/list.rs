use crate::domain::errors::DomainError;
use crate::domain::petition::{Petition, PetitionRepository};
use crate::domain::otp::OtpCache;
use std::sync::Arc;

pub struct ListActivePetitionsUseCase {
    petition_repo: Arc<dyn PetitionRepository>,
    otp_cache: Arc<dyn OtpCache>,
}

impl ListActivePetitionsUseCase {
    pub fn new(petition_repo: Arc<dyn PetitionRepository>, otp_cache: Arc<dyn OtpCache>) -> Self {
        Self {
            petition_repo,
            otp_cache,
        }
    }

    pub async fn execute(&self) -> Result<Vec<Petition>, DomainError> {
        let mut petitions = self.petition_repo.list_active().await?;

        // Align each petition with its live signature count from Redis
        for petition in &mut petitions {
            if let Ok(Some(live_count)) = self.otp_cache.get_signature_count(petition.id).await {
                petition.signature_count = live_count;
            } else {
                let _ = self.otp_cache.set_signature_count(petition.id, petition.signature_count).await;
            }
        }

        Ok(petitions)
    }
}
