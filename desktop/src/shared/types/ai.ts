/** Kiểu dùng chung cho tầng AI. Chi tiết adapter nằm ở src/main/ai/providers/. */

export const PROVIDER_IDS = [
  'gemini', 'openai', 'claude', 'deepseek', 'groq', 'ollama', 'lmstudio', 'custom',
] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

/**
 * Năng lực của provider — kiểm tra TRƯỚC khi gửi request, thay vì để API trả lỗi.
 * Nhờ đó "gửi ảnh cho model text-only" thành lỗi lúc định tuyến, không phải lỗi mạng.
 */
export type ProviderCapabilities = {
  readonly vision: boolean;
  readonly streaming: boolean;
  readonly thinking: boolean;
  readonly structuredOutput: boolean;
  readonly maxImageBytes?: number;
};

/** Một mảnh dữ liệu từ luồng streaming. */
export type AiDelta =
  | { type: 'status'; status: 'connecting' | 'switching'; model: string; provider: ProviderId; notice?: string }
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'error'; message: string; retryable: boolean }
  | { type: 'done' };

export type ProviderError = {
  message: string;
  statusCode?: number;
  /** true khi nên thử key khác (429, 5xx); false khi lỗi cấu hình (401, 403). */
  retryable: boolean;
  /** Số mili-giây nên tạm ngưng key này. */
  cooldownMs: number;
};
