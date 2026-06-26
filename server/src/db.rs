//! Postgres-backed storage implementing the WatermelonDB sync algorithm.
//!
//! Each synced table carries three bookkeeping columns the client never sees:
//!   * `_created_at` — server millis when the row was first inserted.
//!   * `_updated_at` — server millis of the last create/update/delete.
//!   * `_deleted_at` — server millis when soft-deleted, or NULL while live.
//!
//! Soft-deleting (rather than hard-deleting) lets us report tombstones to a
//! client that pulls after the deletion (e.g. a second device or a reinstall).
//!
//! `pull` returns everything that changed in `(last_pulled_at, now]`, split into
//! created / updated / deleted exactly as WatermelonDB expects. `push` upserts
//! created+updated rows and soft-deletes the rest inside a single transaction.

use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::{Row, Transaction};

use crate::error::AppError;
use crate::models::{CategoryRow, Changes, ExpenseRow, IncomeRow, TableChanges};

/// Opens a connection pool to `database_url`.
pub async fn connect(database_url: &str) -> Result<PgPool, AppError> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?;
    Ok(pool)
}

/// Creates the synced tables if they don't already exist. Idempotent, so it's
/// safe to run on every boot.
pub async fn init(pool: &PgPool) -> Result<(), AppError> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS categories (
            id           TEXT PRIMARY KEY,
            name         TEXT NOT NULL,
            color        TEXT NOT NULL,
            _created_at  BIGINT NOT NULL,
            _updated_at  BIGINT NOT NULL,
            _deleted_at  BIGINT
        );
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS expenses (
            id           TEXT PRIMARY KEY,
            title        TEXT NOT NULL,
            amount       DOUBLE PRECISION NOT NULL,
            category_id  TEXT NOT NULL,
            created_at   BIGINT NOT NULL,
            _created_at  BIGINT NOT NULL,
            _updated_at  BIGINT NOT NULL,
            _deleted_at  BIGINT
        );
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS incomes (
            id           TEXT PRIMARY KEY,
            title        TEXT NOT NULL,
            amount       DOUBLE PRECISION NOT NULL,
            created_at   BIGINT NOT NULL,
            _created_at  BIGINT NOT NULL,
            _updated_at  BIGINT NOT NULL,
            _deleted_at  BIGINT
        );
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Collects every change in the window `(last, now]` for all tables.
pub async fn pull(pool: &PgPool, last: i64, now: i64) -> Result<Changes, AppError> {
    Ok(Changes {
        categories: pull_categories(pool, last, now).await?,
        expenses: pull_expenses(pool, last, now).await?,
        incomes: pull_incomes(pool, last, now).await?,
    })
}

async fn pull_categories(
    pool: &PgPool,
    last: i64,
    now: i64,
) -> Result<TableChanges<CategoryRow>, AppError> {
    let map = |r: &sqlx::postgres::PgRow| CategoryRow {
        id: r.get("id"),
        name: r.get("name"),
        color: r.get("color"),
    };

    let created = sqlx::query(
        "SELECT id, name, color FROM categories \
         WHERE _deleted_at IS NULL AND _created_at > $1 AND _created_at <= $2",
    )
    .bind(last)
    .bind(now)
    .fetch_all(pool)
    .await?
    .iter()
    .map(map)
    .collect();

    let updated = sqlx::query(
        "SELECT id, name, color FROM categories \
         WHERE _deleted_at IS NULL AND _created_at <= $1 AND _updated_at > $1 AND _updated_at <= $2",
    )
    .bind(last)
    .bind(now)
    .fetch_all(pool)
    .await?
    .iter()
    .map(map)
    .collect();

    let deleted = pull_deleted_ids(pool, "categories", last, now).await?;

    Ok(TableChanges {
        created,
        updated,
        deleted,
    })
}

async fn pull_expenses(
    pool: &PgPool,
    last: i64,
    now: i64,
) -> Result<TableChanges<ExpenseRow>, AppError> {
    let map = |r: &sqlx::postgres::PgRow| ExpenseRow {
        id: r.get("id"),
        title: r.get("title"),
        amount: r.get("amount"),
        category_id: r.get("category_id"),
        created_at: r.get("created_at"),
    };

    let created = sqlx::query(
        "SELECT id, title, amount, category_id, created_at FROM expenses \
         WHERE _deleted_at IS NULL AND _created_at > $1 AND _created_at <= $2",
    )
    .bind(last)
    .bind(now)
    .fetch_all(pool)
    .await?
    .iter()
    .map(map)
    .collect();

    let updated = sqlx::query(
        "SELECT id, title, amount, category_id, created_at FROM expenses \
         WHERE _deleted_at IS NULL AND _created_at <= $1 AND _updated_at > $1 AND _updated_at <= $2",
    )
    .bind(last)
    .bind(now)
    .fetch_all(pool)
    .await?
    .iter()
    .map(map)
    .collect();

    let deleted = pull_deleted_ids(pool, "expenses", last, now).await?;

    Ok(TableChanges {
        created,
        updated,
        deleted,
    })
}

