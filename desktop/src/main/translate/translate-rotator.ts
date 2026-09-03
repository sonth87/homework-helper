/**
 * Chọn provider dịch nhanh theo thứ tự ưu tiên người dùng đặt, tạm ngưng
 * provider vừa lỗi.
 *
 * KHÔNG dùng chung với KeyRotator (ai/key-rotator.ts, Lane B) — ADR-0003 cấm
 * hai lane chia sẻ logic retry/timeout. Bài học tạm ngưng theo loại lỗi (429
 * dài hơn lỗi máy chủ, kế thừa từ extension key-rotator.js) áp dụng lại ở đây,
 * nhưng triển khai riêng và đơn giản hơn nhiều: không có khái niệm "cần
 * vision", "chỉ dùng local", hay chiến lược xoay vòng round-robin/random — Lane
 * A chỉ cần MỘT thứ tự ưu tiên cố định do người dùng sắp xếp trong Cài đặt.
 */

import { LIMITS } from '@config/limits.config';
import type { TranslateProviderConfig } from '@config/settings';
import type { TranslateProviderId } from '@shared/types/translate';
import { logger } from '../logging/logger';

class TranslateRotator {
  private cooldowns = new Map<TranslateProviderId, number>();

  /** Provider dùng được (đang bật, không trong thời gian tạm ngưng), theo đúng thứ tự ưu tiên. */
  candidates(configs: readonly TranslateProviderConfig[]): TranslateProviderConfig[] {
    const now = Date.now();
    return [...configs]
      .filter((c) => c.isEnabled && (this.cooldowns.get(c.id) ?? 0) <= now)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Tạm ngưng provider vừa lỗi. Vẫn KHÔNG phân biệt được mã lỗi HTTP có cấu
   * trúc cho cả ba provider (Bing trả 401 khi bị chống bot, không phải 429
   * chuẩn) — chỉ so khớp chuỗi trong message, không parse status code thật.
   * Đơn giản nhưng đủ dùng: hậu quả của đoán sai chỉ là tạm ngưng hơi lâu/hơi
   * ngắn hơn lý tưởng, không phải sai kết quả dịch.
   *
   * 2026-09-03: thêm nhánh 401/403 riêng (xem authErrorMs trong
   * limits.config.ts) — trước đó rơi chung vào serverErrorMs (30s), khiến một
   * provider bị chặn dài hạn (như Bing bị hệ chống bot chặn) cứ 30s lại thử
   * lại vô hạn, đo được thật trong log người dùng gửi (401 lặp lại cách nhau
   * ~38s, khớp 30s cooldown + thời gian xử lý).
   */
  reportFailure(id: TranslateProviderId, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const ms = message.includes('429')
      ? LIMITS.cooldown.rateLimitMs
      : message.includes('401') || message.includes('403')
        ? LIMITS.cooldown.authErrorMs
        : LIMITS.cooldown.serverErrorMs;
    this.cooldowns.set(id, Date.now() + ms);
    logger.warn('Tạm ngưng provider dịch', { id, ms, reason: message });
  }

  reportSuccess(id: TranslateProviderId): void {
    this.cooldowns.delete(id);
  }
}

export const translateRotator = new TranslateRotator();
