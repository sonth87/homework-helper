/**
 * Interface chung cho OCR — tách theo nền tảng, cùng mô hình với
 * accessibility/index.ts. macOS đã kiểm chứng thực nghiệm (Vision framework).
 * Windows (Windows OCR) chưa xây — Phase 4.
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

  return null;
}
