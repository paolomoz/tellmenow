import { Hono } from "hono";
import { Env } from "../types";
import { getJobsByUser } from "../db/queries";
import { getOptionalUser } from "../auth/middleware";

const app = new Hono<{ Bindings: Env }>();

app.get("/history", async (c) => {
  const user = getOptionalUser(c);
  if (!user) {
    return c.json({ detail: "Authentication required" }, 401);
  }

  const limit = Math.min(Number(c.req.query("limit") || 50), 200);
  const offset = Math.max(Number(c.req.query("offset") || 0), 0);

  const jobs = await getJobsByUser(c.env.DB, user.id, limit, offset);

  return c.json({ jobs });
});

export default app;