async fn pull_incomes(
    pool: &PgPool,
    last: i64,
    now: i64,
) -> Result<TableChanges<IncomeRow>, AppError> {
    let map = |r: &sqlx::postgres::PgRow| IncomeRow {
        id: r.get("id"),
        title: r.get("title"),
        amount: r.get("amount"),
        created_at: r.get("created_at"),
    };

    let created = sqlx::query(
        "SELECT id, title, amount, created_at FROM incomes \
         WHERE _deleted_at IS NULL AND _created_at > $1 AND _created_at <= $2",
    )
    .bind(last)
    .bind(now)
    .fetch_all(pool)
    .await?
    .iter()
    .map(map)
    .collect();

    let updated = sqlx::query(
        "SELECT id, title, amount, created_at FROM incomes \
         WHERE _deleted_at IS NULL AND _created_at <= $1 AND _updated_at > $1 AND _updated_at <= $2",
    )
    .bind(last)
    .bind(now)
    .fetch_all(pool)
    .await?
    .iter()
    .map(map)
    .collect();

    let deleted = pull_deleted_ids(pool, "incomes", last, now).await?;

    Ok(TableChanges {
        created,
        updated,
        deleted,
    })
}

/// Ids soft-deleted within `(last, now]`. The table name is a fixed literal
/// chosen by the caller, never user input, so the format is safe.
async fn pull_deleted_ids(
    pool: &PgPool,
    table: &str,
    last: i64,
    now: i64,
) -> Result<Vec<String>, AppError> {
    let sql = format!("SELECT id FROM {table} WHERE _deleted_at > $1 AND _deleted_at <= $2");
    let ids = sqlx::query(&sql)
        .bind(last)
        .bind(now)
        .fetch_all(pool)
        .await?
        .iter()
        .map(|r| r.get::<String, _>("id"))
        .collect();
    Ok(ids)
}

/// Applies a client's pushed changes in one transaction.
pub async fn push(pool: &PgPool, changes: &Changes, now: i64) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;

    for c in changes
        .categories
        .created
        .iter()
        .chain(&changes.categories.updated)
    {
        upsert_category(&mut tx, c, now).await?;
    }
    for id in &changes.categories.deleted {
        soft_delete(&mut tx, "categories", id, now).await?;
    }

    for e in changes
        .expenses
        .created
        .iter()
        .chain(&changes.expenses.updated)
    {
        upsert_expense(&mut tx, e, now).await?;
    }
    for id in &changes.expenses.deleted {
        soft_delete(&mut tx, "expenses", id, now).await?;
    }

    for i in changes
        .incomes
        .created
        .iter()
        .chain(&changes.incomes.updated)
    {
        upsert_income(&mut tx, i, now).await?;
    }
    for id in &changes.incomes.deleted {
        soft_delete(&mut tx, "incomes", id, now).await?;
    }

    tx.commit().await?;
    Ok(())
}

async fn upsert_category(
    tx: &mut Transaction<'_, sqlx::Postgres>,
    c: &CategoryRow,
    now: i64,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO categories (id, name, color, _created_at, _updated_at, _deleted_at) \
         VALUES ($1, $2, $3, $4, $4, NULL) \
         ON CONFLICT (id) DO UPDATE SET \
            name = EXCLUDED.name, \
            color = EXCLUDED.color, \
            _updated_at = EXCLUDED._updated_at, \
            _deleted_at = NULL",
    )
    .bind(&c.id)
    .bind(&c.name)
    .bind(&c.color)
    .bind(now)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

async fn upsert_expense(
    tx: &mut Transaction<'_, sqlx::Postgres>,
    e: &ExpenseRow,
    now: i64,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO expenses (id, title, amount, category_id, created_at, _created_at, _updated_at, _deleted_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $6, NULL) \
         ON CONFLICT (id) DO UPDATE SET \
            title = EXCLUDED.title, \
            amount = EXCLUDED.amount, \
            category_id = EXCLUDED.category_id, \
            created_at = EXCLUDED.created_at, \
            _updated_at = EXCLUDED._updated_at, \
            _deleted_at = NULL",
    )
    .bind(&e.id)
    .bind(&e.title)
    .bind(e.amount)
    .bind(&e.category_id)
    .bind(e.created_at)
    .bind(now)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

async fn upsert_income(
    tx: &mut Transaction<'_, sqlx::Postgres>,
    i: &IncomeRow,
    now: i64,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO incomes (id, title, amount, created_at, _created_at, _updated_at, _deleted_at) \
         VALUES ($1, $2, $3, $4, $5, $5, NULL) \
         ON CONFLICT (id) DO UPDATE SET \
            title = EXCLUDED.title, \
            amount = EXCLUDED.amount, \
            created_at = EXCLUDED.created_at, \
            _updated_at = EXCLUDED._updated_at, \
            _deleted_at = NULL",
    )
    .bind(&i.id)
    .bind(&i.title)
    .bind(i.amount)
    .bind(i.created_at)
    .bind(now)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

/// Marks a row as deleted without removing it, so the tombstone can be pulled
/// by other clients. `table` is a fixed literal chosen by the caller.
async fn soft_delete(
    tx: &mut Transaction<'_, sqlx::Postgres>,
    table: &str,
    id: &str,
    now: i64,
) -> Result<(), AppError> {
    let sql = format!("UPDATE {table} SET _deleted_at = $1, _updated_at = $1 WHERE id = $2");
    sqlx::query(&sql)
        .bind(now)
        .bind(id)
        .execute(&mut **tx)
        .await?;
    Ok(())
}
