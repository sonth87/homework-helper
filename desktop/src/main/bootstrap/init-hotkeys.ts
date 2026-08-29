import { INTENTS } from '@config/intents.config';
import { defaultAppHotkey, defaultHotkeyFor } from '@config/hotkeys.config';
import type { Platform } from '@config/hotkeys.config';
import type { Intent } from '@shared/types/intent';
import { hotkeyManager } from '../hotkeys/hotkey-manager';
import type { HotkeyBinding } from '../hotkeys/hotkey-manager';
import { openSettingsWindow } from '../windows/settings.window';
import { logger } from '../logging/logger';

export function initHotkeys(onIntent: (intent: Intent) => void): void {
  const platform = process.platform as Platform;
  const bindings: HotkeyBinding[] = [];

  for (const id of Object.keys(INTENTS) as Intent[]) {
    const accelerator = defaultHotkeyFor(id, platform);
    if (accelerator) bindings.push({ id: `intent.${id}`, accelerator, run: () => onIntent(id) });
  }

  bindings.push({
    id: 'app.openSettings',
    accelerator: defaultAppHotkey('openSettings', platform),
    run: () => void openSettingsWindow(),
  });

  const { registered, conflicted } = hotkeyManager.apply(bindings);
  logger.info('Đã đăng ký phím tắt', { registered: registered.length, conflicted });
}
