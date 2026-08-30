import { ipcMain } from 'electron';
import { quickTranslate } from '../translate/translate.service';
import type { QuickTranslateParams } from '@shared/ipc/channels';
import type { SettingsService } from '../settings/settings.service';

export function registerTranslateIpc(settings: SettingsService): void {
  ipcMain.handle('translate:quick', (_e, params: QuickTranslateParams) =>
    quickTranslate(params.text, params.targetLanguage, settings.get()),
  );
}
