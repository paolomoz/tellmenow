import asyncio

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from tellmenow.api.schemas import (
    QueryRequest,
    QueryResponse,
    JobStatusResponse,
    JobProgress,
    JobResult,
)
from tellmenow.jobs.manager import job_manager
from tellmenow.jobs.models import JobStatus, STEP_PROGRESS, STEP_MESSAGES
from tellmenow.engine.pipeline import run_pipeline

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResponse)
async def create_query(request: QueryRequest):
    job = job_manager.create_job(
        query=request.query,
        skill_id=request.skill_id,
        user_id="anon",
    )
    asyncio.create_task(run_pipeline(job))
    return QueryResponse(job_id=job.id)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    progress = JobProgress(
        step=job.status.value,
        message=STEP_MESSAGES.get(job.status, ""),
        progress=STEP_PROGRESS.get(job.status, 0),
    )

    result = None
    if job.status == JobStatus.COMPLETED:
        result = JobResult(
            html_report=job.html_report,
            report_title=job.report_title,
            reasoning=job.reasoning,
        )

    step_data = job_manager.get_step_data(job_id) or None

    return JobStatusResponse(
        job_id=job.id,
        status=job.status.value,
        progress=progress,
        result=result,
        error=job.error,
        step_data=step_data,
        query=job.query,
        skill_id=job.skill_id,
    )


@router.get("/jobs/{job_id}/stream")
async def stream_job(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return EventSourceResponse(job_manager.sse_generator(job_id))
