/**
 * Hai quyền macOS app cần: Accessibility (đọc cây UI) và Screen Recording
 * (chụp màn hình). ĐÃ KIỂM CHỨNG THỰC NGHIỆM (ADR-0006, ADR-0007): đây là HAI
 * MỤC TÁCH BIỆT trong System Settings, phải xin và giải thích riêng — cấp một
 * cái không có nghĩa cái kia cũng được cấp.
 *
 * Không có API kiểm tra Accessibility trực tiếp từ tiến trình chính (Node) —
 * `AXIsProcessTrusted()` chỉ gọi được từ Objective-C/Swift (lý do
 * accessibility-helper tồn tại, xem ADR-0006), nên tái dùng lệnh 'trusted' đã
 * có sẵn của chính helper đó thay vì dựng thêm một binary chỉ để hỏi quyền.
 */

import { systemPreferences, shell, app } from 'electron';
import { getAccessibilityProvider } from '../acquisition/accessibility';
import type { PermissionKind, PermissionStatus } from '@shared/types/permissions';

export type { PermissionKind, PermissionStatus };

export async function checkPermissions(): Promise<PermissionStatus> {
  if (process.platform !== 'darwin') {
    // Windows (UI Automation) chưa xây — Phase 4. Không có mô hình quyền
    // tương đương để chặn theo ở đây; coi như luôn sẵn sàng.
    return { accessibility: true, screenRecording: true };
  }

  const provider = await getAccessibilityProvider();
  const accessibility = provider ? await provider.isTrusted() : false;
  const screenRecording = systemPreferences.getMediaAccessStatus('screen') === 'granted';

  return { accessibility, screenRecording };
}

const PANE_URL: Record<PermissionKind, string> = {
  accessibility: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
  screenRecording: 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
};

/**
 * Hai URL cố định, KHÔNG đi qua `shell:openExternal` (kênh đó chỉ cho phép
 * http/https có chủ đích — mở rộng nó để nhận scheme `x-apple.systempreferences:`
 * sẽ nới lỏng một chốt chặn bảo mật cho một nhu cầu hẹp). Handler riêng này chỉ
 * mở đúng hai URL đã hardcode ở trên, không nhận URL tuỳ ý từ renderer.
 */
export async function openPermissionPane(kind: PermissionKind): Promise<void> {
  if (process.platform !== 'darwin') return;
  await shell.openExternal(PANE_URL[kind]);
}

/**
 * ĐÃ KIỂM CHỨNG THỰC NGHIỆM: cấp quyền cho tiến trình ĐANG CHẠY SẴN không có
 * tác dụng ngay — phải khởi động lại toàn bộ app (không chỉ helper subprocess)
 * để accessibility-helper/desktopCapturer nhận đúng trạng thái quyền mới.
 */
export function relaunchApp(): void {
  app.relaunch();
  app.exit(0);
}
