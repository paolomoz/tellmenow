import { Skill, QueryRequest, JobStatus } from "@/types/job";

const API_BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    let message = "Request failed";
    if (typeof error.detail === "string") {
      message = error.detail;
    } else if (Array.isArray(error.detail)) {
      message = error.detail.map((e: { msg: string }) => e.msg).join("; ");
    }
    throw new Error(message);
  }
  return response.json();
}

export async function fetchSkills(): Promise<Skill[]> {
  return fetchJson<Skill[]>("/skills");
}

export async function startQuery(request: QueryRequest): Promise<{ job_id: string }> {
  return fetchJson("/query", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  return fetchJson<JobStatus>(`/jobs/${jobId}`);
}

export async function publishReport(jobId: string): Promise<{ published_id: string; url: string }> {
  return fetchJson("/publish", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId }),
  });
}

export async function fetchPublishedPage(pageId: string): Promise<{
  id: string;
  title: string;
  html: string;
  skill_id: string | null;
  query: string | null;
  created_at: string;
}> {
  return fetchJson(`/p/${pageId}`);
}
