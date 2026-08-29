import { BrowserWindow } from 'electron';
import { join } from 'node:path';

let win: BrowserWindow | null = null;

export function openChatWindow(): BrowserWindow {
  if (win && !win.isDestroyed()) {
    win.show();
    win.focus();
    return win;
  }

  win = new BrowserWindow({
    width: 860,
    height: 640,
    minWidth: 560,
    minHeight: 400,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const url = process.env.ELECTRON_RENDERER_URL;
  if (url) void win.loadURL(`${url}/windows/chat/index.html`);
  else void win.loadFile(join(__dirname, '../renderer/windows/chat/index.html'));

  win.once('ready-to-show', () => win?.show());
  win.on('closed', () => {
    win = null;
  });

  return win;
}
