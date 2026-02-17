import { Hono } from "hono";
import { AppEnv } from "../types";
import { requireAdmin } from "../auth/admin";
import { getPendingSharedSkills, updateShareStatus } from "../db/queries";

const app = new Hono<AppEnv>();

app.use("/admin/*", requireAdmin);

app.get("/admin/pending-skills", async (c) => {
  const skills = await getPendingSharedSkills(c.env.DB);
  return c.json(
    skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      creator_name: s.creator_name,
      creator_email: s.creator_email,
      created_at: s.created_at,
    })),
  );
});

app.post("/admin/skills/:id/approve", async (c) => {
  const id = c.req.param("id");
  await updateShareStatus(c.env.DB, id, "approved");
  return c.json({ ok: true });
});

app.post("/admin/skills/:id/reject", async (c) => {
  const id = c.req.param("id");
  await updateShareStatus(c.env.DB, id, "rejected");
  return c.json({ ok: true });
});

export default app;
