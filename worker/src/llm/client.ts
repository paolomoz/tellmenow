import { Env } from "../types";

interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function chat(
  env: Env,
  system: string,
  userMessage: string,
  options: ChatOptions = {},
): Promise<string> {
  const model = options.model || env.ANTHROPIC_MODEL;
  const maxTokens = options.maxTokens ?? 16384;
  const temperature = options.temperature ?? 0.7;

  const encodedModel = encodeURIComponent(model);
  const url = `https://bedrock-runtime.${env.AWS_REGION}.amazonaws.com/model/${encodedModel}/invoke`;

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: "user", content: userMessage }],
  };

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

      const data = (await resp.json()) as {
        content: Array<{ type: string; text: string }>;
      };
      return data.content[0].text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("LLM request failed after 3 attempts");
}
