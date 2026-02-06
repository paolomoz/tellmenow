export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function backendHeaders(
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  return {
    "Content-Type": "application/json",
    ...extra,
  };
}
