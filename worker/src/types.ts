export interface Env {
  DB: D1Database;
  ANTHROPIC_MODEL: string;
  AWS_REGION: string;
  ANTHROPIC_AWS_BEARER_TOKEN_BEDROCK: string;
  FRONTEND_URL?: string;
  AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export interface User {
  id: string; // provider:providerAccountId
  provider: string;
  provider_account_id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  created_at: string;
}

export type SessionUser = Pick<User, "id" | "name" | "email" | "image">;

/** Hono app type with bindings and variables */
export type AppEnv = {
  Bindings: Env;
  Variables: {
    user?: SessionUser;
  };
};

export type JobStatus = "queued" | "reasoning" | "generating" | "completed" | "failed";

export interface Job {
  id: string;
  query: string;
  skill_id: string;
  status: JobStatus;
  reasoning: string | null;
  html_report: string | null;
  report_title: string | null;
  error: string | null;
  user_id: string | null;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
  references: Record<string, string>;
}

export interface PublishedPage {
  id: string;
  job_id: string;
  user_id: string | null;
  title: string;
  html: string;
  skill_id: string | null;
  query: string | null;
  created_at: string;
}

export const STEP_PROGRESS: Record<JobStatus, number> = {
  queued: 0.0,
  reasoning: 0.15,
  generating: 0.6,
  completed: 1.0,
  failed: 0.0,
};

export const STEP_MESSAGES: Record<JobStatus, string> = {
  queued: "Waiting in queue...",
  reasoning: "Analyzing your query...",
  generating: "Generating report...",
  completed: "Your report is ready!",
  failed: "Generation failed",
};
