import { Hono } from "hono";
import { Env } from "../types";
import { insertSkillRequest } from "../db/queries";
import { getOptionalUser } from "../auth/middleware";

const app = new Hono<{ Bindings: Env }>();

app.post("/skill-requests", async (c) => {
  const body = await c.req.json<{
    description?: string;
    additional_context?: string;
  }>();

  if (!body.description || typeof body.description !== "string" || !body.description.trim()) {
    return c.json({ detail: "description is required" }, 400);
  }

  const user = getOptionalUser(c);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await insertSkillRequest(c.env.DB, {
    id,
    user_id: user?.id ?? null,
    description: body.description.trim(),
    additional_context: body.additional_context?.trim() || null,
    created_at: now,
  });

  return c.json({ id });
});

export default app;
