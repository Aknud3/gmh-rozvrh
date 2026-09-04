-- D1 schema for the timetable application.
-- Run once after creating the database:
-- npx wrangler d1 execute timetable_db --remote --file=./schema.sql --config=wrangler.api.toml

CREATE TABLE IF NOT EXISTS timetable_cache (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS analytics_created_at_idx ON analytics(created_at);
