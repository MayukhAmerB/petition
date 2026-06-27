use crate::domain::petition::PetitionRepository;
use crate::domain::otp::OtpCache;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tracing::{error, info};

pub async fn start_count_synchronizer(
    otp_cache: Arc<dyn OtpCache>,
    petition_repo: Arc<dyn PetitionRepository>,
) {
    info!("Starting background Petition Count Synchronizer worker (60s interval)...");

    loop {
        // Sleep for 60 seconds (resolving Bottleneck 4)
        sleep(Duration::from_secs(60)).await;

        info!("Running petition signature count synchronization...");

        // Fetch all petition IDs with live signature counter increments
        let dirty_petitions = match otp_cache.list_dirty_counts().await {
            Ok(list) => list,
            Err(e) => {
                error!("Failed to fetch dirty counts list from Redis: {}", e);
                continue;
            }
        };

        for id in dirty_petitions {
            // Get the live count cached in Redis
            let live_count = match otp_cache.get_signature_count(id).await {
                Ok(Some(count)) => count,
                Ok(None) => continue,
                Err(e) => {
                    error!("Failed to read live count for petition {}: {}", id, e);
                    continue;
                }
            };

            // Write back the updated count to Postgres
            match petition_repo.update_signature_count(id, live_count).await {
                Ok(_) => {
                    // Remove from dirty list if DB sync succeeded
                    let _ = otp_cache.clear_dirty_count(id).await;
                    info!("Synchronized signature count to DB: Petition {} -> {}", id, live_count);
                }
                Err(e) => {
                    error!("Failed to sync signature count to DB for petition {}: {}", id, e);
                }
            }
        }
    }
}
