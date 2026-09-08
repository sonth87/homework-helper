/**
 * Intent — người dùng muốn làm gì. Đây là khái niệm trung tâm thay thế cho
 * `processPoint(Point)` của đặc tả gốc, vốn chỉ mô hình hoá được việc dịch.
 *
 * Xem dev/decisions/0003-hai-lane-thuc-thi.md.
 */

export const INTENT_IDS = ['translate', 'solve', 'summarize', 'explain', 'rewrite', 'chat'] as const;
export type Intent = (typeof INTENT_IDS)[number];

/** Lane quyết định đường thực thi VÀ điều kiện được phép kích hoạt. */
export type Lane = 'fast' | 'llm';

export const STUDY_MODES = ['step-by-step', 'direct', 'hint', 'explain', 'translate'] as const;
export type StudyMode = (typeof STUDY_MODES)[number];

export type Granularity = 'word' | 'sentence' | 'paragraph';

/** Cách thu nhận nội dung, xếp theo thứ tự ưu tiên trong intents.config.ts. */
export type AcquisitionStrategy = 'accessibility' | 'ocr' | 'capture' | 'clipboard' | 'file';

/**
 * Nguồn kích hoạt. `mouse-move` là nguồn DUY NHẤT bị chặn với lane 'llm' —
 * xem src/main/pipeline/guards.ts. Nếu không chặn, một lần rê chuột ngang màn
 * hình sinh ra hàng chục lời gọi LLM tính phí.
 */
export type TriggerSource = 'mouse-move' | 'hotkey' | 'tray' | 'clipboard' | 'file-drop' | 'ui';
