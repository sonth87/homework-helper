/**
 * I18nKey suy ra từ locale tham chiếu `en`.
 *
 * Hệ quả: gõ sai key là lỗi biên dịch, và một locale thiếu key cũng là lỗi biên
 * dịch (vì mỗi locale khai báo `satisfies Dictionary`). Đây là điểm khác biệt so
 * với extension, nơi thiếu key chỉ âm thầm rơi về tiếng Anh qua `d.xxx || '...'`.
 */
import type en from './locales/en';

export type I18nKey = keyof typeof en;
export type Dictionary = Record<I18nKey, string>;
