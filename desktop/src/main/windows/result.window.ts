/**
 * Cửa sổ kết quả — Lane B.
 *
 * Dùng LẠI một cửa sổ cho mọi lần gọi thay vì mở cửa sổ mới: người dùng bấm
 * phím tắt nhiều lần liên tiếp sẽ không bị ngập màn hình. Nhiệm vụ mới ghi đè
 * nhiệm vụ cũ, và request cũ bị huỷ nhờ AbortSignal trong stream-handler.
 */

import { BrowserWindow } from 'electron';
import { join } from 'node:path';
import type { Intent, StudyMode } from '@shared/types/intent';

export type ResultTask = {
  intent: Intent;
  prompt: string;
  imageBase64?: string;
  studyMode?: StudyMode;
};

let win: BrowserWindow | null = null;

function create(): BrowserWindow {
  const created = new BrowserWindow({
    width: 560,
    height: 640,
    minWidth: 380,
    minHeight: 300,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    // Nổi trên ứng dụng người dùng đang làm việc — lời giải để đối chiếu, không
    // phải để chuyển hẳn sang cửa sổ khác.
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const url = process.env.ELECTRON_RENDERER_URL;
  if (url) void created.loadURL(`${url}/windows/result/index.html`);
  else void created.loadFile(join(__dirname, '../renderer/windows/result/index.html'));

  created.on('closed', () => {
    win = null;
  });

  return created;
}

export async function showResult(task: ResultTask): Promise<void> {
  win ??= create();

  // Chờ renderer nạp xong rồi mới gửi nhiệm vụ, nếu không sự kiện bắn vào
  // khoảng không và cửa sổ đứng im mãi.
  if (win.webContents.isLoading()) {
    await new Promise<void>((resolve) => win?.webContents.once('did-finish-load', () => resolve()));
  }

  win.webContents.send('result:task', task);
  win.show();
  win.focus();
}
