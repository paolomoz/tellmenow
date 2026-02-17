import { Job, JobStatus, PublishedPage } from "../types";

export async function insertJob(
  db: D1Database,
  job: { id: string; query: string; skill_id: string; created_at: string },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO jobs (id, query, skill_id, status, created_at) VALUES (?, ?, ?, 'queued', ?)",
    )
    .bind(job.id, job.query, job.skill_id, job.created_at)
    .run();
}

export async function getJob(
  db: D1Database,
  id: string,
): Promise<Job | null> {
  const row = await db
    .prepare("SELECT * FROM jobs WHERE id = ?")
    .bind(id)
    .first();
  return row ? (row as unknown as Job) : null;
}

export async function updateJob(
  db: D1Database,
  id: string,
  fields: Partial<Pick<Job, "status" | "reasoning" | "html_report" | "report_title" | "error">>,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(value);
  }
  if (sets.length === 0) return;
  values.push(id);
  await db
    .prepare(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

/** Atomically claim a queued job. Returns true if claimed. */
export async function claimJob(
  db: D1Database,
  id: string,
  newStatus: JobStatus,
): Promise<boolean> {
  const result = await db
    .prepare("UPDATE jobs SET status = ? WHERE id = ? AND status = 'queued'")
    .bind(newStatus, id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function insertPublishedPage(
  db: D1Database,
  page: PublishedPage,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO published_pages (id, job_id, user_id, title, html, skill_id, query, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      page.id,
      page.job_id,
      page.user_id,
      page.title,
      page.html,
      page.skill_id,
      page.query,
      page.created_at,
    )
    .run();
}

export async function getPublishedPage(
  db: D1Database,
  id: string,
): Promise<PublishedPage | null> {
  const row = await db
    .prepare("SELECT * FROM published_pages WHERE id = ?")
    .bind(id)
    .first();
  return row ? (row as unknown as PublishedPage) : null;
}
