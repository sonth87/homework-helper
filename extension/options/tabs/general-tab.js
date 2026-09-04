import { Storage, SUPPORTED_LANGUAGES } from '../../shared/storage.js';
import { getOptionsI18n } from '../../shared/i18n.js';

export class GeneralTab {
  constructor(optionsController) {
    this.controller = optionsController;
  }

  async init() {
    await this.loadGeneralSettings();
  }

  async loadGeneralSettings() {
    const { enableFormsAdapter = true, enableTextTooltip = true, enableHoverTranslate = false, uiLanguage = 'en', outputLanguage = 'en', disabledSites = [] } = await Storage.get();

    const uiLangSelect = document.getElementById('optUiLanguageSelect');
    if (uiLangSelect) {
      const uiLangs = SUPPORTED_LANGUAGES.filter((l) => l.id !== 'auto');
      uiLangSelect.innerHTML = uiLangs.map(
        (l) => `<option value="${l.id}" ${l.id === uiLanguage ? 'selected' : ''}>${l.name}</option>`
      ).join('');
      uiLangSelect.onchange = async () => {
        const newLang = uiLangSelect.value;
        await Storage.set({ uiLanguage: newLang });
        await this.controller.applyLanguageI18n(newLang);
        const dict = getOptionsI18n(newLang);
        this.controller.showToast(dict.toastLangUpdated || 'Language updated!');
      };
    }

    const langSelect = document.getElementById('optOutputLanguageSelect');
    if (langSelect) {
      langSelect.innerHTML = SUPPORTED_LANGUAGES.map(
        (l) => `<option value="${l.id}" ${l.id === outputLanguage ? 'selected' : ''}>${l.name}</option>`
      ).join('');
      langSelect.onchange = async () => {
        await Storage.set({ outputLanguage: langSelect.value });
        const dict = getOptionsI18n(uiLangSelect?.value || 'en');
        this.controller.showToast(dict.toastLangUpdated || 'Language updated!');
      };
    }

    const checkForms = document.getElementById('optCheckForms');
    const checkTooltip = document.getElementById('optCheckTooltip');

    if (checkForms) {
      checkForms.checked = enableFormsAdapter;
      checkForms.onchange = () => Storage.set({ enableFormsAdapter: checkForms.checked });
    }

    if (checkTooltip) {
      checkTooltip.checked = enableTextTooltip;
      checkTooltip.onchange = () => {
        Storage.set({ enableTextTooltip: checkTooltip.checked });
        // Dispatches a real 'change' (not just setting .checked) so the
        // Appearance tab's own listener on this same checkbox also runs —
        // it's what dims/undims the toolbar's other settings, which a plain
        // property assignment would silently skip.
        const inlineCheck = document.getElementById('optCheckToolbarEnableInline');
        if (inlineCheck) {
          inlineCheck.checked = checkTooltip.checked;
          inlineCheck.dispatchEvent(new Event('change'));
        }
      };
    }

    const checkHoverTranslate = document.getElementById('optCheckHoverTranslate');
    if (checkHoverTranslate) {
      checkHoverTranslate.checked = enableHoverTranslate;
      checkHoverTranslate.onchange = () => {
        Storage.set({ enableHoverTranslate: checkHoverTranslate.checked });
        // Same reasoning as checkTooltip above — a real 'change' event lets
        // the Appearance tab's own listener dim/undim its Hover Translate
        // settings instead of leaving them stuck in the old state.
        const inlineCheck = document.getElementById('optCheckHoverTranslateInline');
        if (inlineCheck) {
          inlineCheck.checked = checkHoverTranslate.checked;
          inlineCheck.dispatchEvent(new Event('change'));
        }
      };
    }

    // Disabled sites
    const disabledContainer = document.getElementById('optDisabledSitesList');
    if (disabledContainer) {
      disabledContainer.innerHTML = '';

      if (disabledSites.length === 0) {
        const dict = getOptionsI18n(uiLanguage);
        disabledContainer.innerHTML = `<div style="font-size:12px; color:#94a3b8;">${dict.noDisabledSites || 'No disabled websites yet.'}</div>`;
      } else {
        disabledSites.forEach((site) => {
          const item = document.createElement('div');
          item.className = 'opt-disabled-site-item';
          item.innerHTML = `
            <span>${site}</span>
            <button class="opt-btn-secondary" style="color:#ef4444; padding:3px 8px; font-size:12px;">Remove</button>
          `;
          item.querySelector('button').addEventListener('click', async () => {
            const updated = disabledSites.filter((s) => s !== site);
            await Storage.set({ disabledSites: updated });
            item.remove();
          });
          disabledContainer.appendChild(item);
        });
      }
    }

    // Export / Clear
    const btnExport = document.getElementById('optBtnExport');
    if (btnExport) {
      btnExport.onclick = async () => {
        const data = await Storage.get();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `homework-ai-config-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      };
    }

    const btnClearData = document.getElementById('optBtnClearData');
    if (btnClearData) {
      btnClearData.onclick = async () => {
        const { uiLanguage: curLang = 'en' } = await Storage.get(['uiLanguage']);
        const dict = getOptionsI18n(curLang);
        if (confirm(curLang === 'vi' ? 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử Chat không?' : 'Are you sure you want to clear all chat history?')) {
          await Storage.clearChatHistory();
          this.controller.showToast(dict.toastDataCleared || 'All chat history cleared!');
        }
      };
    }
  }
}
