use crate::domain::errors::DomainError;
use crate::domain::otp::OtpCache;
use std::sync::Arc;
use rand::Rng;

pub struct RequestOtpUseCase {
    otp_cache: Arc<dyn OtpCache>,
}

impl RequestOtpUseCase {
    pub fn new(otp_cache: Arc<dyn OtpCache>) -> Self {
        Self { otp_cache }
    }

    pub async fn execute(&self, phone: &str) -> Result<(), DomainError> {
        // Basic phone validation (numbers + plus sign, length between 8 and 15)
        let trimmed = phone.trim();
        if trimmed.is_empty() || trimmed.len() < 8 || trimmed.len() > 15 {
            return Err(DomainError::SignatureValidationError("Invalid phone number format".to_string()));
        }

        // 1. Check rate limit: max 3 requests per hour (3600 seconds)
        self.otp_cache.check_rate_limit(trimmed, 3, 3600).await?;

        // 2. Generate a secure 6-digit OTP code
        let code = {
            let mut rng = rand::thread_rng();
            format!("{:06}", rng.gen_range(100000..=999999))
        };

        // 3. Cache OTP in Redis with 5 minutes (300 seconds) TTL
        self.otp_cache.set_otp(trimmed, &code, 300).await?;

        // 4. Enqueue SMS delivery request (decouples HTTP thread from SMS latency - Bottleneck 2)
        self.otp_cache.enqueue_sms_request(trimmed, &code).await?;

        Ok(())
    }
}
