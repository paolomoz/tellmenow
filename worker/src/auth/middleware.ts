/** Auth middleware – extracts optional user from JWT cookie. */
import { Context, Next } from "hono";
import { AppEnv, SessionUser } from "../types";
import { verifyJWT, COOKIE_NAME } from "./jwt";
import { getCookie } from "hono/cookie";

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, COOKIE_NAME);
  if (token) {
    const payload = await verifyJWT(token, c.env.AUTH_SECRET);
    if (payload) {
      c.set("user", {
        id: payload.sub,
        name: payload.name || null,
        email: payload.email || null,
        image: payload.image || null,
      });
    }
  }
  await next();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOptionalUser(c: Context<any>): SessionUser | null {
  return c.get("user") || null;
}
