import { Storage, DEFAULT_SYSTEM_PROMPT, DEFAULT_NANO_SYSTEM_PROMPT } from '../../shared/storage.js';
import { getOptionsI18n } from '../../shared/i18n.js';

export class PromptTab {
  constructor(optionsController) {
    this.controller = optionsController;
  }

  async init() {
    await this.loadPrompts();
  }

  async loadPrompts() {
    const { systemPrompt, nanoSystemPrompt, uiLanguage = 'en' } = await Storage.get(['systemPrompt', 'nanoSystemPrompt', 'uiLanguage']);
    const dict = getOptionsI18n(uiLanguage);

    // 1. Cloud AI System Prompt
    const cloudTextarea = document.getElementById('optSystemPromptTextarea');
    if (cloudTextarea) {
      cloudTextarea.value = systemPrompt || DEFAULT_SYSTEM_PROMPT;
    }

    const btnSaveCloud = document.getElementById('optBtnSavePrompt');
    if (btnSaveCloud && cloudTextarea) {
      btnSaveCloud.onclick = async () => {
        await Storage.set({ systemPrompt: cloudTextarea.value });
        this.controller.showToast(dict.toastPromptSaved || 'Cloud System Prompt saved successfully!');
      };
    }

    const btnResetCloud = document.getElementById('optBtnResetPrompt');
    if (btnResetCloud && cloudTextarea) {
      btnResetCloud.onclick = async () => {
        cloudTextarea.value = DEFAULT_SYSTEM_PROMPT;
        await Storage.set({ systemPrompt: DEFAULT_SYSTEM_PROMPT });
        this.controller.showToast('Đã khôi phục Cloud Prompt mặc định');
      };
    }

    // 2. Chrome Gemini Nano Local AI Prompt
    const nanoTextarea = document.getElementById('optNanoPromptTextarea');
    if (nanoTextarea) {
      nanoTextarea.value = nanoSystemPrompt || DEFAULT_NANO_SYSTEM_PROMPT;
    }

    const btnSaveNano = document.getElementById('optBtnSaveNanoPrompt');
    if (btnSaveNano && nanoTextarea) {
      btnSaveNano.onclick = async () => {
        await Storage.set({ nanoSystemPrompt: nanoTextarea.value });
        this.controller.showToast(dict.toastPromptSaved || 'Gemini Nano Prompt saved successfully!');
      };
    }

    const btnResetNano = document.getElementById('optBtnResetNanoPrompt');
    if (btnResetNano && nanoTextarea) {
      btnResetNano.onclick = async () => {
        nanoTextarea.value = DEFAULT_NANO_SYSTEM_PROMPT;
        await Storage.set({ nanoSystemPrompt: DEFAULT_NANO_SYSTEM_PROMPT });
        this.controller.showToast('Đã khôi phục Nano Prompt mặc định');
      };
    }
  }
}
