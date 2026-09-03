/**
 * Tầng thu nhận nội dung — chọn chiến lược theo intent.
 *
 * Thứ tự ưu tiên lấy từ `config/intents.config.ts`, không hardcode ở đây. Thêm
 * một intent mới với chiến lược khác chỉ cần sửa file config đó.
 *
 * Phase 2 đã có `capture`. Phase 3 thêm `accessibility` và `ocr` — cả hai đã
 * kiểm chứng thực nghiệm trên macOS (ADR-0006, ADR-0007).
 */

import { clipboard } from 'electron';
import { INTENTS } from '@config/intents.config';
import { LIMITS } from '@config/limits.config';
import type { Settings } from '@config/settings';
import type { Intent } from '@shared/types/intent';
import type { AcquiredContent } from '@shared/types/content';
import { rect, rectToLogical } from '@shared/types/geometry';
import type { Point, Rect } from '@shared/types/geometry';
import { captureDisplay, cropToBase64 } from './capture/screen-capture';
import { displayById, displayUnderCursor, selectionToImageRect } from './capture/display';
import { selectRegion } from '../windows/region-select.window';
import { getAccessibilityProvider } from './accessibility';
import { getOcrProvider } from './ocr';
import type { OcrProvider } from './ocr';
import { getTesseractProvider } from './ocr/tesseract';
import { getCachedOcrResult, setCachedOcrResult } from './ocr/region-cache';
import { layoutBlocks } from './ocr/blocks';
import { logger } from '../logging/logger';

export type AcquireResult =
  | { ok: true; content: AcquiredContent }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; error: string };

type PerformanceMode = Settings['performanceMode'];

/**
 * `point` bắt buộc cho các intent có chiến lược `accessibility`/`ocr` trong
 * danh sách ưu tiên (Lane A — dịch khi rê chuột). Intent chỉ dùng `capture`
 * (Lane B — giải bài) không cần, vì `capture` tự mở lớp phủ khoanh vùng riêng.
 *
 * `performanceMode` chỉ ảnh hưởng nhánh `ocr` (xem tryOcr()) — mặc định
 * 'balanced' khi không truyền, để mọi lời gọi cũ (nếu có) vẫn ra đúng hành vi
 * đã có từ trước thay vì đổi ngầm.
 */
