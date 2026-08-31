/**
 * Sắp xếp và định vị các khối chữ OCR trả về.
 *
 * VÌ SAO TỒN TẠI
 * --------------
 * Vision trả về danh sách khối, mỗi khối kèm khung bao chính xác. Trước đây
 * `acquire.ts` ghép hết text lại rồi VỨT toàn bộ hình học đi — nên tầng trên
 * không còn cách nào biết con trỏ đang ở khối nào, và phải ước lượng vị trí
 * trong khung chụp 500×80. Mà khung đó LẤY CON TRỎ LÀM TÂM theo cấu tạo, nên
 * mọi lần hover đều ra cùng một tỉ lệ 0.625 — hằng số, vô dụng (xem ADR-0008).
 *
 * Ở đây giữ lại hình học đó và dùng nó để hit-test: biết chắc con trỏ nằm trong
 * khối nào, rồi mới nội suy TRONG khối đó. Khối OCR ≈ một dòng, nên phép nội
 * suy rơi về đúng ca "một dòng" đã đo được ~93,5% — thay vì ca nhiều dòng ~24%.
 *
 * Module thuần: không import Electron, nhận vào dữ liệu phẳng. Nhờ vậy kiểm thử
 * được bằng số liệu dựng sẵn thay vì phải chụp màn hình thật.
 */

import { rectImageToScreen, rectToLogical, rectToPhysical } from '@shared/types/geometry';
import type { Point, Rect } from '@shared/types/geometry';
import type { TextBlock } from '@shared/types/content';

export type BlockLayout = {
  /** Toàn bộ text đã ghép theo THỨ TỰ ĐỌC (trên→dưới, trái→phải). */
  text: string;
  /** Chỉ số ký tự dưới con trỏ trong `text`. Vắng mặt = con trỏ không rơi vào khối nào. */
  charOffset?: number;
  /** Khung của khối trúng — neo overlay vào đúng dòng chữ thay vì khung chụp. */
  hitBounds?: Rect<'screen-logical'>;
};

/**
 * Đưa các khối về thứ tự đọc.
 *
 * Vision KHÔNG bảo đảm trả về theo thứ tự đọc — Apple không cam kết điều đó ở
 * đâu cả. Ghép text theo thứ tự thô sẽ cho ra chuỗi lộn xộn với bố cục nhiều
 * cột, và khi đó mọi suy luận theo offset trên chuỗi đó đều mất nền. Sắp xếp
 * tường minh ở đây khiến kết quả không phụ thuộc vào thứ tự Vision trả về.
 */
export function sortReadingOrder(blocks: TextBlock[]): TextBlock[] {
  const rows: TextBlock[][] = [];

  for (const block of [...blocks].sort((a, b) => centerY(a) - centerY(b))) {
    // Cùng một dòng khi tâm dọc lệch nhau ít hơn nửa chiều cao khối thấp hơn —
    // dung sai theo chiều cao thật, không phải hằng số pixel, để đúng với cả
    // chữ nhỏ lẫn tiêu đề lớn.
    const row = rows[rows.length - 1];
    const sameRow =
      row?.[0] !== undefined &&
      Math.abs(centerY(block) - centerY(row[0])) < Math.min(block.bounds.height, row[0].bounds.height) * 0.5;

    if (sameRow && row) row.push(block);
    else rows.push([block]);
  }

  return rows.flatMap((row) => row.sort((a, b) => a.bounds.x - b.bounds.x));
}

const centerY = (b: TextBlock): number => b.bounds.y + b.bounds.height / 2;

/**
 * Ghép text theo thứ tự đọc và xác định con trỏ đang ở ký tự nào.
 *
 * `captureBox` là vùng đã chụp (screen-logical); khung của khối do Vision trả
 * về nằm trong hệ ảnh ĐÃ CẮT, nên phải cộng gốc vùng cắt rồi chia hệ số DPI để
 * quay lại screen-logical. Đi qua đúng chuỗi quy đổi có sẵn ở geometry.ts thay
 * vì tự nhân chia tại chỗ — đây chính là lớp lỗi mà branded type dựng ra để chặn.
 */
export function layoutBlocks(
  blocks: TextBlock[],
  cursor: Point<'screen-logical'>,
  captureBox: Rect<'screen-logical'>,
  scaleFactor: number,
): BlockLayout {
  const ordered = sortReadingOrder(blocks);
  const boxPhysical = rectToPhysical(captureBox, scaleFactor);

  const parts: string[] = [];
  let cursorOffset: number | undefined;
  let hitBounds: Rect<'screen-logical'> | undefined;
  let charsSoFar = 0;

  for (const block of ordered) {
    const onScreen = rectToLogical(rectImageToScreen(block.bounds, boxPhysical), scaleFactor);

    if (cursorOffset === undefined && contains2d(onScreen, cursor)) {
      cursorOffset = charsSoFar + offsetWithinBlock(block.text, onScreen, cursor);
      hitBounds = onScreen;
    }

    parts.push(block.text);
    charsSoFar += block.text.length + 1; // +1 cho ký tự xuống dòng khi ghép
  }

  return {
    text: parts.join('\n'),
    ...(cursorOffset !== undefined ? { charOffset: cursorOffset } : {}),
    ...(hitBounds !== undefined ? { hitBounds } : {}),
  };
}

/**
 * `contains()` của geometry.ts dùng nửa khoảng [x, x+w) — đúng cho lưới pixel,
 * nhưng ở đây khung do OCR trả về có thể ôm sát chữ tới mức con trỏ rơi đúng
 * mép. Nới 2px mỗi phía để không trượt oan.
 */
function contains2d(r: Rect<'screen-logical'>, p: Point<'screen-logical'>): boolean {
  return p.x >= r.x - 2 && p.x <= r.x + r.width + 2 && p.y >= r.y - 2 && p.y <= r.y + r.height + 2;
}

/**
 * Vị trí ký tự trong MỘT khối. Khối OCR ≈ một dòng nên chỉ cần trục X — đây
 * đúng là ca đã đo được ~93,5% với font thật, khác hẳn ca nhiều dòng ~24%.
 *
 * Vẫn là ước lượng: giả định bề rộng ký tự đều nhau. Muốn chính xác tuyệt đối
 * cần hộp bao per-character của Vision (`boundingBox(for:)`) — chưa làm, ghi ở
 * ADR-0008 mục tầng 4.
 */
function offsetWithinBlock(text: string, bounds: Rect<'screen-logical'>, cursor: Point<'screen-logical'>): number {
  if (bounds.width <= 0 || !text.length) return 0;
  const fraction = Math.min(1, Math.max(0, (cursor.x - bounds.x) / bounds.width));
  return Math.min(text.length - 1, Math.round(fraction * text.length));
}
