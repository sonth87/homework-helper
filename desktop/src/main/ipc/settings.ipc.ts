import { BrowserWindow, ipcMain } from 'electron';
import { settingsSchema } from '@config/settings';
import type { Settings } from '@config/settings';
import type { SettingsService } from '../settings/settings.service';
import { logger } from '../logging/logger';

export function registerSettingsIpc(service: SettingsService): void {
  ipcMain.handle('settings:get', () => service.get());

  ipcMain.handle('settings:patch', async (_e, changes: unknown) => {
    // Không tin payload từ renderer — validate theo schema trước khi ghi.
    const parsed = settingsSchema.partial().safeParse(changes);
    if (!parsed.success) {
      logger.warn('Bỏ qua patch cấu hình không hợp lệ', parsed.error.issues);
      return;
    }
    await service.patch(parsed.data as Partial<Settings>);
  });

  ipcMain.handle('settings:reset', () => service.reset());

  // Phát tán thay đổi tới mọi cửa sổ để chúng không lệch nhau.
  service.onChange((settings) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('settings:changed', settings);
    }
  });
}
