import { Hono } from "hono";
import { AppEnv } from "../types";
import { listSkills, listSkillsForUser } from "../skills";
import { getGeneratedSkill, claimGeneratedSkill } from "../db/queries";
import { generateSkill } from "../engine/skill-generator";
import { getOptionalUser } from "../auth/middleware";

const app = new Hono<AppEnv>();

app.get("/skills", async (c) => {
  const user = getOptionalUser(c);

  if (user) {
    const skills = await listSkillsForUser(c.env.DB, user.id);
    return c.json(
      skills.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        ...(s.status ? { status: s.status } : {}),
      })),
    );
  }

  const skills = listSkills().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
  }));
  return c.json(skills);
});

app.get("/skills/:id/status", async (c) => {
  const id = c.req.param("id");
  const skill = await getGeneratedSkill(c.env.DB, id);
  if (!skill) {
    return c.json({ detail: "Skill not found" }, 404);
  }
  return c.json({
    id: skill.id,
    name: skill.name,
    status: skill.status,
    error: skill.error,
  });
});

app.get("/skills/:id/generate", async (c) => {
  const id = c.req.param("id");
  const db = c.env.DB;

  const skill = await getGeneratedSkill(db, id);
  if (!skill) {
    return c.json({ detail: "Skill not found" }, 404);
  }

  // Stale skill recovery: if stuck in generating for >5 min, reset
  if (skill.status === "generating") {
    const updatedAt = new Date(skill.updated_at).getTime();
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    if (updatedAt < fiveMinAgo) {
      await db
        .prepare("UPDATE generated_skills SET status = 'pending' WHERE id = ? AND status = 'generating'")
        .bind(id)
        .run();
      skill.status = "pending";
    }
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = (event: string, data: Record<string, unknown>) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    writer.write(encoder.encode(payload)).catch(() => {});
  };

  if (skill.status === "ready" || skill.status === "failed") {
    send("status", { status: skill.status, error: skill.error });
    writer.close();
  } else if (skill.status === "pending") {
    const claimed = await claimGeneratedSkill(db, id, "generating");
    if (claimed) {
      send("status", { status: "generating" });
      const freshSkill = await getGeneratedSkill(db, id);
      if (freshSkill) {
        generateSkill(freshSkill, c.env, db).then(() => {
          getGeneratedSkill(db, id).then((final) => {
            send("status", { status: final?.status ?? "failed", error: final?.error ?? null });
            writer.close();
          });
        });
      } else {
        writer.close();
      }
    } else {
      // Another request claimed it — poll
      pollSkillUntilDone(db, id, send, writer);
    }
  } else {
    // generating — another request owns it, poll
    send("status", { status: skill.status });
    pollSkillUntilDone(db, id, send, writer);
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

async function pollSkillUntilDone(
  db: D1Database,
  skillId: string,
  send: (event: string, data: Record<string, unknown>) => void,
  writer: WritableStreamDefaultWriter<Uint8Array>,
) {
  let lastStatus = "";
  let polls = 0;
  const maxPolls = 150; // 5 min at 2s intervals

  const interval = setInterval(async () => {
    polls++;
    if (polls > maxPolls) {
      clearInterval(interval);
      send("timeout", {});
      writer.close();
      return;
    }

    try {
      const skill = await getGeneratedSkill(db, skillId);
      if (!skill) {
        clearInterval(interval);
        writer.close();
        return;
      }

      if (skill.status !== lastStatus) {
        lastStatus = skill.status;
        send("status", { status: skill.status, error: skill.error });

        if (skill.status === "ready" || skill.status === "failed") {
          clearInterval(interval);
          writer.close();
        }
      }
    } catch {
      clearInterval(interval);
      writer.close();
    }
  }, 2000);
}

export default app;
