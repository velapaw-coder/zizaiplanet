-- Email and phone accounts can sign in with a password the person chose.
-- password_hash stores PBKDF2 parameters, salt, and digest. Never a plaintext password.
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- login: phone magic link. reset: set a new password. Existing rows stay login links.
ALTER TABLE magic_links ADD COLUMN purpose TEXT NOT NULL DEFAULT 'login';
