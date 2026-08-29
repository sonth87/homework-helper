/**
 * Biểu tượng khay hệ thống — nơi ứng dụng "sống" khi không có cửa sổ nào mở.
 *
 * Menu dựng TỪ INTENT REGISTRY, không hardcode: thêm một intent vào
 * config/intents.config.ts là nó tự xuất hiện ở đây, kèm phím tắt và nhãn đã dịch.
 */

import { Menu, Tray, app, nativeImage } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { INTENTS } from '@config/intents.config';
import { defaultHotkeyFor } from '@config/hotkeys.config';
import type { Platform } from '@config/hotkeys.config';
import type { Intent } from '@shared/types/intent';
import { createTranslator } from '@shared/i18n';
import { openSettingsWindow } from '../windows/settings.window';

let tray: Tray | null = null;

type Options = { uiLanguage: string; onIntent: (intent: Intent) => void };

export function createTray({ uiLanguage, onIntent }: Options): Tray {
  const t = createTranslator(uiLanguage);
  const platform = process.platform as Platform;

  tray ??= new Tray(nativeImage.createEmpty());

  // exactOptionalPropertyTypes cấm truyền `accelerator: undefined` tường minh —
  // phải BỎ HẲN thuộc tính khi không có phím tắt, không phải gán undefined.
  const items: MenuItemConstructorOptions[] = (Object.keys(INTENTS) as Intent[]).map((id) => {
    const accelerator = defaultHotkeyFor(id, platform);
    return {
      label: t(INTENTS[id].i18n),
      ...(accelerator ? { accelerator } : {}),
      click: () => onIntent(id),
    };
  });

  tray.setToolTip('Homework Helper');
  const template: MenuItemConstructorOptions[] = [
    ...items,
    { type: 'separator' },
    { label: t('groupSystem'), click: () => void openSettingsWindow() },
    { type: 'separator' },
    { label: 'Quit', role: 'quit', click: () => app.quit() },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(template));

  return tray;
}

/** Dựng lại menu khi người dùng đổi ngôn ngữ — nhãn phải đổi theo. */
export function refreshTray(options: Options): void {
  if (tray) createTray(options);
}
