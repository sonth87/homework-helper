/**
 * Tầng thu nhận nội dung — chọn chiến lược theo intent.
 *
 * Thứ tự ưu tiên lấy từ `config/intents.config.ts`, không hardcode ở đây. Thêm
 * một intent mới với chiến lược khác chỉ cần sửa file config đó.
 *
 * Phase 2 mới hiện thực chiến lược `capture`. `accessibility` và `ocr` là việc
 * của Phase 3 — xem ADR-0004 về lý do capture đi trước.
 */

import { INTENTS } from '@config/intents.config';
import type { Intent } from '@shared/types/intent';
import type { AcquiredContent } from '@shared/types/content';
import { rect } from '@shared/types/geometry';
import { captureDisplay, cropToBase64 } from './capture/screen-capture';
import { displayById, displayUnderCursor, selectionToImageRect } from './capture/display';
import { selectRegion } from '../windows/region-select.window';

export type AcquireResult =
  | { ok: true; content: AcquiredContent }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; error: string };

export async function acquire(intent: Intent): Promise<AcquireResult> {
  for (const strategy of INTENTS[intent].acquisition) {
    if (strategy !== 'capture') continue; // Phase 3 sẽ bổ sung accessibility / ocr
    return captureRegion();
  }
  return { ok: false, cancelled: false, error: `Intent "${intent}" chưa có chiến lược thu nhận nào khả dụng.` };
}

async function captureRegion(): Promise<AcquireResult> {
  const selection = await selectRegion(displayUnderCursor());
  if (!selection) return { ok: false, cancelled: true };

  try {
    // Chụp SAU khi người dùng chọn xong và lớp phủ đã đóng — chụp trước thì
    // ảnh sẽ dính chính lớp phủ chọn vùng.
    const display = displayById(selection.displayId);
    const image = await captureDisplay(display);
    const region = selectionToImageRect(selection.region, display);

    return {
      ok: true,
      content: {
        imageBase64: cropToBase64(image, region),
        bounds: rect('screen-physical', {
          x: Math.round(selection.region.x * display.scaleFactor),
          y: Math.round(selection.region.y * display.scaleFactor),
          width: Math.round(selection.region.width * display.scaleFactor),
          height: Math.round(selection.region.height * display.scaleFactor),
        }),
        source: 'capture',
      },
    };
  } catch (error) {
    return { ok: false, cancelled: false, error: error instanceof Error ? error.message : String(error) };
  }
}
