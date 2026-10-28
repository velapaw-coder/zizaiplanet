CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS explore_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  room_index INTEGER NOT NULL DEFAULT 0,
  question_index INTEGER NOT NULL DEFAULT 0,
  phase TEXT NOT NULL DEFAULT 'question',
  revisit_dimension TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room_answers (
  session_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  q_index INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  skipped INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, dimension, q_index)
);

CREATE TABLE IF NOT EXISTS room_cards (
  session_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  keywords TEXT NOT NULL,
  quote TEXT,
  summary TEXT NOT NULL,
  evidence TEXT NOT NULL,
  lit INTEGER NOT NULL DEFAULT 0,
  via TEXT NOT NULL DEFAULT 'rules',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, dimension)
);

CREATE TABLE IF NOT EXISTS homes (
  user_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  is_private INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  body TEXT NOT NULL,
  prompt TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  topic TEXT NOT NULL,
  tags TEXT NOT NULL,
  cover TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS claims (
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  image_key TEXT,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS likes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  user_id TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  theme TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  place TEXT NOT NULL,
  host_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  proposed_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rsvps (
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_magic_email ON magic_links (email, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON events (status, starts_at);
CREATE INDEX IF NOT EXISTS idx_room_session ON room_cards (session_id);
