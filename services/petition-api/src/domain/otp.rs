use crate::domain::errors::DomainError;
use async_trait::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait SmsProvider: Send + Sync {
    async fn send_sms(&self, phone: &str, code: &str) -> Result<(), DomainError>;
}

#[async_trait]
pub trait OtpCache: Send + Sync {
    // OTP storage
    async fn set_otp(&self, phone: &str, code: &str, expiry_secs: u64) -> Result<(), DomainError>;
    async fn get_otp(&self, phone: &str) -> Result<Option<String>, DomainError>;
    async fn delete_otp(&self, phone: &str) -> Result<(), DomainError>;

    // OTP Rate limiting
    async fn check_rate_limit(&self, phone: &str, max_requests: u32, window_secs: u64) -> Result<u32, DomainError>;

    // Decoupled SMS queue
    async fn enqueue_sms_request(&self, phone: &str, code: &str) -> Result<(), DomainError>;
    async fn pop_sms_request(&self) -> Result<Option<(String, String)>, DomainError>;

    // Session validation
    async fn set_session(&self, token: &str, phone: &str, expiry_secs: u64) -> Result<(), DomainError>;
    async fn get_session(&self, token: &str) -> Result<Option<String>, DomainError>;

    // Distributed lock for preventing race conditions (Bottleneck 9)
    async fn acquire_lock(&self, key: &str, value: &str, ttl_secs: u64) -> Result<bool, DomainError>;
    async fn release_lock(&self, key: &str, value: &str) -> Result<(), DomainError>;

    // Petition signature counts caching (Bottleneck 4)
    async fn increment_signature_count(&self, petition_id: Uuid) -> Result<i32, DomainError>;
    async fn get_signature_count(&self, petition_id: Uuid) -> Result<Option<i32>, DomainError>;
    async fn set_signature_count(&self, petition_id: Uuid, count: i32) -> Result<(), DomainError>;
    async fn list_dirty_counts(&self) -> Result<Vec<Uuid>, DomainError>;
    async fn clear_dirty_count(&self, petition_id: Uuid) -> Result<(), DomainError>;

    // Petition metadata cache (Bottleneck 4)
    async fn get_petition_cache(&self, id: Uuid) -> Result<Option<String>, DomainError>;
    async fn set_petition_cache(&self, id: Uuid, data: &str, ttl_secs: u64) -> Result<(), DomainError>;
}
