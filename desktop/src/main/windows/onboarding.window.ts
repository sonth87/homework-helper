import type { BrowserWindow } from 'electron';
import { createWindow } from './window-factory';

let current: BrowserWindow | null = null;

/** Cửa sổ xin quyền hệ thống — tự mở khi thiếu quyền (init-windows.ts), hoặc
 *  mở lại thủ công từ Cài đặt qua kênh `windows:openOnboarding`. */
export async function openOnboardingWindow(): Promise<BrowserWindow> {
  if (current && !current.isDestroyed()) {
    current.focus();
    return current;
  }

  current = createWindow('onboarding', {
    width: 560,
    height: 620,
    resizable: false,
    title: 'Homework Helper',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  current.on('closed', () => {
    current = null;
  });

  return current;
}
