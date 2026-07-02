use crate::domain::errors::DomainError;
use crate::domain::admin::{AdminUser, AdminRepository};
use crate::domain::petition::{Petition, PetitionRepository};
use crate::domain::signature::{Signature, SignatureRepository};
use async_trait::async_trait;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use std::net::IpAddr;
use ipnetwork::IpNetwork;

pub struct PostgresDb {
    pool: PgPool,
}

impl PostgresDb {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl AdminRepository for PostgresDb {
    async fn find_by_username(&self, username: &str) -> Result<Option<AdminUser>, DomainError> {
        let row = sqlx::query(
            "SELECT id, username, pass_hash, created_at FROM admin_users WHERE username = $1"
        )
        .bind(username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in find_by_username: {}", e)))?;

        match row {
            Some(r) => Ok(Some(AdminUser {
                id: r.get("id"),
                username: r.get("username"),
                pass_hash: r.get("pass_hash"),
                created_at: r.get("created_at"),
            })),
            None => Ok(None),
        }
    }

    async fn create(&self, admin: &AdminUser) -> Result<(), DomainError> {
        sqlx::query(
            "INSERT INTO admin_users (id, username, pass_hash, created_at) VALUES ($1, $2, $3, $4)"
        )
        .bind(admin.id)
        .bind(&admin.username)
        .bind(&admin.pass_hash)
        .bind(admin.created_at)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in create_admin: {}", e)))?;

        Ok(())
    }

    async fn exists(&self, username: &str) -> Result<bool, DomainError> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM admin_users WHERE username = $1"
        )
        .bind(username)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in admin_exists: {}", e)))?;

        Ok(count > 0)
    }
}

