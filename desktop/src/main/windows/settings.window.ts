import type { BrowserWindow } from 'electron';
import { createWindow } from './window-factory';

let current: BrowserWindow | null = null;

export async function openSettingsWindow(): Promise<BrowserWindow> {
  if (current && !current.isDestroyed()) {
    current.focus();
    return current;
  }

  current = createWindow('settings', {
    width: 900,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    title: 'Homework Helper',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  current.on('closed', () => {
    current = null;
  });

  return current;
}
