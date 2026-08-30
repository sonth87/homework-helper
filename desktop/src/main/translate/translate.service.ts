/**
 * Điều phối Lane A: chuẩn hoá text → tra cache → gọi Google Translate khi miss
 * → ghi cache → trả kết quả.
 *
 * Tách khỏi ai.service.ts (Lane B) hoàn toàn — hai lane không dùng chung cache,
 * không dùng chung logic retry/timeout. Xem ADR-0003.
 */

import { LIMITS } from '@config/limits.config';
import type { Settings } from '@config/settings';
import { openDatabase } from '../db/connection';
import { CacheRepo } from '../db/repositories/cache.repo';
import { googleTranslate } from './google.provider';
import { logger } from '../logging/logger';

export type QuickTranslateResult = {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  fromCache: boolean;
};

let repo: CacheRepo | null = null;
const store = () => (repo ??= new CacheRepo(openDatabase()));

export async function quickTranslate(
  text: string,
  targetLang: string,
  settings: Settings,
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

  const result = await googleTranslate(normalized, targetLang, LIMITS.fastLane.timeoutMs);
  store().set(normalized, 'auto', targetLang, result.translatedText);

  return {
    translatedText: result.translatedText,
    sourceLanguage: result.detectedSourceLanguage,
    targetLanguage: targetLang,
    fromCache: false,
  };
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
