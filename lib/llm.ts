import { env } from "cloudflare:workers";
import { getLlmPlatformChoice } from "./site-settings";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmProvider = {
  name: string;
  complete(input: { system: string; user: string }): Promise<string | null>;
  chat(input: {
    messages: ChatMessage[];
    temperature?: number;
    json?: boolean;
  }): Promise<{ content: string | null; error?: string; mock?: boolean }>;
};

export type LlmPreset = {
  id: string;
  label: string;
  group: "国内" | "第三方" | "自定义";
  baseUrl: string;
  model: string;
  /** Env key name hint for per-preset secret, e.g. LLM_API_KEY_DEEPSEEK */
  keyEnv?: string;
};

/** Built-in OpenAI-compatible presets. Platform admin picks the default in /admin. */
export const LLM_PRESETS: LlmPreset[] = [
  {
    id: "deepseek",
    label: "DeepSeek",
    group: "国内",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    keyEnv: "LLM_API_KEY_DEEPSEEK",
  },
  {
    id: "qwen",
    label: "通义千问",
    group: "国内",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    keyEnv: "LLM_API_KEY_QWEN",
  },
  {
    id: "zhipu",
    label: "智谱 GLM",
    group: "国内",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
    keyEnv: "LLM_API_KEY_ZHIPU",
  },
  {
    id: "moonshot",
    label: "Moonshot / Kimi",
    group: "国内",
    baseUrl: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    keyEnv: "LLM_API_KEY_MOONSHOT",
  },
  {
    id: "ark",
    label: "火山方舟 Coding",
    group: "国内",
    // Coding Plan OpenAI-compatible base
    baseUrl: "https://ark.cn-beijing.volces.com/api/coding/v3",
    model: "doubao-seed-2.1-pro",
    keyEnv: "LLM_API_KEY_ARK",
  },
  {
    id: "openai",
    label: "OpenAI",
    group: "第三方",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    keyEnv: "LLM_API_KEY_OPENAI",
  },
  {
    id: "custom",
    label: "自定义（LLM_BASE_URL）",
    group: "自定义",
    baseUrl: "",
    model: "",
    keyEnv: "LLM_API_KEY",
  },
];

type ResolvedEndpoint = {
  presetId: string;
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string | null;
  configured: boolean;
};

function readEnv(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const bag = env as unknown as Record<string, string | undefined>;
  return bag[name];
}

function parsePresetOverrides(): Partial<Record<string, { baseUrl?: string; model?: string; apiKey?: string; label?: string }>> {
  const raw = env.LLM_PRESETS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Partial<Record<string, { baseUrl?: string; model?: string; apiKey?: string; label?: string }>>;
  } catch {
    console.error("LLM_PRESETS JSON invalid");
    return {};
  }
}

export function listLlmPresets(): Array<LlmPreset & { configured: boolean; effectiveModel: string }> {
  const overrides = parsePresetOverrides();
  return LLM_PRESETS.map((preset) => {
    const resolved = resolvePreset(preset.id);
    const over = overrides[preset.id];
    return {
      ...preset,
      label: over?.label || preset.label,
      model: resolved.model,
      baseUrl: resolved.baseUrl,
      configured: resolved.configured,
      effectiveModel: resolved.model,
    };
  });
}

