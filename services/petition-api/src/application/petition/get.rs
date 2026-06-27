use crate::domain::errors::DomainError;
use crate::domain::petition::{Petition, PetitionRepository};
use crate::domain::otp::OtpCache;
use std::sync::Arc;
use uuid::Uuid;

pub struct GetPetitionUseCase {
    petition_repo: Arc<dyn PetitionRepository>,
    otp_cache: Arc<dyn OtpCache>,
}

impl GetPetitionUseCase {
    pub fn new(petition_repo: Arc<dyn PetitionRepository>, otp_cache: Arc<dyn OtpCache>) -> Self {
        Self {
            petition_repo,
            otp_cache,
        }
    }

    pub async fn execute(&self, id: Uuid) -> Result<Petition, DomainError> {
        // 1. Try to read from cache-aside metadata
        if let Ok(Some(cached_json)) = self.otp_cache.get_petition_cache(id).await {
            if let Ok(mut petition) = serde_json::from_str::<Petition>(&cached_json) {
                // Merge live counter from Redis
                if let Ok(Some(live_count)) = self.otp_cache.get_signature_count(id).await {
                    petition.signature_count = live_count;
                }
                return Ok(petition);
            }
        }

        // 2. Cache miss: Fetch from Postgres
        let mut petition = self
            .petition_repo
            .find_by_id(id)
            .await?
            .ok_or(DomainError::PetitionNotFound)?;

        // 3. Align live counter in Redis
        let live_count = match self.otp_cache.get_signature_count(id).await {
            Ok(Some(count)) => {
                petition.signature_count = count;
                count
            }
            _ => {
                // Counter not yet in Redis, initialize it from DB value
                let db_count = petition.signature_count;
                let _ = self.otp_cache.set_signature_count(id, db_count).await;
                db_count
            }
        };

        // 4. Cache metadata back in Redis (30 second TTL as per Bottleneck 4)
        if let Ok(json_str) = serde_json::to_string(&petition) {
            let _ = self.otp_cache.set_petition_cache(id, &json_str, 30).await;
        }

        Ok(petition)
    }
}
