//! A single error type for handlers that converts cleanly into HTTP responses.

use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    /// Something on the server side failed (e.g. database I/O).
    Internal(String),
}

impl AppError {
    fn parts(&self) -> (StatusCode, String) {
        match self {
            AppError::Internal(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, msg.clone())
            }
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = self.parts();
        if status == StatusCode::INTERNAL_SERVER_ERROR {
            tracing::error!(error = %message, "request failed");
        }
        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Internal(format!("io error: {err}"))
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Internal(format!("serialization error: {err}"))
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Internal(format!("database error: {err}"))
    }
}
