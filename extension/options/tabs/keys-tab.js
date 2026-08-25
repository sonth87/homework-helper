import { Icons } from '../../shared/icons.js';
import { Storage } from '../../shared/storage.js';
import { getOptionsI18n } from '../../shared/i18n.js';
import { isLocalProvider, createKeyCard, createLocalKeyCard, wireLocalModelPanel } from '../../shared/api-config-ui.js';

export class KeysTab {
  constructor(optionsController) {
    this.controller = optionsController;
    this.localModelType = 'lmstudio';
    this.localDiscoveredModels = [];
  }

  async init() {
    await this.loadRoutingStrategy();
    await this.loadThinkingToggle();
    await this.loadProvidersAndKeys();
    await this.checkChromeBuiltinAI();
    await this.initLocalModelPanel();
    this.initLocalGuideToggle();
  }

  async loadRoutingStrategy() {
    const strategy = await Storage.getRoutingStrategy();
    const radios = document.querySelectorAll('input[name="optRoutingStrategy"]');
    radios.forEach((r) => {
      r.checked = r.value === strategy;
      r.addEventListener('change', async () => {
        if (r.checked) {
          await Storage.setRoutingStrategy(r.value);
        }
      });
    });
  }

  // Single global switch — not per API config. Models with no known
  // reasoning/thinking control, custom-typed models, and local providers are
  // unaffected either way (see shared/thinking-control.js).
  async loadThinkingToggle() {
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const d = getOptionsI18n(uiLanguage);
    const checkbox = document.getElementById('optThinkingEnabled');
    const label = document.getElementById('optThinkingEnabledLabel');
    if (!checkbox) return;

    const enabled = await Storage.getThinkingEnabled();
    checkbox.checked = enabled;
    if (label) label.textContent = enabled ? (d.thinkingOn || 'Bật') : (d.thinkingOff || 'Tắt');

    checkbox.addEventListener('change', async () => {
      await Storage.setThinkingEnabled(checkbox.checked);
      if (label) label.textContent = checkbox.checked ? (d.thinkingOn || 'Bật') : (d.thinkingOff || 'Tắt');
    });
  }

  async loadProvidersAndKeys() {
    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const dict = getOptionsI18n(uiLanguage);
    const container = document.getElementById('optKeysContainer');
    if (!container) return;

    container.innerHTML = '';
    if (apiConfigs.length === 0) {
      container.innerHTML = `
        <div class="opt-card" style="text-align:center; padding:32px; color:#64748b;">
          ${dict.subheadingProviders || 'No API Keys added yet. Click "Add AI Provider / Key" to begin.'}
        </div>
      `;
    } else {
      apiConfigs.forEach((cfg) => {
        const card = isLocalProvider(cfg.provider)
          ? createLocalKeyCard(cfg, { dict, variant: 'options' })
          : createKeyCard(cfg, { isNew: false, dict, variant: 'options' });
        container.appendChild(card);
      });
    }

    const addBtn = document.getElementById('optBtnAddKey');
    if (addBtn) {
      addBtn.onclick = () => {
        const newConfig = {
          id: `cfg_${Date.now()}`,
          provider: 'gemini',
          name: 'Google Gemini',
          model: 'gemini-3.7-flash',
          apiKey: '',
          baseUrl: '',
          isEnabled: true,
        };
        if (apiConfigs.length === 0) container.innerHTML = '';
        container.appendChild(createKeyCard(newConfig, { isNew: true, dict, variant: 'options' }));
      };
    }
  }

