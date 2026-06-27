use axum::{extract::State, Json};
use uuid::Uuid;
use rand::Rng;
use crate::state::AppState;
use crate::presentation::errors::AppError;
use crate::presentation::dto::CaptchaResponse;

pub async fn generate_captcha(
    State(state): State<AppState>,
) -> Result<Json<CaptchaResponse>, AppError> {
    let (num1, num2) = {
        let mut rng = rand::thread_rng();
        (rng.gen_range(1..=10), rng.gen_range(1..=10))
    };
    let answer = num1 + num2;
    let question = format!("What is {} + {}?", num1, num2);

    let captcha_id = Uuid::new_v4().to_string();
    
    // Store answer in Redis cache session with a 5-minute (300s) TTL
    let session_key = format!("captcha:{}", captcha_id);
    state
        .otp_cache
        .set_session(&session_key, &answer.to_string(), 300)
        .await?;

    Ok(Json(CaptchaResponse {
        id: captcha_id,
        question,
    }))
}
