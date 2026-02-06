"""Main query processing pipeline."""

import logging

from tellmenow.jobs.models import Job, JobStatus
from tellmenow.jobs.manager import job_manager
from tellmenow.skills.loader import get_skill
from tellmenow.llm import client as llm
from tellmenow.engine.report_template import (
    HTML_SYSTEM_PROMPT,
    build_report,
    extract_title,
    clean_llm_content,
)

logger = logging.getLogger(__name__)


async def run_pipeline(job: Job) -> None:
    """Execute the full query pipeline: reasoning -> HTML generation."""
    try:
        skill = get_skill(job.skill_id)
        if not skill:
            await job_manager.update_status(job.id, JobStatus.FAILED, f"Skill not found: {job.skill_id}")
            return

        # --- Phase 1: Reasoning ---
        await job_manager.update_status(job.id, JobStatus.REASONING)

        # Build system prompt with skill instructions and references
        system_parts = [
            "You are an expert analyst. You have been given a specific skill with instructions on how to answer queries.",
            "Follow the skill instructions carefully and provide thorough, well-structured analysis.",
            "",
            "# Skill Instructions",
            skill.content,
        ]

        for ref_name, ref_content in skill.references.items():
            system_parts.append(f"\n# Reference: {ref_name}\n")
            system_parts.append(ref_content)

        system_prompt = "\n".join(system_parts)

        reasoning_prompt = (
            f"User query: {job.query}\n\n"
            "Please analyze this query following the skill instructions above. "
            "Provide your detailed reasoning and analysis in markdown format. "
            "Think step by step through each phase of the workflow. "
            "Be thorough but concise."
        )

        logger.info("Starting reasoning for job %s", job.id)
        reasoning = await llm.chat(
            system_prompt,
            reasoning_prompt,
            max_tokens=8192,
            temperature=0.5,
        )
        job.reasoning = reasoning

        await job_manager.send_step_data(job.id, "reasoning", {
            "preview": reasoning,
        })

        # --- Phase 2: HTML Generation ---
        await job_manager.update_status(job.id, JobStatus.GENERATING)

        html_prompt = (
            f"Generate the body content for a professional HTML report.\n\n"
            f"# Query\n{job.query}\n\n"
            f"# Analysis\n{reasoning}\n\n"
            "Generate the report body content now following the documented CSS classes. "
            "Output only the HTML body content, no full-page wrapper."
        )

        logger.info("Starting HTML generation for job %s", job.id)
        raw_content = await llm.chat(
            HTML_SYSTEM_PROMPT,
            html_prompt,
            max_tokens=16384,
            temperature=0.3,
        )

        content = clean_llm_content(raw_content)
        title = extract_title(content, job.query)
        html_report = build_report(content, title)

        job.html_report = html_report
        job.report_title = title

        await job_manager.send_step_data(job.id, "html_report", {
            "html": html_report,
            "title": title,
        })

        # --- Done ---
        await job_manager.update_status(job.id, JobStatus.COMPLETED)
        logger.info("Job %s completed successfully", job.id)

    except Exception as e:
        logger.exception("Pipeline failed for job %s: %s", job.id, e)
        await job_manager.update_status(job.id, JobStatus.FAILED, str(e))
