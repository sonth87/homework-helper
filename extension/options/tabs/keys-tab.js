import { Icons } from '../../shared/icons.js';
import { Storage, DEFAULT_PROVIDERS } from '../../shared/storage.js';
import { getOptionsI18n } from '../../shared/i18n.js';
import { detectLocalModels, prettifyModelName, looksLikeEmbeddingModel, looksLikeVisionModel } from '../../shared/local-model-detect.js';

const isLocalProvider = (provider) => provider === 'ollama' || provider === 'lmstudio';

const LOCAL_DEFAULT_BASE_URLS = {
  lmstudio: 'http://127.0.0.1:1234',
  ollama: 'http://127.0.0.1:11434',
};

export class KeysTab {
  constructor(optionsController) {
    this.controller = optionsController;
    this.localModelType = 'lmstudio';
    this.localDiscoveredModels = [];
  }

  async init() {
    await this.loadRoutingStrategy();
    await this.loadProvidersAndKeys();
    await this.checkChromeBuiltinAI();
    this.initLocalModelPanel();
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
          ? this.createLocalModelCard(cfg, dict)
          : this.createKeyCard(cfg, false, dict);
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
    
    const isCustomModel =
      !providerObj.models.some((m) => m.id === cfg.model) ||
      cfg.model === '__custom__';

    const modelOptions =
      providerObj.models
        .map(
          (m) => `<option value="${m.id}" ${cfg.model === m.id ? 'selected' : ''}>${m.name}</option>`
        )
        .join('') +
      `<option value="__custom__" ${isCustomModel ? 'selected' : ''}>✏️ ${d.customModelOption || 'Tự điền model (Custom)...'}</option>`;

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

      <input type="text" class="opt-input card-custom-model" placeholder="${d.customModelPlaceholder || 'Nhập tên/mã model (vd: gemini-3.5-pro, gpt-5, claude-4...)'}" value="${isCustomModel && cfg.model !== '__custom__' ? cfg.model : ''}" style="margin-top:6px; ${isCustomModel ? 'display:block;' : 'display:none;'}">

      <input type="text" class="opt-input card-base-url" placeholder="${providerObj.defaultBaseUrl || 'Base URL (http://localhost:...)'}" value="${cfg.baseUrl || (providerObj.requiresBaseUrl ? providerObj.defaultBaseUrl : '')}" style="margin-top:6px; ${providerObj.requiresBaseUrl ? 'display:block;' : 'display:none;'}">

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
    const customModelInput = card.querySelector('.card-custom-model');
    const baseUrlInput = card.querySelector('.card-base-url');
    const keyInput = card.querySelector('.card-key');
    const enabledCheck = card.querySelector('.card-enabled');
    const testBtn = card.querySelector('.card-test');
    const statusText = card.querySelector('.card-status');

    const getSelectedModel = () => {
      if (modelSelect.value === '__custom__') {
        return customModelInput.value.trim() || '__custom__';
      }
      return modelSelect.value;
    };

    const save = async () => {
      await Storage.saveApiConfig({
        id: cfg.id,
        provider: providerSelect.value,
        model: getSelectedModel(),
        baseUrl: baseUrlInput.value.trim(),
        apiKey: keyInput.value.trim(),
        isEnabled: enabledCheck.checked,
      });
    };

    const updateCustomModelVisibility = () => {
      if (modelSelect.value === '__custom__') {
        customModelInput.style.display = 'block';
        customModelInput.focus();
      } else {
        customModelInput.style.display = 'none';
      }
    };

    providerSelect.addEventListener('change', () => {
      const pObj = DEFAULT_PROVIDERS.find((p) => p.id === providerSelect.value) || DEFAULT_PROVIDERS[0];
      modelSelect.innerHTML =
        pObj.models.map((m) => `<option value="${m.id}">${m.name}</option>`).join('') +
        `<option value="__custom__">✏️ ${d.customModelOption || 'Tự điền model (Custom)...'}</option>`;

      if (pObj.requiresBaseUrl) {
        baseUrlInput.style.display = 'block';
        baseUrlInput.placeholder = pObj.defaultBaseUrl || 'http://localhost:...';
        if (!baseUrlInput.value) baseUrlInput.value = pObj.defaultBaseUrl || '';
      } else {
        baseUrlInput.style.display = 'none';
      }

      keyInput.placeholder = pObj.requiresKey === false ? 'API Key (Không bắt buộc cho Local AI)' : `${d.keyPlaceholder || 'Enter API Key'} (sk-... / AIza...)`;

      updateCustomModelVisibility();
      save();
    });

    modelSelect.addEventListener('change', () => {
      updateCustomModelVisibility();
      save();
    });

    customModelInput.addEventListener('input', save);
    baseUrlInput.addEventListener('input', save);
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
          model: getSelectedModel(),
          apiKey: keyInput.value.trim(),
        };

