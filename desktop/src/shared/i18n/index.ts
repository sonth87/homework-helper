/**
 * Resolver i18n. Khác extension ở chỗ: `t()` nhận I18nKey có type, nên gõ sai
 * key là lỗi biên dịch thay vì trả về undefined lúc chạy.
 */

import en from './locales/en';
import vi from './locales/vi';
import th from './locales/th';
import zhCN from './locales/zh-CN';
import zhTW from './locales/zh-TW';
import ja from './locales/ja';
import ko from './locales/ko';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import pt from './locales/pt';
import id from './locales/id';
import ru from './locales/ru';
import type { Dictionary, I18nKey } from './keys';

export const SUPPORTED_LOCALES = [
  'en', 'vi', 'th', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'id', 'ru',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Đủ 13 locale. Record (không phải Partial) nên thiếu locale là lỗi biên dịch. */
const DICTIONARIES: Record<Locale, Dictionary> = {
  en, vi, th, 'zh-CN': zhCN, 'zh-TW': zhTW, ja, ko, es, fr, de, pt, id, ru,
};

export function getDictionary(locale: string): Dictionary {
  return DICTIONARIES[locale as Locale] ?? DICTIONARIES[locale.split('-')[0] as Locale] ?? en;
}

export function createTranslator(locale: string) {
  const dict = getDictionary(locale);
  return (key: I18nKey): string => dict[key];
}

export type { I18nKey, Dictionary };
