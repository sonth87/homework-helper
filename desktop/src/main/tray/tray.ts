/**
 * Biểu tượng khay hệ thống — nơi ứng dụng "sống" khi không có cửa sổ nào mở.
 *
 * Menu dựng TỪ INTENT REGISTRY, không hardcode: thêm một intent vào
 * config/intents.config.ts là nó tự xuất hiện ở đây, kèm phím tắt và nhãn đã dịch.
 */

import { Menu, Tray, app, nativeImage } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { join } from 'node:path';
import { INTENTS } from '@config/intents.config';
import { defaultHotkeyFor } from '@config/hotkeys.config';
import type { Platform } from '@config/hotkeys.config';
import type { Intent } from '@shared/types/intent';
import { createTranslator } from '@shared/i18n';
import { openSettingsWindow } from '../windows/settings.window';
import { logger } from '../logging/logger';

let tray: Tray | null = null;

type Options = { uiLanguage: string; onIntent: (intent: Intent) => void };

/**
 * TẠM: icon vuông bo góc + chữ "H", vẽ bằng AppKit — không phải thiết kế cuối
 * cùng, chỉ để tray CÓ HÌNH THẤY ĐƯỢC thay vì nativeImage.createEmpty() (bug
 * thật đã gặp: icon rỗng khiến tray vô hình, không ai bấm vào được để mở lại
 * app sau khi đóng cửa sổ). Thay bằng icon thật khi có thiết kế chính thức —
 * chỉ cần đổi file trong resources/, không cần sửa code này.
 *
 * "Template" ở cuối tên file là quy ước macOS: hệ thống tự đảo đen/trắng theo
 * theme sáng/tối của thanh menu, không cần code xử lý riêng.
 */
function trayIcon(): Electron.NativeImage {
  const path = join(app.getAppPath(), 'resources/trayTemplate.png');
  const image = nativeImage.createFromPath(path);
  if (image.isEmpty()) {
    logger.warn('Không nạp được icon tray, dùng icon rỗng tạm thời', { path });
  }
  image.setTemplateImage(true);
  return image;
}

export function createTray({ uiLanguage, onIntent }: Options): Tray {
  const t = createTranslator(uiLanguage);
  const platform = process.platform as Platform;

  tray ??= new Tray(trayIcon());

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
