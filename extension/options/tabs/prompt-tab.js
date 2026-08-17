import { Storage, DEFAULT_SETTINGS } from '../../shared/storage.js';
import { getOptionsI18n } from '../../shared/i18n.js';

export class PromptTab {
  constructor(optionsController) {
    this.controller = optionsController;
  }

  async init() {
    await this.loadSystemPrompt();
  }

  async loadSystemPrompt() {
    const { systemPrompt, uiLanguage = 'en' } = await Storage.get(['systemPrompt', 'uiLanguage']);
    const textarea = document.getElementById('optSystemPromptTextarea');
    if (!textarea) return;

    textarea.value = systemPrompt || DEFAULT_SETTINGS.systemPrompt;

    const btnSave = document.getElementById('optBtnSavePrompt');
    if (btnSave) {
      btnSave.onclick = async () => {
        await Storage.set({ systemPrompt: textarea.value });
        const dict = getOptionsI18n(uiLanguage);
        this.controller.showToast(dict.toastPromptSaved || 'System prompt saved successfully!');
      };
    }

    const btnReset = document.getElementById('optBtnResetPrompt');
    if (btnReset) {
      btnReset.onclick = async () => {
        textarea.value = DEFAULT_SETTINGS.systemPrompt;
        await Storage.set({ systemPrompt: DEFAULT_SETTINGS.systemPrompt });
      };
    }
  }
}
