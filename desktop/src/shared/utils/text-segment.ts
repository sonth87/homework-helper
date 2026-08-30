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
 * Cắt lấy MỘT đoạn đại diện khi không biết offset ký tự chính xác dưới con trỏ.
 *
 * GIỚI HẠN QUAN TRỌNG — v1, chưa cursor-accurate
 * ------------------------------------------------
 * Extension biết chính xác ký tự nào dưới con trỏ nhờ `caretRangeFromPoint()`
 * của DOM. Accessibility trên desktop KHÔNG cho offset ký tự qua API cơ bản đã
 * dùng (`kAXValueAttribute`) — muốn chính xác phải gọi thêm
 * `kAXBoundsForRangeParameterizedAttribute` để dò ngược từ toạ độ ra offset,
 * việc này chưa làm (native/accessibility-macos/main.swift chưa hỗ trợ).
 *
 * Trong lúc chờ: nếu chỉ có MỘT đoạn (trường hợp phổ biến nhất trên thực tế —
 * đa số leaf element của AX là nhãn/dòng ngắn, không phải cả khối văn bản dài,
 * xem ghi chú kiểm chứng thực nghiệm ở ADR-0006) thì kết quả đã chính xác tự
 * nhiên. Chỉ khi văn bản dài nhiều câu/từ mới cần đoán — khi đó lấy đoạn ĐẦU
 * TIÊN, đơn giản và có thể giải thích được, hơn là suy diễn vị trí X trong
 * frame (hỏng hoàn toàn với văn bản xuống dòng nhiều lần).
 */
export function pickFirstSegment(text: string, granularity: Granularity, locale?: string): string | null {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return null;

  const segments = segmentText(normalized, granularity, locale);
  return segments[0]?.text.trim() || null;
}

/** Gộp khoảng trắng liên tiếp, bỏ khoảng trắng đầu/cuối — không đổi nội dung chữ. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
