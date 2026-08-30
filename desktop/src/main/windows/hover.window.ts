/**
 * Cửa sổ overlay của Lane A — dịch khi rê chuột.
 *
 * Khác hoàn toàn ResultPanel (Lane B) ở bốn điểm, và đó là lý do phải là hai
 * loại cửa sổ riêng chứ không phải một cửa sổ cấu hình khác nhau (ADR-0003):
 *   1. KHÔNG nhận focus — nếu cướp focus, ứng dụng người dùng đang gõ sẽ mất
 *      con trỏ nhập, phá hỏng chính việc họ đang làm.
 *   2. CLICK-THROUGH — chuột phải xuyên qua tới ứng dụng bên dưới, nếu không
 *      overlay sẽ chắn mọi thao tác trong vùng nó phủ.
 *   3. Trong suốt, không khung, không bóng.
 *   4. Nổi trên cả ứng dụng toàn màn hình.
 */

import { BrowserWindow, screen } from 'electron';
import { join } from 'node:path';
import type { Point, Rect } from '@shared/types/geometry';

let hover: BrowserWindow | null = null;

function getHoverWindow(): BrowserWindow {
  if (hover && !hover.isDestroyed()) return hover;

  hover = new BrowserWindow({
    width: 320,
    height: 120,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    // Không bao giờ cướp focus khỏi ứng dụng người dùng đang dùng.
    focusable: false,
    // 'screen-saver' nổi trên cả ứng dụng toàn màn hình; các mức thấp hơn bị che.
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  hover.setAlwaysOnTop(true, 'screen-saver');
  // Chuột xuyên qua overlay xuống ứng dụng bên dưới.
  hover.setIgnoreMouseEvents(true, { forward: true });
  // Hiện trên mọi không gian làm việc, kể cả khi có app toàn màn hình.
  hover.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const url = process.env.ELECTRON_RENDERER_URL;
  if (url) void hover.loadURL(`${url}/windows/hover/index.html`);
  else void hover.loadFile(join(__dirname, '../renderer/windows/hover/index.html'));

  hover.on('closed', () => {
    hover = null;
  });

  return hover;
}

export type HoverContent = { sourceText: string; translatedText: string; sourceLanguage?: string };

/**
 * Gửi nội dung rồi hiện overlay đúng vị trí — MỘT hàm, không tách rời như
 * trước, vì thứ tự và việc chờ trang tải xong là bắt buộc, không phải chi
 * tiết tuỳ chọn.
 *
 * BUG THẬT đã gặp: lần đầu tiên trong một phiên (cửa sổ vừa được tạo bằng
 * `getHoverWindow()`), `loadFile()` chưa xong — script preload chưa kịp đăng
 * ký listener `hover:update` — thì `webContents.send()` gọi ngay sau đó gửi
 * vào khoảng không, Electron KHÔNG đệm IPC cho listener chưa sẵn sàng, sự
 * kiện mất vĩnh viễn. Lần hiện đầu tiên trong mỗi phiên luôn trống, các lần
 * sau mới đúng — cùng loại lỗi thứ tự mà `result.window.ts` (Phase 2) đã xử
 * lý bằng cách đợi `did-finish-load`, chỉ là hover.window.ts khi đó thiếu.
 */
export async function showHoverAt(anchor: Rect<'screen-logical'>, content: HoverContent): Promise<void> {
  const win = getHoverWindow();

  if (win.webContents.isLoading()) {
    await new Promise<void>((resolve) => win.webContents.once('did-finish-load', () => resolve()));
  }

  win.webContents.send('hover:update', content);

  const [width, height] = win.getSize() as [number, number];
  const area = screen.getDisplayNearestPoint({ x: anchor.x, y: anchor.y }).workArea;

  // Ưu tiên đặt bên dưới; nếu tràn đáy thì lật lên trên vùng nguồn.
  const belowY = anchor.y + anchor.height + 8;
  const y = belowY + height > area.y + area.height ? anchor.y - height - 8 : belowY;
  const x = Math.min(Math.max(anchor.x, area.x), area.x + area.width - width);

  win.setPosition(Math.round(x), Math.round(y));
  win.showInactive();
}

export function hideHover(): void {
  if (hover && !hover.isDestroyed()) hover.hide();
}

/** Toạ độ con trỏ hiện tại, đã gắn nhãn không gian để không trộn nhầm. */
export function cursorPoint(): Point<'screen-logical'> {
  const { x, y } = screen.getCursorScreenPoint();
  return { x, y } as Point<'screen-logical'>;
}
