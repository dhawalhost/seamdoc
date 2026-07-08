/**
 * Database schema and migration runner for the Collaborative Workspaces feature.
 *
 * Uses better-sqlite3 (SQLite) for zero-config self-hosted deployments.
 * The DB file path is configured via the SEAMDOC_DB_PATH env variable
 * (default: ./seamdoc.db).
 *
 * Tables:
 *   workspaces        — workspace metadata (id, name, description, created_at)
 *   workspace_themes  — shared themes stored as JSON (workspace_id, key, value)
 *   workspace_templates — shared DOCX templates stored as base64 (workspace_id, key, value)
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: Database.Database | null = null;

/** Returns the shared database connection, creating it on first call. */
export function getDb(): Database.Database {
  if (_db !== null) return _db;

  const dbPath = process.env['SEAMDOC_DB_PATH'] ?? path.join(process.cwd(), 'seamdoc.db');

  // Ensure the parent directory exists (for Docker volume paths like /data/seamdoc.db).
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance.
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  runMigrations(_db);

  return _db;
}

// ─── Migrations ───────────────────────────────────────────────────────────────

const MIGRATIONS: ReadonlyArray<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_versions (
        version   INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS workspace_themes (
        id           TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        theme_key    TEXT NOT NULL,
        theme_json   TEXT NOT NULL,
        updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(workspace_id, theme_key)
      );

      CREATE TABLE IF NOT EXISTS workspace_templates (
        id           TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        template_key TEXT NOT NULL,
        template_b64 TEXT NOT NULL,
        updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(workspace_id, template_key)
      );
    `,
  },
];

function runMigrations(db: Database.Database): void {
  // Ensure the schema_versions table exists before querying it.
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const appliedStmt = db.prepare<[], { version: number }>(
    'SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1',
  );
  const last = appliedStmt.get();
  const currentVersion = last?.version ?? 0;

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);

  for (const migration of pending) {
    db.exec(migration.sql);
    db.prepare('INSERT OR IGNORE INTO schema_versions (version) VALUES (?)').run(migration.version);
    console.log(`[db] Applied migration v${migration.version}`);
  }
}

/** Closes the database connection (useful for testing). */
export function closeDb(): void {
  _db?.close();
  _db = null;
}
