/**
 * Trích text layer sẵn có trong PDF — dùng pdfjs-dist thay vì binary/addon
 * native (tránh đúng rủi ro ABI/node-gyp mà dự án đã né với better-sqlite3,
 * xem ADR-0005 và ghi chú trong accessibility/darwin.ts).
 *
 * CHỈ trích text đã có sẵn — KHÔNG render trang thành ảnh rồi OCR. Render PDF
 * ra pixel cần một bộ rasterizer 2D (canvas), và lựa chọn phổ biến nhất cho
 * Node (gói `canvas`) lại chính là loại native addon dự án đang tránh — nên
 * PDF dạng scan (không có text layer) hiện KHÔNG được hỗ trợ, xem
 * `extractPdfText` trả `text: ''` cho trường hợp đó thay vì cố OCR.
 *
 * ⚠️ Chốt phiên bản `pdfjs-dist@^6.2.108` KHÔNG PHẢI ngẫu nhiên — bản `5.x`
 * mặc định dính CVE thực thi JS tuỳ ý khi mở PDF độc hại (GHSA-hq66-cqwq-w95j,
 * https://github.com/advisories/GHSA-hq66-cqwq-w95j), đúng vào bề mặt tấn công
 * của chính tính năng này (người dùng thả PDF từ nguồn bất kỳ). Đã xác nhận
 * `npm audit` sạch với bản đang dùng — xem commit thêm dependency này.
 */

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { app } from 'electron';
import { LIMITS } from '@config/limits.config';
import { logger } from '../../logging/logger';

export type PdfTextResult = {
  /** Rỗng nghĩa là không có text layer nào trích được — nhiều khả năng là bản
   *  scan (ảnh) chứ không phải PDF text thật. */
  text: string;
  pageCount: number;
  /** true nếu đã cắt bớt theo LIMITS.pdf (quá nhiều trang hoặc quá dài). */
  truncated: boolean;
};

function pdfjsAssetPath(sub: string): string {
  // Giống cách accessibility-helper/ocr-helper tìm file qua app.getAppPath()
  // thay vì __dirname (xem darwin.ts) — electron-vite có thể tách code thành
  // nhiều chunk, làm __dirname của MODULE NÀY không ổn định.
  //
  // KHÁC accessibility-helper/ocr-helper ở chỗ KHÔNG dùng process.resourcesPath
  // khi đã đóng gói: hai binary Swift đó nằm NGOÀI asar (khai qua extraResources,
  // cần THỰC THI được — asar không cho thực thi file bên trong). pdfjs-dist
  // chỉ là data file JS đọc qua fs bình thường, được electron-builder tự đóng
  // vào app.asar cùng mọi node_modules khác (đã xác minh bằng cách đóng gói
  // thật rồi `npx asar list app.asar | grep pdfjs-dist` — thấy đúng file, kể cả
  // standard_fonts/cmaps). app.getAppPath() trỏ vào GỐC asar đó khi đã đóng gói
  // (mirror đúng cấu trúc thư mục dự án gốc), và trỏ vào gốc dự án lúc dev —
  // cùng MỘT biểu thức đường dẫn đúng cho cả hai trường hợp, không cần rẽ nhánh
  // app.isPackaged như hai helper kia.
  return join(app.getAppPath(), 'node_modules/pdfjs-dist', sub);
}

export async function extractPdfText(filePath: string): Promise<PdfTextResult> {
  const data = await readFile(filePath);

  // getDocument() trả về LOADING TASK, không phải document — .destroy() (dọn
  // worker + tài nguyên) sống trên chính loading task đó, KHÔNG có trên
  // PDFDocumentProxy mà `.promise` resolve ra (xác nhận qua type definition
  // của pdfjs-dist@6, không đoán).
  const loadingTask = getDocument({
    data: new Uint8Array(data),
    useWorkerFetch: false,
    disableFontFace: true,
    standardFontDataUrl: pdfjsAssetPath('standard_fonts') + '/',
    cMapUrl: pdfjsAssetPath('cmaps') + '/',
    cMapPacked: true,
  });
  const doc = await loadingTask.promise;

  const pageCount = doc.numPages;
  const pagesToRead = Math.min(pageCount, LIMITS.pdf.maxPages);
  let truncated = pagesToRead < pageCount;

  const parts: string[] = [];
  let totalChars = 0;

  for (let i = 1; i <= pagesToRead; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => ('str' in it ? it.str : '')).join(' ').trim();

    if (totalChars + pageText.length > LIMITS.pdf.maxChars) {
      parts.push(pageText.slice(0, Math.max(0, LIMITS.pdf.maxChars - totalChars)));
      truncated = true;
      break;
    }

    parts.push(pageText);
    totalChars += pageText.length;
  }

  await loadingTask.destroy();

  const text = parts.filter(Boolean).join('\n\n');
  logger.debug('Trích text PDF', { filePath, pageCount, pagesToRead, textLength: text.length, truncated });

  return { text, pageCount, truncated };
}
