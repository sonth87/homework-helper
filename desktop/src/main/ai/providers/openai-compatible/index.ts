/**
 * Họ tương thích OpenAI — dùng chung cho OpenAI, DeepSeek, Groq, Ollama,
 * LM Studio, OpenRouter và mọi endpoint tuỳ biến.
 *
 * Một adapter phục vụ 6 provider là lý do `family` tách khỏi `id` trong
 * config/providers.config.ts.
 */

import type { AiDelta } from '@shared/types/ai';
import { httpError } from '../errors';
import { sseData } from '../types';
import type { ParseState, ProviderAdapter, ProviderRequest, RequestContext } from '../types';

type OpenAiChunk = {
  choices?: { delta?: { content?: string; reasoning_content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export const openAiCompatibleAdapter: ProviderAdapter = {
  family: 'openai-compatible',

  authHeaders: (apiKey) => (apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),

  buildRequest(ctx: RequestContext): ProviderRequest {
    const content: Record<string, unknown>[] = [{ type: 'text', text: ctx.userPrompt }];

    if (ctx.imageBase64) {
      const url = ctx.imageBase64.startsWith('data:')
        ? ctx.imageBase64
        : `data:image/png;base64,${ctx.imageBase64}`;
      content.push({ type: 'image_url', image_url: { url } });
    }

    const body: Record<string, unknown> = {
      model: ctx.model,
      stream: true,
      // Xin luôn số token đã dùng trong chunk cuối — nếu không, không đếm được
      // chi phí cho hạn mức hàng tháng.
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: ctx.systemPrompt },
        { role: 'user', content: ctx.imageBase64 ? content : ctx.userPrompt },
      ],
      ...(ctx.maxOutputTokens ? { max_tokens: ctx.maxOutputTokens } : {}),
    };

    return {
      url: `${ctx.baseUrl}/chat/completions`,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.authHeaders(ctx.apiKey),
        },
        body: JSON.stringify(body),
      },
    };
  },

  parseLine(line: string, _state: ParseState): AiDelta[] {
    const payload = sseData(line);
    if (!payload) return [];

    let chunk: OpenAiChunk;
    try {
      chunk = JSON.parse(payload) as OpenAiChunk;
    } catch {
      return [];
    }

    const out: AiDelta[] = [];
    const delta = chunk.choices?.[0]?.delta;

    // DeepSeek R1 và các model suy luận trả phần nghĩ trong trường riêng.
    if (delta?.reasoning_content) out.push({ type: 'thinking', text: delta.reasoning_content });
    if (delta?.content) out.push({ type: 'text', text: delta.content });

    if (chunk.usage) {
      out.push({
        type: 'usage',
        inputTokens: chunk.usage.prompt_tokens ?? 0,
        outputTokens: chunk.usage.completion_tokens ?? 0,
      });
    }

    return out;
  },

  normalizeError: httpError,
};
