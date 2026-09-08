import { defineSettings } from './define';

export const aiSettings = defineSettings('ai', 'groupAi', {
  routingStrategy: {
    type: 'enum', default: 'prefer_config',
    options: [
      { value: 'prefer_config', i18n: 'routingPreferConfig' },
      { value: 'prefer_local', i18n: 'routingPreferLocal' },
      { value: 'local_only', i18n: 'routingLocalOnly' },
      { value: 'config_only', i18n: 'routingConfigOnly' },
    ],
    i18n: 'setRoutingStrategy', i18nDesc: 'setRoutingStrategyDesc',
  },
  rotationStrategy: {
    type: 'enum', default: 'round-robin',
    options: [
      { value: 'round-robin', i18n: 'rotationRoundRobin' },
      { value: 'random', i18n: 'rotationRandom' },
      { value: 'fallback-on-error', i18n: 'rotationFallback' },
    ],
    i18n: 'setRotationStrategy', i18nDesc: 'setRotationStrategyDesc',
  },
  requestTimeoutMs: {
    type: 'number', default: 120_000, min: 15_000, max: 600_000, step: 5_000, unit: 'ms',
    i18n: 'setRequestTimeout', i18nDesc: 'setRequestTimeoutDesc',
  },
  maxRetries: {
    type: 'number', default: 3, min: 1, max: 10,
    i18n: 'setMaxRetries', i18nDesc: 'setMaxRetriesDesc',
  },
  thinkingEnabled: {
    type: 'boolean', default: true,
    i18n: 'setThinkingEnabled', i18nDesc: 'setThinkingEnabledDesc',
  },
  // Kiểm soát chi phí — lưới an toàn thứ hai sau bất biến lane (ADR-0003).
  maxRequestsPerMinute: {
    type: 'number', default: 20, min: 1, max: 120,
    i18n: 'setMaxRequestsPerMinute', i18nDesc: 'setMaxRequestsPerMinuteDesc',
  },
  monthlyTokenBudget: {
    type: 'number', default: 0, min: 0, max: 100_000_000, step: 100_000,
    i18n: 'setMonthlyTokenBudget', i18nDesc: 'setMonthlyTokenBudgetDesc',
  },
  ollamaBaseUrl: {
    type: 'string', default: 'http://127.0.0.1:11434/v1', placeholder: 'http://127.0.0.1:11434/v1',
    i18n: 'setOllamaBaseUrl',
  },
  lmStudioBaseUrl: {
    type: 'string', default: 'http://127.0.0.1:1234/v1', placeholder: 'http://127.0.0.1:1234/v1',
    i18n: 'setLmStudioBaseUrl',
  },
} as const);
