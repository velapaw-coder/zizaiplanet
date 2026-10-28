interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB: {
      prepare(query: string): D1Statement;
    };
    SESSION: {
      get(key: string): Promise<string | null>;
      put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
      delete(key: string): Promise<void>;
    };
    ASSETS?: {
      fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    };
    MEDIA: {
      put(
        key: string,
        value: ArrayBuffer | ArrayBufferView | string | Blob,
        options?: { httpMetadata?: { contentType?: string } },
      ): Promise<unknown>;
      get(key: string): Promise<{
        body: ReadableStream;
        httpMetadata?: { contentType?: string };
      } | null>;
    };
    APP_URL?: string;
    ADMIN_EMAILS?: string;
    MAGIC_LINK_PREVIEW?: string;
    SESSION_SECRET?: string;
    LLM_API_KEY?: string;
    LLM_BASE_URL?: string;
    LLM_MODEL?: string;
    LLM_DEFAULT_PRESET?: string;
    LLM_PRESETS?: string;
    LLM_API_KEY_DEEPSEEK?: string;
    LLM_API_KEY_QWEN?: string;
    LLM_API_KEY_ZHIPU?: string;
    LLM_API_KEY_MOONSHOT?: string;
    LLM_API_KEY_OPENAI?: string;
    LLM_API_KEY_ARK?: string;
    MAIL_WEBHOOK_URL?: string;
    TURNSTILE_SITE_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
  };
}
