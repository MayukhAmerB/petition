use axum::{
    extract::{State, ConnectInfo},
    http::HeaderMap,
    Json,
};
use crate::state::AppState;
use crate::presentation::errors::AppError;
use crate::presentation::dto::{SignPetitionRequest, SignatureResponse};
use std::net::{IpAddr, SocketAddr};

pub async fn sign_petition(
    State(state): State<AppState>,
    connect_info: ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(payload): Json<SignPetitionRequest>,
) -> Result<Json<SignatureResponse>, AppError> {
    // Resolve client IP (handles Nginx reverse proxy headers)
    let ip_address = get_client_ip(&headers, connect_info);

    // Resolve User-Agent header
    let user_agent = headers
        .get(axum::http::header::USER_AGENT)
        .and_then(|val| val.to_str().ok())
        .map(|s| s.to_string());

    // Input length validation
    crate::presentation::security::validate_max_length(&payload.first_name, "First name", 100)?;
    crate::presentation::security::validate_max_length(&payload.last_name, "Last name", 500)?;
    crate::presentation::security::validate_phone(&payload.phone)?;

    // Verify Captcha Answer
    let captcha_key = format!("captcha:{}", payload.captcha_id);
    let cached_answer = state.otp_cache.get_session(&captcha_key).await?;
    
    match cached_answer {
        Some(ans) => {
            // Delete used captcha to prevent replay attacks
            let _ = state.otp_cache.set_session(&captcha_key, "", 0).await;
            
            if ans.trim() != payload.captcha_answer.trim() {
                return Err(crate::domain::errors::DomainError::ValidationError(
                    "Incorrect captcha answer. Please try again.".to_string()
                ).into());
            }
        }
        None => {
            return Err(crate::domain::errors::DomainError::ValidationError(
                "Captcha challenge has expired or is invalid. Please reload the captcha.".to_string()
            ).into());
        }
    }

    // Verify Altcha Payload (Proof-of-Work protection)
    verify_altcha(&payload.altcha_payload, &state.config.jwt_secret, &*state.otp_cache).await?;

    // XSS sanitization
    let sanitized_first = crate::presentation::security::sanitize_html(&payload.first_name);
    let sanitized_last = crate::presentation::security::sanitize_demographic_json(&payload.last_name);

    let signature = state
        .sign_petition_use_case
        .execute(
            payload.phone,
            payload.petition_id,
            sanitized_first,
            sanitized_last,
            payload.agreed_terms,
            ip_address,
            user_agent,
        )
        .await?;

    Ok(Json(SignatureResponse {
        id: signature.id,
        petition_id: signature.petition_id,
        first_name: signature.first_name,
        last_name: signature.last_name,
        phone_number: signature.phone_number,
        signed_at: signature.signed_at,
        ip_address: signature.ip_address.map(|ip| ip.to_string()),
        user_agent: signature.user_agent,
    }))
}

async fn verify_altcha(payload_str: &str, jwt_secret: &str, otp_cache: &dyn crate::domain::otp::OtpCache) -> Result<(), crate::domain::errors::DomainError> {
    use base64::Engine;
    use sha2::Sha256;
    use hmac::{Hmac, Mac};
    use sha2::Digest;

    // 1. Base64 decode payload
    let decoded_bytes = base64::engine::general_purpose::STANDARD.decode(payload_str)
        .map_err(|_| crate::domain::errors::DomainError::ValidationError("Invalid Altcha payload encoding".to_string()))?;
    
    let decoded_str = String::from_utf8(decoded_bytes)
        .map_err(|_| crate::domain::errors::DomainError::ValidationError("Invalid Altcha UTF-8 payload".to_string()))?;
    
    #[derive(serde::Deserialize)]
    struct AltchaPayload {
        algorithm: String,
        challenge: String,
        maxnumber: u32,
        salt: String,
        signature: String,
        number: u32,
    }
    
    let altcha: AltchaPayload = serde_json::from_str(&decoded_str)
        .map_err(|_| crate::domain::errors::DomainError::ValidationError("Malformed Altcha JSON payload".to_string()))?;
    
    // 2. Validate algorithm
    if altcha.algorithm != "SHA-256" {
        return Err(crate::domain::errors::DomainError::ValidationError("Unsupported Altcha algorithm".to_string()));
    }
    
    // 3. Prevent replay attacks using Redis cache
    let replay_key = format!("altcha:used:{}", altcha.challenge);
    if let Some(_) = otp_cache.get_session(&replay_key).await? {
        return Err(crate::domain::errors::DomainError::ValidationError("Altcha challenge has already been used".to_string()));
    }
    // Mark challenge as used in Redis for 5 minutes (300s)
    otp_cache.set_session(&replay_key, "1", 300).await?;
    
    // 4. Verify signature: HMAC-SHA256(challenge, secret_key)
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(jwt_secret.as_bytes())
        .map_err(|e| crate::domain::errors::DomainError::Internal(format!("HMAC key error: {}", e)))?;
    mac.update(altcha.challenge.as_bytes());
    let expected_sig = hex::encode(mac.finalize().into_bytes());
    
    if expected_sig != altcha.signature {
        return Err(crate::domain::errors::DomainError::ValidationError("Invalid Altcha signature verification".to_string()));
    }
    
    // 5. Verify work: SHA-256(salt + number)
    let challenge_input = format!("{}{}", altcha.salt, altcha.number);
    let mut hasher = Sha256::new();
    hasher.update(challenge_input.as_bytes());
    let expected_challenge = hex::encode(hasher.finalize());
    
    if expected_challenge != altcha.challenge {
        return Err(crate::domain::errors::DomainError::ValidationError("Incorrect Altcha challenge solution".to_string()));
    }
    
    Ok(())
}

fn get_client_ip(headers: &HeaderMap, ConnectInfo(addr): ConnectInfo<SocketAddr>) -> Option<IpAddr> {
    // 1. Check X-Forwarded-For (standard header set by proxies like Nginx)
    if let Some(forwarded) = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()) {
        if let Some(ip_str) = forwarded.split(',').next() {
            if let Ok(ip) = ip_str.trim().parse::<IpAddr>() {
                return Some(ip);
            }
        }
    }

    // 2. Check X-Real-IP (alternative proxy header)
    if let Some(real_ip) = headers.get("x-real-ip").and_then(|h| h.to_str().ok()) {
        if let Ok(ip) = real_ip.trim().parse::<IpAddr>() {
            return Some(ip);
        }
    }

    // 3. Fallback to peer TCP address
    Some(addr.ip())
}
