/**
 * Thanh hành động nổi của clipboard watcher — hiện gần vị trí con trỏ khi
 * người dùng vừa copy một đoạn text, cho bấm nhanh Tóm tắt/Giải thích/Viết lại
 * mà không cần nhớ phím tắt.
 *
 * Khác HoverOverlay (hover.window.ts) ở chỗ PHẢI nhận được click (không
 * click-through, không setIgnoreMouseEvents) — gần với region-select.window.ts
 * hơn ở điểm đó. Nhưng khác region-select ở chỗ đây là cửa sổ SỐNG LÂU DÀI,
 * tái dùng qua nhiều lần copy (giống hover.window.ts), không tạo mới mỗi lần.
 */

import { BrowserWindow, screen } from 'electron';
import { join } from 'node:path';
import type { Settings } from '@config/settings';
import type { Intent } from '@shared/types/intent';
import type { Point } from '@shared/types/geometry';
import { handleClipboardAction } from '../pipeline/task-pipeline';
import { logger } from '../logging/logger';

const BAR_WIDTH = 260;
const BAR_HEIGHT = 44;
// Tự ẩn nếu người dùng không bấm gì — thanh nổi mãi mãi sau mỗi lần copy sẽ
// gây phiền nhiều hơn giúp ích, nhất là copy paste diễn ra liên tục khi làm
// việc bình thường (không phải lúc nào cũng có ý định xử lý bằng AI).
const AUTO_HIDE_MS = 8_000;

let bar: BrowserWindow | null = null;
let autoHideTimer: NodeJS.Timeout | null = null;
// Text ĐANG hiện thanh hành động — main tự nhớ, không tin renderer echo lại
// (xem ghi chú ở handleClipboardAction trong task-pipeline.ts).
let currentText = '';
let currentSettings: Settings | null = null;
let ipcBound = false;

function clearAutoHide(): void {
  if (autoHideTimer) clearTimeout(autoHideTimer);
  autoHideTimer = null;
}

function getBarWindow(): BrowserWindow {
  if (bar && !bar.isDestroyed()) return bar;

  bar = new BrowserWindow({
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  bar.setAlwaysOnTop(true, 'screen-saver');
  bar.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const url = process.env.ELECTRON_RENDERER_URL;
  if (url) void bar.loadURL(`${url}/windows/clipboard-bar/index.html`);
  else void bar.loadFile(join(__dirname, '../renderer/windows/clipboard-bar/index.html'));

  // Mất focus (bấm ra ngoài) coi như người dùng không muốn dùng thanh này nữa.
  bar.on('blur', hideClipboardBar);
  bar.on('closed', () => {
    bar = null;
  });

  if (!ipcBound) {
    ipcBound = true;
    bar.webContents.ipc.on('clipboard-bar:action', (_e, payload: { intent: Intent }) => {
      const text = currentText;
      const settings = currentSettings;
      hideClipboardBar();
      if (!text || !settings) return;
      void handleClipboardAction(payload.intent, text, settings).catch((err: unknown) => {
        logger.warn('handleClipboardAction lỗi', err);
      });
    });
    bar.webContents.ipc.on('clipboard-bar:dismiss', () => hideClipboardBar());
  }

  return bar;
}

export function showClipboardBar(anchor: Point<'screen-logical'>, text: string, settings: Settings): void {
  currentText = text;
  currentSettings = settings;

  const win = getBarWindow();
  const area = screen.getDisplayNearestPoint(anchor).workArea;

  // Ghim trong vùng làm việc màn hình — con trỏ ở sát mép không được đẩy
  // thanh hành động ra ngoài, mất một phần hoặc toàn bộ nút bấm.
  const x = Math.min(Math.max(anchor.x, area.x), area.x + area.width - BAR_WIDTH);
  const y = Math.min(Math.max(anchor.y + 16, area.y), area.y + area.height - BAR_HEIGHT);
  win.setPosition(Math.round(x), Math.round(y));

  // Không click-through như HoverOverlay — thanh này PHẢI nhận được click, nên
  // show() + focus() (giống region-select.window.ts), không showInactive().
  win.show();
  win.focus();

  clearAutoHide();
  autoHideTimer = setTimeout(hideClipboardBar, AUTO_HIDE_MS);
}

export function hideClipboardBar(): void {
  clearAutoHide();
  currentText = '';
  currentSettings = null;
  if (bar && !bar.isDestroyed()) bar.hide();
}
