use serde_json::{Value, Map};
use crate::presentation::errors::AppError;
use crate::domain::errors::DomainError;

// ─── HTML Entity Escaping (XSS Prevention) ───

/// Escapes all HTML-significant characters to prevent stored XSS.
/// Converts < > & " ' into their HTML entity equivalents.
/// Note: '/' is intentionally NOT escaped — React auto-escapes JSX output,
/// and escaping '/' corrupts URLs and base64 data URIs.
pub fn sanitize_html(input: &str) -> String {
    let mut escaped = String::with_capacity(input.len());
    for c in input.chars() {
        match c {
            '<' => escaped.push_str("&lt;"),
            '>' => escaped.push_str("&gt;"),
            '&' => escaped.push_str("&amp;"),
            '"' => escaped.push_str("&quot;"),
            '\'' => escaped.push_str("&#x27;"),
            _ => escaped.push(c),
        }
    }
    escaped
}

/// Sanitizes a JSON string containing demographic data.
/// Parses the JSON, escapes all string values, and re-serializes.
pub fn sanitize_demographic_json(json_str: &str) -> String {
    if let Ok(Value::Object(map)) = serde_json::from_str::<Value>(json_str) {
        let mut sanitized_map = Map::new();
        for (key, val) in map {
            let sanitized_val = match val {
                Value::String(s) => Value::String(sanitize_html(&s)),
                other => other,
            };
            sanitized_map.insert(key, sanitized_val);
        }
        if let Ok(serialized) = serde_json::to_string(&Value::Object(sanitized_map)) {
            return serialized;
        }
    }
    // Fallback: escape the raw string if not valid JSON
    sanitize_html(json_str)
}

// ─── Input Length Validation ───

/// Validates that a string input does not exceed the maximum allowed length.
/// Returns an AppError (HTTP 400) with a descriptive message if validation fails.
pub fn validate_max_length(value: &str, field_name: &str, max_len: usize) -> Result<(), AppError> {
    if value.len() > max_len {
        return Err(AppError(DomainError::ValidationError(
            format!("{} exceeds maximum length of {} characters", field_name, max_len),
        )));
    }
    Ok(())
}

// ─── Phone Number Format Validation ───

/// Validates phone number format: must contain only digits, optionally prefixed
/// with '+', and be between 10 and 15 characters long.
pub fn validate_phone(phone: &str) -> Result<(), AppError> {
    let digits_only = phone.strip_prefix('+').unwrap_or(phone);
    if digits_only.is_empty() || digits_only.len() < 10 || digits_only.len() > 15 {
        return Err(AppError(DomainError::ValidationError(
            "Phone number must be between 10 and 15 digits".to_string(),
        )));
    }
    if !digits_only.chars().all(|c| c.is_ascii_digit()) {
        return Err(AppError(DomainError::ValidationError(
            "Phone number must contain only digits".to_string(),
        )));
    }
    Ok(())
}

// ─── OTP Code Format Validation ───

/// Validates OTP code format: must be exactly 6 ASCII digits.
pub fn validate_otp_code(code: &str) -> Result<(), AppError> {
    if code.len() != 6 || !code.chars().all(|c| c.is_ascii_digit()) {
        return Err(AppError(DomainError::ValidationError(
            "OTP code must be exactly 6 digits".to_string(),
        )));
    }
    Ok(())
}
