from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime


class JobStatus(str, Enum):
    QUEUED = "queued"
    REASONING = "reasoning"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


STEP_PROGRESS = {
    JobStatus.QUEUED: 0.0,
    JobStatus.REASONING: 0.15,
    JobStatus.GENERATING: 0.6,
    JobStatus.COMPLETED: 1.0,
    JobStatus.FAILED: 0.0,
}

STEP_MESSAGES = {
    JobStatus.QUEUED: "Waiting in queue...",
    JobStatus.REASONING: "Analyzing your query...",
    JobStatus.GENERATING: "Generating report...",
    JobStatus.COMPLETED: "Your report is ready!",
    JobStatus.FAILED: "Generation failed",
}


@dataclass
class Job:
    id: str
    query: str
    skill_id: str
    user_id: str | None = None
    status: JobStatus = JobStatus.QUEUED
    error: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)

    # Results populated during pipeline
    reasoning: str | None = None
    html_report: str | None = None
    report_title: str | None = None
    published_id: str | None = None
