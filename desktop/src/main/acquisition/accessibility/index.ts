/**
 * Interface chung cho Accessibility — tách theo nền tảng, giống mô hình
 * `AccessibilityProvider` trong roadmap/desktop-app.md §60.
 *
 * macOS đã kiểm chứng thực nghiệm (ADR-0006). Windows (UI Automation qua
 * PowerShell, xem windows.ts) đã viết ở Phase 4 nhưng CHƯA đo thực nghiệm trên
 * máy Windows thật — xem cảnh báo trong native/accessibility-windows/helper.ps1.
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

  if (platform === 'win32') {
    const { windowsAccessibility } = await import('./windows');
    cached = windowsAccessibility;
    return cached;
  }

  return null;
}
