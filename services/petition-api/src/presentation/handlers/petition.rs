use crate::domain::errors::DomainError;
use crate::presentation::dto::PetitionResponse;
use crate::presentation::errors::AppError;
use crate::state::AppState;
use axum::{
    extract::{Path, State},
    http::{header, HeaderMap, HeaderValue},
    response::{IntoResponse, Response},
    Json,
};
use base64::{engine::general_purpose, Engine as _};
use uuid::Uuid;

pub async fn get_petition(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<PetitionResponse>, AppError> {
    let petition = state.get_petition_use_case.execute(id).await?;

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

pub async fn list_petitions(
    State(state): State<AppState>,
) -> Result<Json<Vec<PetitionResponse>>, AppError> {
    let petitions = state.list_active_petitions_use_case.execute().await?;

    let response = petitions
        .into_iter()
        .map(|p| PetitionResponse {
            id: p.id,
            title: p.title,
            description: p.description,
            terms: String::new(),
            signature_count: p.signature_count,
            is_active: p.is_active,
            created_at: p.created_at,
            image_data: p
                .image_data
                .map(|_| format!("/api/petition/{}/image", p.id)),
            eye_label: p.eye_label,
            goal: p.goal,
        })
        .collect();

    Ok(Json(response))
}

pub async fn get_petition_image(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Response, AppError> {
    let petition = state
        .petition_repo
        .find_by_id(id)
        .await?
        .ok_or(DomainError::PetitionNotFound)?;

    let image_data = petition.image_data.ok_or(DomainError::PetitionNotFound)?;
    let (content_type, encoded) = parse_data_uri(&image_data)?;
    let bytes = general_purpose::STANDARD
        .decode(encoded)
        .map_err(|_| DomainError::ValidationError("Invalid petition image data".to_string()))?;

    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(content_type).map_err(|_| {
            DomainError::ValidationError("Invalid petition image content type".to_string())
        })?,
    );
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("public, max-age=86400, stale-while-revalidate=604800"),
    );

    Ok((headers, bytes).into_response())
}

fn parse_data_uri(image_data: &str) -> Result<(&str, &str), DomainError> {
    let Some(data_uri) = image_data.strip_prefix("data:") else {
        return Err(DomainError::ValidationError(
            "Invalid petition image format".to_string(),
        ));
    };

    let Some((metadata, encoded)) = data_uri.split_once(',') else {
        return Err(DomainError::ValidationError(
            "Invalid petition image format".to_string(),
        ));
    };

    let Some(content_type) = metadata.strip_suffix(";base64") else {
        return Err(DomainError::ValidationError(
            "Invalid petition image encoding".to_string(),
        ));
    };

    if !matches!(
        content_type,
        "image/png" | "image/jpeg" | "image/webp" | "image/gif"
    ) {
        return Err(DomainError::ValidationError(
            "Unsupported petition image type".to_string(),
        ));
    }

    Ok((content_type, encoded))
}
