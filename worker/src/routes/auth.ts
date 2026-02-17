import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { AppEnv } from "../types";
import { signJWT, verifyJWT, sessionCookie, COOKIE_NAME } from "../auth/jwt";
import {
  googleAuthUrl,
  exchangeGoogleCode,
  githubAuthUrl,
  exchangeGithubCode,
  OAuthUserInfo,
} from "../auth/oauth";

const app = new Hono<AppEnv>();

function getBaseUrl(env: AppEnv["Bindings"], reqUrl: string): string {
  if (env.FRONTEND_URL) return env.FRONTEND_URL;
  const url = new URL(reqUrl);
  return `${url.protocol}//${url.host}`;
}

function getApiBase(reqUrl: string): string {
  const url = new URL(reqUrl);
  return `${url.protocol}//${url.host}`;
}

/** Upsert user record in D1 and return the user id */
async function upsertUser(db: D1Database, info: OAuthUserInfo): Promise<string> {
  const userId = `${info.provider}:${info.providerAccountId}`;
  const now = new Date().toISOString();

  const existing = await db
    .prepare("SELECT id FROM users WHERE id = ?")
    .bind(userId)
    .first();

  if (existing) {
    await db
      .prepare("UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?")
      .bind(info.name, info.email, info.image, userId)
      .run();
  } else {
    await db
      .prepare(
        "INSERT INTO users (id, provider, provider_account_id, name, email, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(userId, info.provider, info.providerAccountId, info.name, info.email, info.image, now)
      .run();
  }

  return userId;
}

// ── Google ──────────────────────────────────────────

app.get("/auth/google", (c) => {
  const state = crypto.randomUUID();
  const redirectUri = `${getApiBase(c.req.url)}/api/auth/google/callback`;
  const url = googleAuthUrl(c.env.GOOGLE_CLIENT_ID, redirectUri, state);
  return c.redirect(url);
});

app.get("/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.json({ detail: "Missing code" }, 400);

  const redirectUri = `${getApiBase(c.req.url)}/api/auth/google/callback`;

  try {
    const info = await exchangeGoogleCode(
      code,
      c.env.GOOGLE_CLIENT_ID,
      c.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );
    const userId = await upsertUser(c.env.DB, info);

    const token = await signJWT(
      { sub: userId, name: info.name ?? undefined, email: info.email ?? undefined, image: info.image ?? undefined },
      c.env.AUTH_SECRET,
    );
    const maxAge = 30 * 24 * 3600;
    c.header("Set-Cookie", sessionCookie(token, maxAge, c.env.FRONTEND_URL));
    return c.redirect(getBaseUrl(c.env, c.req.url) + "/?logged_in=1");
  } catch (e: unknown) {
    console.error("Google OAuth error:", e);
    return c.redirect(getBaseUrl(c.env, c.req.url) + "/?auth_error=google");
  }
});

// ── GitHub ───────────────────────────────────────────

app.get("/auth/github", (c) => {
  const state = crypto.randomUUID();
  const redirectUri = `${getApiBase(c.req.url)}/api/auth/github/callback`;
  const url = githubAuthUrl(c.env.GITHUB_CLIENT_ID, redirectUri, state);
  return c.redirect(url);
});

app.get("/auth/github/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.json({ detail: "Missing code" }, 400);

  try {
    const info = await exchangeGithubCode(
      code,
      c.env.GITHUB_CLIENT_ID,
      c.env.GITHUB_CLIENT_SECRET,
    );
    const userId = await upsertUser(c.env.DB, info);

    const token = await signJWT(
      { sub: userId, name: info.name ?? undefined, email: info.email ?? undefined, image: info.image ?? undefined },
      c.env.AUTH_SECRET,
    );
    const maxAge = 30 * 24 * 3600;
    c.header("Set-Cookie", sessionCookie(token, maxAge, c.env.FRONTEND_URL));
    return c.redirect(getBaseUrl(c.env, c.req.url) + "/?logged_in=1");
  } catch (e: unknown) {
    console.error("GitHub OAuth error:", e);
    return c.redirect(getBaseUrl(c.env, c.req.url) + "/?auth_error=github");
  }
});

// ── Session ─────────────────────────────────────────

app.get("/auth/session", async (c) => {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) {
    return c.json({ user: null });
  }

  const payload = await verifyJWT(token, c.env.AUTH_SECRET);
  if (!payload) {
    return c.json({ user: null });
  }

  return c.json({
    user: {
      id: payload.sub,
      name: payload.name || null,
      email: payload.email || null,
      image: payload.image || null,
    },
  });
});

app.post("/auth/logout", (c) => {
  c.header("Set-Cookie", sessionCookie("", 0, c.env.FRONTEND_URL));
  return c.json({ ok: true });
});

export default app;
