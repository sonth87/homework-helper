import { openSettingsWindow } from '../windows/settings.window';
import { openOnboardingWindow } from '../windows/onboarding.window';
import { checkPermissions } from '../permissions/permissions.service';

/**
 * Thiếu quyền hệ thống thì app không đọc được gì trên màn hình — mở onboarding
 * thay vì Cài đặt để người dùng biết ngay lý do, thay vì tự hỏi vì sao dịch/
 * giải bài không hoạt động. Windows không có mô hình xin quyền kiểu TCC của
 * macOS cho UI Automation/chụp màn hình — `checkPermissions()` luôn trả cả hai
 * `true` trên nền tảng đó (xem permissions.service.ts) nên nhánh này không bao
 * giờ chạy trên Windows, không phải vì thiếu code mà vì không có gì để xin.
 */
export async function initWindows(): Promise<void> {
  const status = await checkPermissions();
  if (!status.accessibility || !status.screenRecording) {
    await openOnboardingWindow();
    return;
  }
  await openSettingsWindow();
}
