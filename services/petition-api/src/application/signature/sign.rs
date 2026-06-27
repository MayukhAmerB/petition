use crate::domain::errors::DomainError;
use crate::domain::petition::PetitionRepository;
use crate::domain::signature::{Signature, SignatureRepository};
use crate::domain::otp::OtpCache;
use std::sync::Arc;
use uuid::Uuid;
use std::net::IpAddr;
use time::OffsetDateTime;

pub struct SignPetitionUseCase {
    petition_repo: Arc<dyn PetitionRepository>,
    signature_repo: Arc<dyn SignatureRepository>,
    otp_cache: Arc<dyn OtpCache>,
}

impl SignPetitionUseCase {
    pub fn new(
        petition_repo: Arc<dyn PetitionRepository>,
        signature_repo: Arc<dyn SignatureRepository>,
        otp_cache: Arc<dyn OtpCache>,
    ) -> Self {
        Self {
            petition_repo,
            signature_repo,
            otp_cache,
        }
    }

    pub async fn execute(
        &self,
        phone: String,
        petition_id: Uuid,
        first_name: String,
        last_name: String,
        agreed_terms: bool,
        ip_address: Option<IpAddr>,
        user_agent: Option<String>,
    ) -> Result<Signature, DomainError> {
        // 1. Validate Terms and Conditions agreement
        if !agreed_terms {
            return Err(DomainError::SignatureValidationError(
                "You must agree to the terms and conditions".to_string(),
            ));
        }

        // 2. Validate first name and last name
        let first_name = first_name.trim().to_string();
        let last_name = last_name.trim().to_string();
        if first_name.is_empty() || last_name.is_empty() {
            return Err(DomainError::SignatureValidationError(
                "First name and last name cannot be empty".to_string(),
            ));
        }

        // 4. Ensure petition exists and is active
        let petition = self
            .petition_repo
            .find_by_id(petition_id)
            .await?
            .ok_or(DomainError::PetitionNotFound)?;

        if !petition.is_active {
            return Err(DomainError::SignatureValidationError("This petition is no longer active".to_string()));
        }

        // 5. Distributed Lock to prevent duplicate race conditions (Bottleneck 9)
        let lock_key = format!("sign:{}:{}", petition_id, phone);
        let lock_val = Uuid::new_v4().to_string();
        
        // Try acquiring lock with a 10-second TTL
        let lock_acquired = self.otp_cache.acquire_lock(&lock_key, &lock_val, 10).await?;
        if !lock_acquired {
            return Err(DomainError::DuplicateSignature);
        }

        // 6. Perform database actions and counter updates within the lock
        let result = self
            .execute_signed_transaction(
                petition_id,
                &phone,
                first_name,
                last_name,
                ip_address,
                user_agent,
            )
            .await;

        // 7. Ensure lock is released (Bottleneck 9)
        let _ = self.otp_cache.release_lock(&lock_key, &lock_val).await;

        result
    }

    async fn execute_signed_transaction(
        &self,
        petition_id: Uuid,
        phone: &str,
        first_name: String,
        last_name: String,
        ip_address: Option<IpAddr>,
        user_agent: Option<String>,
    ) -> Result<Signature, DomainError> {
        // Check if signature already exists (first layer of protection)
        if let Some(_) = self.signature_repo.find_by_phone(petition_id, phone).await? {
            return Err(DomainError::DuplicateSignature);
        }

        // Create new signature entity
        let signature = Signature {
            id: Uuid::new_v4(),
            petition_id,
            first_name,
            last_name,
            phone_number: phone.to_string(),
            phone_verified: true,
            agreed_terms: true,
            signed_at: OffsetDateTime::now_utc(),
            ip_address,
            user_agent,
        };

        // Write to database (will hit PostgreSQL unique constraint idx_unique_sig as absolute backstop - Bottleneck 9)
        self.signature_repo.create(&signature).await?;

        // Increment petition signature count in Redis cache (Bottleneck 4)
        let _ = self.otp_cache.increment_signature_count(petition_id).await;

        Ok(signature)
    }
}
