/**
 * Multi-Language Internationalization (i18n) Hub
 * Dynamically resolves localized strings from modular locale files.
 */

import en from './i18n/locales/en.js';
import vi from './i18n/locales/vi.js';
import th from './i18n/locales/th.js';
import zhCN from './i18n/locales/zh-CN.js';
import zhTW from './i18n/locales/zh-TW.js';
import ja from './i18n/locales/ja.js';
import ko from './i18n/locales/ko.js';
import es from './i18n/locales/es.js';
import fr from './i18n/locales/fr.js';
import de from './i18n/locales/de.js';
import pt from './i18n/locales/pt.js';
import id from './i18n/locales/id.js';
import ru from './i18n/locales/ru.js';

export const LOCALES = {
  en,
  vi,
  th,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ja,
  ko,
  es,
  fr,
  de,
  pt,
  id,
  ru,
};

/**
 * Get general UI string dictionary (Drawer, Sidepanel, Common)
 */
export function getI18n(lang = 'en') {
  const loc = LOCALES[lang] || LOCALES[lang?.split('-')[0]] || LOCALES.en;
  return loc.general || LOCALES.en.general;
}

/**
 * Get options page string dictionary
 */
export function getOptionsI18n(lang = 'en') {
  const loc = LOCALES[lang] || LOCALES[lang?.split('-')[0]] || LOCALES.en;
  return loc.options || LOCALES.en.options;
}

/**
 * Get action popup dictionary
 */
export function getPopupI18n(lang = 'en') {
  const loc = LOCALES[lang] || LOCALES[lang?.split('-')[0]] || LOCALES.en;
  return loc.popup || LOCALES.en.popup;
}

/**
 * Get text selection tooltip dictionary
 */
export function getSelectionTooltipI18n(lang = 'en') {
  const loc = LOCALES[lang] || LOCALES[lang?.split('-')[0]] || LOCALES.en;
  return loc.selectionTooltip || LOCALES.en.selectionTooltip;
}

/**
 * Get screenshot cropper overlay dictionary
 */
export function getCropperI18n(lang = 'en') {
  const loc = LOCALES[lang] || LOCALES[lang?.split('-')[0]] || LOCALES.en;
  return loc.cropper || LOCALES.en.cropper;
}

/**
 * Get in-page floating solution / translation popup dictionary
 */
export function getFloatingPopupI18n(lang = 'en') {
  const loc = LOCALES[lang] || LOCALES[lang?.split('-')[0]] || LOCALES.en;
  return loc.floatingPopup || LOCALES.en.floatingPopup;
}
