import { Hono } from "hono";
import { Env } from "../types";
import { listSkills } from "../skills";

const app = new Hono<{ Bindings: Env }>();

app.get("/skills", (c) => {
  const skills = listSkills().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
  }));
  return c.json(skills);
});

export default app;
