-- Six-section「我的向往」page. Empty string means: derive from the legacy columns.
ALTER TABLE profiles ADD COLUMN aspiration_json TEXT NOT NULL DEFAULT '';
