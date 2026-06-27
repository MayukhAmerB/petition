use crate::domain::errors::DomainError;
use tokio::task;

pub async fn hash(password: String) -> Result<String, DomainError> {
    task::spawn_blocking(move || {
        bcrypt::hash(&password, bcrypt::DEFAULT_COST)
            .map_err(|e| DomainError::Internal(format!("Bcrypt hashing failed: {}", e)))
    })
    .await
    .map_err(|_| DomainError::Internal("Thread pool execution error".to_string()))?
}

pub async fn verify(password: String, hash: String) -> Result<bool, DomainError> {
    task::spawn_blocking(move || {
        bcrypt::verify(&password, &hash)
            .map_err(|e| DomainError::Internal(format!("Bcrypt verification failed: {}", e)))
    })
    .await
    .map_err(|_| DomainError::Internal("Thread pool execution error".to_string()))?
}
