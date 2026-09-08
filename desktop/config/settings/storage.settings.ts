import { defineSettings } from './define';

export const storageSettings = defineSettings('storage', 'groupStorage', {
  maxConversations: {
    type: 'number', default: 200, min: 10, max: 5000, step: 10,
    i18n: 'setMaxConversations', i18nDesc: 'setMaxConversationsDesc',
  },
  cacheTtlDays: {
    type: 'number', default: 7, min: 1, max: 90,
    i18n: 'setCacheTtl', i18nDesc: 'setCacheTtlDesc',
  },
} as const);
