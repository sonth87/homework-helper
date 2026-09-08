import { screen } from 'electron';
import { ClipboardWatcher } from '../acquisition/clipboard/watcher';
import { showClipboardBar, hideClipboardBar } from '../windows/clipboard-bar.window';
import type { SettingsService } from '../settings/settings.service';
import type { Point } from '@shared/types/geometry';

/**
 * Bật/tắt theo dõi clipboard theo đúng setting `clipboardWatcherEnabled` —
 * mặc định TẮT (xem ghi chú trong acquisition.settings.ts), không chạy ngầm
 * khi người dùng chưa bật. Cùng mẫu với initMouseTracker() (init-mouse-tracker.ts).
 */
export function initClipboardWatcher(settings: SettingsService): void {
  const watcher = new ClipboardWatcher((text) => {
    const { x, y } = screen.getCursorScreenPoint();
    showClipboardBar({ x, y } as Point<'screen-logical'>, text, settings.get());
  });

  const apply = () => {
    if (settings.get().clipboardWatcherEnabled) watcher.start();
    else {
      watcher.stop();
      hideClipboardBar();
    }
  };

  apply();
  settings.onChange(apply);
}
