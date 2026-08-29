import { defineSettings } from './define';

/**
 * Cấu hình theo tác vụ.
 *
 * Phase 2 mới có chế độ học tập dùng chung. Kế hoạch dài hạn là mỗi intent có
 * model, prompt và ngôn ngữ đầu ra riêng — dịch dùng model rẻ, giải bài dùng
 * model mạnh có thị giác. Xem roadmap/desktop-app-structure.md mục 8.2.
 */
export const intentSettings = defineSettings('intent', 'groupIntent', {
  studyMode: {
    type: 'enum',
    default: 'step-by-step',
    options: [
      { value: 'step-by-step', i18n: 'modeStepByStep' },
      { value: 'direct', i18n: 'modeDirect' },
      { value: 'hint', i18n: 'modeHint' },
      { value: 'explain', i18n: 'modeExplain' },
      { value: 'translate', i18n: 'modeTranslate' },
    ],
    i18n: 'setStudyMode',
    i18nDesc: 'setStudyModeDesc',
  },
} as const);
