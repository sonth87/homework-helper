/**
 * Áp `data-theme` lên <html> theo setting `theme` — gọi MỘT LẦN ở main.tsx của
 * mỗi cửa sổ renderer. 'system' (mặc định) không set thuộc tính gì, để
 * theme.css tự theo `prefers-color-scheme` như hành vi cũ; 'light'/'dark' ép
 * cứng bất kể hệ điều hành.
 *
 * KHÔNG dùng React hook — nhiều cửa sổ (hover, clipboard-bar) là component
 * đơn giản không muốn kéo thêm state chỉ để set một thuộc tính DOM một lần.
 * Trả về hàm huỷ đăng ký, nhưng không bắt buộc gọi (các cửa sổ renderer sống
 * theo vòng đời cả window, không unmount giữa chừng).
 */

function applyThemeAttr(theme: string): void {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function initTheme(): () => void {
  window.api?.invoke('settings:get').then((s) => applyThemeAttr(s.theme)).catch(() => undefined);
  return window.api?.onSettingsChanged((s) => applyThemeAttr(s.theme)) ?? (() => undefined);
}
