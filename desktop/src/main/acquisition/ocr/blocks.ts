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
 * khối nào, rồi khớp vào đúng khung TỪ Vision đã nhận diện trong khối đó
 * (`offsetFromWords`) — chính xác tuyệt đối, không suy đoán. Chỉ nội suy theo
 * tỉ lệ X (giả định bề rộng ký tự đều nhau, ~93,5% đúng với font thật) khi
 * khối không có khung từ nào — phòng nguồn OCR khác trong tương lai.
 *
 * Module thuần: không import Electron, nhận vào dữ liệu phẳng. Nhờ vậy kiểm thử
 * được bằng số liệu dựng sẵn thay vì phải chụp màn hình thật.
 */

import { rectImageToScreen, rectToLogical, rectToPhysical } from '@shared/types/geometry';
import type { Point, Rect } from '@shared/types/geometry';
import type { TextBlock, TextWord } from '@shared/types/content';

/** Vị trí ký tự dưới con trỏ + khung của chính từ đó (để neo overlay). */
type WordHit = { offset: number; bounds: Rect<'screen-logical'> };

/** Gộp hai tham số luôn đi cùng nhau khi quy đổi khung ảnh -> screen-logical. */
type ImageToScreen = { boxPhysical: Rect<'screen-physical'>; scaleFactor: number };

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
 * Giữ lại các khối thuộc CÙNG MỘT CỘT chữ với con trỏ, bỏ phần còn lại.
 *
 * VÌ SAO CẦN — hệ quả trực tiếp của việc chụp trọn bề rộng màn hình (xem
 * `tryOcr`): dải ngang đó cắt qua mọi thứ nằm cùng độ cao, không chỉ đoạn văn
 * người dùng đang đọc. Hover giữa trình soạn thảo thì dải còn hút cả cây thư
 * mục bên trái, minimap bên phải, hay một cửa sổ khác cạnh đó. Ghép tất cả vào
 * một chuỗi rồi cắt câu sẽ sinh ra câu lai giữa những nội dung không liên
 * quan — dịch ra thứ vô nghĩa mà người dùng không biết là sai.
 *
 * Cách phân biệt: khối cùng cột thì hình chiếu ngang CHỒNG LÊN NHAU đáng kể
 * (các dòng của một đoạn văn gần như trùng khít bề ngang), còn sidebar/minimap
 * nằm ở dải x hoàn toàn khác. Ngưỡng 30% tính theo khối HẸP HƠN để dòng cuối
 * đoạn (thường ngắn hơn hẳn) không bị loại oan.
 */
function sameColumnAs(
  cursor: Point<'screen-logical'>,
  ordered: TextBlock[],
  conv: ImageToScreen,
): TextBlock[] {
  const onScreen = (b: TextBlock) => rectToLogical(rectImageToScreen(b.bounds, conv.boxPhysical), conv.scaleFactor);
  const hit = ordered.find((b) => contains2d(onScreen(b), cursor));
  if (!hit) return ordered; // không trúng khối nào — không có cột nào để bám theo

  const hitRect = onScreen(hit);
  return ordered.filter((b) => {
    const r = onScreen(b);
    const overlap = Math.min(r.x + r.width, hitRect.x + hitRect.width) - Math.max(r.x, hitRect.x);
    return overlap > 0 && overlap >= Math.min(r.width, hitRect.width) * 0.3;
  });
}

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
  const conv: ImageToScreen = { boxPhysical: rectToPhysical(captureBox, scaleFactor), scaleFactor };
  const ordered = sameColumnAs(cursor, sortReadingOrder(blocks), conv);

  let text = '';
  let cursorOffset: number | undefined;
  let hitBounds: Rect<'screen-logical'> | undefined;
  let previous: Rect<'screen-logical'> | null = null;

  for (const block of ordered) {
    const onScreen = rectToLogical(rectImageToScreen(block.bounds, conv.boxPhysical), conv.scaleFactor);
    if (previous) text += separatorBetween(previous, onScreen);

    if (cursorOffset === undefined && contains2d(onScreen, cursor)) {
      const hit = offsetWithinBlock(block, onScreen, cursor, conv);
      cursorOffset = text.length + hit.offset;
      // Neo vào khung TỪ chứ không phải cả dòng: từ khi chụp trọn bề rộng màn
      // hình, một dòng có thể rộng gần hết màn — neo theo dòng sẽ đẩy thẻ dịch
      // ra xa hẳn chỗ người dùng đang trỏ.
      hitBounds = hit.bounds;
    }

    text += block.text;
    previous = onScreen;
  }

  return {
    text,
    ...(cursorOffset !== undefined ? { charOffset: cursorOffset } : {}),
    ...(hitBounds !== undefined ? { hitBounds } : {}),
  };
}