#[async_trait]
impl PetitionRepository for PostgresDb {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Petition>, DomainError> {
        let row = sqlx::query(
            "SELECT id, title, description, image_data, eye_label, terms, created_by, is_active, signature_count, created_at, goal \
             FROM petitions WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in find_petition: {}", e)))?;

        match row {
            Some(r) => Ok(Some(Petition {
                id: r.get("id"),
                title: r.get("title"),
                description: r.get("description"),
                terms: r.get("terms"),
                created_by: r.get("created_by"),
                is_active: r.get("is_active"),
                signature_count: r.get("signature_count"),
                created_at: r.get("created_at"),
                image_data: r.get("image_data"),
                eye_label: r.get("eye_label"),
                goal: r.get("goal"),
            })),
            None => Ok(None),
        }
    }

    async fn create(&self, petition: &Petition) -> Result<(), DomainError> {
        sqlx::query(
            "INSERT INTO petitions (id, title, description, image_data, eye_label, terms, created_by, is_active, signature_count, created_at, goal) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)"
        )
        .bind(petition.id)
        .bind(&petition.title)
        .bind(&petition.description)
        .bind(&petition.image_data)
        .bind(&petition.eye_label)
        .bind(&petition.terms)
        .bind(petition.created_by)
        .bind(petition.is_active)
        .bind(petition.signature_count)
        .bind(petition.created_at)
        .bind(petition.goal)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in create_petition: {}", e)))?;

        Ok(())
    }

    async fn update_signature_count(&self, id: Uuid, count: i32) -> Result<(), DomainError> {
        sqlx::query(
            "UPDATE petitions SET signature_count = $1 WHERE id = $2"
        )
        .bind(count)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in update_signature_count: {}", e)))?;

        Ok(())
    }

    async fn list_active(&self) -> Result<Vec<Petition>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, title, LEFT(description, 360) AS description, \
             CASE WHEN image_data IS NULL OR image_data = '' THEN NULL ELSE 'HAS_IMAGE' END AS image_data, \
             eye_label, '' AS terms, created_by, is_active, signature_count, created_at, goal \
             FROM petitions WHERE is_active = TRUE ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in list_active_petitions: {}", e)))?;

        let petitions = rows.into_iter().map(|r| Petition {
            id: r.get("id"),
            title: r.get("title"),
            description: r.get("description"),
            terms: r.get("terms"),
            created_by: r.get("created_by"),
            is_active: r.get("is_active"),
            signature_count: r.get("signature_count"),
            created_at: r.get("created_at"),
            image_data: r.get("image_data"),
            eye_label: r.get("eye_label"),
            goal: r.get("goal"),
        }).collect();

        Ok(petitions)
    }

    async fn list_all(&self) -> Result<Vec<Petition>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, title, LEFT(description, 360) AS description, NULL::text AS image_data, eye_label, '' AS terms, created_by, is_active, signature_count, created_at, goal \
             FROM petitions ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in list_all_petitions: {}", e)))?;

        let petitions = rows.into_iter().map(|r| Petition {
            id: r.get("id"),
            title: r.get("title"),
            description: r.get("description"),
            terms: r.get("terms"),
            created_by: r.get("created_by"),
            is_active: r.get("is_active"),
            signature_count: r.get("signature_count"),
            created_at: r.get("created_at"),
            image_data: r.get("image_data"),
            eye_label: r.get("eye_label"),
            goal: r.get("goal"),
        }).collect();

        Ok(petitions)
    }

    async fn update_active_status(&self, id: Uuid, is_active: bool) -> Result<(), DomainError> {
        sqlx::query(
            "UPDATE petitions SET is_active = $1 WHERE id = $2"
        )
        .bind(is_active)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in update_active_status: {}", e)))?;

        Ok(())
    }

    async fn update_goal(&self, id: Uuid, goal: i32) -> Result<(), DomainError> {
        sqlx::query(
            "UPDATE petitions SET goal = $1 WHERE id = $2"
        )
        .bind(goal)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in update_goal: {}", e)))?;

        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<(), DomainError> {
        sqlx::query(
            "DELETE FROM petitions WHERE id = $1"
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in delete_petition: {}", e)))?;

        Ok(())
    }
}

#[async_trait]
impl SignatureRepository for PostgresDb {
    async fn find_by_phone(&self, petition_id: Uuid, phone: &str) -> Result<Option<Signature>, DomainError> {
        let row = sqlx::query(
            "SELECT id, petition_id, first_name, last_name, phone_number, phone_verified, agreed_terms, signed_at, ip_address, user_agent \
             FROM signatures WHERE petition_id = $1 AND phone_number = $2"
        )
        .bind(petition_id)
        .bind(phone)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in find_signature_by_phone: {}", e)))?;

        match row {
            Some(r) => {
                let ip_net: Option<IpNetwork> = r.get("ip_address");
                let ip_address = ip_net.map(|net| net.ip());
                Ok(Some(Signature {
                    id: r.get("id"),
                    petition_id: r.get("petition_id"),
                    first_name: r.get("first_name"),
                    last_name: r.get("last_name"),
                    phone_number: r.get("phone_number"),
                    phone_verified: r.get("phone_verified"),
                    agreed_terms: r.get("agreed_terms"),
                    signed_at: r.get("signed_at"),
                    ip_address,
                    user_agent: r.get("user_agent"),
                }))
            },
            None => Ok(None),
        }
    }

    async fn create(&self, signature: &Signature) -> Result<(), DomainError> {
        let ip_net = signature.ip_address.map(IpNetwork::from);

        let res = sqlx::query(
            "INSERT INTO signatures (id, petition_id, first_name, last_name, phone_number, phone_verified, agreed_terms, signed_at, ip_address, user_agent) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
        )
        .bind(signature.id)
        .bind(signature.petition_id)
        .bind(&signature.first_name)
        .bind(&signature.last_name)
        .bind(&signature.phone_number)
        .bind(signature.phone_verified)
        .bind(signature.agreed_terms)
        .bind(signature.signed_at)
        .bind(ip_net)
        .bind(&signature.user_agent)
        .execute(&self.pool)
        .await;

        match res {
            Ok(_) => Ok(()),
            Err(e) => {
                if let Some(db_err) = e.as_database_error() {
                    // Postgres unique constraint violation code: 23505
                    if db_err.code().as_deref() == Some("23505") {
                        return Err(DomainError::DuplicateSignature);
                    }
                }
                Err(DomainError::Internal(format!("Database error in create_signature: {}", e)))
            }
        }
    }

    async fn list_by_petition(&self, petition_id: Uuid) -> Result<Vec<Signature>, DomainError> {
        let rows = sqlx::query(
            "SELECT id, petition_id, first_name, last_name, phone_number, phone_verified, agreed_terms, signed_at, ip_address, user_agent \
             FROM signatures WHERE petition_id = $1 ORDER BY signed_at DESC"
        )
        .bind(petition_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Internal(format!("Database error in list_signatures_by_petition: {}", e)))?;

        let signatures = rows.into_iter().map(|r| {
            let ip_net: Option<IpNetwork> = r.get("ip_address");
            let ip_address = ip_net.map(|net| net.ip());
            Signature {
                id: r.get("id"),
                petition_id: r.get("petition_id"),
                first_name: r.get("first_name"),
                last_name: r.get("last_name"),
                phone_number: r.get("phone_number"),
                phone_verified: r.get("phone_verified"),
                agreed_terms: r.get("agreed_terms"),
                signed_at: r.get("signed_at"),
                ip_address,
                user_agent: r.get("user_agent"),
            }
        }).collect();

        Ok(signatures)
    }
}
