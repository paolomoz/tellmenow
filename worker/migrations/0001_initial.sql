CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  reasoning TEXT,
  html_report TEXT,
  report_title TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE published_pages (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  skill_id TEXT,
  query TEXT,
  created_at TEXT NOT NULL
);
