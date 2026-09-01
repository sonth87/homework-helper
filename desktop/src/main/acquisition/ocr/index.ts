/**
 * Interface chung cho OCR — tách theo nền tảng, cùng mô hình với
 * accessibility/index.ts. macOS đã kiểm chứng thực nghiệm (Vision framework).
 * Windows (Windows.Media.Ocr qua PowerShell, xem native-windows.ts) đã viết ở
 * Phase 4 nhưng CHƯA đo thực nghiệm — xem cảnh báo trong
 * native/ocr-windows/helper.ps1.
 */

import { platform } from 'node:process';
import type { OcrResult } from '@shared/types/content';

export type OcrProvider = {
  recognize(imageBase64: string): Promise<OcrResult>;
};

let cached: OcrProvider | null = null;

export async function getOcrProvider(): Promise<OcrProvider | null> {
  if (cached) return cached;

  if (platform === 'darwin') {
    const { macOcr } = await import('./native-darwin');
    cached = macOcr;
    return cached;
  }

  if (platform === 'win32') {
    const { windowsOcr } = await import('./native-windows');
    cached = windowsOcr;
    return cached;
  }

  return null;
}
