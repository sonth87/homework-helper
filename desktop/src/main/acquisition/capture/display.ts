/**
 * Chọn màn hình và quy đổi toạ độ.
 *
 * Đây là nơi branded type ở @shared/types/geometry trả lãi: `Display.bounds` và
 * `getCursorScreenPoint()` của Electron đều là điểm LOGIC, còn ảnh chụp ra là
 * pixel VẬT LÝ. Trên máy Retina hai hệ này lệch nhau đúng `scaleFactor` lần.
 *
 * Trộn nhầm không ném lỗi — vùng crop chỉ lệch đi, và trên màn hình 1× thì
 * scaleFactor = 1 nên bug hoàn toàn vô hình khi phát triển.
 */

import { screen } from 'electron';
import type { Display } from 'electron';
import { rect } from '@shared/types/geometry';
import type { Point, Rect } from '@shared/types/geometry';

export type DisplayInfo = {
  id: number;
  scaleFactor: number;
  /** Vùng màn hình theo điểm logic — dùng để đặt cửa sổ chọn vùng. */
  boundsLogical: Rect<'screen-logical'>;
  /** Cùng vùng đó theo pixel vật lý — dùng để yêu cầu ảnh chụp đúng độ phân giải. */
  boundsPhysical: Rect<'screen-physical'>;
};

function toInfo(display: Display): DisplayInfo {
  const { x, y, width, height } = display.bounds;
  const s = display.scaleFactor;

  return {
    id: display.id,
    scaleFactor: s,
    boundsLogical: rect('screen-logical', { x, y, width, height }),
    boundsPhysical: rect('screen-physical', {
      x: Math.round(x * s),
      y: Math.round(y * s),
      width: Math.round(width * s),
      height: Math.round(height * s),
    }),
  };
}

/** Màn hình đang chứa con trỏ — nơi người dùng đang nhìn. */
export function displayUnderCursor(): DisplayInfo {
  return toInfo(screen.getDisplayNearestPoint(screen.getCursorScreenPoint()));
}

export function displayById(id: number): DisplayInfo {
  const found = screen.getAllDisplays().find((d) => d.id === id);
  return toInfo(found ?? screen.getPrimaryDisplay());
}

export function cursorPoint(): Point<'screen-logical'> {
  const { x, y } = screen.getCursorScreenPoint();
  return { x, y } as Point<'screen-logical'>;
}

/**
 * Đổi vùng chọn (toạ độ logic, gốc là màn hình đó) sang pixel vật lý tính từ
 * góc trên-trái của chính ảnh đã chụp màn hình đó.
 *
 * Hai phép trừ và một phép nhân, nhưng làm sai thứ tự là lệch vùng crop —
 * chính vì vậy chữ ký hàm bắt buộc nêu rõ không gian của từng tham số.
 */
export function selectionToImageRect(
  selection: Rect<'screen-logical'>,
  display: DisplayInfo,
): Rect<'image'> {
  const s = display.scaleFactor;
  return rect('image', {
    x: Math.round((selection.x - display.boundsLogical.x) * s),
    y: Math.round((selection.y - display.boundsLogical.y) * s),
    width: Math.round(selection.width * s),
    height: Math.round(selection.height * s),
  });
}
