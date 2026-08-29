/**
 * Anthropic Claude — Messages API.
 *
 * Điểm riêng: SSE có nhiều loại sự kiện (`content_block_delta`, `message_delta`…)
 * thay vì một hình dạng chunk duy nhất, system prompt là trường cấp cao nhất,
 * và ảnh dùng khối `source` với base64 thuần.
 */

import type { AiDelta } from '@shared/types/ai';
import { httpError } from '../errors';
import { sseData, stripDataUrl } from '../types';
import type { ParseState, ProviderAdapter, ProviderRequest, RequestContext } from '../types';

type ClaudeEvent = {
  type?: string;
  delta?: { type?: string; text?: string; thinking?: string };
  message?: { usage?: { input_tokens?: number; output_tokens?: number } };
  usage?: { output_tokens?: number };
};

/** Ngân sách token tối thiểu Anthropic chấp nhận cho chế độ suy luận. */
const THINKING_BUDGET = 2048;
const DEFAULT_MAX_TOKENS = 8192;

/**
 * Claude phát nhiều loại sự kiện SSE thay vì một hình dạng chunk duy nhất.
 * Bảng tra theo `type` thay cho chuỗi if lồng nhau — vừa dễ đọc, vừa giữ độ
 * phức tạp của parseLine dưới ngưỡng ESLint.
 */
const HANDLERS: Record<string, (event: ClaudeEvent, state: ParseState) => AiDelta[]> = {
  // Số token đầu vào chỉ xuất hiện ở sự kiện đầu; giữ lại để gộp với số token
  // đầu ra ở sự kiện cuối.
  message_start: (event, state) => {
    state.inputTokens = event.message?.usage?.input_tokens ?? 0;
    return [];
  },
  content_block_delta: (event) => {
    if (event.delta?.thinking) return [{ type: 'thinking', text: event.delta.thinking }];
    if (event.delta?.text) return [{ type: 'text', text: event.delta.text }];
    return [];
  },
  message_delta: (event, state) =>
    event.usage
      ? [{
          type: 'usage',
          inputTokens: typeof state.inputTokens === 'number' ? state.inputTokens : 0,
          outputTokens: event.usage.output_tokens ?? 0,
        }]
      : [],
};

export const claudeAdapter: ProviderAdapter = {
  family: 'claude',

  authHeaders: (apiKey) => (apiKey ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } : {}),

  buildRequest(ctx: RequestContext): ProviderRequest {
    const content: Record<string, unknown>[] = [];

    if (ctx.imageBase64) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: stripDataUrl(ctx.imageBase64) },
      });
    }
    content.push({ type: 'text', text: ctx.userPrompt });

    const maxTokens = ctx.maxOutputTokens ?? DEFAULT_MAX_TOKENS;

    const body: Record<string, unknown> = {
      model: ctx.model,
      stream: true,
      max_tokens: maxTokens,
      system: ctx.systemPrompt,
      messages: [{ role: 'user', content }],
      // max_tokens phải LỚN HƠN budget_tokens, nếu không API từ chối request.
      ...(ctx.thinkingEnabled && maxTokens > THINKING_BUDGET
        ? { thinking: { type: 'enabled', budget_tokens: THINKING_BUDGET } }
        : {}),
    };

    return {
      url: `${ctx.baseUrl}/messages`,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          ...this.authHeaders(ctx.apiKey),
        },
        body: JSON.stringify(body),
      },
    };
  },

  parseLine(line: string, state: ParseState): AiDelta[] {
    const payload = sseData(line);
    if (!payload) return [];

    try {
      const event = JSON.parse(payload) as ClaudeEvent;
      return HANDLERS[event.type ?? '']?.(event, state) ?? [];
    } catch {
      return [];
    }
  },

  normalizeError: httpError,
};
