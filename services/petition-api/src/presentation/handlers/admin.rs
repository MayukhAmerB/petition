use axum::{
    extract::{Path, State, ConnectInfo},
    http::HeaderMap,
    Json,
};
use crate::state::AppState;
use crate::presentation::errors::AppError;
use crate::presentation::middleware::auth::AdminClaims;
use crate::presentation::dto::{
    AdminLoginRequest, AdminLoginResponse, CreatePetitionRequest, PetitionResponse, SignatureResponse,
};
use uuid::Uuid;
use std::net::{IpAddr, SocketAddr};

fn get_client_ip(headers: &HeaderMap, connect_info: ConnectInfo<SocketAddr>) -> Option<IpAddr> {
    headers
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.split(',').next())
        .and_then(|s| s.parse().ok())
        .or(Some(connect_info.0.ip()))
}

pub async fn login(
    State(state): State<AppState>,
    connect_info: ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(payload): Json<AdminLoginRequest>,
) -> Result<Json<AdminLoginResponse>, AppError> {
    let ip_address = get_client_ip(&headers, connect_info).unwrap_or(IpAddr::V4(std::net::Ipv4Addr::new(127, 0, 0, 1)));
    let lockout_key = format!("admin_lockout:{}", ip_address);
    let fail_count_key = format!("admin_fail_count:{}", ip_address);

    // 1. Check if IP is currently locked out
    if let Some(_) = state.otp_cache.get_session(&lockout_key).await? {
        return Err(crate::domain::errors::DomainError::ValidationError(
            "Your IP has been locked out of the admin panel for 1 hour due to too many failed login attempts.".to_string()
        ).into());
    }

    // 2. Attempt login
    let login_result = state
        .login_use_case
        .execute(&payload.username, &payload.password)
        .await;

    match login_result {
        Ok(token) => {
            // Reset fail count on successful login
            let _ = state.otp_cache.set_session(&fail_count_key, "0", 0).await;
            Ok(Json(AdminLoginResponse { token }))
        }
        Err(e) => {
            // Increment fail count
            let current_fails = state
                .otp_cache
                .get_session(&fail_count_key)
                .await?
                .unwrap_or_default()
                .parse::<u32>()
                .unwrap_or(0);
            
            let new_fails = current_fails + 1;
            
            if new_fails >= 5 {
                // Lockout the IP for 1 hour (3600 seconds)
                state.otp_cache.set_session(&lockout_key, "locked", 3600).await?;
                // Reset failure count so it doesn't immediately stack upon expiry
                let _ = state.otp_cache.set_session(&fail_count_key, "0", 0).await;
                return Err(crate::domain::errors::DomainError::ValidationError(
                    "Too many failed login attempts. Your IP has been locked out of the admin panel for 1 hour.".to_string()
                ).into());
            } else {
                state.otp_cache.set_session(&fail_count_key, &new_fails.to_string(), 3600).await?;
                return Err(e.into());
            }
        }
    }
}

pub async fn create_petition(
    State(state): State<AppState>,
    claims: AdminClaims,
    Json(payload): Json<CreatePetitionRequest>,
) -> Result<Json<PetitionResponse>, AppError> {
    // Input length validation
    crate::presentation::security::validate_max_length(&payload.title, "Title", 200)?;
    crate::presentation::security::validate_max_length(&payload.description, "Description", 5000)?;
    crate::presentation::security::validate_max_length(&payload.terms, "Terms", 10000)?;
    if let Some(ref label) = payload.eye_label {
        crate::presentation::security::validate_max_length(label, "Eye label", 50)?;
    }

    // XSS sanitization (image_data is a URL/data-URI, not sanitized as HTML)
    let sanitized_title = crate::presentation::security::sanitize_html(&payload.title);
    let sanitized_desc = crate::presentation::security::sanitize_html(&payload.description);
    let sanitized_image = payload.image_data;
    let sanitized_eye = payload.eye_label.map(|s| crate::presentation::security::sanitize_html(&s));
    let sanitized_terms = crate::presentation::security::sanitize_html(&payload.terms);

    let petition = state
        .create_petition_use_case
        .execute(
            sanitized_title,
            sanitized_desc,
            sanitized_image,
            sanitized_eye,
            sanitized_terms,
            claims.user_id,
            payload.goal.unwrap_or(5000),
        )
        .await?;

    Ok(Json(PetitionResponse {
        id: petition.id,
        title: petition.title,
        description: petition.description,
        terms: petition.terms,
        signature_count: petition.signature_count,
        is_active: petition.is_active,
        created_at: petition.created_at,
        image_data: petition.image_data,
        eye_label: petition.eye_label,
        goal: petition.goal,
    }))
}

pub async fn get_signatures(
    State(state): State<AppState>,
    _claims: AdminClaims,
    Path(petition_id): Path<Uuid>,
) -> Result<Json<Vec<SignatureResponse>>, AppError> {
    let signatures = state
        .signature_repo
        .list_by_petition(petition_id)
        .await?;

    let dtos = signatures
        .into_iter()
        .map(|s| SignatureResponse {
            id: s.id,
            petition_id: s.petition_id,
            first_name: s.first_name,
            last_name: s.last_name,
            phone_number: s.phone_number,
            signed_at: s.signed_at,
            ip_address: s.ip_address.map(|ip| ip.to_string()),
            user_agent: s.user_agent,
        })
        .collect();

    Ok(Json(dtos))
}

#[derive(Debug, serde::Deserialize)]
pub struct ToggleRequest {
    pub is_active: bool,
}

pub async fn list_petitions(
    State(state): State<AppState>,
    _claims: AdminClaims,
) -> Result<Json<Vec<PetitionResponse>>, AppError> {
    let petitions = state.petition_repo.list_all().await?;
    let mut dtos = Vec::new();
    
    for petition in petitions {
        let mut count = petition.signature_count;
        if let Ok(Some(live_count)) = state.otp_cache.get_signature_count(petition.id).await {
            count = live_count;
        }
        
        dtos.push(PetitionResponse {
            id: petition.id,
            title: petition.title,
            description: petition.description,
            terms: petition.terms,
            signature_count: count,
            is_active: petition.is_active,
            created_at: petition.created_at,
            image_data: petition.image_data,
            eye_label: petition.eye_label,
            goal: petition.goal,
        });
    }

    Ok(Json(dtos))
}

pub async fn toggle_petition(
    State(state): State<AppState>,
    _claims: AdminClaims,
    Path(petition_id): Path<Uuid>,
    Json(payload): Json<ToggleRequest>,
) -> Result<Json<bool>, AppError> {
    state.petition_repo.update_active_status(petition_id, payload.is_active).await?;
    Ok(Json(payload.is_active))
}

pub async fn delete_petition(
    State(state): State<AppState>,
    _claims: AdminClaims,
    Path(petition_id): Path<Uuid>,
) -> Result<Json<bool>, AppError> {
    state.petition_repo.delete(petition_id).await?;
    Ok(Json(true))
}

#[derive(Debug, serde::Deserialize)]
pub struct UpdateGoalRequest {
    pub goal: i32,
}

pub async fn update_goal(
    State(state): State<AppState>,
    _claims: AdminClaims,
    Path(petition_id): Path<Uuid>,
    Json(payload): Json<UpdateGoalRequest>,
) -> Result<Json<i32>, AppError> {
    state.petition_repo.update_goal(petition_id, payload.goal).await?;
    Ok(Json(payload.goal))
}
