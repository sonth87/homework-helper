/**
 * INTENT REGISTRY — nơi mọi tính năng AI được khai báo.
 *
 * MỘT entry ở đây điều khiển đồng thời: hotkey mặc định, chiến lược thu nhận nội
 * dung, chọn lane thực thi, loại cửa sổ hiển thị, mục trong tray menu, và nhóm
 * setting per-intent.
 *
 * Thêm một tính năng AI mới = thêm một entry + một prompt builder.
 *
 * Trường `lane` là DỮ LIỆU CƯỠNG CHẾ, không phải chú thích: src/main/pipeline/guards.ts
 * dùng nó để chặn intent lane 'llm' khỏi bị kích hoạt bởi chuyển động chuột.
 * Xem dev/decisions/0003-hai-lane-thuc-thi.md.
 */

import type { I18nKey } from '../src/shared/i18n/keys';
import type { AcquisitionStrategy, Intent, Lane, StudyMode } from '../src/shared/types/intent';

export type IntentConfig = {
  readonly lane: Lane;
  /** Thứ tự ưu tiên khi thu nhận nội dung. Phần tử đầu được thử trước. */
  readonly acquisition: readonly AcquisitionStrategy[];
  /** true = ưu tiên gửi ẢNH cho model thị giác, vì OCR sẽ làm mất thông tin
   *  (đồ thị, hình học, công thức hoá học, sơ đồ mạch điện). */
  readonly needsImage: boolean;
  readonly surface: 'hover-overlay' | 'result-panel' | 'chat-window';
  readonly defaultHotkey: { readonly darwin: string; readonly win32: string } | null;
  readonly defaultStudyMode?: StudyMode;
  readonly i18n: I18nKey;
};

export const INTENTS: Readonly<Record<Intent, IntentConfig>> = {
  translate: {
    lane: 'fast',
    acquisition: ['accessibility', 'ocr'],
    needsImage: false,
    surface: 'hover-overlay',
    defaultHotkey: { darwin: 'Command+Shift+T', win32: 'Control+Shift+T' },
    i18n: 'intentTranslate',
  },
  solve: {
    lane: 'llm',
    // Ảnh trước, không OCR trước — xem needsImage.
    acquisition: ['capture'],
    needsImage: true,
    surface: 'result-panel',
    defaultHotkey: { darwin: 'Command+Shift+S', win32: 'Control+Shift+S' },
    defaultStudyMode: 'step-by-step',
    i18n: 'intentSolve',
  },
  summarize: {
    lane: 'llm',
    // Tóm tắt cần nhiều text; gửi ảnh sẽ tốn token vô ích.
    acquisition: ['accessibility', 'ocr'],
    needsImage: false,
    surface: 'result-panel',
    defaultHotkey: { darwin: 'Command+Shift+M', win32: 'Control+Shift+M' },
    i18n: 'intentSummarize',
  },
  explain: {
    lane: 'llm',
    acquisition: ['accessibility', 'ocr', 'capture'],
    needsImage: false,
    surface: 'result-panel',
    defaultHotkey: { darwin: 'Command+Shift+E', win32: 'Control+Shift+E' },
    defaultStudyMode: 'explain',
    i18n: 'intentExplain',
  },
  rewrite: {
    lane: 'llm',
    acquisition: ['accessibility', 'clipboard'],
    needsImage: false,
    surface: 'result-panel',
    defaultHotkey: null,
    i18n: 'intentRewrite',
  },
  chat: {
    lane: 'llm',
    acquisition: [],
    needsImage: false,
    surface: 'chat-window',
    defaultHotkey: { darwin: 'Command+Shift+K', win32: 'Control+Shift+K' },
    i18n: 'intentChat',
  },
};

export const LLM_INTENTS = Object.entries(INTENTS)
  .filter(([, c]) => c.lane === 'llm')
  .map(([id]) => id as Intent);
