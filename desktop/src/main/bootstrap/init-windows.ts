import { openSettingsWindow } from '../windows/settings.window';

export async function initWindows(): Promise<void> {
  await openSettingsWindow();
}
