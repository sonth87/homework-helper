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
import { initWindows } from './bootstrap/init-windows';
import { logger } from './logging/logger';

async function main(): Promise<void> {
  const env = initEnv();
  logger.configure(env.LOG_LEVEL);
  logger.info('Khởi động', { version: app.getVersion(), env: env.NODE_ENV });

  await app.whenReady();

  const settings = await initSettings();
  initIpc(settings);
  await initWindows();

  app.on('activate', () => void initWindows());
}

app.on('window-all-closed', () => {
  // Ứng dụng sống trên tray — đóng hết cửa sổ không có nghĩa là thoát.
  if (process.platform !== 'darwin') return;
});

main().catch((error: unknown) => {
  logger.error('Khởi động thất bại', error);
  app.exit(1);
});
