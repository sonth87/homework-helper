/**
 * Chọn cấu hình AI để dùng, và tạm ngưng cấu hình vừa lỗi.
 *
 * Bám theo hành vi đã kiểm chứng ở extension (background/key-rotator.js):
 * lỗi 429 tạm ngưng 60s, lỗi máy chủ 30s. Khác biệt: ở đây `retryable` do adapter
 * quyết định, nên lỗi cấu hình (401/403) KHÔNG kích hoạt cooldown — thử lại
 * cùng key đó vẫn hỏng, và tạm ngưng chỉ làm người dùng bối rối thêm.
 */

import type { ApiConfig, Settings } from '@config/settings';
import { PROVIDERS } from '@config/providers.config';
import type { ProviderError } from '@shared/types/ai';
import { logger } from '../logging/logger';

export type SelectOptions = {
  /** true khi request có ảnh — loại các provider không đọc được ảnh. */
  needsVision: boolean;
  preferredConfigId?: string;
};

export class KeyRotator {
  private cooldowns = new Map<string, number>();
  private cursor = 0;

  /** Trả về các cấu hình dùng được, đã xếp theo thứ tự nên thử. */
  candidates(settings: Settings, options: SelectOptions): ApiConfig[] {
    const now = Date.now();

    let usable = settings.apiConfigs.filter((config) => {
      if (!config.isEnabled) return false;
      if ((this.cooldowns.get(config.id) ?? 0) > now) return false;
      if (options.needsVision && !PROVIDERS[config.provider].capabilities.vision) return false;
      if (settings.localModelsOnly && !PROVIDERS[config.provider].isLocal) return false;
      return true;
    });

    if (options.preferredConfigId) {
      const preferred = usable.filter((c) => c.id === options.preferredConfigId);
      if (preferred.length) return preferred;
    }

    usable = [...usable].sort((a, b) => a.priority - b.priority);

    if (settings.rotationStrategy === 'random') {
      return shuffle(usable);
    }
    if (settings.rotationStrategy === 'round-robin' && usable.length > 1) {
      // Xoay điểm bắt đầu để tải rải đều, nhưng vẫn giữ nguyên thứ tự ưu tiên
      // cho các lần thử tiếp theo trong cùng một request.
      const offset = this.cursor++ % usable.length;
      return [...usable.slice(offset), ...usable.slice(0, offset)];
    }
    return usable;
  }

  /** Ghi nhận lỗi. Chỉ lỗi tạm thời mới tạm ngưng cấu hình. */
  reportFailure(configId: string, error: ProviderError): void {
    if (!error.retryable || error.cooldownMs <= 0) return;
    this.cooldowns.set(configId, Date.now() + error.cooldownMs);
    logger.warn('Tạm ngưng cấu hình', { configId, ms: error.cooldownMs, reason: error.message });
  }

  reportSuccess(configId: string): void {
    this.cooldowns.delete(configId);
  }

  /** Thời điểm cấu hình sớm nhất hết tạm ngưng — để báo người dùng phải chờ bao lâu. */
  nextAvailableAt(): number | null {
    const times = [...this.cooldowns.values()].filter((t) => t > Date.now());
    return times.length ? Math.min(...times) : null;
  }
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export const keyRotator = new KeyRotator();
