import type { TranslateProviderId } from '@shared/types/translate';
import { googleTranslate } from './google.provider';
import { bingTranslate } from './bing.provider';
import { myMemoryTranslate, MYMEMORY_MAX_LENGTH } from './mymemory.provider';

export type TranslateFn = (
  text: string,
  targetLang: string,
  signal: AbortSignal,
) => Promise<{ translatedText: string; detectedSourceLanguage: string }>;

export const TRANSLATE_PROVIDERS: Record<TranslateProviderId, TranslateFn> = {
  google: googleTranslate,
  bing: bingTranslate,
  mymemory: myMemoryTranslate,
};

/**
 * Độ dài text tối đa từng provider chấp nhận — vắng mặt nghĩa là không có
 * giới hạn nào biết trước.
 *
 * `google`/`bing`: KẾ THỪA từ `extension/background/translate-engines.js`
 * (`FREE_ENGINES[].maxLength`) — cùng endpoint hệt nhau (xem
 * google.provider.ts/bing.provider.ts, đổi 2026-09-03), nên số đo thực nghiệm
 * của extension áp dụng đúng ở đây, không phải suy đoán riêng cho app này.
 * `mymemory`: đo thực nghiệm riêng cho app này (xem mymemory.provider.ts) vì
 * đây là API có tài liệu chính thức, giới hạn không đổi theo endpoint.
 */
export const TRANSLATE_PROVIDER_MAX_LENGTH: Partial<Record<TranslateProviderId, number>> = {
  google: 5000,
  bing: 1800,
  mymemory: MYMEMORY_MAX_LENGTH,
};
