/**
 * Điểm vào main process.
 *
 * File này CHỈ điều phối thứ tự khởi động. Mọi logic nằm trong bootstrap/.
 * Giới hạn cứng 60 dòng — nếu phải thêm gì vào đây, hãy tạo một init*() mới.
 */

import { app } from 'electron';
import { initEnv } from './bootstrap/init-env';
import { initSettings } from './bootstrap/init-settings';
import { initIpc } from './bootstrap/init-ipc';
import { initTray } from './bootstrap/init-tray';
import { initHotkeys } from './bootstrap/init-hotkeys';
import { initWindows } from './bootstrap/init-windows';
import { handleIntent } from './pipeline/task-pipeline';
import { abortAllStreams } from './ipc/stream-handler';
import { closeDatabase } from './db/connection';
import { hotkeyManager } from './hotkeys/hotkey-manager';
import { logger } from './logging/logger';

async function main(): Promise<void> {
  const env = initEnv();
  logger.configure(env.LOG_LEVEL);
  logger.info('Khởi động', { version: app.getVersion(), env: env.NODE_ENV });

  await app.whenReady();

  const settings = await initSettings();
  initIpc(settings);
  initTray(settings, (intent) => void handleIntent(intent, 'tray', settings.get()));
  initHotkeys(settings, (intent) => void handleIntent(intent, 'hotkey', settings.get()));
  await initWindows();

  app.on('activate', () => void initWindows());
}

app.on('window-all-closed', () => {
  // Ứng dụng sống trên tray — đóng hết cửa sổ không có nghĩa là thoát.
});

app.on('will-quit', () => {
  hotkeyManager.unregisterAll();
  abortAllStreams();
  closeDatabase();
});

main().catch((error: unknown) => {
  logger.error('Khởi động thất bại', error);
  app.exit(1);
});