        const currentProviderObj = DEFAULT_PROVIDERS.find((p) => p.id === providerSelect.value) || DEFAULT_PROVIDERS[0];
        if (!testPayload.apiKey && currentProviderObj.requiresKey !== false) {
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

  // Local models (Ollama / LM Studio) get their own compact card instead of
  // the generic cloud-provider form — there's no API key, no provider/model
  // dropdowns to pick from, and the baseUrl+model were already chosen via
  // the "Add Local Model" ping flow.
  createLocalModelCard(cfg, dict = null) {
    const d = dict || getOptionsI18n();
    const card = document.createElement('div');
    card.className = 'opt-local-model-card';
    card.setAttribute('data-id', cfg.id);

    const providerLabel = cfg.provider === 'ollama' ? 'Ollama' : 'LM Studio';
    const prettyName = prettifyModelName(cfg.model);
    const embeddingWarning = looksLikeEmbeddingModel(cfg.model);
    const isVision = cfg.isVision !== undefined ? cfg.isVision : looksLikeVisionModel(cfg.model);
    const ocrFallbackOn = cfg.ocrFallback !== false;

    // Backfill isVision for configs saved before this field existed, so
    // ai-engine.js's OCR-fallback routing (which only trusts a persisted
    // `isVision === false`) sees the same capability the card is showing.
    if (cfg.isVision === undefined) {
      Storage.saveApiConfig({ id: cfg.id, isVision });
    }

    card.innerHTML = `
      <label class="opt-local-card-toggle">
        <input type="checkbox" class="card-enabled" ${cfg.isEnabled ? 'checked' : ''}>
      </label>
      <div class="opt-local-card-icon">${Icons.server(18)}</div>
      <div class="opt-local-card-info">
        <div class="opt-local-card-title-row">
          <span class="opt-local-card-badge">${providerLabel}</span>
          <span class="opt-local-card-model-name">${prettyName}</span>
          ${isVision ? `<span class="opt-local-vision-tag">${d.localVisionTag || 'Vision'}</span>` : `<span class="opt-local-textonly-tag">${d.localTextOnlyTag || 'Text only'}</span>`}
        </div>
        <div class="opt-local-card-meta">${cfg.model} &middot; ${cfg.baseUrl || ''}</div>
        ${embeddingWarning ? `<div class="opt-local-card-embedding-warning">${Icons.alertCircle(12)} ${d.localEmbeddingCardWarning || 'This looks like an embedding model — it cannot answer questions. Delete it and add a chat/vision model instead.'}</div>` : ''}
        ${!embeddingWarning && !isVision ? `
          <label class="opt-local-card-ocr-toggle">
            <input type="checkbox" class="card-ocr-fallback" ${ocrFallbackOn ? 'checked' : ''}>
            <span>${d.localOcrFallbackToggle || 'Auto-OCR screenshots into text before sending (model can’t read images)'}</span>
          </label>
        ` : ''}
        <div class="opt-local-card-status card-status"></div>
      </div>
      <div class="opt-local-card-actions">
        <button class="opt-btn-secondary card-test" style="padding:4px 10px; font-size:12px;">
          ${Icons.refresh(12)} ${d.testConnection || 'Test Connection'}
        </button>
        <button class="opt-icon-btn-danger card-delete" title="${d.deleteKey || 'Delete'}">
          ${Icons.trash(14)}
        </button>
      </div>
    `;

    const enabledCheck = card.querySelector('.card-enabled');
    const ocrFallbackCheck = card.querySelector('.card-ocr-fallback');
    const testBtn = card.querySelector('.card-test');
    const statusText = card.querySelector('.card-status');

    enabledCheck.addEventListener('change', async () => {
      await Storage.saveApiConfig({ id: cfg.id, isEnabled: enabledCheck.checked });
    });

    ocrFallbackCheck?.addEventListener('change', async () => {
      await Storage.saveApiConfig({ id: cfg.id, ocrFallback: ocrFallbackCheck.checked });
    });

    card.querySelector('.card-delete').addEventListener('click', async () => {
      await Storage.removeApiConfig(cfg.id);
      card.remove();
    });

    testBtn.addEventListener('click', async () => {
      testBtn.innerHTML = `${Icons.refresh(12)} ${d.testingConnection || 'Testing...'}`;
      chrome.runtime.sendMessage({
        action: 'ASK_AI',
        payload: { prompt: 'Reply "Connected OK"', preferredConfigId: cfg.id },
      }, (res) => {
        if (res?.success) {
          statusText.innerHTML = `<span style="color:#16a34a;">${Icons.check(12)} ${d.keyValid || 'Key Valid & Working'}</span>`;
        } else {
          statusText.innerHTML = `<span style="color:#ef4444;">${d.keyInvalid || 'Connection Failed:'} ${res?.error || 'Unknown Error'}</span>`;
        }
        testBtn.innerHTML = `${Icons.refresh(12)} ${d.testConnection || 'Test Connection'}`;
      });
    });

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

  // =======================================================
  // Local AI Server (Ollama / LM Studio) Add-Model Panel
  // =======================================================
  initLocalModelPanel() {
    const openBtn = document.getElementById('optBtnAddLocalModel');
    const panel = document.getElementById('optLocalModelPanel');
    const baseUrlInput = document.getElementById('optLocalBaseUrl');
    const pingBtn = document.getElementById('optLocalBtnPing');
    const typeBtns = document.querySelectorAll('#optLocalTypeToggle .opt-local-type-btn');
    const cancelBtn = document.getElementById('optLocalBtnCancel');
    const closeBtn = document.getElementById('optLocalBtnClose');
    const addBtn = document.getElementById('optLocalBtnAddSelected');
    if (!openBtn || !panel || !baseUrlInput) return;

    const statusIcon = document.getElementById('optLocalStatusIcon');
    if (statusIcon) statusIcon.innerHTML = Icons.check(16);

    const closePanel = () => {
      panel.style.display = 'none';
      this.resetLocalModelResults();
    };

    openBtn.addEventListener('click', () => {
      const willOpen = panel.style.display === 'none';
      panel.style.display = willOpen ? 'block' : 'none';
      if (willOpen) baseUrlInput.focus();
      else this.resetLocalModelResults();
    });

    closeBtn?.addEventListener('click', closePanel);

    typeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        this.localModelType = type;
        typeBtns.forEach((b) => b.classList.toggle('active', b === btn));

        const otherDefault = Object.values(LOCAL_DEFAULT_BASE_URLS).find((u) => u === baseUrlInput.value.trim());
        if (!baseUrlInput.value.trim() || otherDefault) {
          baseUrlInput.value = LOCAL_DEFAULT_BASE_URLS[type];
        }
        this.resetLocalModelResults();
      });
    });

    baseUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.pingLocalServer();
    });

    pingBtn?.addEventListener('click', () => this.pingLocalServer());

    cancelBtn?.addEventListener('click', closePanel);

    addBtn?.addEventListener('click', () => this.addSelectedLocalModels());
  }

  resetLocalModelResults() {
    this.localDiscoveredModels = [];
    const list = document.getElementById('optLocalModelsList');
    const footer = document.getElementById('optLocalPanelFooter');
    const statusText = document.getElementById('optLocalStatusText');
    const pingBtn = document.getElementById('optLocalBtnPing');
    const statusIcon = document.getElementById('optLocalStatusIcon');
    if (list) list.innerHTML = '';
    if (footer) footer.style.display = 'none';
    if (statusText) statusText.textContent = '';
    if (pingBtn) pingBtn.className = 'opt-local-ping-btn';
    if (statusIcon) statusIcon.innerHTML = Icons.check(16);
  }

  async pingLocalServer() {
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const d = getOptionsI18n(uiLanguage);

    const baseUrlInput = document.getElementById('optLocalBaseUrl');
    const pingBtn = document.getElementById('optLocalBtnPing');
    const statusIcon = document.getElementById('optLocalStatusIcon');
    const statusText = document.getElementById('optLocalStatusText');
    const list = document.getElementById('optLocalModelsList');
    const footer = document.getElementById('optLocalPanelFooter');
    if (!baseUrlInput) return;

    const baseUrl = baseUrlInput.value.trim();
    pingBtn.className = 'opt-local-ping-btn checking';
    statusIcon.innerHTML = Icons.refresh(16);
    list.innerHTML = '';
    footer.style.display = 'none';
    statusText.textContent = '';

    const result = await detectLocalModels(this.localModelType, baseUrl);

    if (!result.ok) {
      pingBtn.className = 'opt-local-ping-btn offline';
      statusIcon.innerHTML = Icons.x(16);
      statusText.innerHTML = `<span style="color:#ef4444;">${d.localStatusOffline || 'Could not connect to this server.'}</span>`;
      this.localDiscoveredModels = [];
      return;
    }

    pingBtn.className = 'opt-local-ping-btn online';
    statusIcon.innerHTML = Icons.check(16);
    this.localDiscoveredModels = result.models;

    if (result.models.length === 0) {
      const emptyMsg = this.localModelType === 'ollama'
        ? (d.localNoModelsOllama || 'No models downloaded yet.')
        : (d.localNoModelsLmstudio || 'No model is currently running.');
      statusText.innerHTML = `<span style="color:#d97706;">${d.localStatusOnlineEmpty || 'Connected but no model is loaded yet.'}</span><br>${emptyMsg}`;
      return;
    }

    statusText.innerHTML = `<span style="color:#16a34a;">${(d.localStatusOnline || 'Connected! Found {count} model(s).').replace('{count}', result.models.length)}</span>`;

    list.innerHTML = result.models
      .map((m, idx) => {
        const pretty = prettifyModelName(m.id);
        const showRawId = pretty !== m.id;
        const capabilityTag = m.isEmbedding
          ? `<span class="opt-local-embedding-tag">${d.localEmbeddingTag || 'Embedding'}</span>`
          : m.isVision
            ? `<span class="opt-local-vision-tag">${d.localVisionTag || 'Vision'}</span>`
            : `<span class="opt-local-textonly-tag">${d.localTextOnlyTag || 'Text only'}</span>`;
        return `
        <label class="opt-local-model-row ${m.isEmbedding ? 'is-embedding' : ''}">
          <input type="checkbox" class="opt-local-model-check" value="${idx}" ${m.isEmbedding ? 'disabled' : 'checked'}>
          <span style="display:flex; flex-direction:column; flex:1;">
            <span>${pretty} ${capabilityTag}</span>
            ${showRawId ? `<span style="font-size:11px; color:#94a3b8;">${m.id}</span>` : ''}
            ${m.isEmbedding ? `<span style="font-size:11px; color:#d97706;">${d.localEmbeddingWarning || 'Embedding model — cannot be used to answer questions.'}</span>` : ''}
            ${!m.isEmbedding && !m.isVision ? `<span style="font-size:11px; color:#64748b;">${d.localTextOnlyHint || 'No direct image support — screenshots are OCR-extracted to text before sending.'}</span>` : ''}
          </span>
        </label>
      `;
      })
      .join('');
    footer.style.display = 'flex';
  }

  async addSelectedLocalModels() {
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const d = getOptionsI18n(uiLanguage);

    const baseUrlInput = document.getElementById('optLocalBaseUrl');
    const panel = document.getElementById('optLocalModelPanel');
    const checks = document.querySelectorAll('.opt-local-model-check:checked');
    if (!baseUrlInput || checks.length === 0) return;

    // ai-engine.js calls `${baseUrl}/chat/completions` directly, so the
    // stored baseUrl must already carry the OpenAI-compatible /v1 suffix.
    const baseUrl = `${baseUrlInput.value.trim().replace(/\/+$/, '').replace(/\/v1$/, '')}/v1`;
    const providerName = this.localModelType === 'ollama' ? 'Ollama (Local AI)' : 'LM Studio (Local AI)';

    for (const check of checks) {
      const model = this.localDiscoveredModels[Number(check.value)];
      if (!model || model.isEmbedding) continue;
      await Storage.saveApiConfig({
        id: `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        provider: this.localModelType,
        name: providerName,
        model: model.id,
        baseUrl,
        apiKey: '',
        isEnabled: true,
        isVision: model.isVision,
        ocrFallback: true,
      });
    }

    this.controller.showToast?.((d.localModelAdded || 'Added {count} model(s) to the list.').replace('{count}', checks.length));

    if (panel) panel.style.display = 'none';
    this.resetLocalModelResults();
    await this.loadProvidersAndKeys();
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