export async function acquire(
  intent: Intent,
  point?: Point<'screen-logical'>,
  performanceMode: PerformanceMode = 'balanced',
): Promise<AcquireResult> {
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
      const viaOcr = await tryOcr(point, performanceMode);
      if (viaOcr) return { ok: true, content: viaOcr };
      continue;
    }

    if (strategy === 'clipboard') {
      const viaClipboard = tryClipboard(point);
      if (viaClipboard) return { ok: true, content: viaClipboard };
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
 * Đọc clipboard hệ thống — dùng cho `rewrite` khi Accessibility không đọc được
 * text tại điểm hover (editor ảo hoá cao, hoặc người dùng chỉ đơn giản đã copy
 * sẵn đoạn cần viết lại thay vì trỏ chuột vào đó).
 *
 * `bounds` không có ý nghĩa hình học thật với clipboard (không có "vị trí" gắn
 * với nội dung đã copy) — chỉ neo vào điểm hiện tại của con trỏ để thoả kiểu dữ
 * liệu `AcquiredContent.bounds` (bắt buộc). Vô hại: surface 'result-panel' của
 * `rewrite` không đọc `bounds` (xem showResult() ở task-pipeline.ts).
 */
function tryClipboard(point?: Point<'screen-logical'>): AcquiredContent | null {
  const text = clipboard.readText().trim();
  if (!text) return null;

  const anchor = point ?? ({ x: 0, y: 0 } as Point<'screen-logical'>);
  return {
    text,
    bounds: rect('screen-logical', { x: anchor.x, y: anchor.y, width: 0, height: 0 }),
    source: 'clipboard',
  };
}

/**
 * Fallback khi Accessibility không đọc được nội dung tại điểm đó — ví dụ
 * editor ảo hoá cao (Monaco/VS Code không cho ánh xạ vị trí → ký tự), PDF,
 * ảnh, app native không hỗ trợ accessibility.
 *
 * Chụp một DẢI NGANG trọn bề rộng màn hình quanh con trỏ, không phải một ô
 * vuông quanh con trỏ. Hai lý do, cả hai đều đo được (xem LIMITS.ocr):
 *
 *   - Ô vuông cắt dòng chữ ở cả hai đầu. Vision trả về RỖNG khi chữ tràn cả
 *     hai mép ảnh — hover giữa đoạn văn dày im lặng không ra gì.
 *   - Kể cả khi đọc được, câu cắt ra là MẢNH VỤN: cụt đầu, cụt đuôi, hoặc
 *     dính sang câu bên cạnh. Dịch một mảnh vụn còn tệ hơn không dịch, vì
 *     người dùng không có cách nào biết mình đang đọc bản dịch của nửa câu.
 *
 * Dải trọn bề rộng giữ nguyên vẹn từng dòng, nên câu cắt ra là câu thật.
 */
async function tryOcr(point: Point<'screen-logical'>, performanceMode: PerformanceMode): Promise<AcquiredContent | null> {
  const modeLimits = LIMITS.ocr.performanceModes[performanceMode];
  const display = displayUnderCursor();
  const bounds = display.boundsLogical;
  const height = modeLimits.hoverCaptureHeight;
  // Ghim dải vào trong màn hình — con trỏ ở sát mép trên/dưới không được sinh
  // vùng chụp tràn ra ngoài (crop sẽ lệch hoặc rỗng).
  const top = Math.max(bounds.y, Math.min(point.y - height / 2, bounds.y + bounds.height - height));
  const box = rect('screen-logical', { x: bounds.x, y: top, width: bounds.width, height });

  let base64: string;
  try {
    const image = await captureDisplay(display);
    const imageRegion = selectionToImageRect(box, display);
    base64 = cropToBase64(image, imageRegion);
  } catch (error) {
    // KHÔNG nuốt lỗi im lặng — thất bại thật (capture lỗi...) phải phân biệt
    // được với "vùng này đơn giản không có chữ".
    logger.warn('OCR fallback lỗi (chụp màn hình)', error);
    return null;
  }

  const hit = { point, box, scaleFactor: display.scaleFactor, minConfidence: modeLimits.minConfidence };

  const provider = await getOcrProvider();
  if (provider) {
    const viaNative = await recognizeWith('native', provider, base64, hit);
    if (viaNative) return viaNative;
  }

  // Tesseract (WASM thuần, không tăng tốc phần cứng) — chậm hơn hẳn OCR native
  // nên chỉ thử SAU KHI native đã thất bại/không có/tin cậy thấp, không chạy
  // song song để không tốn CPU vô ích ở đường nóng. Bù lại chạy được trên MỌI
  // nền tảng kể cả khi chưa có provider native (ví dụ Linux trong tương lai,
  // hoặc provider native khởi động lỗi) — không cần quyền hệ thống hay binary
  // ngoài. KHÔNG có khả năng đặc biệt cho công thức toán (model 'equ' của
  // Tesseract chỉ tồn tại ở bản legacy, không tương thích chế độ LSTM đang
  // dùng — xem acquisition/ocr/tesseract.ts).
  const viaTesseract = await recognizeWith('tesseract', getTesseractProvider(), base64, hit);
  if (viaTesseract) logger.debug('OCR native không đạt, Tesseract cứu được');
  return viaTesseract;
}

type OcrHitContext = {
  point: Point<'screen-logical'>;
  box: Rect<'screen-logical'>;
  scaleFactor: number;
  minConfidence: number;
};

async function recognizeWith(
  label: 'native' | 'tesseract',
  provider: OcrProvider,
  base64: string,
  { point, box, scaleFactor, minConfidence }: OcrHitContext,
): Promise<AcquiredContent | null> {
  try {
    // Cache theo NỘI DUNG ảnh, không phải toạ độ — rê chuột sang từ kế bên
    // trong cùng dòng/đoạn thường chụp trúng gần như đúng y hệt vùng ảnh lần
    // trước (xem region-cache.ts). Chỉ bỏ qua bước OCR THẬT (chậm, ~300-400ms
    // đo được), MỌI xử lý sau đó (lọc confidence, layoutBlocks) vẫn chạy lại
    // bình thường — performanceMode có thể đã đổi giữa hai lần hover dù ảnh
    // giống hệt, nên không được cache luôn cả kết quả ĐÃ lọc.
    const cached = getCachedOcrResult(base64, label);
    const result = cached ?? (await provider.recognize(base64));
    if (!cached) setCachedOcrResult(base64, label, result);
    logger.debug('OCR fallback', { engine: result.engine, textLength: result.text.length, blocks: result.blocks.length, durationMs: result.durationMs, fromCache: cached !== null });
    if (!result.text.trim()) return null;

    const bestConfidence = result.blocks.reduce((max, b) => Math.max(max, b.confidence), 0);
    if (bestConfidence > 0 && bestConfidence < minConfidence) {
      logger.debug('OCR confidence quá thấp, bỏ qua', { engine: result.engine, bestConfidence });
      return null;
    }

    // Dùng hình học của từng khối để biết con trỏ ở khối nào, thay vì ghép text
    // phẳng rồi ước lượng trong khung chụp — khung đó lấy con trỏ làm tâm nên
    // ước lượng luôn ra hằng số 0.625, vô dụng (ADR-0008).
    const layout = layoutBlocks(result.blocks, point, box, scaleFactor);
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
    logger.warn('OCR fallback lỗi', { engine: label, error });
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
