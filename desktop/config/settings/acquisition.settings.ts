import { defineSettings } from './define';

/**
 * Thu nhận nội dung cho Lane A (dịch khi rê chuột).
 *
 * Kế thừa tư tưởng từ extension (enableHoverTranslate, hoverTranslateDelay...)
 * nhưng là schema độc lập — hai bộ cấu hình không dùng chung (ADR-0001).
 */
export const acquisitionSettings = defineSettings('acquisition', 'groupAcquisition', {
  hoverEnabled: {
    type: 'boolean', default: false,
    i18n: 'setHoverEnabled', i18nDesc: 'setHoverEnabledDesc',
  },
  hoverDelayMs: {
    type: 'number', default: 350, min: 100, max: 1500, step: 50, unit: 'ms',
    i18n: 'setHoverDelay', i18nDesc: 'setHoverDelayDesc',
  },
  hoverTolerancePx: {
    type: 'number', default: 6, min: 2, max: 20, unit: 'px',
    i18n: 'setHoverTolerance', i18nDesc: 'setHoverToleranceDesc',
  },
  hoverGranularity: {
    type: 'enum', default: 'sentence',
    options: [
      { value: 'word', i18n: 'granWord' },
      { value: 'sentence', i18n: 'granSentence' },
      { value: 'paragraph', i18n: 'granParagraph' },
    ],
    i18n: 'setHoverGranularity', i18nDesc: 'setHoverGranularityDesc',
  },
  hoverModifiers: {
    type: 'multi',
    default: [] as string[], // rỗng = kích hoạt ngay khi rê, không cần giữ phím
    options: [
      { value: 'command', i18n: 'modCommand' },
      { value: 'control', i18n: 'modControl' },
      { value: 'option', i18n: 'modOption' },
      { value: 'shift', i18n: 'modShift' },
    ],
    i18n: 'setHoverModifiers', i18nDesc: 'setHoverModifiersDesc',
  },
} as const);
