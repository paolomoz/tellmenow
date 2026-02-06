import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function backendHeaders(
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  try {
    const session = await auth();
    if (session?.user?.id) {
      const cookieStore = await cookies();
      const sessionToken =
        cookieStore.get("__Secure-authjs.session-token")?.value ||
        cookieStore.get("authjs.session-token")?.value;

      if (sessionToken) {
        headers["X-Session-Token"] = sessionToken;
      }
    }
  } catch {
    // Auth not configured or session unavailable
  }

  return headers;
}
