import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const dataDir = process.env.DATA_DIR || "/app/data";
export const uploadsDir = path.join(dataDir, "uploads");
export const databasePath = path.join(dataDir, process.env.DB_FILE || "authera-link-card.db");

mkdirSync(dataDir, { recursive: true });
mkdirSync(uploadsDir, { recursive: true });

export const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");
db.pragma("synchronous = NORMAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
    photo_url TEXT,
    name TEXT NOT NULL,
    bio TEXT,
    instagram TEXT,
    facebook TEXT,
    tiktok TEXT,
    youtube TEXT,
    linkedin TEXT,
    whatsapp TEXT,
    telegram TEXT,
    twitter TEXT,
    website TEXT,
    custom_links TEXT NOT NULL DEFAULT '[]',
    theme TEXT NOT NULL DEFAULT 'neon-dark',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    show_event INTEGER NOT NULL DEFAULT 0,
    event_title TEXT,
    event_date TEXT,
    event_time TEXT,
    event_location TEXT,
    event_ticket_url TEXT,
    event_description TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profile_views (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referrer TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS link_clicks (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('social', 'custom')),
    link_key TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS integration_settings (
    id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    saas_center_url TEXT,
    integration_token TEXT,
    last_sync TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS saas_center_sync_log (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
  CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
  CREATE INDEX IF NOT EXISTS idx_link_clicks_profile_id ON link_clicks(profile_id);
  CREATE INDEX IF NOT EXISTS idx_reset_expires_at ON password_reset_tokens(expires_at);
`);

db.prepare(`
  INSERT OR IGNORE INTO integration_settings (id, enabled)
  VALUES ('default', 0)
`).run();

export function cleanupExpiredRows() {
  const now = Date.now();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  db.prepare("DELETE FROM password_reset_tokens WHERE expires_at <= ? OR used_at IS NOT NULL").run(now);
}
