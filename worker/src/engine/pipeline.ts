import { Env, Job, STEP_PROGRESS, STEP_MESSAGES } from "../types";
import { getSkill } from "../skills";
import { chat } from "../llm/client";
import { updateJob } from "../db/queries";
import {
  HTML_SYSTEM_PROMPT,
  buildReport,
  extractTitle,
  cleanLlmContent,
} from "./report-template";

type SendFn = (event: string, data: Record<string, unknown>) => void;

export async function runPipelineSSE(
  job: Job,
  env: Env,
  db: D1Database,
  send: SendFn,
): Promise<void> {
  try {
    const skill = getSkill(job.skill_id);
    if (!skill) {
      await updateJob(db, job.id, { status: "failed", error: `Skill not found: ${job.skill_id}` });
      send("status", {
        type: "status",
        status: "failed",
        progress: 0,
        message: "Skill not found",
      });
      return;
    }

    // --- Phase 1: Reasoning ---
    await updateJob(db, job.id, { status: "reasoning" });
    send("status", {
      type: "status",
      status: "reasoning",
      progress: STEP_PROGRESS.reasoning,
      message: STEP_MESSAGES.reasoning,
    });

    // Build system prompt with skill instructions and references
    const systemParts = [
      "You are an expert analyst. You have been given a specific skill with instructions on how to answer queries.",
      "Follow the skill instructions carefully and provide thorough, well-structured analysis.",
      "",
      "# Skill Instructions",
      skill.content,
    ];

    for (const [refName, refContent] of Object.entries(skill.references)) {
      systemParts.push(`\n# Reference: ${refName}\n`);
      systemParts.push(refContent);
    }

    const systemPrompt = systemParts.join("\n");

    const reasoningPrompt =
      `User query: ${job.query}\n\n` +
      "Please analyze this query following the skill instructions above. " +
      "Provide your detailed reasoning and analysis in markdown format. " +
      "Think step by step through each phase of the workflow. " +
      "Be thorough but concise.";

    const reasoning = await chat(env, systemPrompt, reasoningPrompt, {
      maxTokens: 8192,
      temperature: 0.5,
    });

    await updateJob(db, job.id, { reasoning });
    send("step_data", {
      type: "step_data",
      step: "reasoning",
      data: { preview: reasoning },
    });

    // --- Phase 2: HTML Generation ---
    await updateJob(db, job.id, { status: "generating" });
    send("status", {
      type: "status",
      status: "generating",
      progress: STEP_PROGRESS.generating,
      message: STEP_MESSAGES.generating,
    });

    const htmlPrompt =
      `Generate the body content for a professional HTML report.\n\n` +
      `# Query\n${job.query}\n\n` +
      `# Analysis\n${reasoning}\n\n` +
      "Generate the report body content now following the documented CSS classes. " +
      "Output only the HTML body content, no full-page wrapper.";

    const rawContent = await chat(env, HTML_SYSTEM_PROMPT, htmlPrompt, {
      maxTokens: 16384,
      temperature: 0.3,
    });

    const content = cleanLlmContent(rawContent);
    const title = extractTitle(content, job.query);
    const htmlReport = buildReport(content, title);

    await updateJob(db, job.id, {
      status: "completed",
      html_report: htmlReport,
      report_title: title,
    });

    send("step_data", {
      type: "step_data",
      step: "html_report",
      data: { html: htmlReport, title },
    });

    send("status", {
      type: "status",
      status: "completed",
      progress: STEP_PROGRESS.completed,
      message: STEP_MESSAGES.completed,
    });

    send("result", {
      html_report: htmlReport,
      report_title: title,
      reasoning,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await updateJob(db, job.id, { status: "failed", error: errorMsg });
    send("status", {
      type: "status",
      status: "failed",
      progress: 0,
      message: "Generation failed",
    });
  }
}
