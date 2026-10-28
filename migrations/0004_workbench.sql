CREATE TABLE IF NOT EXISTS workbench_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  explore_session_id TEXT,
  preset_id TEXT NOT NULL DEFAULT 'deepseek',
  model TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  portrait_text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workbench_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workbench_user ON workbench_sessions (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_workbench_msgs ON workbench_messages (session_id, created_at);
