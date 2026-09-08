/**
 * Cưỡng chế bất biến kiến trúc của ADR-0003.
 *
 * Intent thuộc lane 'llm' KHÔNG BAO GIỜ được kích hoạt bởi chuyển động chuột.
 * Nếu không chặn, một lần rê chuột ngang màn hình sinh ra hàng chục lời gọi LLM
 * tính phí — rủi ro 🔴 nghiêm trọng nhất của dự án.
 *
 * Đây là kiểm tra CHẠY ĐƯỢC, không phải quy ước trong tài liệu. Mọi đường vào
 * pipeline đều phải đi qua đây.
 */

import { INTENTS } from '@config/intents.config';
import type { Intent, TriggerSource } from '@shared/types/intent';
import { logger } from '../logging/logger';

export type GuardVerdict = { allowed: true } | { allowed: false; reason: string };

/** Nguồn kích hoạt tự động — không do người dùng chủ ý mỗi lần. */
const AUTOMATIC_SOURCES: ReadonlySet<TriggerSource> = new Set<TriggerSource>(['mouse-move']);

export function checkTrigger(intent: Intent, source: TriggerSource): GuardVerdict {
  const { lane } = INTENTS[intent];

  if (lane === 'llm' && AUTOMATIC_SOURCES.has(source)) {
    const reason = `Intent "${intent}" thuộc lane LLM (tính phí) nên không được kích hoạt tự động bởi "${source}".`;
    logger.warn('Guard chặn kích hoạt', { intent, source, lane });
    return { allowed: false, reason };
  }

  return { allowed: true };
}

/**
 * Hạn mức request/phút — lưới an toàn THỨ HAI, sau bất biến lane.
 * Bất biến lane chặn nguyên nhân; hạn mức chặn thiệt hại khi có gì đó lọt qua.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxPerMinute: number;

  // Không dùng parameter property vì `erasableSyntaxOnly` cấm — cú pháp đó cần
  // TypeScript sinh code lúc chạy, không chỉ xoá kiểu đi.
  constructor(maxPerMinute: number) {
    this.maxPerMinute = maxPerMinute;
  }

  tryAcquire(now = Date.now()): GuardVerdict {
    const cutoff = now - 60_000;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);

    if (this.timestamps.length >= this.maxPerMinute) {
      return {
        allowed: false,
        reason: `Đã đạt hạn mức ${this.maxPerMinute} yêu cầu mỗi phút. Thử lại sau ít giây.`,
      };
    }

    this.timestamps.push(now);
    return { allowed: true };
  }

  reset(): void {
    this.timestamps = [];
  }
}
