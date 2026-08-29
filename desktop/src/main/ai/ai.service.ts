/**
 * Điều phối một yêu cầu AI: chọn cấu hình → gọi adapter → đọc stream → thử lại.
 *
 * File này KHÔNG chứa code riêng của provider nào. Mọi khác biệt nằm trong
 * src/main/ai/providers/ và được chọn qua adapterFor().
 */

import { PROVIDERS } from '@config/providers.config';
import { LIMITS } from '@config/limits.config';
import type { ApiConfig, Settings } from '@config/settings';
import type { AiDelta } from '@shared/types/ai';
import { adapterFor } from './providers';
import type { ParseState } from './providers/types';
import { keyRotator } from './key-rotator';
import { buildSystemPrompt, buildUserPrompt } from './prompt/build-prompt';
import type { PromptParams } from './prompt/build-prompt';
import { keychain } from '../secrets/keychain';
import { streamSse } from './sse';
import { logger } from '../logging/logger';

export type AskParams = PromptParams & {
  imageBase64?: string;
  preferredConfigId?: string;
};

export async function ask(
  params: AskParams,
  settings: Settings,
  emit: (delta: AiDelta) => void,
  signal: AbortSignal,
): Promise<void> {
  const candidates = keyRotator.candidates(settings, {
    needsVision: !!params.imageBase64,
    ...(params.preferredConfigId ? { preferredConfigId: params.preferredConfigId } : {}),
  });

  if (candidates.length === 0) {
    emit({ type: 'error', message: describeNoCandidate(settings, !!params.imageBase64), retryable: false });
    return;
  }

  const attempts = Math.min(settings.maxRetries, candidates.length);

  for (let i = 0; i < attempts; i++) {
    const config = candidates[i] as ApiConfig;
    if (signal.aborted) return;

    emit({ type: 'status', status: i === 0 ? 'connecting' : 'switching', model: config.model, provider: config.provider });

    const failure = await attempt({ config, params, settings, emit, signal });
    if (!failure) {
      keyRotator.reportSuccess(config.id);
      emit({ type: 'done' });
      return;
    }

    keyRotator.reportFailure(config.id, failure);
    logger.warn('Cấu hình thất bại', { configId: config.id, provider: config.provider, error: failure.message });

    // Lỗi cấu hình (khoá sai) thì thử key khác cũng vô ích — dừng và báo ngay.
    if (!failure.retryable || i === attempts - 1) {
      emit({ type: 'error', message: failure.message, retryable: failure.retryable });
      return;
    }
  }
}

type AttemptArgs = {
  config: ApiConfig;
  params: AskParams;
  settings: Settings;
  emit: (delta: AiDelta) => void;
  signal: AbortSignal;
};

/** Trả về null nếu thành công, hoặc lỗi đã chuẩn hoá nếu thất bại. */
async function attempt({ config, params, settings, emit, signal }: AttemptArgs) {
  const info = PROVIDERS[config.provider];
  const adapter = adapterFor(config.provider);
  const apiKey = info.requiresKey ? await keychain.get(config.id) : null;

  if (info.requiresKey && !apiKey) {
    return { message: `Chưa có API key cho ${info.name}.`, retryable: false, cooldownMs: 0 };
  }

  const request = adapter.buildRequest({
    baseUrl: (config.baseUrl || info.defaultBaseUrl).replace(/\/$/, ''),
    apiKey,
    model: config.model,
    systemPrompt: buildSystemPrompt(params),
    userPrompt: buildUserPrompt(params),
    ...(params.imageBase64 ? { imageBase64: params.imageBase64 } : {}),
    thinkingEnabled: settings.thinkingEnabled && info.capabilities.thinking,
  });

  const state: ParseState = {};
  return streamSse({
    request,
    signal,
    timeoutMs: Math.min(settings.requestTimeoutMs, LIMITS.llmLane.totalTimeoutMs),
    onLine: (line) => {
      for (const delta of adapter.parseLine(line, state)) emit(delta);
    },
    onHttpError: (status, body) => adapter.normalizeError(status, body),
  });
}

function describeNoCandidate(settings: Settings, needsVision: boolean): string {
  if (settings.apiConfigs.length === 0) return 'Chưa cấu hình mô hình nào. Mở Cài đặt để thêm.';
  if (needsVision) return 'Không có mô hình nào đọc được ảnh. Thêm một mô hình có thị giác.';
  if (settings.localModelsOnly) return 'Đang bật "chỉ dùng mô hình nội bộ" nhưng chưa có mô hình nội bộ nào khả dụng.';

  const at = keyRotator.nextAvailableAt();
  if (at) return `Mọi mô hình đang tạm ngưng. Thử lại sau ${Math.ceil((at - Date.now()) / 1000)} giây.`;
  return 'Không có mô hình nào khả dụng. Kiểm tra lại trong Cài đặt.';
}