/**
 * Nối hai dòng OCR liền nhau bằng KHOẢNG TRẮNG, không phải xuống dòng.
 *
 * BUG THẬT đã gặp: ghép mọi dòng bằng '\n' làm `Intl.Segmenter` coi mỗi dòng
 * là một câu riêng — câu thật trải hai dòng (chuyện thường trong mọi đoạn văn)
 * bị chặt làm đôi, và người dùng nhận về bản dịch của NỬA CÂU mà không hề biết.
 * Xuống dòng trong một đoạn văn là ngắt THỊ GIÁC, không phải ngắt ngữ nghĩa.
 *
 * Chỉ khi khoảng cách dọc giữa hai khối lớn bất thường (hơn 1,6 lần chiều cao
 * dòng) mới coi là sang ĐOẠN mới và dùng '\n\n' — lúc đó ngắt câu là đúng.
 */
function separatorBetween(previous: Rect<'screen-logical'>, next: Rect<'screen-logical'>): string {
  const gap = next.y - (previous.y + previous.height);
  const lineHeight = Math.max(previous.height, next.height);
  return gap > lineHeight * 1.6 ? '\n\n' : ' ';
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
 * Vị trí ký tự trong MỘT khối. Ưu tiên khung từng TỪ Vision trả về
 * (`offsetFromWords`) — chính xác tuyệt đối, không suy đoán. Chỉ nội suy theo
 * tỉ lệ X (giả định bề rộng ký tự đều nhau, đo được ~93,5% đúng với font thật)
 * khi khối không có khung từ nào — phòng nguồn OCR khác trong tương lai (ví dụ
 * Windows OCR, Phase 4) chưa chắc có cùng API cho từng từ như `ocr-macos`.
 */
function offsetWithinBlock(
  block: TextBlock,
  bounds: Rect<'screen-logical'>,
  cursor: Point<'screen-logical'>,
  conv: ImageToScreen,
): WordHit {
  const exact = offsetFromWords(block, cursor, conv);
  if (exact !== undefined) return exact;

  if (bounds.width <= 0 || !block.text.length) return { offset: 0, bounds };
  const fraction = Math.min(1, Math.max(0, (cursor.x - bounds.x) / bounds.width));
  return { offset: Math.min(block.text.length - 1, Math.round(fraction * block.text.length)), bounds };
}

/**
 * Hit-test con trỏ vào đúng khung TỪ Vision đã nhận diện. Trả `undefined` khi
 * khối không có khung từ nào (chưa nên xảy ra với `ocr-macos` hiện tại, nhưng
 * không giả định nguồn OCR nào cũng có).
 *
 * Con trỏ rơi vào KHE giữa hai từ (khoảng trắng) → lấy từ GẦN NHẤT theo
 * khoảng cách tới mép, không phải từ đầu tiên/cuối cùng của khối — cùng
 * nguyên tắc đã sửa ở `pickSegmentAtIndex` (text-segment.ts) cho đúng loại lỗi
 * này: lấy "từ cuối" khi hover vào khoảng trắng đầu câu là sai lệch hoàn toàn.
 */
function offsetFromWords(
  block: TextBlock,
  cursor: Point<'screen-logical'>,
  conv: ImageToScreen,
): WordHit | undefined {
  if (!block.words.length) return undefined;

  let nearest: WordHit = { offset: block.words[0]!.startOffset, bounds: wordRect(block.words[0]!, conv) };
  let nearestDistance = Infinity;

  for (const word of block.words) {
    const onScreen = wordRect(word, conv);
    if (contains2d(onScreen, cursor)) return { offset: word.startOffset, bounds: onScreen };

    const distance = cursor.x < onScreen.x ? onScreen.x - cursor.x : Math.max(0, cursor.x - (onScreen.x + onScreen.width));
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = { offset: word.startOffset, bounds: onScreen };
    }
  }
  return nearest;
}

const wordRect = (word: TextWord, conv: ImageToScreen): Rect<'screen-logical'> =>
  rectToLogical(rectImageToScreen(word.bounds, conv.boxPhysical), conv.scaleFactor);
