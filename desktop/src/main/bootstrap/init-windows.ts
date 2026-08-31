import { openSettingsWindow } from '../windows/settings.window';
import { openOnboardingWindow } from '../windows/onboarding.window';
import { checkPermissions } from '../permissions/permissions.service';

/**
 * Thiếu quyền hệ thống thì app không đọc được gì trên màn hình — mở onboarding
 * thay vì Cài đặt để người dùng biết ngay lý do, thay vì tự hỏi vì sao dịch/
 * giải bài không hoạt động. Trên Windows (chưa xây quyền tương đương, Phase 4)
 * `checkPermissions()` luôn trả cả hai `true` nên nhánh này không bao giờ chạy.
 */
export async function initWindows(): Promise<void> {
  const status = await checkPermissions();
  if (!status.accessibility || !status.screenRecording) {
    await openOnboardingWindow();
    return;
  }
  await openSettingsWindow();
}
