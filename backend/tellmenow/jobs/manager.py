import asyncio
import json
import logging
import uuid
from collections import defaultdict

from tellmenow.jobs.models import Job, JobStatus, STEP_PROGRESS, STEP_MESSAGES

logger = logging.getLogger(__name__)


class JobManager:
    def __init__(self):
        self._jobs: dict[str, Job] = {}
        self._listeners: dict[str, list[asyncio.Queue]] = defaultdict(list)
        self._step_data: dict[str, dict[str, dict]] = defaultdict(dict)

    def create_job(
        self,
        query: str,
        skill_id: str,
        user_id: str | None = None,
    ) -> Job:
        job_id = uuid.uuid4().hex[:12]
        job = Job(
            id=job_id,
            query=query,
            skill_id=skill_id,
            user_id=user_id,
        )
        self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def get_step_data(self, job_id: str) -> dict[str, dict]:
        return dict(self._step_data.get(job_id, {}))

    async def update_status(self, job_id: str, status: JobStatus, error: str | None = None):
        job = self._jobs.get(job_id)
        if not job:
            return
        job.status = status
        if error:
            job.error = error
        await self._notify(job_id, status)

    async def _notify(self, job_id: str, status: JobStatus):
        event = {
            "type": "status",
            "status": status.value,
            "progress": STEP_PROGRESS.get(status, 0),
            "message": STEP_MESSAGES.get(status, ""),
        }
        for queue in self._listeners.get(job_id, []):
            await queue.put(event)

    async def send_step_data(self, job_id: str, step: str, data: dict):
        self._step_data[job_id][step] = data
        event = {
            "type": "step_data",
            "step": step,
            "data": data,
        }
        for queue in self._listeners.get(job_id, []):
            await queue.put(event)

    async def send_reasoning_chunk(self, job_id: str, chunk: str, full_text: str):
        """Send a reasoning text chunk for real-time streaming."""
        event = {
            "type": "reasoning_chunk",
            "chunk": chunk,
            "full_text": full_text,
        }
        for queue in self._listeners.get(job_id, []):
            await queue.put(event)

    async def send_html_chunk(self, job_id: str, chunk: str, full_html: str):
        """Send an HTML generation chunk for real-time streaming."""
        event = {
            "type": "html_chunk",
            "chunk": chunk,
            "full_html": full_html,
        }
        for queue in self._listeners.get(job_id, []):
            await queue.put(event)

    def subscribe(self, job_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._listeners[job_id].append(queue)
        return queue

    def unsubscribe(self, job_id: str, queue: asyncio.Queue):
        listeners = self._listeners.get(job_id, [])
        if queue in listeners:
            listeners.remove(queue)

    async def sse_generator(self, job_id: str):
        queue = self.subscribe(job_id)
        try:
            job = self.get_job(job_id)
            if job:
                yield {
                    "event": "status",
                    "data": json.dumps({
                        "type": "status",
                        "status": job.status.value,
                        "progress": STEP_PROGRESS.get(job.status, 0),
                        "message": STEP_MESSAGES.get(job.status, ""),
                    }),
                }
                # Replay accumulated step data
                for step, data in self._step_data.get(job_id, {}).items():
                    yield {
                        "event": "step_data",
                        "data": json.dumps({
                            "type": "step_data",
                            "step": step,
                            "data": data,
                        }),
                    }

            while True:
                event = await asyncio.wait_for(queue.get(), timeout=600)
                event_type = event.get("type", "status")
                yield {
                    "event": event_type,
                    "data": json.dumps(event),
                }
                if event.get("status") in (JobStatus.COMPLETED.value, JobStatus.FAILED.value):
                    if event.get("status") == JobStatus.COMPLETED.value and job:
                        yield {
                            "event": "result",
                            "data": json.dumps({
                                "html_report": job.html_report,
                                "report_title": job.report_title,
                                "reasoning": job.reasoning,
                            }),
                        }
                    break
        except asyncio.TimeoutError:
            yield {"event": "timeout", "data": "{}"}
        finally:
            self.unsubscribe(job_id, queue)


job_manager = JobManager()
