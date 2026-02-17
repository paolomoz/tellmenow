/** Minimal JWT (HS256) using Web Crypto – no external dependencies. */

interface JWTPayload {
  sub: string; // user id
  name?: string;
  email?: string;
  image?: string;
  iat: number;
  exp: number;
}

const ALG = { name: "HMAC", hash: "SHA-256" };
const HEADER = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), ALG, false, [
    "sign",
    "verify",
  ]);
}

function toBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(s: string): Uint8Array {
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function signJWT(
  payload: Omit<JWTPayload, "iat" | "exp">,
  secret: string,
  ttlSeconds = 30 * 24 * 3600, // 30 days
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: JWTPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const body = btoa(JSON.stringify(full))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const data = `${HEADER}.${body}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${toBase64Url(sig)}`;
}

export async function verifyJWT(
  token: string,
  secret: string,
): Promise<JWTPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const key = await getKey(secret);
  const data = `${header}.${body}`;
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(sig),
    new TextEncoder().encode(data),
  );
  if (!valid) return null;

  try {
    const payload: JWTPayload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "tmn_session";

export function sessionCookie(token: string, maxAge: number, frontendUrl?: string): string {
  const secure = frontendUrl?.startsWith("https") ? "; Secure" : "";
  const sameSite = secure ? "None" : "Lax";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure}`;
}
