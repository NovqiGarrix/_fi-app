//! fi-app sync server.
//!
//! A small Axum + sqlx (Postgres) service that implements the WatermelonDB sync
//! protocol for the fi-app mobile client. See `handlers.rs` for the routes and
//! `db.rs` for the pull/push algorithm.

mod db;
mod error;
mod handlers;
mod models;

use std::env;

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::routing::get;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

/// A full sync push can hold a lot of rows, so allow bodies well above Axum's
/// 2 MB default.
const MAX_BODY_BYTES: usize = 10 * 1024 * 1024;

/// Default local Postgres connection, used when `DATABASE_URL` is unset.
const DEFAULT_DATABASE_URL: &str = "postgres://postgres:postgres@localhost:5432/fi_app";

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "server=info,tower_http=info".into()),
        )
        .init();

    let database_url =
        env::var("DATABASE_URL").unwrap_or_else(|_| DEFAULT_DATABASE_URL.to_string());
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(4000);

    let pool = db::connect(&database_url)
        .await
        .expect("failed to connect to Postgres (set DATABASE_URL)");
    db::init(&pool)
        .await
        .expect("failed to initialize database schema");

    let app = Router::new()
        .route("/health", get(handlers::health))
        // WatermelonDB sync: GET pulls changes, POST pushes them.
        .route("/sync", get(handlers::pull).post(handlers::push))
        .layer(DefaultBodyLimit::max(MAX_BODY_BYTES))
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(pool);

    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|e| panic!("failed to bind {addr}: {e}"));

    tracing::info!("sync server listening on http://{addr}");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");
}

/// Resolves when the process receives Ctrl-C, allowing in-flight writes to finish.
async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("shutdown signal received, stopping");
}
