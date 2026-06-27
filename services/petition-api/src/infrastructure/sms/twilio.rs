use crate::domain::errors::DomainError;
use crate::domain::otp::SmsProvider;
use async_trait::async_trait;
use reqwest::Client;

pub struct TwilioSmsProvider {
    client: Client,
    account_sid: String,
    auth_token: String,
    from_number: String,
}

impl TwilioSmsProvider {
    pub fn new(account_sid: String, auth_token: String, from_number: String) -> Self {
        Self {
            client: Client::new(),
            account_sid,
            auth_token,
            from_number,
        }
    }
}

#[async_trait]
impl SmsProvider for TwilioSmsProvider {
    async fn send_sms(&self, phone: &str, code: &str) -> Result<(), DomainError> {
        let url = format!(
            "https://api.twilio.com/2010-04-01/Accounts/{}/Messages.json",
            self.account_sid
        );

        let body = format!("Your verification code is: {}", code);

        let response = self
            .client
            .post(&url)
            .basic_auth(&self.account_sid, Some(&self.auth_token))
            .form(&[
                ("To", phone),
                ("From", &self.from_number),
                ("Body", &body),
            ])
            .send()
            .await
            .map_err(|e| DomainError::Internal(format!("Failed to connect to Twilio: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown Twilio API error".to_string());
            return Err(DomainError::Internal(format!(
                "Twilio SMS delivery failed (Status: {}): {}",
                status, text
            )));
        }

        Ok(())
    }
}
