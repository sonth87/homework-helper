import { z } from 'zod';
import { defineSettings } from './define';

/**
 * Phím tắt lưu dạng bản đồ `id → accelerator`, không phải mỗi phím một setting.
 *
 * Lý do: danh sách intent thay đổi theo config/intents.config.ts. Khai báo cứng
 * từng setting ở đây thì thêm một intent lại phải sửa hai nơi — đúng thứ mà
 * registry sinh ra để tránh.
 *
 * Mặc định là RỖNG, không phải bản đồ phím tắt thật.
 * -------------------------------------------------
 * Phím tắt mặc định khác nhau giữa macOS và Windows, nhưng file này được CẢ
 * renderer import — nơi `process.platform` không tồn tại. Vì vậy chỉ main process
 * (nơi biết nền tảng) mới điền giá trị mặc định, trong SettingsService.load().
 *
 * Chuỗi rỗng ở một khoá nghĩa là người dùng đã tắt phím tắt đó — khác với khoá
 * không tồn tại, vốn nghĩa là "chưa điền mặc định".
 */
export const hotkeySettings = defineSettings('hotkeys', 'groupHotkeys', {
  hotkeys: {
    type: 'json',
    default: {} as Record<string, string>,
    schema: z.record(z.string(), z.string()),
    i18n: 'setHotkeys',
    i18nDesc: 'setHotkeysDesc',
  },
} as const);
