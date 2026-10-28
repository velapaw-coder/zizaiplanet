-- Personal public profile + AI partner (direction dialogue) sessions

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  experience TEXT NOT NULL DEFAULT '',
  expertise TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT '',
  cases TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_slug ON profiles (slug);

CREATE TABLE IF NOT EXISTS partner_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  direction_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS partner_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_user ON partner_sessions (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_partner_msgs ON partner_messages (session_id, created_at);
