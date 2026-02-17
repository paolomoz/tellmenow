CREATE TABLE skill_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  description TEXT NOT NULL,
  additional_context TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_skill_requests_created ON skill_requests(created_at DESC);
