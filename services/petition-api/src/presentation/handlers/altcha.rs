use axum::{extract::State, Json};
use sha2::Sha256;
use hmac::{Hmac, Mac};
use crate::state::AppState;
use crate::presentation::errors::AppError;
use serde::Serialize;

#[derive(Serialize)]
pub struct AltchaChallenge {
    pub algorithm: String,
    pub challenge: String,
    pub maxnumber: u32,
    pub salt: String,
    pub signature: String,
}

pub async fn get_challenge(
    State(state): State<AppState>,
) -> Result<Json<AltchaChallenge>, AppError> {
    let (number, salt) = {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let num: u32 = rng.gen_range(0..20000); // 20k is fast to solve but stops spam bots
        let mut salt_bytes = [0u8; 12];
        rng.fill(&mut salt_bytes);
        (num, hex::encode(salt_bytes))
    };

    // Compute challenge: SHA-256(salt + number)
    let challenge_input = format!("{}{}", salt, number);
    
    use sha2::Digest;
    let mut hasher = Sha256::new();
    hasher.update(challenge_input.as_bytes());
    let challenge = hex::encode(hasher.finalize());
    
    // Compute signature: HMAC-SHA256(challenge, secret_key)
    let secret_key = &state.config.jwt_secret;
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(secret_key.as_bytes())
        .map_err(|e| crate::domain::errors::DomainError::Internal(format!("HMAC key error: {}", e)))?;
    mac.update(challenge.as_bytes());
    let signature = hex::encode(mac.finalize().into_bytes());

    Ok(Json(AltchaChallenge {
        algorithm: "SHA-256".to_string(),
        challenge,
        maxnumber: 20000,
        salt,
        signature,
    }))
}
