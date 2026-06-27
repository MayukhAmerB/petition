use crate::domain::errors::DomainError;
use crate::domain::otp::OtpCache;
use async_trait::async_trait;
use deadpool_redis::Pool;
use redis::AsyncCommands;
use uuid::Uuid;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct RedisCache {
    pool: Pool,
}

impl RedisCache {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

#[derive(Serialize, Deserialize)]
struct SmsQueueItem {
    phone: String,
    code: String,
}

#[async_trait]
impl OtpCache for RedisCache {
    async fn set_otp(&self, phone: &str, code: &str, expiry_secs: u64) -> Result<(), DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("otp:{}", phone);
        // Bottleneck 7: Combined SET + EXPIRE in a single request
        let _: () = redis::cmd("SET")
            .arg(&key)
            .arg(code)
            .arg("EX")
            .arg(expiry_secs)
            .query_async(&mut conn)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in set_otp: {}", e)))?;

        Ok(())
    }

    async fn get_otp(&self, phone: &str) -> Result<Option<String>, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("otp:{}", phone);
        let code: Option<String> = conn
            .get(&key)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in get_otp: {}", e)))?;

        Ok(code)
    }

    async fn delete_otp(&self, phone: &str) -> Result<(), DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("otp:{}", phone);
        let _: () = conn
            .del(&key)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in delete_otp: {}", e)))?;

        Ok(())
    }

    async fn check_rate_limit(&self, phone: &str, max_requests: u32, window_secs: u64) -> Result<u32, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("ratelimit:{}", phone);
        
        // Pipelined atomic check and increment
        let mut pipe = redis::pipe();
        pipe.atomic()
            .cmd("INCR").arg(&key)
            .cmd("TTL").arg(&key);

        let (count, ttl): (u32, i64) = pipe
            .query_async(&mut conn)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in rate limit check: {}", e)))?;

        // If newly created (TTL was not set, returned -1 or similar)
        if ttl < 0 {
            let _: () = conn
                .expire(&key, window_secs as i64)
                .await
                .map_err(|e| DomainError::Internal(format!("Redis error in setting TTL: {}", e)))?;
        }

        if count > max_requests {
            return Err(DomainError::OtpTooManyRequests);
        }

        Ok(count)
    }

    async fn enqueue_sms_request(&self, phone: &str, code: &str) -> Result<(), DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let item = SmsQueueItem {
            phone: phone.to_string(),
            code: code.to_string(),
        };
        let payload = serde_json::to_string(&item)
            .map_err(|e| DomainError::Internal(format!("JSON serialization error: {}", e)))?;

        let _: () = conn
            .lpush("otp_queue", payload)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in lpush: {}", e)))?;

        Ok(())
    }

    async fn pop_sms_request(&self) -> Result<Option<(String, String)>, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        // BRPOP returns Option<(KeyName, Value)>
        let res: Option<(String, String)> = redis::cmd("BRPOP")
            .arg("otp_queue")
            .arg(2) // 2 second block timeout to avoid spinning
            .query_async(&mut conn)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in brpop: {}", e)))?;

        match res {
            Some((_, val)) => {
                let item: SmsQueueItem = serde_json::from_str(&val)
                    .map_err(|e| DomainError::Internal(format!("JSON deserialization error: {}", e)))?;
                Ok(Some((item.phone, item.code)))
            }
            None => Ok(None),
        }
    }

    async fn set_session(&self, token: &str, phone: &str, expiry_secs: u64) -> Result<(), DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("session:{}", token);
        let _: () = redis::cmd("SET")
            .arg(&key)
            .arg(phone)
            .arg("EX")
            .arg(expiry_secs)
            .query_async(&mut conn)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in set_session: {}", e)))?;

        Ok(())
    }

    async fn get_session(&self, token: &str) -> Result<Option<String>, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("session:{}", token);
        let phone: Option<String> = conn
            .get(&key)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in get_session: {}", e)))?;

        Ok(phone)
    }

    async fn acquire_lock(&self, key: &str, value: &str, ttl_secs: u64) -> Result<bool, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let lock_key = format!("lock:{}", key);
        let res: Option<String> = redis::cmd("SET")
            .arg(&lock_key)
            .arg(value)
            .arg("NX")
            .arg("EX")
            .arg(ttl_secs)
            .query_async(&mut conn)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in acquire_lock: {}", e)))?;

        Ok(res.is_some())
    }

    async fn release_lock(&self, key: &str, value: &str) -> Result<(), DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let lock_key = format!("lock:{}", key);

        // Safe lock release script (releases lock only if value matches)
        let script = r#"
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        "#;

        let _: () = redis::cmd("EVAL")
            .arg(script)
            .arg(1)
            .arg(&lock_key)
            .arg(value)
            .query_async(&mut conn)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in release_lock: {}", e)))?;

        Ok(())
    }

    async fn increment_signature_count(&self, petition_id: Uuid) -> Result<i32, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("petition:{}:cnt", petition_id);
        
        let mut pipe = redis::pipe();
        pipe.atomic()
            .cmd("INCR").arg(&key)
            .cmd("SADD").arg("dirty_counts").arg(petition_id.to_string());

        let (new_val, _): (i32, u32) = pipe
            .query_async(&mut conn)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in increment_signature_count: {}", e)))?;

        Ok(new_val)
    }

    async fn get_signature_count(&self, petition_id: Uuid) -> Result<Option<i32>, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("petition:{}:cnt", petition_id);
        let val: Option<i32> = conn
            .get(&key)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in get_signature_count: {}", e)))?;

        Ok(val)
    }

    async fn set_signature_count(&self, petition_id: Uuid, count: i32) -> Result<(), DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("petition:{}:cnt", petition_id);
        let _: () = conn
            .set(&key, count)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in set_signature_count: {}", e)))?;

        Ok(())
    }

    async fn list_dirty_counts(&self) -> Result<Vec<Uuid>, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let members: Vec<String> = conn
            .smembers("dirty_counts")
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in list_dirty_counts: {}", e)))?;

        let uuids = members
            .into_iter()
            .filter_map(|s| Uuid::parse_str(&s).ok())
            .collect();

        Ok(uuids)
    }

    async fn clear_dirty_count(&self, petition_id: Uuid) -> Result<(), DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let _: () = conn
            .srem("dirty_counts", petition_id.to_string())
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in clear_dirty_count: {}", e)))?;

        Ok(())
    }

    async fn get_petition_cache(&self, id: Uuid) -> Result<Option<String>, DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("petition:{}", id);
        let data: Option<String> = conn
            .get(&key)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in get_petition_cache: {}", e)))?;

        Ok(data)
    }

    async fn set_petition_cache(&self, id: Uuid, data: &str, ttl_secs: u64) -> Result<(), DomainError> {
        let mut conn = self.pool.get().await.map_err(|e| {
            DomainError::Internal(format!("Failed to get Redis connection: {}", e))
        })?;

        let key = format!("petition:{}", id);
        let _: () = redis::cmd("SET")
            .arg(&key)
            .arg(data)
            .arg("EX")
            .arg(ttl_secs)
            .query_async(&mut conn)
            .await
            .map_err(|e| DomainError::Internal(format!("Redis error in set_petition_cache: {}", e)))?;

        Ok(())
    }
}
