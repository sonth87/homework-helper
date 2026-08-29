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
  bounds: Rect<'screen-physical'>;
  role?: string;
};

export type AcquiredContent = {
  /** Text lấy từ Accessibility hoặc OCR. */
  text?: string;
  /** Ảnh — công dân hạng nhất, không phải phương án phụ. Đồ thị, hình học, công
   *  thức hoá học sẽ MẤT thông tin nếu ép qua OCR thành text. */
  imageBase64?: string;
  bounds: Rect<'screen-physical'>;
  source: AcquisitionStrategy;
  confidence?: number;
  app?: ApplicationInfo;
};
