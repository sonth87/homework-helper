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

export type TextBlock = {
  text: string;
  bounds: Rect<'image'>;
  confidence: number;
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
  confidence?: number;
  app?: ApplicationInfo;
};
