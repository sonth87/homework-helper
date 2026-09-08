import { INTENTS } from '@config/intents.config';
import type { Settings } from '@config/settings';
import type { Intent } from '@shared/types/intent';
import { hotkeyManager } from '../hotkeys/hotkey-manager';
import type { HotkeyBinding } from '../hotkeys/hotkey-manager';
import { openSettingsWindow } from '../windows/settings.window';
import type { SettingsService } from '../settings/settings.service';
import { logger } from '../logging/logger';

/**
 * Phím tắt đọc từ user settings, không phải từ config — config chỉ cung cấp
 * giá trị mặc định ban đầu (xem config/settings/hotkey.settings.ts).
 *
 * Đăng ký lại mỗi khi người dùng đổi. HotkeyManager.apply() tự gỡ đăng ký cũ
 * trước, nếu không lần đổi thứ hai sẽ thất bại vì phím cũ vẫn đang bị giữ.
 */
export function initHotkeys(settings: SettingsService, onIntent: (intent: Intent) => void): void {
  let lastSignature = '';

  const apply = (current: Settings) => {
    // settings.onChange bắn với MỌI thay đổi cấu hình, kể cả đổi ngôn ngữ.
    // Đăng ký lại phím tắt khi không cần vừa lãng phí, vừa có khoảng thời gian
    // ngắn phím tắt bị gỡ — người dùng bấm đúng lúc đó sẽ không thấy phản hồi.
    const signature = JSON.stringify(current.hotkeys);
    if (signature === lastSignature) return;
    lastSignature = signature;

    const { registered, conflicted } = hotkeyManager.apply(buildBindings(current.hotkeys, onIntent));
    logger.info('Đã đăng ký phím tắt', { registered: registered.length, conflicted });
  };

  apply(settings.get());
  settings.onChange(apply);
}

function buildBindings(
  hotkeys: Record<string, string>,
  onIntent: (intent: Intent) => void,
): HotkeyBinding[] {
  const bindings: HotkeyBinding[] = [];

  for (const id of Object.keys(INTENTS) as Intent[]) {
    const accelerator = hotkeys[`intent.${id}`];
    // Chuỗi rỗng = người dùng đã tắt phím tắt này.
    if (accelerator) bindings.push({ id: `intent.${id}`, accelerator, run: () => onIntent(id) });
  }

  const openSettings = hotkeys['app.openSettings'];
  if (openSettings) {
    bindings.push({ id: 'app.openSettings', accelerator: openSettings, run: () => void openSettingsWindow() });
  }

  return bindings;
}
