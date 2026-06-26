//! Types describing the WatermelonDB sync protocol payloads.
//!
//! WatermelonDB's `synchronize()` speaks a fixed JSON shape. For each table it
//! groups records into `created`, `updated` and `deleted`, where created/updated
//! are full raw records (using the table's snake_case column names) and deleted
//! is a list of record ids:
//!
//! ```json
//! {
//!   "categories": { "created": [...], "updated": [...], "deleted": ["id", ...] },
//!   "expenses":   { "created": [...], "updated": [...], "deleted": [...] },
//!   "incomes":    { "created": [...], "updated": [...], "deleted": [...] }
//! }
//! ```
//!
//! The same `Changes` struct serializes for `pullChanges` (server -> client) and
//! deserializes for `pushChanges` (client -> server), so the column field names
//! must match the client schema exactly.

use serde::{Deserialize, Serialize};

/// The full set of changes for every synced table.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Changes {
    #[serde(default)]
    pub categories: TableChanges<CategoryRow>,
    #[serde(default)]
    pub expenses: TableChanges<ExpenseRow>,
    #[serde(default)]
    pub incomes: TableChanges<IncomeRow>,
}

/// Per-table created/updated/deleted buckets.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableChanges<T> {
    #[serde(default = "Vec::new")]
    pub created: Vec<T>,
    #[serde(default = "Vec::new")]
    pub updated: Vec<T>,
    /// Tombstones — just the ids of records the client deleted.
    #[serde(default = "Vec::new")]
    pub deleted: Vec<String>,
}

// Hand-written so `TableChanges<T>: Default` holds for any `T` (the derive would
// wrongly require `T: Default`).
impl<T> Default for TableChanges<T> {
    fn default() -> Self {
        Self {
            created: Vec::new(),
            updated: Vec::new(),
            deleted: Vec::new(),
        }
    }
}

/// A `categories` raw record. Mirrors `model/schema.ts` (id + columns).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryRow {
    pub id: String,
    pub name: String,
    pub color: String,
}

/// An `expenses` raw record. `created_at` is the WatermelonDB `@date` column
/// (Unix millis), not a sync timestamp.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpenseRow {
    pub id: String,
    pub title: String,
    pub amount: f64,
    pub category_id: String,
    pub created_at: i64,
}

/// An `incomes` raw record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomeRow {
    pub id: String,
    pub title: String,
    pub amount: f64,
    pub created_at: i64,
}
