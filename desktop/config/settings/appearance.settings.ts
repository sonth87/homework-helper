import { defineSettings } from './define';

/**
 * Giao diện — theme toàn app và tuỳ chỉnh riêng cho tooltip dịch (HoverOverlay).
 *
 * Tách khỏi acquisition.settings.ts dù cùng nói về "hover": acquisition nói về
 * HÀNH VI (khi nào kích hoạt, dung sai chuột), còn ở đây nói về HÌNH THỨC
 * (tooltip trông ra sao) — hai mối quan tâm khác nhau, gộp chung sẽ làm cả hai
 * tab khó hiểu.
 *
 * `hoverCustomStyleEnabled` mặc định TẮT — sáu tuỳ chọn màu/cỡ bên dưới CHỈ áp
 * dụng khi bật. Không áp mặc định "on": nếu không, giá trị mặc định của
 * `hoverBgColor` (một màu cố định) sẽ THAY THẾ hẳn hành vi tự đổi theo
 * light/dark hệ thống hiện có (hover.css), tức đổi hành vi mặc định cho mọi
 * người dùng chưa từng mở tới setting này — đúng loại hồi quy im lặng cần
 * tránh. Giữ nguyên hành vi cũ khi tắt, chỉ ai chủ động bật mới thấy khác.
 */
export const appearanceSettings = defineSettings('appearance', 'groupAppearance', {
  theme: {
    type: 'enum', default: 'system',
    options: [
      { value: 'system', i18n: 'themeSystem' },
      { value: 'light', i18n: 'themeLight' },
      { value: 'dark', i18n: 'themeDark' },
    ],
    i18n: 'setTheme', i18nDesc: 'setThemeDesc',
  },

  hoverCustomStyleEnabled: {
    type: 'boolean', default: false,
    i18n: 'setHoverCustomStyle', i18nDesc: 'setHoverCustomStyleDesc',
  },
  // showWhen: tên field khác trong CÙNG nhóm này phải đang `true` thì mới hiện
  // — xem buildUiGroups()/SettingsApp.tsx phần lọc theo showWhen.
  hoverBgColor: {
    type: 'color', default: '#ffffff',
    i18n: 'setHoverBgColor', i18nDesc: 'setHoverBgColorDesc',
    showWhen: 'hoverCustomStyleEnabled',
  },
  hoverBgOpacity: {
    type: 'number', default: 94, min: 10, max: 100, step: 1, unit: '%',
    i18n: 'setHoverBgOpacity', i18nDesc: 'setHoverBgOpacityDesc',
    showWhen: 'hoverCustomStyleEnabled',
  },
  hoverTextColor: {
    type: 'color', default: '#16181d',
    i18n: 'setHoverTextColor', i18nDesc: 'setHoverTextColorDesc',
    showWhen: 'hoverCustomStyleEnabled',
  },
  hoverFontSize: {
    type: 'number', default: 13, min: 10, max: 24, step: 1, unit: 'px',
    i18n: 'setHoverFontSize', i18nDesc: 'setHoverFontSizeDesc',
    showWhen: 'hoverCustomStyleEnabled',
  },
  hoverBlur: {
    type: 'number', default: 18, min: 0, max: 40, step: 1, unit: 'px',
    i18n: 'setHoverBlur', i18nDesc: 'setHoverBlurDesc',
    showWhen: 'hoverCustomStyleEnabled',
  },
  hoverBorderRadius: {
    type: 'number', default: 12, min: 0, max: 24, step: 1, unit: 'px',
    i18n: 'setHoverBorderRadius', i18nDesc: 'setHoverBorderRadiusDesc',
    showWhen: 'hoverCustomStyleEnabled',
  },
} as const);
