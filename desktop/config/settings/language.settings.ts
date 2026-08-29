import { defineSettings } from './define';

const UI_LANGUAGES = [
  { value: 'vi', i18n: 'langVi' }, { value: 'en', i18n: 'langEn' },
  { value: 'th', i18n: 'langTh' }, { value: 'zh-CN', i18n: 'langZhCN' },
  { value: 'zh-TW', i18n: 'langZhTW' }, { value: 'ja', i18n: 'langJa' },
  { value: 'ko', i18n: 'langKo' }, { value: 'es', i18n: 'langEs' },
  { value: 'fr', i18n: 'langFr' }, { value: 'de', i18n: 'langDe' },
  { value: 'pt', i18n: 'langPt' }, { value: 'id', i18n: 'langId' },
  { value: 'ru', i18n: 'langRu' },
] as const;

const OUTPUT_LANGUAGES = [...UI_LANGUAGES, { value: 'auto', i18n: 'langAuto' }] as const;

export const languageSettings = defineSettings('language', 'groupLanguage', {
  uiLanguage: {
    type: 'enum', default: 'vi', options: UI_LANGUAGES,
    i18n: 'setUiLanguage', i18nDesc: 'setUiLanguageDesc',
  },
  outputLanguage: {
    type: 'enum', default: 'en', options: OUTPUT_LANGUAGES,
    i18n: 'setOutputLanguage', i18nDesc: 'setOutputLanguageDesc',
  },
  translateTargetLanguage: {
    type: 'enum', default: 'vi', options: UI_LANGUAGES,
    i18n: 'setTranslateTarget', i18nDesc: 'setTranslateTargetDesc',
  },
} as const);
