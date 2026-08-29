import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';

const isDev = !!process.env.ELECTRON_RENDERER_URL;

// Ghi chú cho người bảo trì: main/preload build ra CJS (mặc định của electron-vite,
// không có "type": "module" trong package.json). ESM cũng chạy được với Electron 33,
// nhưng CJS hợp hơn với native module CJS sắp thêm ở Phase 1 (better-sqlite3),
// và preload ESM còn đòi thêm ràng buộc về sandbox và phần mở rộng .mjs.
// Vì vậy `__dirname` dùng được trực tiếp ở đây.

export type WindowKind = 'settings' | 'chat' | 'result' | 'hover' | 'region-select';

/**
 * Dựng BrowserWindow với thiết lập bảo mật đã chuẩn hoá.
 *
 * `contextIsolation: true` + `nodeIntegration: false` là bắt buộc — renderer chỉ
 * chạm được main qua preload, đúng ranh giới của IPC contract.
 */
export function createWindow(
  kind: WindowKind,
  options: BrowserWindowConstructorOptions = {},
): BrowserWindow {
  const win = new BrowserWindow({
    show: false,
    ...options,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      ...options.webPreferences,
    },
  });

  const url = process.env.ELECTRON_RENDERER_URL;
  if (isDev && url) {
    void win.loadURL(`${url}/windows/${kind}/index.html`);
  } else {
    void win.loadFile(join(__dirname, `../renderer/windows/${kind}/index.html`));
  }

  win.once('ready-to-show', () => win.show());
  return win;
}
