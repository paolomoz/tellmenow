CREATE TABLE generated_skills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  input_spec TEXT NOT NULL,
  output_spec TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  content TEXT,
  refs_json TEXT,
  error TEXT,
  chat_context TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_generated_skills_user ON generated_skills(user_id, created_at DESC);
