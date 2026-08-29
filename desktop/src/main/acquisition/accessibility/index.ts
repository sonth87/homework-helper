/**
 * Interface chung cho Accessibility — tách theo nền tảng, giống mô hình
 * `AccessibilityProvider` trong roadmap/desktop-app.md §60.
 *
 * macOS đã kiểm chứng thực nghiệm (ADR-0006). Windows (UI Automation) chưa xây
 * — đúng thứ tự roadmap (macOS trước, Windows ở Phase 4).
 */

import { platform } from 'node:process';
import type { AccessibilityText } from '@shared/types/content';
import type { Point } from '@shared/types/geometry';

export type AccessibilityProvider = {
  isTrusted(): Promise<boolean>;
  getTextAtPoint(point: Point<'screen-logical'>): Promise<AccessibilityText | null>;
};

let cached: AccessibilityProvider | null = null;

export async function getAccessibilityProvider(): Promise<AccessibilityProvider | null> {
  if (cached) return cached;

  if (platform === 'darwin') {
    const { macAccessibility } = await import('./darwin');
    cached = macAccessibility;
    return cached;
  }

  // Windows (UI Automation) chưa xây — Phase 4. Trả null để acquire.ts tự
  // chuyển sang chiến lược tiếp theo trong danh sách ưu tiên của intent.
  return null;
}
