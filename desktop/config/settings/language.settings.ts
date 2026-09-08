import { z } from 'zod';
import { defineSettings } from './define';
import { TRANSLATE_PROVIDER_IDS } from '../../src/shared/types/translate';

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

/** Số nhỏ hơn được thử trước — cùng quy ước với `ApiConfig.priority` (apikeys.settings.ts). */
export const translateProviderConfigSchema = z.object({
  id: z.enum(TRANSLATE_PROVIDER_IDS),
  isEnabled: z.boolean().default(true),
  priority: z.number().int().default(0),
});
export type TranslateProviderConfig = z.infer<typeof translateProviderConfigSchema>;

const DEFAULT_TRANSLATE_PROVIDERS: TranslateProviderConfig[] = [
  { id: 'google', isEnabled: true, priority: 0 },
  { id: 'bing', isEnabled: true, priority: 1 },
  { id: 'mymemory', isEnabled: true, priority: 2 },
];

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
  /**
   * Thứ tự thử + bật/tắt provider dịch nhanh. `internal: true` vì có màn hình
   * riêng (TranslateProvidersPanel — kéo thứ tự, không phải control sinh từ
   * schema) — cùng lý do `apiConfigs` được đánh dấu internal ở apikeys.settings.ts.
   */
  translateProviders: {
    type: 'json',
    default: DEFAULT_TRANSLATE_PROVIDERS,
    schema: z.array(translateProviderConfigSchema),
    i18n: 'setTranslateProviders',
    i18nDesc: 'setTranslateProvidersDesc',
    internal: true,
  },
} as const);
