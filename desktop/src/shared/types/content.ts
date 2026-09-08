/**
 * Nội dung thu nhận được từ màn hình.
 *
 * `AcquiredContent` thay cho `Point` của đặc tả gốc: giải bài tập cần một VÙNG
 * hoặc một ẢNH, không phải một điểm chuột. Xem roadmap/desktop-app-implementation-plan.md
 * mục 4.
 */

import type { Rect } from './geometry';
import type { AcquisitionStrategy } from './intent';

export type ApplicationInfo = {
  name: string;
  processName?: string;
  bundleId?: string;
  windowTitle?: string;
};

export type TextWord = {
  text: string;
  /** Offset UTF-16 trong `TextBlock.text` chứa nó — khớp cách JS đếm `string.length`. */
  startOffset: number;
  endOffset: number;
  bounds: Rect<'image'>;
};

export type TextBlock = {
  text: string;
  bounds: Rect<'image'>;
  confidence: number;
  /**
   * Khung riêng từng từ trong khối — chính xác tuyệt đối (lấy thẳng từ hộp
   * bao Vision đã nhận diện), không phải nội suy. Cho phép hit-test đúng từ
   * theo trục X thay vì giả định bề rộng ký tự đều nhau (`offsetWithinBlock`
   * ở ocr/blocks.ts vẫn giữ làm phương án chót khi mảng này rỗng). Xem ADR-0008.
   */
  words: TextWord[];
};

export type OcrResult = {
  text: string;
  blocks: TextBlock[];
  language?: string;
  durationMs: number;
  engine: 'vision-darwin' | 'windows-ocr' | 'tesseract';
};

export type AccessibilityText = {
  text: string;
  /**
   * screen-logical, KHÔNG PHẢI screen-physical — đã kiểm chứng thực nghiệm:
   * AXUIElement/Quartz trả toạ độ theo "points" (đơn vị logic của macOS),
   * cùng đơn vị với screen.getCursorScreenPoint() của Electron, không phải
   * pixel vật lý sau khi nhân scaleFactor. Khai báo ban đầu ở Phase 0 (trước
   * khi có bằng chứng thực nghiệm) từng ghi nhầm là screen-physical.
   */
  bounds: Rect<'screen-logical'>;
  /**
   * Chỉ số ký tự CHÍNH XÁC dưới con trỏ, trong `text`.
   *
   * Có mặt CHỈ KHI đã qua kiểm chứng khứ hồi ở tầng native (offset →
   * AXBoundsForRange → khung ký tự đó có bao con trỏ không). Đo thực nghiệm
   * cho thấy AX trả offset sai một cách âm thầm khá thường xuyên — Finder trả
   * 0 khi hover cuối dòng, Notes trả cùng một offset cho mọi vị trí X — nên
   * giá trị chưa kiểm chứng còn tệ hơn không có giá trị. Xem ADR-0008.
   *
   * VẮNG MẶT nghĩa là "không xác định được", KHÔNG phải "bằng 0".
   */
  charOffset?: number;
  /**
   * Tầng nào giải ra `charOffset` — `position` (AXRangeForPosition + kiểm khứ
   * hồi) hay `lines` (phân rã theo dòng + nhị phân). Chỉ để ĐO xem tầng nào
   * thực sự gánh việc khi dùng thật; không tầng nào kém chính xác hơn tầng nào,
   * cả hai đều chứng minh kết quả bằng hình học thật.
   */
  offsetSource?: 'position' | 'lines';
  /**
   * Đoạn ký tự đang HIỂN THỊ, với view có cuộn. Cần thiết vì `bounds` là khung
   * nhìn còn `text` là cả tài liệu — đã đo được phần tử của Terminal có khung
   * cao 5057px trong khi màn hình chỉ ~1400px.
   */
  visibleRange?: { start: number; length: number };
  role?: string;
};

export type AcquiredContent = {
  /** Text lấy từ Accessibility hoặc OCR. */
  text?: string;
  /** Ảnh — công dân hạng nhất, không phải phương án phụ. Đồ thị, hình học, công
   *  thức hoá học sẽ MẤT thông tin nếu ép qua OCR thành text. */
  imageBase64?: string;
  /**
   * screen-logical, chuẩn hoá cho MỌI nguồn — kể cả khi nguồn gốc (capture) tự
   * nhiên ra pixel vật lý. Lý do: người tiêu thụ thật sự (định vị cửa sổ
   * HoverOverlay) cần đơn vị logic, và tại thời điểm quyết định (chưa có nơi
   * nào đọc bounds) chưa có lý do giữ pixel vật lý xuyên suốt.
   */
  bounds: Rect<'screen-logical'>;
  source: AcquisitionStrategy;
  /** Xem `AccessibilityText.charOffset` — vắng mặt = chưa xác định được. */
  charOffset?: number;
  /** Tầng nào giải ra `charOffset`. `blocks` = hit-test khối OCR. Chỉ để đo. */
  offsetSource?: 'position' | 'lines' | 'blocks';
  confidence?: number;
  app?: ApplicationInfo;
};
