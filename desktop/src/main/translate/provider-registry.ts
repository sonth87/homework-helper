import type { TranslateProviderId } from '@shared/types/translate';
import { googleTranslate } from './google.provider';
import { bingTranslate } from './bing.provider';
import { myMemoryTranslate } from './mymemory.provider';

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
