/**
 * Cửa sổ chọn vùng — phủ kín một màn hình để người dùng kéo khoanh.
 *
 * Khác HoverOverlay ở chỗ nó PHẢI nhận chuột và bàn phím (kéo chọn, Esc để huỷ),
 * nên không dùng setIgnoreMouseEvents. Nhưng vẫn không khung, trong suốt, và
 * nổi trên mọi thứ.
 */

import { BrowserWindow } from 'electron';
import { join } from 'node:path';
import { rect } from '@shared/types/geometry';
import type { Rect } from '@shared/types/geometry';
import type { DisplayInfo } from '../acquisition/capture/display';

export type SelectionResult = { region: Rect<'screen-logical'>; displayId: number } | null;

/**
 * Mở lớp phủ và chờ người dùng kéo chọn. Trả về null nếu họ huỷ.
 *
 * Cửa sổ được tạo mới mỗi lần thay vì dùng lại: lớp phủ phải khớp đúng kích
 * thước màn hình đang có con trỏ, và người dùng có thể đổi màn hình giữa hai lần.
 */
export function selectRegion(display: DisplayInfo): Promise<SelectionResult> {
  const b = display.boundsLogical;

  const win = new BrowserWindow({
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    // Phải nhận được phím Esc, nên KHÔNG dùng focusable: false như HoverOverlay.
    alwaysOnTop: true,
    // Trên macOS, fullscreenable: false giữ lớp phủ không tạo không gian riêng.
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const url = process.env.ELECTRON_RENDERER_URL;
  if (url) void win.loadURL(`${url}/windows/region-select/index.html`);
  else void win.loadFile(join(__dirname, '../renderer/windows/region-select/index.html'));

  return new Promise<SelectionResult>((resolve) => {
    let settled = false;
    const finish = (result: SelectionResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
      if (!win.isDestroyed()) win.close();
    };

    win.webContents.ipc.on('region:done', (_e, payload: { x: number; y: number; width: number; height: number } | null) => {
      if (!payload || payload.width < 4 || payload.height < 4) return finish(null);
      // Toạ độ từ renderer là tương đối với cửa sổ; cộng gốc màn hình để ra
      // toạ độ màn hình thật.
      finish({
        region: rect('screen-logical', {
          x: b.x + payload.x,
          y: b.y + payload.y,
          width: payload.width,
          height: payload.height,
        }),
        displayId: display.id,
      });
    });

    // Đóng cửa sổ bằng bất kỳ cách nào khác cũng coi như huỷ.
    win.on('closed', () => finish(null));
    win.once('ready-to-show', () => {
      win.show();
      win.focus();
    });
  });
}
