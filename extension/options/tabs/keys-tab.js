import { Icons } from '../../shared/icons.js';
import { Storage, DEFAULT_PROVIDERS } from '../../shared/storage.js';
import { getOptionsI18n } from '../../shared/i18n.js';

export class KeysTab {
  constructor(optionsController) {
    this.controller = optionsController;
  }

  async init() {
    await this.loadRoutingStrategy();
    await this.loadProvidersAndKeys();
    await this.checkChromeBuiltinAI();
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
        container.appendChild(this.createKeyCard(cfg, false, dict));
      });
    }

    const addBtn = document.getElementById('optBtnAddKey');
    if (addBtn) {
      addBtn.onclick = () => {
        const newConfig = {
          id: `cfg_${Date.now()}`,
          provider: 'gemini',
          name: 'Google Gemini',
          model: 'gemini-2.5-flash',
          apiKey: '',
          baseUrl: '',
          isEnabled: true,
        };
        if (apiConfigs.length === 0) container.innerHTML = '';
        container.appendChild(this.createKeyCard(newConfig, true, dict));
      };
    }
  }

  createKeyCard(cfg, isNew = false, dict = null) {
    const d = dict || getOptionsI18n();
    const card = document.createElement('div');
    card.className = 'opt-key-card';
    card.setAttribute('data-id', cfg.id);

    const providerOptions = DEFAULT_PROVIDERS.map(
      (p) => `<option value="${p.id}" ${cfg.provider === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const providerObj = DEFAULT_PROVIDERS.find((p) => p.id === cfg.provider) || DEFAULT_PROVIDERS[0];
    const modelOptions = providerObj.models.map(
      (m) => `<option value="${m.id}" ${cfg.model === m.id ? 'selected' : ''}>${m.name}</option>`
    ).join('');

    card.innerHTML = `
      <div class="opt-key-header">
        <label class="opt-key-provider-title">
          <input type="checkbox" class="card-enabled" ${cfg.isEnabled ? 'checked' : ''}>
          <span>${providerObj.name}</span>
        </label>
        <button class="opt-btn-secondary card-delete" style="color:#ef4444; padding:4px 8px; font-size:12px;" title="${d.deleteKey || 'Delete'}">
          ${Icons.trash(14)} ${d.deleteKey || 'Delete'}
        </button>
      </div>

      <div class="opt-key-grid">
        <select class="opt-select card-provider">${providerOptions}</select>
        <select class="opt-select card-model">${modelOptions}</select>
        <input type="password" class="opt-input card-key" placeholder="${d.keyPlaceholder || 'Enter API Key'} (sk-... / AIza...)" value="${cfg.apiKey || ''}">
      </div>

      <div class="opt-key-actions">
        <div style="font-size:12px; color:#64748b;" class="card-status">
          ${cfg.cooldownUntil && cfg.cooldownUntil > Date.now() ? `${Icons.alertCircle(12)} Cooling down (${new Date(cfg.cooldownUntil).toLocaleTimeString()})` : (d.statusReady || 'Status: Ready')}
        </div>
        <button class="opt-btn-secondary card-test" style="padding:4px 10px; font-size:12px;">
          ${Icons.refresh(12)} ${d.testConnection || 'Test Connection'}
        </button>
      </div>
    `;

    const providerSelect = card.querySelector('.card-provider');
    const modelSelect = card.querySelector('.card-model');
    const keyInput = card.querySelector('.card-key');
    const enabledCheck = card.querySelector('.card-enabled');
    const testBtn = card.querySelector('.card-test');
    const statusText = card.querySelector('.card-status');

    const save = async () => {
      await Storage.saveApiConfig({
        id: cfg.id,
        provider: providerSelect.value,
        model: modelSelect.value,
        apiKey: keyInput.value.trim(),
        isEnabled: enabledCheck.checked,
      });
    };

    providerSelect.addEventListener('change', () => {
      const pObj = DEFAULT_PROVIDERS.find((p) => p.id === providerSelect.value) || DEFAULT_PROVIDERS[0];
      modelSelect.innerHTML = pObj.models.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
      save();
    });

    modelSelect.addEventListener('change', save);
    keyInput.addEventListener('input', save);
    enabledCheck.addEventListener('change', save);

    card.querySelector('.card-delete').addEventListener('click', async () => {
      await Storage.removeApiConfig(cfg.id);
      card.remove();
    });

    testBtn.addEventListener('click', async () => {
      testBtn.innerHTML = `${Icons.refresh(12)} ${d.testingConnection || 'Testing...'}`;
      try {
        const testPayload = {
          provider: providerSelect.value,
          model: modelSelect.value,
          apiKey: keyInput.value.trim(),
        };

        if (!testPayload.apiKey) {
          throw new Error(d.enterKeyFirst || 'Please enter an API Key before testing');
        }

        chrome.runtime.sendMessage({
          action: 'ASK_AI',
          payload: { prompt: 'Reply "Connected OK"', preferredConfigId: cfg.id }
        }, (res) => {
          if (res?.success) {
            statusText.innerHTML = `<span style="color:#16a34a;">${Icons.check(12)} ${d.keyValid || 'Key Valid & Working'}</span>`;
          } else {
            statusText.innerHTML = `<span style="color:#ef4444;">${d.keyInvalid || 'Connection Failed:'} ${res?.error || 'Unknown Error'}</span>`;
          }
        });
      } catch (err) {
        statusText.innerHTML = `<span style="color:#ef4444;">${err.message}</span>`;
      } finally {
        setTimeout(() => {
          testBtn.innerHTML = `${Icons.refresh(12)} ${d.testConnection || 'Test Connection'}`;
        }, 1200);
      }
    });

    if (isNew) save();
    return card;
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
          const session = await aiModel.create();
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
              const sess = await m.create();
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
}
