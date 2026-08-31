/**
 * Tầng thu nhận nội dung — chọn chiến lược theo intent.
 *
 * Thứ tự ưu tiên lấy từ `config/intents.config.ts`, không hardcode ở đây. Thêm
 * một intent mới với chiến lược khác chỉ cần sửa file config đó.
 *
 * Phase 2 đã có `capture`. Phase 3 thêm `accessibility` và `ocr` — cả hai đã
 * kiểm chứng thực nghiệm trên macOS (ADR-0006, ADR-0007).
 */

import { INTENTS } from '@config/intents.config';
import { LIMITS } from '@config/limits.config';
import type { Intent } from '@shared/types/intent';
import type { AcquiredContent } from '@shared/types/content';
import { rect, rectToLogical } from '@shared/types/geometry';
import type { Point } from '@shared/types/geometry';
import { captureDisplay, cropToBase64 } from './capture/screen-capture';
import { displayById, displayUnderCursor, selectionToImageRect } from './capture/display';
import { selectRegion } from '../windows/region-select.window';
import { getAccessibilityProvider } from './accessibility';
import { getOcrProvider } from './ocr';
import { layoutBlocks } from './ocr/blocks';
import { logger } from '../logging/logger';

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

    if (strategy === 'ocr' && point) {
      const viaOcr = await tryOcr(point);
      if (viaOcr) return { ok: true, content: viaOcr };
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
    ...(result.charOffset !== undefined ? { charOffset: result.charOffset } : {}),
    ...(result.offsetSource !== undefined ? { offsetSource: result.offsetSource } : {}),
    ...(result.role ? { app: { name: result.role } } : {}),
  };
}

/**
 * Fallback khi Accessibility không đọc được nội dung tại điểm đó — ví dụ
 * editor ảo hoá cao (đã quan sát: Monaco/VS Code không lộ text qua AX ở vùng
 * soạn thảo, dù sidebar/terminal của cùng app đọc được), PDF, ảnh, app native
 * không hỗ trợ accessibility.
 *
 * Chụp một vùng NHỎ quanh con trỏ (không phải toàn màn hình) rồi OCR — đủ để
 * bắt một dòng chữ, giữ nhanh cho Lane A.
 */
async function tryOcr(point: Point<'screen-logical'>): Promise<AcquiredContent | null> {
  const provider = await getOcrProvider();
  if (!provider) return null;

  const display = displayUnderCursor();
  const box = rect('screen-logical', {
    x: point.x - LIMITS.ocr.hoverCaptureWidth / 2,
    y: point.y - LIMITS.ocr.hoverCaptureHeight / 2,
    width: LIMITS.ocr.hoverCaptureWidth,
    height: LIMITS.ocr.hoverCaptureHeight,
  });

  try {
    const image = await captureDisplay(display);
    const imageRegion = selectionToImageRect(box, display);
    const base64 = cropToBase64(image, imageRegion);

    const result = await provider.recognize(base64);
    logger.debug('OCR fallback', { textLength: result.text.length, blocks: result.blocks.length, durationMs: result.durationMs });
    if (!result.text.trim()) return null;

    const bestConfidence = result.blocks.reduce((max, b) => Math.max(max, b.confidence), 0);
    if (bestConfidence > 0 && bestConfidence < LIMITS.ocr.minConfidence) {
      logger.debug('OCR confidence quá thấp, bỏ qua', { bestConfidence });
      return null;
    }

    // Dùng hình học của từng khối để biết con trỏ ở khối nào, thay vì ghép text
    // phẳng rồi ước lượng trong khung chụp — khung đó lấy con trỏ làm tâm nên
    // ước lượng luôn ra hằng số 0.625, vô dụng (ADR-0008).
    const layout = layoutBlocks(result.blocks, point, box, display.scaleFactor);
    logger.debug('OCR định vị khối', {
      hit: layout.charOffset !== undefined,
      blocks: result.blocks.length,
    });

    return {
      text: layout.text,
      // Neo vào đúng dòng chữ khi biết chắc; chỉ lùi về khung chụp khi không.
      bounds: layout.hitBounds ?? box,
      source: 'ocr',
      ...(layout.charOffset !== undefined ? { charOffset: layout.charOffset, offsetSource: 'blocks' as const } : {}),
      ...(bestConfidence > 0 ? { confidence: bestConfidence } : {}),
    };
  } catch (error) {
    // KHÔNG nuốt lỗi im lặng — thất bại thật (helper không spawn được, capture
    // lỗi...) phải phân biệt được với "vùng này đơn giản không có chữ".
    logger.warn('OCR fallback lỗi', error);
    return null;
  }
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
