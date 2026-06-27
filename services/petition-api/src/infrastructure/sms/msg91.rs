use crate::domain::errors::DomainError;
use crate::domain::otp::SmsProvider;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;

pub struct Msg91SmsProvider {
    client: Client,
    auth_key: String,
    flow_id: String,
}

impl Msg91SmsProvider {
    pub fn new(auth_key: String, flow_id: String) -> Self {
        Self {
            client: Client::new(),
            auth_key,
            flow_id,
        }
    }
}

#[async_trait]
impl SmsProvider for Msg91SmsProvider {
    async fn send_sms(&self, phone: &str, code: &str) -> Result<(), DomainError> {
        let url = "https://control.msg91.com/api/v5/otp";

        let body = json!({
            "template_id": self.flow_id,
            "mobile": phone,
            "otp": code
        });

        let response = self
            .client
            .post(url)
            .header("authkey", &self.auth_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| DomainError::Internal(format!("Failed to connect to MSG91: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown MSG91 API error".to_string());
            return Err(DomainError::Internal(format!(
                "MSG91 SMS delivery failed (Status: {}): {}",
                status, text
            )));
        }

        Ok(())
    }
}
