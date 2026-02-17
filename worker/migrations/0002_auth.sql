-- Users table for OAuth-authenticated users
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- format: provider:providerAccountId
  provider TEXT NOT NULL,                 -- 'google' or 'github'
  provider_account_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  image TEXT,
  created_at TEXT NOT NULL
);

-- Associate jobs with users
ALTER TABLE jobs ADD COLUMN user_id TEXT;

-- Index for fast history lookups
CREATE INDEX idx_jobs_user ON jobs(user_id, created_at DESC);
