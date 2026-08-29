/**
 * Đường ống chính: intent → thu nhận nội dung → thực thi → hiển thị.
 *
 * Thay cho `processPoint(Point)` của đặc tả gốc, vốn chỉ mô hình hoá được việc
 * dịch. Xem roadmap/desktop-app-implementation-plan.md mục 4.
 *
 * Phase 1 mới dựng khung và guard. Tầng thu nhận (acquisition) và thực thi
 * (lane-fast / lane-llm) là công việc của Phase 2 và Phase 3.
 */

import { INTENTS } from '@config/intents.config';
import type { Settings } from '@config/settings';
import type { Intent, TriggerSource } from '@shared/types/intent';
import { RateLimiter, checkTrigger } from './guards';
import { logger } from '../logging/logger';

let limiter: RateLimiter | null = null;
let limiterCapacity = -1;

function rateLimiterFor(settings: Settings): RateLimiter {
  if (!limiter || limiterCapacity !== settings.maxRequestsPerMinute) {
    limiter = new RateLimiter(settings.maxRequestsPerMinute);
    limiterCapacity = settings.maxRequestsPerMinute;
  }
  return limiter;
}

export function handleIntent(intent: Intent, source: TriggerSource, settings: Settings): void {
  // Bất biến ADR-0003 — kiểm tra TRƯỚC mọi việc khác.
  const trigger = checkTrigger(intent, source);
  if (!trigger.allowed) {
    logger.warn('Bỏ qua intent', { intent, source, reason: trigger.reason });
    return;
  }

  if (INTENTS[intent].lane === 'llm') {
    const quota = rateLimiterFor(settings).tryAcquire();
    if (!quota.allowed) {
      logger.warn('Vượt hạn mức', { intent, reason: quota.reason });
      return;
    }
  }

  logger.info('Nhận intent', { intent, source, lane: INTENTS[intent].lane });
  // TODO(Phase 2): acquire(intent) → lane-llm cho solve/summarize/explain
  // TODO(Phase 3): acquire(intent) → lane-fast cho translate
}
