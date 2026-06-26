# fi-app sync server

A small [Axum](https://github.com/tokio-rs/axum) + [sqlx](https://github.com/launchbadge/sqlx)
(Postgres) service implementing the [WatermelonDB sync protocol](https://watermelondb.dev/docs/Sync/Backend)
for the fi-app mobile client.

The client (`client/lib/sync.ts`, triggered by `client/components/SyncButton.tsx`)
calls WatermelonDB's `synchronize()`, which:

- **pulls** changes from `GET /sync` (records the server has that the client
  doesn't), and
- **pushes** local changes to `POST /sync`.

The server is the source of truth, storing every synced row in Postgres along
with bookkeeping columns that drive the sync window.

## Prerequisites

A local Postgres with a database named `fi_app` (or point `DATABASE_URL`
elsewhere). For example:

```bash
# Homebrew
brew install postgresql@16 && brew services start postgresql@16
createdb fi_app

# or Docker
docker run --name fi-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fi_app \
  -p 5432:5432 -d postgres:16
```

The tables are created automatically on startup (`CREATE TABLE IF NOT EXISTS`),
so no migration step is needed.

## Run

```bash
cargo run
```

Configuration via environment variables:

| Variable       | Default                                              | Purpose                                   |
| -------------- | ---------------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/fi_app` | Postgres connection string                |
| `PORT`         | `4000`                                               | Port to listen on (matches client `.env`) |
| `RUST_LOG`     | `server=info,tower_http=info`                        | Log filter                                |

It binds to `0.0.0.0`, so the Android emulator reaches it via
`http://10.0.2.2:4000` (already set in `client/.env`).

## Endpoints

### `GET /sync` — pull

Query params (sent by WatermelonDB):

- `last_pulled_at` — server timestamp (ms) of the client's previous sync; empty
  on the first sync (pull everything).
- `schema_version`, `migration` — accepted but currently unused.

Returns the changes since `last_pulled_at`, plus the cursor for next time:

```json
{
  "changes": {
    "categories": { "created": [...], "updated": [...], "deleted": ["id", ...] },
    "expenses":   { "created": [...], "updated": [...], "deleted": [...] },
    "incomes":    { "created": [...], "updated": [...], "deleted": [...] }
  },
  "timestamp": 1719500000000
}
```

`created`/`updated` are full raw records using the client's snake_case column
names; `deleted` lists tombstoned ids.

### `POST /sync` — push

Body is the same `changes` shape as above (without `timestamp`). The server
upserts `created` + `updated` rows and soft-deletes `deleted` ids, all in one
transaction. Responds `{ "status": "ok" }`.

### `GET /health`

Liveness probe → `{ "status": "ok" }`.

## How sync works

Each synced table has three server-only columns:

- `_created_at` — server millis when the row was first inserted.
- `_updated_at` — server millis of the last create/update/delete.
- `_deleted_at` — server millis when soft-deleted, or `NULL` while live.

A **pull** for window `(last_pulled_at, now]` returns rows where:

- `created`: `_deleted_at IS NULL AND _created_at` in the window.
- `updated`: `_deleted_at IS NULL AND _created_at <= last AND _updated_at` in the window.
- `deleted`: `_deleted_at` in the window.

Soft-deleting (rather than removing rows) lets a second device — or the same
device after a reinstall — pull the tombstone and delete its local copy.
