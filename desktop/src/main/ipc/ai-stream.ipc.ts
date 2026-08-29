import { registerStreamHandler } from './stream-handler';
import { ask } from '../ai/ai.service';
import { RateLimiter, checkTrigger } from '../pipeline/guards';
import { openDatabase } from '../db/connection';
import { UsageRepo } from '../db/repositories/usage.repo';
import type { SettingsService } from '../settings/settings.service';
import type { AskParams } from '@shared/ipc/channels';
import { logger } from '../logging/logger';

let limiter: RateLimiter | null = null;
let capacity = -1;

export function registerAiStreamIpc(settings: SettingsService): void {
  registerStreamHandler('ai:ask', async ({ payload, emit, signal }) => {
    const current = settings.get();
    const params = payload as AskParams;

    // Yêu cầu đến từ giao diện là do người dùng chủ động — nhưng vẫn đi qua
    // guard để bất biến ADR-0003 không có ngoại lệ nào.
    const trigger = checkTrigger(params.intent, 'ui');
    if (!trigger.allowed) {
      emit({ type: 'error', message: trigger.reason, retryable: false });
      return;
    }

    if (capacity !== current.maxRequestsPerMinute) {
      limiter = new RateLimiter(current.maxRequestsPerMinute);
      capacity = current.maxRequestsPerMinute;
    }
    const quota = limiter?.tryAcquire();
    if (quota && !quota.allowed) {
      emit({ type: 'error', message: quota.reason, retryable: true });
      return;
    }

    const usage = new UsageRepo(openDatabase());
    let provider = '';
    let model = '';

    await ask(
      {
        intent: params.intent,
        outputLanguage: current.outputLanguage,
        userText: params.prompt,
        hasImage: !!params.imageBase64,
        ...(params.studyMode ? { studyMode: params.studyMode } : {}),
        ...(params.imageBase64 ? { imageBase64: params.imageBase64 } : {}),
        ...(params.preferredConfigId ? { preferredConfigId: params.preferredConfigId } : {}),
      },
      current,
      (delta) => {
        if (delta.type === 'status') {
          provider = delta.provider;
          model = delta.model;
        }
        // Ghi usage ngay khi nhận được, không đợi kết thúc: request bị huỷ
        // giữa chừng vẫn đã tiêu token và vẫn phải tính.
        if (delta.type === 'usage' && provider) {
          try {
            usage.record(provider, model, delta.inputTokens, delta.outputTokens);
          } catch (error) {
            logger.warn('Không ghi được usage', error);
          }
        }
        emit(delta);
      },
      signal,
    );
  });
}