export function resolvePreset(presetId: string, modelOverride?: string): ResolvedEndpoint {
  const overrides = parsePresetOverrides();
  const builtIn = LLM_PRESETS.find((item) => item.id === presetId) ?? LLM_PRESETS.find((item) => item.id === "custom")!;
  const over = overrides[builtIn.id] ?? {};

  let baseUrl = (over.baseUrl || builtIn.baseUrl || env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  let model = modelOverride || over.model || builtIn.model || env.LLM_MODEL || "gpt-4o-mini";

  if (builtIn.id === "custom") {
    baseUrl = (over.baseUrl || env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    model = modelOverride || over.model || env.LLM_MODEL || "gpt-4o-mini";
  }

  const perKey =
    over.apiKey ||
    readEnv(builtIn.keyEnv) ||
    (builtIn.id === "custom" ? env.LLM_API_KEY : undefined) ||
    env.LLM_API_KEY ||
    null;

  return {
    presetId: builtIn.id,
    label: over.label || builtIn.label,
    baseUrl,
    model,
    apiKey: perKey,
    configured: Boolean(perKey),
  };
}

export type PublicLlmStatus = {
  configured: boolean;
  /** Active provider label for residents (no selector). */
  providerLabel: string;
  mock: boolean;
};

export type AdminLlmStatus = {
  configured: boolean;
  defaultPreset: string;
  defaultModel: string | null;
  active: { presetId: string; label: string; model: string; baseUrl: string; configured: boolean };
  presets: Array<{
    id: string;
    label: string;
    group: string;
    configured: boolean;
    model: string;
    baseUrl: string;
  }>;
  /** Secrets stay in Wrangler; never returned as values. */
  secretHint: string;
};

async function resolvePlatformDefaults() {
  const choice = await getLlmPlatformChoice();
  const presets = listLlmPresets();
  const anyKey = presets.some((item) => item.configured) || Boolean(env.LLM_API_KEY);
  const presetId =
    choice.presetId ||
    env.LLM_DEFAULT_PRESET ||
    (anyKey && presets.find((item) => item.id === "deepseek" && item.configured)
      ? "deepseek"
      : anyKey
        ? presets.find((item) => item.configured)?.id || "custom"
        : "deepseek");
  const model = choice.model || env.LLM_MODEL || null;
  return { presetId, model, anyKey };
}

/** Resident-facing: configured or not, no provider catalog. */
export async function llmStatus(): Promise<PublicLlmStatus> {
  const { presetId, model, anyKey } = await resolvePlatformDefaults();
  const endpoint = resolvePreset(presetId, model || undefined);
  return {
    configured: anyKey && endpoint.configured,
    providerLabel: endpoint.label,
    mock: !(anyKey && endpoint.configured),
  };
}

/** Admin-facing: full preset catalog + saved defaults (no API keys). */
export async function adminLlmStatus(): Promise<AdminLlmStatus> {
  const { presetId, model, anyKey } = await resolvePlatformDefaults();
  const endpoint = resolvePreset(presetId, model || undefined);
  const presets = listLlmPresets();
  return {
    configured: anyKey,
    defaultPreset: presetId,
    defaultModel: model,
    active: {
      presetId: endpoint.presetId,
      label: endpoint.label,
      model: endpoint.model,
      baseUrl: endpoint.baseUrl,
      configured: endpoint.configured,
    },
    presets: presets.map(({ id, label, group, configured, effectiveModel, baseUrl }) => ({
      id,
      label,
      group,
      configured,
      model: effectiveModel,
      baseUrl,
    })),
    secretHint:
      "密钥用 wrangler secret put（LLM_API_KEY / LLM_API_KEY_DEEPSEEK / LLM_API_KEY_ARK 等），不在后台明文保存。",
  };
}

/** Platform default for workbench chat (ignores resident input). */
export async function getPlatformChatProvider() {
  const { presetId, model } = await resolvePlatformDefaults();
  return getChatProvider(presetId, model || undefined);
}

async function openAiChat(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
}): Promise<{ content: string | null; error?: string }> {
  const body: Record<string, unknown> = {
    model: input.model,
    temperature: input.temperature ?? 0.5,
    messages: input.messages,
  };
  if (input.json) body.response_format = { type: "json_object" };

  try {
    const response = await fetch(`${input.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { content: null, error: `模型接口 ${response.status}${text ? `：${text.slice(0, 180)}` : ""}` };
    }
    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string | null; reasoning_content?: string | null };
      }>;
    };
    const message = data.choices?.[0]?.message;
    const content = (message?.content || "").trim() || (message?.reasoning_content || "").trim() || null;
    return { content };
  } catch (error) {
    console.error("llm chat failed", error);
    return { content: null, error: "模型请求失败，请稍后重试。" };
  }
}

const mockProvider: LlmProvider = {
  name: "mock",
  complete: async () => null,
  async chat({ messages }) {
    const lastUser = [...messages].reverse().find((item) => item.role === "user")?.content || "";
    const turns = messages.filter((item) => item.role !== "system").length;
    if (turns <= 1) {
      return {
        mock: true,
        content:
          "你好，我是自在星球的七维探索向导（当前为「未配置密钥」演示模式）。\n\n七个维度是：本源、天赋、品味、价值观、身份、同频关系、人生愿景。完整题库约 120 题。\n\n你可以选「自适应探索」（推荐，每维先问几题）或「完整探索」。直接说「开始」我会默认自适应，并从「本源」问起。\n\n（配置 LLM_API_KEY 后即可对接 DeepSeek / 火山方舟 / 通义 / 智谱 / Moonshot / OpenAI 等兼容接口。）",
      };
    }
    if (/画像|结束|停|生成|完成|总结/.test(lastUser) || turns > 8) {
      return {
        mock: true,
        content: `《七维个人定位画像》（演示 · 未配置真实密钥）

### 本源
关键发现：你提到「${lastUser.slice(0, 40) || "自在地做自己"}」。
支持证据：用户直接陈述（演示）。
可能的反例/限制：尚未深入验证。
置信度：待验证

### 天赋
关键发现：待加深。
支持证据：尚未知。
可能的反例/限制：—
置信度：待验证

### 品味 / 价值观 / 身份 / 同频关系 / 人生愿景
关键发现：演示模式仅示意结构；配置密钥后会按 Skill 完整生成。
支持证据：尚未知。
置信度：待验证

一句话本源表达：我想怎样活，而不是我想成为什么。（演示）
仍需验证的问题：请配置大模型密钥后继续真实探索。`,
      };
    }
    const order = ["本源", "天赋", "品味", "价值观", "身份", "同频关系", "人生愿景"];
    const idx = Math.min(Math.max(Math.floor((turns - 2) / 1), 0), order.length - 1);
    const dim = order[idx];
    const next = order[Math.min(idx + 1, order.length - 1)];
    return {
      mock: true,
      content: `收到。你刚才说：「${lastUser.slice(0, 120)}${lastUser.length > 120 ? "…" : ""}」。\n\n（演示）「${dim}」这一维先记下你的原话。可以继续补充，或说「下一维 / 生成画像」。\n\n下一问（${next}）：请再讲一件具体的小事。\n<<<LIT:${dim}>>>`,
    };
  },
};

function makeOpenAiProvider(resolved: ResolvedEndpoint): LlmProvider {
  return {
    name: resolved.presetId,
    async complete({ system, user }) {
      if (!resolved.apiKey) return null;
      const result = await openAiChat({
        baseUrl: resolved.baseUrl,
        apiKey: resolved.apiKey,
        model: resolved.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
        json: true,
      });
      return result.content;
    },
    async chat({ messages, temperature, json }) {
      if (!resolved.apiKey) return mockProvider.chat({ messages, temperature, json });
      const result = await openAiChat({
        baseUrl: resolved.baseUrl,
        apiKey: resolved.apiKey,
        model: resolved.model,
        messages,
        temperature,
        json,
      });
      return result;
    },
  };
}

/** Legacy single-shot helper used by room cards. */
export function getLlmProvider(): LlmProvider {
  if (env.LLM_API_KEY) return makeOpenAiProvider(resolvePreset("custom"));
  return mockProvider;
}

/** Workbench: pick preset + optional model override. Falls back to mock when no key. */
export function getChatProvider(presetId?: string, modelOverride?: string): {
  provider: LlmProvider;
  endpoint: ResolvedEndpoint;
  mock: boolean;
} {
  const endpoint = resolvePreset(presetId || env.LLM_DEFAULT_PRESET || "deepseek", modelOverride);
  if (!endpoint.apiKey) {
    return { provider: mockProvider, endpoint, mock: true };
  }
  return { provider: makeOpenAiProvider(endpoint), endpoint, mock: false };
}
