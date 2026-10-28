-- Login can be email or mainland mobile. Display name is chosen by the person.
-- Community posts can carry an automatic review note.

CREATE TABLE users_v2 (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL,
  CHECK (
    (email IS NOT NULL AND length(trim(email)) > 0)
    OR (phone IS NOT NULL AND length(trim(phone)) > 0)
  )
);

INSERT INTO users_v2 (id, email, phone, display_name, role, created_at)
SELECT id, email, NULL, display_name, role, created_at FROM users;

DROP TABLE users;
ALTER TABLE users_v2 RENAME TO users;

CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_users_phone ON users (phone) WHERE phone IS NOT NULL;

CREATE TABLE magic_links_v2 (
  token_hash TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  display_name TEXT,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL,
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

INSERT INTO magic_links_v2 (token_hash, email, phone, display_name, expires_at, used_at, created_at)
SELECT token_hash, email, NULL, NULL, expires_at, used_at, created_at FROM magic_links;

DROP TABLE magic_links;
ALTER TABLE magic_links_v2 RENAME TO magic_links;

CREATE INDEX idx_magic_email ON magic_links (email, created_at);
CREATE INDEX idx_magic_phone ON magic_links (phone, created_at);

ALTER TABLE posts ADD COLUMN review_note TEXT;
