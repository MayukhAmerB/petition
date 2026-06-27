use std::fmt;

#[derive(Debug, Clone)]
pub enum DomainError {
    PetitionNotFound,
    AdminNotFound,
    InvalidCredentials,
    OtpExpired,
    OtpInvalid,
    OtpTooManyRequests,
    DuplicateSignature,
    SignatureValidationError(String),
    ValidationError(String),
    Internal(String),
}

impl fmt::Display for DomainError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DomainError::PetitionNotFound => write!(f, "Petition not found"),
            DomainError::AdminNotFound => write!(f, "Admin user not found"),
            DomainError::InvalidCredentials => write!(f, "Invalid admin credentials"),
            DomainError::OtpExpired => write!(f, "OTP has expired"),
            DomainError::OtpInvalid => write!(f, "Invalid OTP code"),
            DomainError::OtpTooManyRequests => write!(f, "Too many OTP requests. Please try again later."),
            DomainError::DuplicateSignature => write!(f, "A signature from this phone number already exists for this petition"),
            DomainError::SignatureValidationError(msg) => write!(f, "Signature validation failed: {}", msg),
            DomainError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            DomainError::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for DomainError {}
