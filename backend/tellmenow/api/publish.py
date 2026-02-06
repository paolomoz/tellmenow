import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from tellmenow.api.auth import User, get_current_user, get_optional_user
from tellmenow.api.schemas import PublishRequest, PublishResponse, PublishedPageResponse
from tellmenow.db import get_db
from tellmenow.jobs.manager import job_manager

router = APIRouter(prefix="/api", tags=["publish"])


@router.post("/publish", response_model=PublishResponse)
async def publish_page(
    request: PublishRequest,
    user: Annotated[User, Depends(get_current_user)],
):
    job = job_manager.get_job(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.user_id and job.user_id != user.id:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.html_report:
        raise HTTPException(status_code=400, detail="Job has no HTML report to publish")

    published_id = uuid.uuid4().hex[:10]
    now = datetime.now(timezone.utc).isoformat()

    db = get_db()
    await db.execute(
        """INSERT INTO published_pages (id, job_id, user_id, title, html, skill_id, query, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (published_id, job.id, user.id, job.report_title or job.query[:80], job.html_report, job.skill_id, job.query, now),
    )
    await db.commit()

    job.published_id = published_id

    return PublishResponse(
        published_id=published_id,
        url=f"/p/{published_id}",
    )


@router.get("/p/{page_id}", response_model=PublishedPageResponse)
async def get_published_page(page_id: str):
    """Get a published page. No auth required — published pages are public."""
    db = get_db()
    cursor = await db.execute(
        "SELECT id, title, html, skill_id, query, created_at FROM published_pages WHERE id = ?",
        (page_id,),
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Page not found")

    return PublishedPageResponse(
        id=row[0],
        title=row[1],
        html=row[2],
        skill_id=row[3],
        query=row[4],
        created_at=row[5],
    )
