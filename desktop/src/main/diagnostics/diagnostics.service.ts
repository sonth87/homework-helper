/**
 * Trang Chẩn đoán (Cài đặt → Chẩn đoán) — hiện trạng thái từng subsystem để
 * TỰ NGƯỜI DÙNG chẩn đoán được vì sao một tính năng không hoạt động, thay vì
 * phải hỏi/gửi log. Roadmap gốc §92: liệt kê Platform, Accessibility, Screen
 * Capture, OCR, Translation, Mouse Tracking — KHÔNG phải log chi tiết hay
 * gửi dữ liệu đi đâu (đó là §91/§151 "Debug Mode", một tính năng khác — vẽ
 * bounding-box OCR + info kỹ thuật từng lần dịch — CHƯA làm ở đây).
 *
 * `accessibilityProvider`/`ocrProvider` gọi thẳng getAccessibilityProvider()/
 * getOcrProvider() thật — có tác dụng phụ là khởi động sớm helper native nếu
 * chưa chạy (bình thường: cùng việc sẽ xảy ra khi người dùng hover lần đầu),
 * không phải một kiểm tra giả lập.
 */

import { app } from 'electron';
import type { Settings } from '@config/settings';
import type { DiagnosticsInfo } from '@shared/types/diagnostics';
import { checkPermissions } from '../permissions/permissions.service';
import { getAccessibilityProvider } from '../acquisition/accessibility';
import { getOcrProvider } from '../acquisition/ocr';

export async function getDiagnostics(settings: Settings): Promise<DiagnosticsInfo> {
  const [permissions, accessibilityProvider, ocrProvider] = await Promise.all([
    checkPermissions(),
    getAccessibilityProvider(),
    getOcrProvider(),
  ]);

  return {
    platform: process.platform,
    arch: process.arch,
    appVersion: app.getVersion(),
    accessibilityGranted: permissions.accessibility,
    screenRecordingGranted: permissions.screenRecording,
    accessibilityProviderAvailable: accessibilityProvider !== null,
    ocrProviderAvailable: ocrProvider !== null,
    hoverEnabled: settings.hoverEnabled,
    clipboardWatcherEnabled: settings.clipboardWatcherEnabled,
    configuredAiProviders: settings.apiConfigs.filter((c) => c.isEnabled).length,
    configuredTranslateProviders: settings.translateProviders.filter((c) => c.isEnabled).length,
  };
}
