import { ipcMain } from 'electron';
import { getDiagnostics } from '../diagnostics/diagnostics.service';
import type { SettingsService } from '../settings/settings.service';

export function registerDiagnosticsIpc(settings: SettingsService): void {
  ipcMain.handle('diagnostics:get', () => getDiagnostics(settings.get()));
}
