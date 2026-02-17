import { Context, Next } from "hono";
import { AppEnv, SessionUser } from "../types";
import { getOptionalUser } from "./middleware";

function isAdmin(email: string | null, adminEmails: string): boolean {
  if (!email) return false;
  const list = adminEmails.split(",").map((e) => e.trim().toLowerCase());
  return list.includes(email.toLowerCase());
}

/** Returns the user if they are an admin, null otherwise. */
export function getAdminUser(c: Context<AppEnv>): SessionUser | null {
  const user = getOptionalUser(c);
  if (!user) return null;
  return isAdmin(user.email, c.env.ADMIN_EMAILS) ? user : null;
}

/** Returns true if the email is in the admin allowlist. */
export function isAdminEmail(email: string | null, adminEmails: string): boolean {
  return isAdmin(email, adminEmails);
}

/** Hono middleware that returns 403 for non-admins. */
export async function requireAdmin(c: Context<AppEnv>, next: Next) {
  const admin = getAdminUser(c);
  if (!admin) {
    return c.json({ detail: "Forbidden" }, 403);
  }
  await next();
}
