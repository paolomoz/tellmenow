from pydantic import BaseModel, Field


class SkillResponse(BaseModel):
    id: str
    name: str
    description: str


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=50000)
    skill_id: str


class QueryResponse(BaseModel):
    job_id: str


class JobProgress(BaseModel):
    step: str
    message: str
    progress: float


class JobResult(BaseModel):
    html_report: str | None = None
    report_title: str | None = None
    reasoning: str | None = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: JobProgress | None = None
    result: JobResult | None = None
    error: str | None = None
    step_data: dict | None = None
    query: str | None = None
    skill_id: str | None = None


class PublishRequest(BaseModel):
    job_id: str


class PublishResponse(BaseModel):
    published_id: str
    url: str


class PublishedPageResponse(BaseModel):
    id: str
    title: str
    html: str
    skill_id: str | None = None
    query: str | None = None
    created_at: str


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
