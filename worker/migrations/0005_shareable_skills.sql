ALTER TABLE generated_skills ADD COLUMN share_status TEXT DEFAULT NULL;
CREATE INDEX idx_generated_skills_share ON generated_skills(share_status);
