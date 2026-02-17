import { Hono } from "hono";
import { Env } from "../types";
import { insertJob } from "../db/queries";
import { getOptionalUser } from "../auth/middleware";

const app = new Hono<{ Bindings: Env }>();

app.post("/query", async (c) => {
  const body = await c.req.json<{ query: string; skill_id: string }>();

  if (!body.query || body.query.length < 3) {
    return c.json({ detail: "Query must be at least 3 characters" }, 400);
  }
  if (!body.skill_id) {
    return c.json({ detail: "skill_id is required" }, 400);
  }

  const user = getOptionalUser(c);
  const jobId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const now = new Date().toISOString();

  await insertJob(c.env.DB, {
    id: jobId,
    query: body.query,
    skill_id: body.skill_id,
    user_id: user?.id ?? null,
    created_at: now,
  });

  return c.json({ job_id: jobId });
});

export default app;
