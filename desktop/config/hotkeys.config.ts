/**
 * Phím tắt mặc định. Người dùng đổi được — giá trị thật đọc từ user settings,
 * file này chỉ cung cấp mặc định ban đầu.
 *
 * Hotkey của intent lấy từ config/intents.config.ts để không khai báo hai nơi.
 */

import { INTENTS } from './intents.config';
import type { Intent } from '../src/shared/types/intent';

export type Platform = 'darwin' | 'win32' | 'linux';

/** Phím tắt không gắn với intent nào. */
export const APP_HOTKEYS = {
  toggleEnabled: { darwin: 'Command+Shift+H', win32: 'Control+Shift+H' },
  openSettings: { darwin: 'Command+,', win32: 'Control+,' },
} as const;

export type AppHotkey = keyof typeof APP_HOTKEYS;

const platformKey = (p: Platform): 'darwin' | 'win32' => (p === 'darwin' ? 'darwin' : 'win32');

export function defaultHotkeyFor(intent: Intent, platform: Platform): string | null {
  const binding = INTENTS[intent].defaultHotkey;
  return binding ? binding[platformKey(platform)] : null;
}

export function defaultAppHotkey(id: AppHotkey, platform: Platform): string {
  return APP_HOTKEYS[id][platformKey(platform)];
}

/** Tất cả phím tắt mặc định — dùng để phát hiện trùng lặp khi người dùng đổi. */
export function allDefaultHotkeys(platform: Platform): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of Object.keys(INTENTS) as Intent[]) {
    const key = defaultHotkeyFor(id, platform);
    if (key) out[`intent.${id}`] = key;
  }
  for (const id of Object.keys(APP_HOTKEYS) as AppHotkey[]) {
    out[`app.${id}`] = defaultAppHotkey(id, platform);
  }
  return out;
}
