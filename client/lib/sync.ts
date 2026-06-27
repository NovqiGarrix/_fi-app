import { synchronize } from "@nozbe/watermelondb/sync";
import { API_URL } from "@/utils/constants";
import { database } from "./db";

/**
 * Runs a full WatermelonDB sync against the server's `/sync` endpoint.
 *
 * `synchronize()` first pulls the server's changes since our last sync, then
 * pushes our local changes. The server is the source of truth and resolves
 * conflicts last-write-wins. Throws if the server can't be reached or returns a
 * non-2xx response, so callers can surface the failure to the user.
 */
export async function sync(): Promise<void> {
  await synchronize({
    database,

    // Pull: ask the server for everything that changed since `lastPulledAt`.
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const params = new URLSearchParams({
        // First sync: lastPulledAt is null -> empty, meaning "pull everything".
        last_pulled_at: lastPulledAt == null ? "" : String(lastPulledAt),
        schema_version: String(schemaVersion),
        migration: migration == null ? "" : JSON.stringify(migration),
      });

      const response = await fetch(`${API_URL}/sync?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Sync pull failed with status ${response.status}`);
      }

      const { changes, timestamp } = await response.json();
      return { changes, timestamp };
    },

    // Push: send our local creates/updates/deletes to the server.
    pushChanges: async ({ changes, lastPulledAt }) => {
      const response = await fetch(
        `${API_URL}/sync?last_pulled_at=${lastPulledAt}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        },
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Sync push failed with status ${response.status} ${detail}`.trim(),
        );
      }
    },

    // Our schema declares version 1; required so migration syncs work later.
    migrationsEnabledAtVersion: 1,
  });
}
