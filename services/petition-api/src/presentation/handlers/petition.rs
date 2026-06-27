use axum::{
    extract::{Path, State},
    Json,
};
use crate::state::AppState;
use crate::presentation::errors::AppError;
use crate::presentation::dto::PetitionResponse;
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
            terms: p.terms,
            signature_count: p.signature_count,
            is_active: p.is_active,
            created_at: p.created_at,
            image_data: p.image_data,
            eye_label: p.eye_label,
            goal: p.goal,
        })
        .collect();

    Ok(Json(response))
}
