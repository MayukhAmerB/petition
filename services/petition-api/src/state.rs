use crate::config::Config;
use crate::domain::admin::AdminRepository;
use crate::domain::petition::PetitionRepository;
use crate::domain::signature::SignatureRepository;
use crate::domain::otp::OtpCache;
use crate::application::admin::{LoginUseCase, CreatePetitionUseCase};
use crate::application::petition::{GetPetitionUseCase, ListActivePetitionsUseCase};
use crate::application::otp::{RequestOtpUseCase, VerifyOtpUseCase};
use crate::application::signature::SignPetitionUseCase;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub admin_repo: Arc<dyn AdminRepository>,
    pub petition_repo: Arc<dyn PetitionRepository>,
    pub signature_repo: Arc<dyn SignatureRepository>,
    pub otp_cache: Arc<dyn OtpCache>,
    pub login_use_case: Arc<LoginUseCase>,
    pub create_petition_use_case: Arc<CreatePetitionUseCase>,
    pub get_petition_use_case: Arc<GetPetitionUseCase>,
    pub list_active_petitions_use_case: Arc<ListActivePetitionsUseCase>,
    pub request_otp_use_case: Arc<RequestOtpUseCase>,
    pub verify_otp_use_case: Arc<VerifyOtpUseCase>,
    pub sign_petition_use_case: Arc<SignPetitionUseCase>,
}
