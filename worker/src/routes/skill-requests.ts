import { Hono } from "hono";
import { Env } from "../types";
import { insertSkillRequest } from "../db/queries";
import { getOptionalUser } from "../auth/middleware";
import { chatMultiTurn, ChatMessage } from "../llm/client";

const CHAT_SYSTEM_PROMPT = `You are a product collaborator helping a user define a new skill idea for TellMeNow — a platform where users select a skill, enter a query, and get an AI-generated research report.

Existing skills produce structured HTML reports (e.g. "Site Overviewer" estimates website page counts for migration scoping).

Your job:
- Understand what the user wants the skill to do
- Ask focused follow-up questions to clarify: what input would the user provide? What output/report should it produce? What's the use case?
- Think out loud — share your reasoning, suggest improvements, and build on the user's idea
- Keep responses concise (2-4 sentences) and conversational
- When the idea feels well-defined, output a summary block in exactly this format:

<skill-summary>
Name: [Short skill name]
Description: [One sentence describing what it does]
Input: [What the user provides]
Output: [What the report contains]
</skill-summary>

After outputting the summary, ask the user if they'd like to submit it or refine further. Only include the <skill-summary> block when you feel the idea is clear enough. You can include it alongside your conversational response.`;

const HAIKU_MODEL = "us.anthropic.claude-3-5-haiku-20241022-v1:0";

const app = new Hono<{ Bindings: Env }>();

app.post("/skill-requests/chat", async (c) => {
  const body = await c.req.json<{
    messages?: { role: string; content: string }[];
  }>();

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ detail: "messages array is required" }, 400);
  }

  // Validate and sanitize messages
  const messages: ChatMessage[] = body.messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return c.json({ detail: "Last message must be from user" }, 400);
  }

  try {
    const reply = await chatMultiTurn(c.env, CHAT_SYSTEM_PROMPT, messages, {
      model: HAIKU_MODEL,
      maxTokens: 1024,
      temperature: 0.7,
    });

    // Check if the reply contains a skill summary
    const summaryMatch = reply.match(/<skill-summary>\s*([\s\S]*?)\s*<\/skill-summary>/);
    let summary: { name: string; description: string; input: string; output: string } | null = null;

    if (summaryMatch) {
      const block = summaryMatch[1];
      const get = (key: string) => {
        const match = block.match(new RegExp(`${key}:\\s*(.+)`));
        return match?.[1]?.trim() ?? "";
      };
      summary = {
        name: get("Name"),
        description: get("Description"),
        input: get("Input"),
        output: get("Output"),
      };
    }

    // Strip the XML tags from the reply text for display
    const text = reply.replace(/<skill-summary>[\s\S]*?<\/skill-summary>/, "").trim();

    return c.json({ text, summary });
  } catch (err) {
    console.error("Skill request chat error:", err);
    return c.json({ detail: "Failed to generate response" }, 500);
  }
});

app.post("/skill-requests", async (c) => {
  const body = await c.req.json<{
    description?: string;
    additional_context?: string;
  }>();

  if (!body.description || typeof body.description !== "string" || !body.description.trim()) {
    return c.json({ detail: "description is required" }, 400);
  }

  const user = getOptionalUser(c);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await insertSkillRequest(c.env.DB, {
    id,
    user_id: user?.id ?? null,
    description: body.description.trim(),
    additional_context: body.additional_context?.trim() || null,
    created_at: now,
  });

  return c.json({ id });
});

export default app;
