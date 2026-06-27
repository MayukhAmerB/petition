use crate::domain::errors::DomainError;
use crate::domain::otp::SmsProvider;
use async_trait::async_trait;
use tracing::info;

pub struct MockSmsProvider;

#[async_trait]
impl SmsProvider for MockSmsProvider {
    async fn send_sms(&self, phone: &str, code: &str) -> Result<(), DomainError> {
        info!("==================================================");
        info!(" [MOCK SMS SENDER] | Phone: {} | OTP: {}", phone, code);
        info!("==================================================");
        Ok(())
    }
}
