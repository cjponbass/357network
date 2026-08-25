/**
 * Server-only AI provider abstraction.
 *
 * Resolution order:
 *   1. OPENAI_API_KEY  -> OpenAI chat completions
 *   2. nothing         -> AiNotConfiguredError, never fabricated output.
 *
 * Keys are read inside functions (never at module scope) and never leave the server.
 */

export const AI_NOT_CONFIGURED = "AI_NOT_CONFIGURED";

export class AiNotConfiguredError extends Error {
  code = AI_NOT_CONFIGURED;
  constructor() {
    super(
      "AI is not configured. Add OPENAI_API_KEY in the deployment environment to enable analysis and generation. Every other part of the workspace keeps working manually.",
    );
    this.name = "AiNotConfiguredError";
  }
}

interface Provider {
  name: "openai";
  endpoint: string;
  apiKey: string;
  model: string;
}

const OPENAI_MODEL = "gpt-4o-mini";

function resolveProvider(): Provider | null {
  const openaiKey = process.env["OPENAI_API_KEY"];
  if (!openaiKey) return null;
  return {
    name: "openai",
    endpoint: "https://api.openai.com/v1/chat/completions",
    apiKey: openaiKey,
    model: process.env["OPENAI_MODEL"] || OPENAI_MODEL,
  };
}

export function aiStatus(): { configured: boolean; provider: string | null; model: string | null } {
  const provider = resolveProvider();
  return provider
    ? { configured: true, provider: provider.name, model: provider.model }
    : { configured: false, provider: null, model: null };
}

export interface ChatResult {
  text: string;
  model: string;
}

export async function chat(options: {
  system: string;
  user: string;
  json?: boolean;
  maxTokens?: number;
}): Promise<ChatResult> {
  const provider = resolveProvider();
  if (!provider) throw new AiNotConfiguredError();

  const body: Record<string, unknown> = {
    model: provider.model,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    max_completion_tokens: options.maxTokens ?? 1800,
  };
  if (options.json) body["response_format"] = { type: "json_object" };

  let response: Response;
  try {
    response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the AI service. Please try again.");
  }

  if (response.status === 429) {
    throw new Error("AI rate limit reached. Wait a moment and try again.");
  }
  if (!response.ok) {
    console.error("[ai] provider error", provider.name, response.status, await safeText(response));
    throw new Error(`The AI service returned an error (${response.status}). Please try again.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("The AI service returned an empty response. Please try again.");
  return { text, model: provider.model };
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "<unreadable>";
  }
}

/** Tolerant JSON parse for model output that may be fenced or padded with prose. */
export function parseJsonObject<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("The AI service returned output we could not read. Please try again.");
  }
}
