import { ipcMain, shell } from 'electron';
import { openSettingsWindow } from '../windows/settings.window';
import { logger } from '../logging/logger';

/** Chỉ mở http/https — chặn file://, javascript: và các scheme khác. */
function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export function registerShellIpc(): void {
  ipcMain.handle('shell:openExternal', async (_e, { url }: { url: string }) => {
    if (!isSafeUrl(url)) {
      logger.warn('Từ chối mở URL không an toàn', url);
      return;
    }
    await shell.openExternal(url);
  });

  ipcMain.handle('shell:openSettings', () => void openSettingsWindow());
}
