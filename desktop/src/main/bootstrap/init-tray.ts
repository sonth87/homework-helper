import { createTray, refreshTray } from '../tray/tray';
import type { Intent } from '@shared/types/intent';
import type { SettingsService } from '../settings/settings.service';

export function initTray(settings: SettingsService, onIntent: (intent: Intent) => void): void {
  const build = () => ({ uiLanguage: settings.get().uiLanguage, onIntent });

  createTray(build());
  // Nhãn trên tray phải đổi theo ngôn ngữ người dùng chọn.
  settings.onChange(() => refreshTray(build()));
}
