/**
 * Điều phối Lane A: chuẩn hoá text → tra cache → thử lần lượt provider dịch
 * theo thứ tự người dùng đặt (rơi qua provider tiếp theo khi lỗi) → ghi cache
 * → trả kết quả.
 *
 * Tách khỏi ai.service.ts (Lane B) hoàn toàn — hai lane không dùng chung cache,
 * không dùng chung logic retry/timeout. Xem ADR-0003. Chuỗi fallback nhiều
 * provider ra đời sau khi kiểm chứng thực nghiệm rằng endpoint Google Translate
 * miễn phí (duy nhất trước đây) có thể bị chặn hẳn ("automated queries"), không
 * chỉ rate-limit tạm thời — xem ADR-0009.
 */

import { LIMITS } from '@config/limits.config';
import type { Settings } from '@config/settings';
import type { TranslateProviderId } from '@shared/types/translate';
import { openDatabase } from '../db/connection';
import { CacheRepo } from '../db/repositories/cache.repo';
import { TRANSLATE_PROVIDERS } from './provider-registry';
import { translateRotator } from './translate-rotator';
import { logger } from '../logging/logger';

export type QuickTranslateResult = {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  fromCache: boolean;
  /** Provider nào thực sự trả kết quả — vắng mặt khi lấy từ cache. Chỉ để chẩn đoán. */
  provider?: TranslateProviderId;
};

let repo: CacheRepo | null = null;
const store = () => (repo ??= new CacheRepo(openDatabase()));

export async function quickTranslate(
  text: string,
  targetLang: string,
  settings: Settings,
  /**
   * Huỷ khi chuột đã rời khỏi vị trí hover trước khi lệnh dịch kịp xong — xem
   * init-mouse-tracker.ts. Không bắt buộc: các nơi gọi khác (nếu có trong
   * tương lai, ví dụ dịch theo yêu cầu chủ động) không cần quan tâm huỷ giữa
   * chừng.
   */
  cancelSignal?: AbortSignal,
): Promise<QuickTranslateResult> {
  const normalized = text.trim();
  if (!normalized) throw new Error('Không có nội dung để dịch.');

  const ttlMs = settings.cacheTtlDays * 24 * 60 * 60 * 1000;
  const cached = store().get(normalized, 'auto', targetLang);

  if (cached && Date.now() - cached.createdAt < ttlMs) {
    return {
      translatedText: cached.translatedText,
      sourceLanguage: cached.sourceLanguage,
      targetLanguage: targetLang,
      fromCache: true,
    };
  }

  const candidates = translateRotator.candidates(settings.translateProviders);
  if (!candidates.length) throw new Error('Không có provider dịch nào khả dụng (đều bị tắt hoặc đang tạm ngưng).');

  let lastError: unknown;
  for (const candidate of candidates) {
    // Một AbortSignal MỚI cho mỗi provider thử — timeout riêng không được phép
    // rơi rớt qua lần thử tiếp theo, nhưng tín hiệu huỷ từ bên ngoài (chuột đã
    // rời đi) phải áp dụng xuyên suốt mọi lần thử trong vòng lặp.
    const timeoutSignal = AbortSignal.timeout(LIMITS.fastLane.timeoutMs);
    const signal = cancelSignal ? AbortSignal.any([timeoutSignal, cancelSignal]) : timeoutSignal;

    try {
      const result = await TRANSLATE_PROVIDERS[candidate.id](normalized, targetLang, signal);
      translateRotator.reportSuccess(candidate.id);
      store().set(normalized, 'auto', targetLang, result.translatedText);

      return {
        translatedText: result.translatedText,
        sourceLanguage: result.detectedSourceLanguage,
        targetLanguage: targetLang,
        fromCache: false,
        provider: candidate.id,
      };
    } catch (error) {
      // Huỷ có CHỦ ĐÍCH từ bên ngoài (chuột đã rời đi) — dừng hẳn ngay, không
      // thử provider tiếp theo (chỉ tốn thêm một request cũng sẽ bị huỷ), và
      // không tính là lỗi của provider này — nó bị ngắt giữa chừng, không phải
      // tự nó hỏng, nên không đáng bị đưa vào cooldown.
      if (cancelSignal?.aborted) throw error;

      lastError = error;
      translateRotator.reportFailure(candidate.id, error);
      logger.warn('Provider dịch lỗi, thử provider tiếp theo', { provider: candidate.id, error });
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Tất cả provider dịch đều lỗi.');
}

/** Dọn cache quá hạn/vượt hạn mức — gọi lúc khởi động, giống pruneHistory(). */
export function pruneTranslationCache(settings: Settings): void {
  try {
    const ttlMs = settings.cacheTtlDays * 24 * 60 * 60 * 1000;
    const removed = store().prune(ttlMs, LIMITS.fastLane.cacheMaxEntries);
    if (removed > 0) logger.info('Đã dọn cache dịch', { removed });
  } catch (error) {
    logger.warn('Không dọn được cache dịch', error);
  }
}
