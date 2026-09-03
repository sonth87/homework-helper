/** Trạng thái từng subsystem, hiện ở Cài đặt → Chẩn đoán. Xem
 *  main/diagnostics/diagnostics.service.ts để biết cách từng trường được đo. */
export type DiagnosticsInfo = {
  platform: string;
  arch: string;
  appVersion: string;
  accessibilityGranted: boolean;
  screenRecordingGranted: boolean;
  accessibilityProviderAvailable: boolean;
  ocrProviderAvailable: boolean;
  hoverEnabled: boolean;
  clipboardWatcherEnabled: boolean;
  configuredAiProviders: number;
  configuredTranslateProviders: number;
};
