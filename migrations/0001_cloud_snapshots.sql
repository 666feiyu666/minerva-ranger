PRAGMA foreign_keys = ON;

CREATE TABLE cloud_users (
  subject TEXT PRIMARY KEY,
  email TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
) STRICT;

CREATE TABLE cloud_snapshots (
  subject TEXT PRIMARY KEY,
  revision INTEGER NOT NULL CHECK (revision >= 0),
  schema_version INTEGER NOT NULL CHECK (schema_version >= 1),
  payload_json TEXT NOT NULL,
  payload_bytes INTEGER NOT NULL CHECK (payload_bytes >= 0),
  last_request_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (subject) REFERENCES cloud_users(subject) ON DELETE CASCADE
) STRICT;

CREATE INDEX cloud_snapshots_updated_at_idx ON cloud_snapshots(updated_at);
