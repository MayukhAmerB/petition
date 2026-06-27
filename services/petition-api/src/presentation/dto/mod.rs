use serde::{Deserialize, Serialize};
use uuid::Uuid;
use time::OffsetDateTime;

// --- ADMIN DTOs ---

#[derive(Debug, Deserialize)]
pub struct AdminLoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AdminLoginResponse {
    pub token: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePetitionRequest {
    pub title: String,
    pub description: String,
    pub terms: String,
    pub image_data: Option<String>,
    pub eye_label: Option<String>,
    pub goal: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct PetitionResponse {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub terms: String,
    pub signature_count: i32,
    pub is_active: bool,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    pub image_data: Option<String>,
    pub eye_label: Option<String>,
    pub goal: i32,
}

// --- OTP DTOs ---

#[derive(Debug, Deserialize)]
pub struct OtpRequest {
    pub phone: String,
}

#[derive(Debug, Deserialize)]
pub struct OtpVerifyRequest {
    pub phone: String,
    pub code: String,
}

#[derive(Debug, Serialize)]
pub struct OtpVerifyResponse {
    pub token: String,
}

// --- SIGNATURE DTOs ---

#[derive(Debug, Deserialize)]
pub struct SignPetitionRequest {
    pub phone: String,
    pub petition_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub agreed_terms: bool,
    pub captcha_id: String,
    pub captcha_answer: String,
    pub altcha_payload: String,
}

#[derive(Debug, Serialize)]
pub struct CaptchaResponse {
    pub id: String,
    pub question: String,
}

#[derive(Debug, Serialize)]
pub struct SignatureResponse {
    pub id: Uuid,
    pub petition_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub phone_number: String,
    #[serde(with = "time::serde::rfc3339")]
    pub signed_at: OffsetDateTime,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
}
