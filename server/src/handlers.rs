//! HTTP route handlers implementing the WatermelonDB sync endpoints.

use std::time::{SystemTime, UNIX_EPOCH};

use axum::Json;
use axum::extract::{Query, State};
use serde::Deserialize;
use serde_json::{Value, json};
use sqlx::postgres::PgPool;

use crate::db;
use crate::error::AppError;
use crate::models::Changes;

/// `GET /health` — liveness probe.
pub async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

/// Query string sent by WatermelonDB's `pullChanges`. `last_pulled_at` arrives
/// as a string (and is empty on the very first sync), so we parse it leniently;
/// `schema_version` and `migration` are accepted but unused (this server has no
/// migration-aware sync yet).
#[derive(Debug, Deserialize)]
pub struct PullQuery {
    #[serde(default)]
    last_pulled_at: Option<String>,
}

impl PullQuery {
    /// Returns the last-pulled timestamp, defaulting to 0 (pull everything) when
    /// absent or unparseable.
    fn last(&self) -> i64 {
        self.last_pulled_at
            .as_deref()
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(0)
    }
}

/// `GET /sync` — `pullChanges`. Returns everything changed since the client's
/// `last_pulled_at`, plus the server timestamp to use as the next cursor.
pub async fn pull(
    State(pool): State<PgPool>,
    Query(query): Query<PullQuery>,
) -> Result<Json<Value>, AppError> {
    let last = query.last();
    let now = now_millis();

    let changes = db::pull(&pool, last, now).await?;
    tracing::info!(
        last_pulled_at = last,
        timestamp = now,
        "served pull"
    );

    Ok(Json(json!({
        "changes": changes,
        "timestamp": now,
    })))
}

/// `POST /sync` — `pushChanges`. Applies the client's local changes. The
/// `last_pulled_at` query param is part of the protocol but unused here, since
/// upserts are last-write-wins.
pub async fn push(
    State(pool): State<PgPool>,
    Json(changes): Json<Changes>,
) -> Result<Json<Value>, AppError> {
    let now = now_millis();
    db::push(&pool, &changes, now).await?;
    tracing::info!(
        categories = changes.categories.created.len() + changes.categories.updated.len(),
        expenses = changes.expenses.created.len() + changes.expenses.updated.len(),
        incomes = changes.incomes.created.len() + changes.incomes.updated.len(),
        "applied push"
    );
    Ok(Json(json!({ "status": "ok" })))
}

/// Current Unix time in milliseconds — the unit WatermelonDB uses for its sync
/// cursor (`Date.now()`).
fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}
