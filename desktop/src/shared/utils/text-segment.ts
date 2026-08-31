/**
 * Cắt văn bản theo từ/câu/đoạn bằng `Intl.Segmenter` — API chuẩn V8, chạy
 * được cả trong renderer lẫn main process (không phụ thuộc DOM), có sẵn nhận
 * biết ngôn ngữ đúng cho tiếng Việt/Trung/Nhật thay vì regex tự chế theo dấu
 * câu kiểu Latin.
 *
 * Kế thừa tư tưởng từ extension (content/hover-translate.js `detectSegment()`)
 * — cùng chiến lược Intl.Segmenter + fallback regex, nhưng phần DOM
 * (`caretRangeFromPoint`, `TreeWalker`) không mang sang được vì desktop không
 * có DOM cho nội dung lấy từ Accessibility. Xem GIỚI HẠN bên dưới.
 */

export type Granularity = 'word' | 'sentence' | 'paragraph';

export type Segment = { text: string; start: number; end: number };

/** Cắt toàn bộ văn bản thành danh sách đoạn theo độ chi tiết yêu cầu. */
export function segmentText(text: string, granularity: Granularity, locale?: string): Segment[] {
  if (granularity === 'paragraph') {
    // "Đoạn" không cần Intl.Segmenter — tách theo dòng trống, khớp cách hiểu
    // thông thường của một khối văn bản.
    return splitParagraphs(text);
  }

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(locale, { granularity });
      const out: Segment[] = [];
      for (const s of segmenter.segment(text)) {
        if (granularity === 'word' && !(s as Intl.SegmentData & { isWordLike?: boolean }).isWordLike) continue;
        out.push({ text: s.segment, start: s.index, end: s.index + s.segment.length });
      }
      return out;
    } catch {
      // Một số locale hiếm gặp có thể ném lỗi — rơi xuống regex bên dưới.
    }
  }

  return segmentWithRegex(text, granularity);
}

function splitParagraphs(text: string): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const part of text.split(/\n{2,}/)) {
    const start = text.indexOf(part, cursor);
    if (start === -1) continue;
    if (part.trim()) out.push({ text: part.trim(), start, end: start + part.length });
    cursor = start + part.length;
  }
  return out.length ? out : [{ text: text.trim(), start: 0, end: text.length }];
}

function segmentWithRegex(text: string, granularity: 'word' | 'sentence'): Segment[] {
  const re = granularity === 'word' ? /[\p{L}\p{N}_'-]+/gu : /[^.!?…]+[.!?…]*\s*/g;
  const out: Segment[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * Cắt lấy MỘT đoạn tại vị trí ước lượng dưới con trỏ, khi không biết offset ký
 * tự chính xác.
 *
 * GIỚI HẠN — v1, chưa cursor-accurate tuyệt đối
 * ------------------------------------------------
 * Extension biết chính xác ký tự nào dưới con trỏ nhờ `caretRangeFromPoint()`
 * của DOM. Accessibility trên desktop KHÔNG cho offset ký tự qua API cơ bản đã
 * dùng (`kAXValueAttribute`) — muốn tuyệt đối chính xác phải gọi thêm
 * `kAXBoundsForRangeParameterizedAttribute` để dò ngược từ toạ độ ra offset,
 * việc này chưa làm (native/accessibility-macos/main.swift chưa hỗ trợ).
 *
 * Bù lại bằng dữ liệu ĐÃ SẴN CÓ mà không cần thêm lệnh gọi native nào: khung
 * bao của khối văn bản (`bounds`) và toạ độ con trỏ đều đã có ở tầng gọi —
 * xem `estimateTextOffsetFraction()` (geometry.ts, có xét cả trường hợp khối
 * text trải nhiều dòng). `offsetFraction` (0..1) là vị trí ước lượng của con
 * trỏ trong văn bản; hàm này chọn đúng đoạn CHỨA vị trí đó, thay vì luôn trả
 * đoạn đầu tiên bất kể hover ở đâu — nếu chỉ dịch một từ (hoặc một câu trong
 * một đoạn văn nhiều câu) mà kết quả không đổi dù hover chỗ nào thì tính năng
 * vô nghĩa, đây là lý do hàm này thay thế cách làm "luôn lấy đầu tiên" trước
 * đó.
 *
 * Vẫn chưa tuyệt đối chính xác khi khối text trải nhiều dòng (xem giới hạn ở
 * `estimateTextOffsetFraction`) — nhưng LỆCH THEO vị trí hover thay vì hằng số
 * cố định, đúng tự nhiên với văn bản một dòng (đa số leaf element AX thực tế).
 */
export function pickSegmentAtOffset(
  text: string,
  offsetFraction: number,
  granularity: Granularity,
  locale?: string,
): string | null {
  if (!text.trim()) return null;
  const clamped = Math.min(1, Math.max(0, offsetFraction));
  return pickSegmentAtIndex(text, Math.round(clamped * text.length), granularity, locale);
}

/**
 * Chọn đoạn chứa MỘT CHỈ SỐ KÝ TỰ đã biết chắc — đường đi khi tầng native trả
 * về `charOffset` đã kiểm chứng khứ hồi (xem `AccessibilityText.charOffset`).
 * Không ước lượng gì cả.
 *
 * Cắt trên text THÔ, không chuẩn hoá trước: `normalizeWhitespace()` gộp khoảng
 * trắng nên LÀM DỊCH CHUYỂN mọi chỉ số ký tự — dùng nó trước khi tra cứu theo
 * offset sẽ tra nhầm chỗ một cách âm thầm, càng lệch nhiều khi text càng nhiều
 * khoảng trắng liên tiếp. Chỉ chuẩn hoá KẾT QUẢ trả về.
 */
export function pickSegmentAtIndex(
  text: string,
  index: number,
  granularity: Granularity,
  locale?: string,
): string | null {
  if (!text.trim()) return null;

  const segments = segmentText(text, granularity, locale);
  if (!segments.length) return null;

  const target = Math.min(Math.max(index, 0), Math.max(0, text.length - 1));
  const hit = segments.find((s) => target >= s.start && target < s.end);
  if (hit) return normalizeWhitespace(hit.text) || null;

  // Rơi vào khe giữa hai đoạn — với granularity 'word' thì đó là khoảng trắng
  // hoặc dấu câu, vốn không thuộc đoạn nào (Intl.Segmenter lọc bỏ phần không
  // phải từ). Lấy đoạn GẦN NHẤT, không phải đoạn cuối: lấy đoạn cuối cho ra
  // "từ cuối câu" khi người dùng hover vào khoảng trắng ở đầu câu — sai lệch
  // hoàn toàn, và xảy ra ở khoảng 1/6 số vị trí hover trên một câu tiếng Anh.
  let best = segments[0]!;
  let bestDistance = Infinity;
  for (const s of segments) {
    const distance = target < s.start ? s.start - target : target - s.end;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = s;
    }
  }
  return normalizeWhitespace(best.text) || null;
}

/** Gộp khoảng trắng liên tiếp, bỏ khoảng trắng đầu/cuối — không đổi nội dung chữ. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
