import { z } from 'zod';
import { defineSettings } from './define';

export const privacySettings = defineSettings('privacy', 'groupPrivacy', {
  excludedApps: {
    type: 'json', default: [] as string[], schema: z.array(z.string()),
    i18n: 'setExcludedApps', i18nDesc: 'setExcludedAppsDesc',
  },
  // Ba tuỳ chọn dưới đây là lý do chính khiến người dùng tin được một app đọc
  // màn hình. Bật mặc định — an toàn trước, tiện lợi sau.
  pauseWhenScreenSharing: {
    type: 'boolean', default: true,
    i18n: 'setPauseWhenScreenSharing', i18nDesc: 'setPauseWhenScreenSharingDesc',
  },
  pauseOnSensitiveApps: {
    type: 'boolean', default: true,
    i18n: 'setPauseOnSensitiveApps', i18nDesc: 'setPauseOnSensitiveAppsDesc',
  },
  localModelsOnly: {
    type: 'boolean', default: false,
    i18n: 'setLocalModelsOnly', i18nDesc: 'setLocalModelsOnlyDesc',
  },
  saveHistory: {
    type: 'boolean', default: true,
    i18n: 'setSaveHistory', i18nDesc: 'setSaveHistoryDesc',
  },
  historyRetentionDays: {
    type: 'number', default: 0, min: 0, max: 365,
    i18n: 'setHistoryRetention', i18nDesc: 'setHistoryRetentionDesc',
  },
  telemetryEnabled: {
    type: 'boolean', default: false,
    i18n: 'setTelemetry', i18nDesc: 'setTelemetryDesc',
  },
} as const);
