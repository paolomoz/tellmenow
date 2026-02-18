import { Env } from "../types";

interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export type ToolHandler = (
  name: string,
  input: Record<string, unknown>,
) => Promise<string>;

interface InvokeResult {
  content: ContentBlock[];
  stop_reason: string;
}

async function invokeModel(
  env: Env,
  system: string,
  messages: ChatMessage[],
  options: ChatOptions = {},
  tools?: Tool[],
): Promise<InvokeResult> {
  const model = options.model || env.ANTHROPIC_MODEL;
  const maxTokens = options.maxTokens ?? 16384;
  const temperature = options.temperature ?? 0.7;

  const encodedModel = encodeURIComponent(model);
  const url = `https://bedrock-runtime.${env.AWS_REGION}.amazonaws.com/model/${encodedModel}/invoke`;

  const body: Record<string, unknown> = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    temperature,
    system,
    messages,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.ANTHROPIC_AWS_BEARER_TOKEN_BEDROCK}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Bedrock ${resp.status}: ${text}`);
      }

      const data = (await resp.json()) as InvokeResult;
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("LLM request failed after 3 attempts");
}

export async function chat(
  env: Env,
  system: string,
  userMessage: string,
  options: ChatOptions = {},
): Promise<string> {
  return chatMultiTurn(env, system, [{ role: "user", content: userMessage }], options);
}

export async function chatMultiTurn(
  env: Env,
  system: string,
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const result = await invokeModel(env, system, messages, options);
  const textBlock = result.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

const MAX_TOOL_TURNS = 25;

export async function chatWithTools(
  env: Env,
  system: string,
  userMessage: string,
  tools: Tool[],
  handler: ToolHandler,
  options: ChatOptions = {},
  onToolUse?: (name: string, input: Record<string, unknown>) => void,
): Promise<string> {
  const messages: ChatMessage[] = [{ role: "user", content: userMessage }];
  const textParts: string[] = [];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const result = await invokeModel(env, system, messages, options, tools);

    // Collect text blocks from this turn
    for (const block of result.content) {
      if (block.type === "text" && block.text) {
        textParts.push(block.text);
      }
    }

    if (result.stop_reason !== "tool_use") {
      break;
    }

    // Find all tool_use blocks
    const toolUseBlocks = result.content.filter((b) => b.type === "tool_use");
    if (toolUseBlocks.length === 0) break;

    // Add assistant message with the full content
    messages.push({ role: "assistant", content: result.content });

    // Execute tool calls in parallel
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        if (onToolUse) {
          onToolUse(block.name!, block.input!);
        }
        try {
          const output = await handler(block.name!, block.input!);
          return {
            type: "tool_result" as const,
            tool_use_id: block.id!,
            content: output,
          };
        } catch (err) {
          return {
            type: "tool_result" as const,
            tool_use_id: block.id!,
            content: err instanceof Error ? err.message : String(err),
            is_error: true,
          };
        }
      }),
    );

    // Feed tool results back as a user message
    messages.push({
      role: "user",
      content: toolResults as unknown as ContentBlock[],
    });
  }

  return textParts.join("\n\n");
}
