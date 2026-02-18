import { Env, Job, STEP_PROGRESS, STEP_MESSAGES } from "../types";
import { getSkillResolved } from "../skills";
import { chat, chatWithTools, Tool } from "../llm/client";
import { updateJob } from "../db/queries";
import {
  HTML_SYSTEM_PROMPT,
  buildReport,
  extractTitle,
  cleanLlmContent,
} from "./report-template";

const FETCH_URL_MAX_BYTES = 50 * 1024; // 50 KB

const REASONING_TOOLS: Tool[] = [
  {
    name: "fetch_url",
    description:
      "Fetch the contents of a URL. Use this to retrieve sitemaps, web pages, robots.txt, or any other publicly accessible URL. Returns the response body as text.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch (must start with http:// or https://)",
        },
      },
      required: ["url"],
    },
  },
];

async function handleToolCall(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  if (name !== "fetch_url") {
    return `Unknown tool: ${name}`;
  }

  const url = input.url as string;
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    return `Invalid URL: ${url}. Must start with http:// or https://`;
  }

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "TellMeNow/1.0 (site-overviewer)",
        Accept: "text/html, application/xml, text/xml, text/plain, */*",
      },
    });

    if (!resp.ok) {
      return `HTTP ${resp.status} ${resp.statusText} fetching ${url}`;
    }

    const text = await resp.text();
    if (text.length > FETCH_URL_MAX_BYTES) {
      return text.slice(0, FETCH_URL_MAX_BYTES) + `\n\n[Truncated at ${FETCH_URL_MAX_BYTES} bytes]`;
    }
    return text;
  } catch (err) {
    return `Error fetching ${url}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

type SendFn = (event: string, data: Record<string, unknown>) => void;

export async function runPipelineSSE(
  job: Job,
  env: Env,
  db: D1Database,
  send: SendFn,
): Promise<void> {
  try {
    const skill = await getSkillResolved(job.skill_id, db);
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
      "You have access to a `fetch_url` tool that lets you fetch any public URL.",
      "When the skill instructions mention fetching sitemaps, robots.txt, or any web resource, use the `fetch_url` tool to actually retrieve the content instead of guessing.",
      "Always prefer real data from fetched URLs over estimates from your training data.",
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

    const reasoning = await chatWithTools(
      env,
      systemPrompt,
      reasoningPrompt,
      REASONING_TOOLS,
      handleToolCall,
      { maxTokens: 8192, temperature: 0.5 },
      (toolName, toolInput) => {
        if (toolName === "fetch_url") {
          send("status", {
            type: "status",
            status: "reasoning",
            progress: STEP_PROGRESS.reasoning,
            message: `Fetching ${toolInput.url}...`,
          });
        }
      },
    );

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
