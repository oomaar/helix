import { createDatabase } from "./seed";
import type { Database } from "./models";

/**
 * Single, module-scoped instance of the seeded fake database.
 * Modules go through the async `queries/*` functions rather than reading
 * this directly, so the whole surface stays swap-in ready for a real API.
 */
let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) db = createDatabase();
  return db;
}

/** Test/dev helper — reseeds the store from scratch. */
export function resetDatabase(): void {
  db = createDatabase();
}
