/**
 * Google Gemini — generateContent với alt=sse.
 *
 * Khác hai họ kia ở ba điểm: khoá đi trong header riêng (không phải Bearer),
 * system prompt nằm ở `systemInstruction` chứ không phải một message, và ảnh
 * dùng `inlineData` thay vì data URL.
 */

import type { AiDelta } from '@shared/types/ai';
import { httpError } from '../errors';
import { sseData, stripDataUrl } from '../types';
import type { ParseState, ProviderAdapter, ProviderRequest, RequestContext } from '../types';

type GeminiChunk = {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

export const geminiAdapter: ProviderAdapter = {
  family: 'gemini',

  authHeaders: (apiKey) => (apiKey ? { 'x-goog-api-key': apiKey } : {}),

  buildRequest(ctx: RequestContext): ProviderRequest {
    const parts: Record<string, unknown>[] = [{ text: ctx.userPrompt }];

    if (ctx.imageBase64) {
      parts.unshift({
        inlineData: { mimeType: 'image/png', data: stripDataUrl(ctx.imageBase64) },
      });
    }

    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts }],
      systemInstruction: { parts: [{ text: ctx.systemPrompt }] },
      generationConfig: {
        ...(ctx.maxOutputTokens ? { maxOutputTokens: ctx.maxOutputTokens } : {}),
        // thinkingBudget = 0 tắt hẳn suy luận. Bỏ trường này đi thì model tự quyết.
        ...(ctx.thinkingEnabled ? {} : { thinkingConfig: { thinkingBudget: 0 } }),
      },
    };

    return {
      url: `${ctx.baseUrl}/models/${ctx.model}:streamGenerateContent?alt=sse`,
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

    let chunk: GeminiChunk;
    try {
      chunk = JSON.parse(payload) as GeminiChunk;
    } catch {
      return [];
    }

    const out: AiDelta[] = [];

    for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
      if (!part.text) continue;
      // Gemini đánh dấu phần suy luận bằng cờ `thought` — tách ra để UI hiển
      // thị khác với lời giải chính.
      out.push(part.thought ? { type: 'thinking', text: part.text } : { type: 'text', text: part.text });
    }

    const usage = chunk.usageMetadata;
    if (usage) {
      out.push({
        type: 'usage',
        inputTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
      });
    }

    return out;
  },

  normalizeError: httpError,
};
