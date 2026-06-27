use crate::domain::otp::{SmsProvider, OtpCache};
use std::sync::Arc;
use tokio::sync::Semaphore;
use tracing::{error, info};

pub async fn start_otp_sender(
    otp_cache: Arc<dyn OtpCache>,
    sms_provider: Arc<dyn SmsProvider>,
) {
    info!("Starting background SMS OTP Sender worker...");

    // Concurrency limit of 20 (resolving Bottleneck 2)
    let semaphore = Arc::new(Semaphore::new(20));

    loop {
        // Pop next delivery request from the Redis list queue (blocks up to 2 seconds)
        match otp_cache.pop_sms_request().await {
            Ok(Some((phone, code))) => {
                let otp_cache_clone = otp_cache.clone();
                let sms_provider_clone = sms_provider.clone();
                
                // Acquire permit from the concurrency cap (blocks if 20 tasks are in flight)
                let permit = match semaphore.clone().acquire_owned().await {
                    Ok(p) => p,
                    Err(e) => {
                        error!("Failed to acquire concurrency semaphore permit: {}", e);
                        continue;
                    }
                };

                // Spawn task to send SMS asynchronously
                tokio::spawn(async move {
                    info!("Sending OTP to {}", phone);
                    if let Err(e) = sms_provider_clone.send_sms(&phone, &code).await {
                        error!("Failed to send SMS OTP to {}: {}", phone, e);
                        // Optionally: push back to queue or write to audit logs
                    } else {
                        info!("Successfully sent OTP to {}", phone);
                    }
                    // Permit is dropped automatically when task finishes
                    drop(permit);
                });
            }
            Ok(None) => {
                // BRPOP timed out after 2 seconds, continue loop
            }
            Err(e) => {
                error!("Error popping SMS request from queue: {}", e);
                // Pause briefly before retrying to avoid hammering Redis in case of connection drop
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
        }
    }
}
