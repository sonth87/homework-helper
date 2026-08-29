/**
 * Tầng thu nhận nội dung — chọn chiến lược theo intent.
 *
 * Thứ tự ưu tiên lấy từ `config/intents.config.ts`, không hardcode ở đây. Thêm
 * một intent mới với chiến lược khác chỉ cần sửa file config đó.
 *
 * Phase 2 đã có `capture`. Phase 3 thêm `accessibility` — đã kiểm chứng thực
 * nghiệm trên macOS (ADR-0006). `ocr` là bước tiếp theo, chưa xây trong file
 * này — khi thiếu, danh sách ưu tiên tự rơi qua chiến lược kế tiếp hoặc báo lỗi.
 */

import { INTENTS } from '@config/intents.config';
import type { Intent } from '@shared/types/intent';
import type { AcquiredContent } from '@shared/types/content';
import { rect, rectToLogical } from '@shared/types/geometry';
import type { Point } from '@shared/types/geometry';
import { captureDisplay, cropToBase64 } from './capture/screen-capture';
import { displayById, displayUnderCursor, selectionToImageRect } from './capture/display';
import { selectRegion } from '../windows/region-select.window';
import { getAccessibilityProvider } from './accessibility';

export type AcquireResult =
  | { ok: true; content: AcquiredContent }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; error: string };

/**
 * `point` bắt buộc cho các intent có chiến lược `accessibility`/`ocr` trong
 * danh sách ưu tiên (Lane A — dịch khi rê chuột). Intent chỉ dùng `capture`
 * (Lane B — giải bài) không cần, vì `capture` tự mở lớp phủ khoanh vùng riêng.
 */
export async function acquire(intent: Intent, point?: Point<'screen-logical'>): Promise<AcquireResult> {
  for (const strategy of INTENTS[intent].acquisition) {
    if (strategy === 'capture') return captureRegion();

    if (strategy === 'accessibility' && point) {
      const viaAx = await tryAccessibility(point);
      if (viaAx) return { ok: true, content: viaAx };
      // Không có provider, chưa có quyền, hoặc không có text tại điểm đó —
      // rơi qua chiến lược tiếp theo (thường là 'ocr') thay vì báo lỗi ngay.
      continue;
    }
  }
  return { ok: false, cancelled: false, error: `Intent "${intent}" chưa có chiến lược thu nhận nào khả dụng.` };
}

async function tryAccessibility(point: Point<'screen-logical'>): Promise<AcquiredContent | null> {
  const provider = await getAccessibilityProvider();
  if (!provider) return null;

  const result = await provider.getTextAtPoint(point);
  if (!result) return null;

  return {
    text: result.text,
    bounds: result.bounds,
    source: 'accessibility',
    ...(result.role ? { app: { name: result.role } } : {}),
  };
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

    const boundsPhysical = rect('screen-physical', {
      x: Math.round(selection.region.x * display.scaleFactor),
      y: Math.round(selection.region.y * display.scaleFactor),
      width: Math.round(selection.region.width * display.scaleFactor),
      height: Math.round(selection.region.height * display.scaleFactor),
    });

    return {
      ok: true,
      content: {
        imageBase64: cropToBase64(image, region),
        // Chuẩn hoá về screen-logical — xem ghi chú ở AcquiredContent.bounds.
        bounds: rectToLogical(boundsPhysical, display.scaleFactor),
        source: 'capture',
      },
    };
  } catch (error) {
    return { ok: false, cancelled: false, error: error instanceof Error ? error.message : String(error) };
  }
}
