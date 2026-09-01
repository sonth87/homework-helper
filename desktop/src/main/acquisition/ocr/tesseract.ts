/**
 * OCR fallback dùng Tesseract (WASM thuần qua tesseract.js — không native
 * addon, tránh đúng rủi ro ABI/node-gyp dự án đã né với better-sqlite3, xem
 * ADR-0005) khi OCR native (Vision/Windows OCR) không có sẵn hoặc tin cậy
 * thấp. Xem `recognizeWith()` trong acquire.ts để biết vòng thử: native
 * trước, Tesseract chỉ chạy khi native không đạt — Tesseract KHÔNG tăng tốc
 * phần cứng nên chậm hơn hẳn, không đáng chạy song song ở đường nóng.
 *
 * KHÔNG có khả năng đặc biệt cho công thức toán (roadmap ghi "Tesseract
 * fallback cho equ", nhưng đã điều tra và xác nhận KHÔNG khả thi). Model
 * 'equ' (ký hiệu toán) của Tesseract chỉ tồn tại ở bản LEGACY ENGINE — đã xác
 * minh bằng hash: file equ.traineddata ở cả ba kho chính thức (tessdata,
 * tessdata_fast, tessdata_best) GIỐNG HỆT NHAU (cùng SHA-256), tức dự án
 * Tesseract chưa từng huấn luyện bản LSTM riêng cho nó. Pipeline ở đây dùng
 * oem=1 (LSTM_ONLY, xem createWorker() dưới) — nạp equ vào sẽ báo lỗi "LSTM
 * requested, but not present!!", HỎNG HẲN OCR chứ không chỉ kém với công thức
 * toán. Đúng phát hiện đã có sẵn ở phía extension (shared/ocr-engine.js dòng
 * 312-324, viết bằng tiếng Anh) — không phải lặp lại một lỗi mới ở đây.
 *
 * Ngôn ngữ bundled: eng + vie, bản "fast" (tessdata_fast — tối ưu tốc độ hơn
 * độ chính xác tối đa của "best", hợp lý cho một đường FALLBACK), nén gzip
 * sẵn trong resources/tessdata/*.traineddata.gz (electron-builder đóng gói
 * cùng resources/**, xem electron-builder.yml). Tải từ tesseract-ocr/
 * tessdata_fast trên GitHub — KHÔNG lấy từ thư mục assets/ocr/ của extension:
 * hai app không chia sẻ tài nguyên (ADR-0001), đây là bản tải riêng cho
 * desktop dù cùng nguồn công khai.
 */

import Tesseract from 'tesseract.js';
import { join } from 'node:path';
import { app } from 'electron';
import type { OcrResult, TextBlock, TextWord } from '@shared/types/content';
import { rect } from '@shared/types/geometry';
import type { OcrProvider } from './index';

let workerPromise: Promise<Tesseract.Worker> | null = null;

function tessdataPath(): string {
  // Cùng lý do dùng app.getAppPath() thay vì __dirname như pdfjs-dist (xem
  // acquisition/pdf/extract-text.ts) — electron-vite có thể tách code thành
  // nhiều chunk. resources/ nằm trong `files` của electron-builder.yml, được
  // đóng vào app.asar giống mọi thứ khác — tesseract.js đọc qua fs bình
  // thường (không phải file cần THỰC THI), không cần extraResources.
  return join(app.getAppPath(), 'resources/tessdata');
}

function ensureWorker(): Promise<Tesseract.Worker> {
  workerPromise ??= Tesseract.createWorker('eng+vie', 1, {
    langPath: tessdataPath(),
    cacheMethod: 'none',
    gzip: true,
    logger: () => {}, // tesseract.js log tiến trình rất dày (từng % một) — không cần ở log app.
  });
  return workerPromise;
}

function bboxToImageRect(b: Tesseract.Bbox) {
  return rect('image', { x: b.x0, y: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0 });
}

/** Một `Tesseract.Line` → một `TextBlock` — cùng độ hạt với macOS Vision
 *  (mỗi observation ~ một dòng), khớp giả định của `layoutBlocks()` (mỗi
 *  block ứng với một dòng khi gộp theo hàng — xem sortReadingOrder()). */
function lineToTextBlock(line: Tesseract.Line): TextBlock {
  const words: TextWord[] = [];
  let searchFrom = 0;
  for (const w of line.words) {
    const found = line.text.indexOf(w.text, searchFrom);
    const start = found < 0 ? searchFrom : found;
    const end = start + w.text.length;
    searchFrom = end;
    words.push({ text: w.text, startOffset: start, endOffset: end, bounds: bboxToImageRect(w.bbox) });
  }

  return {
    text: line.text,
    // Tesseract: 0-100. Dự án dùng 0-1 (khớp Vision framework của macOS, xem
    // native-darwin.ts / VNRecognizedText.confidence) — LIMITS.ocr.minConfidence
    // so sánh trực tiếp với giá trị này, lệch thang đo sẽ làm ngưỡng vô nghĩa.
    confidence: line.confidence / 100,
    bounds: bboxToImageRect(line.bbox),
    words,
  };
}

class TesseractOcr implements OcrProvider {
  async recognize(imageBase64: string): Promise<OcrResult> {
    const worker = await ensureWorker();
    const start = performance.now();

    const { data } = await worker.recognize(Buffer.from(imageBase64, 'base64'), {}, { blocks: true });
    const durationMs = performance.now() - start;

    const blocks: TextBlock[] = [];
    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) blocks.push(lineToTextBlock(line));
      }
    }

    return { text: data.text, blocks, durationMs, engine: 'tesseract' };
  }
}

const instance = new TesseractOcr();
/** Instance đơn — worker Tesseract khởi tạo một lần (nạp WASM + trained data),
 *  dùng lại cho mọi lần OCR sau, giống cách macOcr/windowsOcr giữ subprocess. */
export function getTesseractProvider(): OcrProvider {
  return instance;
}
