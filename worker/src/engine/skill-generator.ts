import { Env, GeneratedSkill } from "../types";
import { chat } from "../llm/client";
import { updateGeneratedSkill } from "../db/queries";

const SYSTEM_PROMPT = `You are a skill architect for TellMeNow — a platform where users select a skill, enter a query, and receive an AI-generated HTML research report.

Your task: given a skill name, description, expected input, and expected output, generate the full skill definition that will guide the report-generation AI.

## Reference: Site Overviewer Skill (quality benchmark)

Here is the structure of an existing high-quality skill for reference:

\`\`\`
# Site Overviewer

Estimate the total number of pages across a website or brand portfolio, producing a structured inventory for migration scoping.

## Trigger
User provides a brand name, company name, or one or more website URLs...

## Input
The user will provide one or more of the following:
- A brand or company name
- One or more website URLs
- Context about regional presence
- Any constraints

## Workflow
### Phase 1 — Domain Discovery
1. Identify the primary domain(s)...
2. Check for regional/country variants...

### Phase 2 — Sitemap Analysis
For each discovered domain:
1. Fetch sitemap...
2. Count sitemap URLs...

### Phase 3 — Content Sampling
...

### Phase 4 — Estimation & Tiering
...

### Phase 5 — Output
Generate the structured output following the format in the Output Format reference below.

## Research Methods
Use these approaches in priority order:
1. Method 1 — description
2. Method 2 — description

## Important Notes
- Always provide ranges...
- Distinguish between...
\`\`\`

And a separate output format reference:

\`\`\`
# Skill Name — Output Format

The output is a structured report with the following sections...

## 1. Section Name
Description and template...

## 2. Section Name
Description and template...
\`\`\`

## Your Output

Generate TWO blocks:

<skill-content>
The full skill instructions in markdown. Include:
- Title and description
- Trigger (when this skill activates)
- Input (what the user provides)
- Workflow (step-by-step phases)
- Research Methods (prioritized approaches)
- Important Notes (constraints, quality guidelines)
Be thorough but practical. The skill should produce genuinely useful reports.
</skill-content>

<output-format>
A detailed output format reference in markdown. Include:
- All required report sections with templates
- Example tables/structures
- Format variants if applicable
This tells the report generator exactly what structure to produce.
</output-format>

Generate only these two blocks, nothing else.`;

export async function generateSkill(
  skill: GeneratedSkill,
  env: Env,
  db: D1Database,
): Promise<void> {
  try {
    const userPrompt = [
      `# Skill to Generate`,
      ``,
      `**Name**: ${skill.name}`,
      `**Description**: ${skill.description}`,
      `**Input**: ${skill.input_spec}`,
      `**Output**: ${skill.output_spec}`,
    ];

    if (skill.chat_context) {
      userPrompt.push(``, `## Conversation Context`, ``, skill.chat_context);
    }

    const response = await chat(env, SYSTEM_PROMPT, userPrompt.join("\n"), {
      maxTokens: 8192,
      temperature: 0.5,
    });

    const contentMatch = response.match(/<skill-content>\s*([\s\S]*?)\s*<\/skill-content>/);
    const formatMatch = response.match(/<output-format>\s*([\s\S]*?)\s*<\/output-format>/);

    if (!contentMatch) {
      throw new Error("LLM response missing <skill-content> block");
    }

    const content = contentMatch[1].trim();
    const refs: Record<string, string> = {};
    if (formatMatch) {
      refs["output-format.md"] = formatMatch[1].trim();
    }

    await updateGeneratedSkill(db, skill.id, {
      status: "ready",
      content,
      refs_json: JSON.stringify(refs),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await updateGeneratedSkill(db, skill.id, {
      status: "failed",
      error: errorMsg,
      updated_at: new Date().toISOString(),
    });
  }
}
