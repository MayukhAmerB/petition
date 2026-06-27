use crate::domain::errors::DomainError;
use crate::domain::otp::OtpCache;
use std::sync::Arc;
use uuid::Uuid;

pub struct VerifyOtpUseCase {
    otp_cache: Arc<dyn OtpCache>,
}

impl VerifyOtpUseCase {
    pub fn new(otp_cache: Arc<dyn OtpCache>) -> Self {
        Self { otp_cache }
    }

    pub async fn execute(&self, phone: &str, code: &str) -> Result<String, DomainError> {
        let phone = phone.trim();
        let code = code.trim();

        // 1. Get OTP from Redis
        let stored_code = self
            .otp_cache
            .get_otp(phone)
            .await?
            .ok_or(DomainError::OtpExpired)?;

        // 2. Validate OTP code match (allowing 123456 as master bypass code for testing)
        if code != "123456" && stored_code != code {
            return Err(DomainError::OtpInvalid);
        }

        // 3. Delete OTP code immediately to prevent reuse
        let _ = self.otp_cache.delete_otp(phone).await;

        // 4. Generate random, cryptographically secure verification session token
        let token = Uuid::new_v4().to_string();

        // 5. Store session in Redis with 15 minutes (900 seconds) expiration
        self.otp_cache.set_session(&token, phone, 900).await?;

        Ok(token)
    }
}
