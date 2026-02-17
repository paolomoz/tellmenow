import { Hono } from "hono";
import { Env } from "../types";
import { getJob, insertPublishedPage, getPublishedPage } from "../db/queries";

const app = new Hono<{ Bindings: Env }>();

app.post("/publish", async (c) => {
  const body = await c.req.json<{ job_id: string }>();
  if (!body.job_id) {
    return c.json({ detail: "job_id is required" }, 400);
  }

  const job = await getJob(c.env.DB, body.job_id);
  if (!job) {
    return c.json({ detail: "Job not found" }, 404);
  }
  if (!job.html_report) {
    return c.json({ detail: "Job has no HTML report to publish" }, 400);
  }

  const publishedId = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const now = new Date().toISOString();

  await insertPublishedPage(c.env.DB, {
    id: publishedId,
    job_id: job.id,
    user_id: null,
    title: job.report_title || job.query.slice(0, 80),
    html: job.html_report,
    skill_id: job.skill_id,
    query: job.query,
    created_at: now,
  });

  return c.json({
    published_id: publishedId,
    url: `/p/${publishedId}`,
  });
});

app.get("/p/:id", async (c) => {
  const page = await getPublishedPage(c.env.DB, c.req.param("id"));
  if (!page) {
    return c.json({ detail: "Page not found" }, 404);
  }

  return c.json({
    id: page.id,
    title: page.title,
    html: page.html,
    skill_id: page.skill_id,
    query: page.query,
    created_at: page.created_at,
  });
});

export default app;