  async checkChromeBuiltinAI() {
    const badge = document.getElementById('builtinNanoBadge');
    const testBtn = document.getElementById('btnTestBuiltinAI');
    if (!badge) return;

    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const d = getOptionsI18n(uiLanguage);

    const getAiModel = () => {
      if (typeof chrome !== 'undefined' && chrome.aiOriginTrial?.languageModel) {
        return chrome.aiOriginTrial.languageModel;
      }
      if (typeof ai !== 'undefined' && ai?.languageModel) {
        return ai.languageModel;
      }
      const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
      return g.ai?.languageModel || g.ai?.assistant || g.LanguageModel || null;
    };

    const checkViaActiveTab = async () => {
      try {
        const tabs = await chrome.tabs.query({ url: ['https://*/*', 'http://*/*'] });
        if (!tabs || tabs.length === 0) return null;
        const targetTab = tabs.find((t) => t.active) || tabs[0];
        if (!targetTab?.id) return null;

        const results = await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          world: 'MAIN',
          func: async () => {
            const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
            const aiModel = g.ai?.languageModel || g.ai?.assistant || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null);
            if (!aiModel) return { available: false };
            try {
              const caps = typeof aiModel.capabilities === 'function' ? await aiModel.capabilities() : {};
              return { available: true, caps };
            } catch (e) {
              return { available: true, error: e.message };
            }
          },
        });
        return results?.[0]?.result;
      } catch (e) {
        return null;
      }
    };

    const updateStatus = async () => {
      try {
        let aiModel = getAiModel();
        let isTabAi = false;
        let tabCaps = null;

        if (!aiModel) {
          const tabRes = await checkViaActiveTab();
          if (tabRes?.available) {
            isTabAi = true;
            tabCaps = tabRes.caps || {};
          }
        }

        if (!aiModel && !isTabAi) {
          badge.textContent = d.statusReady || 'Ready On-Device';
          badge.style.background = '#dcfce7';
          badge.style.color = '#16a34a';
          return;
        }

        const caps = isTabAi ? tabCaps : (typeof aiModel.capabilities === 'function' ? await aiModel.capabilities() : {});
        const avail = caps?.available || caps?.availability || 'readily';

        if (avail === 'readily') {
          badge.textContent = d.statusReady || 'Ready On-Device';
          badge.style.background = '#dcfce7';
          badge.style.color = '#16a34a';
        } else if (avail === 'after-download') {
          badge.textContent = 'Downloading model files...';
          badge.style.background = '#fef3c7';
          badge.style.color = '#d97706';
        } else {
          badge.textContent = d.statusReady || 'Ready On-Device';
          badge.style.background = '#dcfce7';
          badge.style.color = '#16a34a';
        }
      } catch (e) {
        badge.textContent = d.statusReady || 'Ready On-Device';
        badge.style.background = '#dcfce7';
        badge.style.color = '#16a34a';
      }
    };

    await updateStatus();

    document.getElementById('btnOpenFlagsFromOptions')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api-for-gemini-nano' });
    });

    document.getElementById('btnFlagPromptApi')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api-for-gemini-nano' });
    });

    document.getElementById('btnFlagOptimizationGuide')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#optimization-guide-on-device-model' });
    });

    document.getElementById('btnOpenComponents')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://components' });
    });

    testBtn?.addEventListener('click', async () => {
      testBtn.innerHTML = `${Icons.refresh(12)} ${d.testingConnection || 'Testing...'}`;
      try {
        let reply = '';
        const aiModel = getAiModel();

        if (aiModel && typeof aiModel.create === 'function') {
          const session = await aiModel.create({
            expectedOutputs: [{ type: 'text', languages: ['en'] }],
          });
          reply = await session.prompt('Say "Gemini Nano is working on your computer!" in 1 short sentence.');
        } else {
          const tabs = await chrome.tabs.query({ url: ['https://*/*', 'http://*/*'] });
          if (!tabs || tabs.length === 0) {
            throw new Error('Please open a normal web tab (https://) to test Gemini Nano.');
          }
          const targetTab = tabs.find((t) => t.active) || tabs[0];
          const results = await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            world: 'MAIN',
            func: async () => {
              const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
              const m = g.ai?.languageModel || g.ai?.assistant || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null);
              if (!m) throw new Error('ai.languageModel not found on web page.');
              const sess = await m.create({
                expectedOutputs: [{ type: 'text', languages: ['en'] }],
              });
              return await sess.prompt('Say "Gemini Nano is working on your device!" in 1 short sentence.');
            },
          });
          reply = results?.[0]?.result;
        }

        if (reply) {
          alert(`Test Success!\n\nResponse from Gemini Nano On-Device:\n"${reply}"`);
          badge.textContent = d.statusReady || 'Ready On-Device';
          badge.style.background = '#dcfce7';
          badge.style.color = '#16a34a';
        }
      } catch (err) {
        alert(`Gemini Nano Connection Note:\n${err.message}`);
        await updateStatus();
      } finally {
        testBtn.innerHTML = d.btnTestBuiltinAI || 'Test Built-in Model';
      }
    });
  }

  // =======================================================
  // Local AI Server (Ollama / LM Studio) Add-Model Panel
  // =======================================================
  async initLocalModelPanel() {
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const dict = getOptionsI18n(uiLanguage);

    wireLocalModelPanel(document, {
      dict,
      variant: 'options',
      state: this,
      onModelsAdded: async (newConfigs) => {
        if (newConfigs.length > 0) {
          this.controller.showToast?.((dict.localModelAdded || 'Added {count} model(s) to the list.').replace('{count}', newConfigs.length));
        }
        await this.loadProvidersAndKeys();
      },
    });
  }

  initLocalGuideToggle() {
    const toggle = document.getElementById('optLocalGuideToggle');
    const body = document.getElementById('optLocalGuideBody');
    const chevron = document.getElementById('optLocalGuideChevron');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      const isHidden = body.style.display === 'none';
      body.style.display = isHidden ? 'flex' : 'none';
      if (chevron) chevron.innerHTML = isHidden ? Icons.chevronDown(16) : Icons.chevronRight(16);
    });
  }
}
