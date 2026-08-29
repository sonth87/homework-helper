import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';

const isDev = !!process.env.ELECTRON_RENDERER_URL;

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
      preload: join(import.meta.dirname, '../preload/index.js'),
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
    void win.loadFile(join(import.meta.dirname, `../renderer/windows/${kind}/index.html`));
  }

  win.once('ready-to-show', () => win.show());
  return win;
}
