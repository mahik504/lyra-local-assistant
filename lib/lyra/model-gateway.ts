export type ModelRoute = "fast" | "balanced" | "reasoning" | "long-context";

export type GatewayMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GatewayConfig = {
  baseUrl: string;
  apiKey: string;
  models: Record<ModelRoute, string>;
  timeoutMs: number;
};

type CompletionResponse = {
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
};

function readModel(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

export function getGatewayConfig(): GatewayConfig {
  return {
    baseUrl: readModel("LYRA_LLM_BASE_URL", readModel("OPENAI_API_BASE")),
    apiKey: readModel("LYRA_LLM_API_KEY", readModel("OPENAI_API_KEY")),
    models: {
      fast: readModel("LYRA_MODEL_FAST"),
      balanced: readModel("LYRA_MODEL_BALANCED"),
      reasoning: readModel("LYRA_MODEL_REASONING"),
      "long-context": readModel("LYRA_MODEL_LONG_CONTEXT"),
    },
    timeoutMs: Number.parseInt(readModel("LYRA_LLM_TIMEOUT_MS", "30000"), 10) || 30000,
  };
}

export function chooseRoute(prompt: string): ModelRoute {
  const normalized = prompt.toLowerCase();
  if (/(research|summarize|document|long|meeting transcript|many notes)/.test(normalized)) return "long-context";
  if (/(code|debug|architect|security|refactor|complex|reason)/.test(normalized)) return "reasoning";
  if (/(capture|tag|extract|classify|task|todo|quick)/.test(normalized)) return "fast";
  return "balanced";
}

function readContent(payload: CompletionResponse) {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((part) => part.text || "").join("").trim();
  return "";
}

export async function complete(messages: GatewayMessage[], route: ModelRoute) {
  const config = getGatewayConfig();
  const model = config.models[route] || config.models.balanced || config.models.fast;
  if (!config.baseUrl || !config.apiKey || !model) return { configured: false, text: "", route, model: model || null };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3 }),
      signal: controller.signal,
    });
    if (!response.ok) return { configured: true, text: "", route, model, error: `provider_${response.status}` };
    const payload = (await response.json()) as CompletionResponse;
    return { configured: true, text: readContent(payload), route, model };
  } catch (error) {
    return { configured: true, text: "", route, model, error: error instanceof Error ? error.name : "provider_error" };
  } finally {
    clearTimeout(timeout);
  }
}
