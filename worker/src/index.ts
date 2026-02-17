import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppEnv } from "./types";
import { authMiddleware } from "./auth/middleware";

import health from "./routes/health";
import skills from "./routes/skills";
import query from "./routes/query";
import jobs from "./routes/jobs";
import publish from "./routes/publish";
import auth from "./routes/auth";
import history from "./routes/history";
import skillRequests from "./routes/skill-requests";

const app = new Hono<AppEnv>();

app.use(
  "/api/*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// Extract user from JWT cookie on every request
app.use("/api/*", authMiddleware);

const api = app.basePath("/api");
api.route("/", health);
api.route("/", skills);
api.route("/", query);
api.route("/", jobs);
api.route("/", publish);
api.route("/", auth);
api.route("/", history);
api.route("/", skillRequests);

export default app;
