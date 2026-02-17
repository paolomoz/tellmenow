import { Job, JobStatus, PublishedPage, GeneratedSkill, GeneratedSkillStatus } from "../types";

export async function insertJob(
  db: D1Database,
  job: { id: string; query: string; skill_id: string; user_id: string | null; created_at: string },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO jobs (id, query, skill_id, status, user_id, created_at) VALUES (?, ?, ?, 'queued', ?, ?)",
    )
    .bind(job.id, job.query, job.skill_id, job.user_id, job.created_at)
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

export async function insertSkillRequest(
  db: D1Database,
  request: {
    id: string;
    user_id: string | null;
    description: string;
    additional_context: string | null;
    created_at: string;
  },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO skill_requests (id, user_id, description, additional_context, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(
      request.id,
      request.user_id,
      request.description,
      request.additional_context,
      request.created_at,
    )
    .run();
}

// ── Generated Skills ────────────────────────────────

export async function insertGeneratedSkill(
  db: D1Database,
  skill: {
    id: string;
    user_id: string;
    name: string;
    description: string;
    input_spec: string;
    output_spec: string;
    chat_context: string | null;
    created_at: string;
    updated_at: string;
  },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO generated_skills (id, user_id, name, description, input_spec, output_spec, status, chat_context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
    )
    .bind(
      skill.id,
      skill.user_id,
      skill.name,
      skill.description,
      skill.input_spec,
      skill.output_spec,
      skill.chat_context,
      skill.created_at,
      skill.updated_at,
    )
    .run();
}

export async function getGeneratedSkill(
  db: D1Database,
  id: string,
): Promise<GeneratedSkill | null> {
  const row = await db
    .prepare("SELECT * FROM generated_skills WHERE id = ?")
    .bind(id)
    .first();
  return row ? (row as unknown as GeneratedSkill) : null;
}

export async function updateGeneratedSkill(
  db: D1Database,
  id: string,
  fields: Partial<Pick<GeneratedSkill, "status" | "content" | "refs_json" | "error" | "updated_at">>,
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
    .prepare(`UPDATE generated_skills SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

/** Atomically claim a pending generated skill. Returns true if claimed. */
export async function claimGeneratedSkill(
  db: D1Database,
  id: string,
  newStatus: GeneratedSkillStatus,
): Promise<boolean> {
  const result = await db
    .prepare("UPDATE generated_skills SET status = ? WHERE id = ? AND status = 'pending'")
    .bind(newStatus, id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function getGeneratedSkillsByUser(
  db: D1Database,
  userId: string,
): Promise<GeneratedSkill[]> {
  const rows = await db
    .prepare(
      "SELECT * FROM generated_skills WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(userId)
    .all();
  return (rows.results ?? []) as unknown as GeneratedSkill[];
}

// ── Shareable Skills ────────────────────────────────

export async function updateShareStatus(
  db: D1Database,
  id: string,
  shareStatus: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare("UPDATE generated_skills SET share_status = ?, updated_at = ? WHERE id = ?")
    .bind(shareStatus, now, id)
    .run();
}

export async function getPendingSharedSkills(
  db: D1Database,
): Promise<(GeneratedSkill & { creator_name: string | null; creator_email: string | null })[]> {
  const rows = await db
    .prepare(
      `SELECT gs.*, u.name AS creator_name, u.email AS creator_email
       FROM generated_skills gs
       JOIN users u ON gs.user_id = u.id
       WHERE gs.share_status = 'pending_review'
       ORDER BY gs.updated_at DESC`,
    )
    .all();
  return (rows.results ?? []) as unknown as (GeneratedSkill & {
    creator_name: string | null;
    creator_email: string | null;
  })[];
}

export async function getApprovedSharedSkills(
  db: D1Database,
): Promise<GeneratedSkill[]> {
  const rows = await db
    .prepare(
      "SELECT * FROM generated_skills WHERE share_status = 'approved' AND status = 'ready' ORDER BY updated_at DESC",
    )
    .all();
  return (rows.results ?? []) as unknown as GeneratedSkill[];
}

// ── History ─────────────────────────────────────────

export async function getJobsByUser(
  db: D1Database,
  userId: string,
  limit = 50,
  offset = 0,
): Promise<Pick<Job, "id" | "query" | "skill_id" | "status" | "report_title" | "created_at">[]> {
  const rows = await db
    .prepare(
      "SELECT id, query, skill_id, status, report_title, created_at FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
    )
    .bind(userId, limit, offset)
    .all();
  return (rows.results ?? []) as unknown as Pick<
    Job,
    "id" | "query" | "skill_id" | "status" | "report_title" | "created_at"
  >[];
}
