import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types";

import health from "./routes/health";
import skills from "./routes/skills";
import query from "./routes/query";
import jobs from "./routes/jobs";
import publish from "./routes/publish";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/api/*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

const api = app.basePath("/api");
api.route("/", health);
api.route("/", skills);
api.route("/", query);
api.route("/", jobs);
api.route("/", publish);

export default app;
