export interface Skill {
  id: string;
  name: string;
  description: string;
}

export interface QueryRequest {
  query: string;
  skill_id: string;
}

export interface JobProgress {
  step: string;
  message: string;
  progress: number;
}

export interface JobResult {
  html_report: string | null;
  report_title: string | null;
  reasoning: string | null;
}

export interface StepDataMap {
  reasoning?: {
    preview?: string;
  };
  html_report?: {
    html?: string;
    title?: string;
  };
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: JobProgress | null;
  result: JobResult | null;
  error: string | null;
  step_data: StepDataMap | null;
  query: string | null;
  skill_id: string | null;
}
