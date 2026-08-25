/**
 * Shared "AI Model & API Key" card + Local-Model-detect UI logic.
 *
 * Used identically by the 3 surfaces that expose this feature:
 *  - content/overlay/config-modal.js  (variant: 'overlay',   compact popup, shadow DOM)
 *  - sidepanel/sidepanel-keys-modal.js (variant: 'sidepanel', compact panel, dark theme)
 *  - options/tabs/keys-tab.js          (variant: 'options',   full-width page tab)
 *
 * Behavior, field set, Storage calls and the Local-Model detect flow are
 * identical across all 3 — only the DOM/CSS "skin" differs (narrow popup vs
 * wide page), which is what `variant` selects. Each host still owns its own
 * modal/section shell (open/close chrome, title, backdrop) and its own
 * `root` (shadow root or `document`) + `dict` (getI18n() vs getOptionsI18n())
 * — this module only builds/wires the content inside that shell.
 */

import { Icons } from './icons.js';
import { Storage, DEFAULT_PROVIDERS } from './storage.js';
import {
  detectLocalModels,
  prettifyModelName,
  looksLikeEmbeddingModel,
  looksLikeVisionModel,
} from './local-model-detect.js';

export const isLocalProvider = (provider) => provider === 'ollama' || provider === 'lmstudio';

export const LOCAL_DEFAULT_BASE_URLS = {
  lmstudio: 'http://127.0.0.1:1234',
  ollama: 'http://127.0.0.1:11434',
};

// Element-id prefix each host already uses for its Local-Model panel markup
// (sidepanel/options are pre-existing; overlay's is new, added to mirror
// this exact pattern).
const ID_PREFIX = { overlay: 'hw', sidepanel: 'sp', options: 'opt' };

// Cloud-provider card "skin": options gets a wide 3-column grid (it's a full
// page section, not a cramped popup); overlay + sidepanel share a narrow
// stacked layout, each keeping its own pre-existing class names / colors.
const CLOUD_SKIN = {
  overlay: {
    layout: 'compact',
    cardStyle:
      'border:1px solid rgba(226, 232, 240, 0.9); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; background:#f8fafc;',
    field: 'hw-input',
    select: 'hw-select',
    iconBtn: 'hw-icon-btn',
  },
  sidepanel: {
    layout: 'compact',
    cardStyle:
      'border:1px solid var(--border-color); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; background:var(--bg-secondary);',
    field: 'sp-field',
    select: 'sp-field',
    iconBtn: 'sp-icon-btn',
  },
  options: { layout: 'wide' },
};

// Local-model card + detect-panel skin: overlay borrows the Options page's
// `.opt-local-*` class names verbatim (new rules added to overlay.css) since
// overlay lives in a shadow DOM — those class names can't collide with the
// real Options page. Sidepanel keeps its own pre-existing `.sp-local-key-*`
// classes. This mirrors `.opt-local-ping-btn`, which already crosses into
// sidepanel.css unchanged today.
const LOCAL_SKIN = {
  overlay: 'opt',
  options: 'opt',
  sidepanel: 'sp',
};

function fmt(str, vars) {
  let out = str;
  for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, v);
  return out;
}

// =======================================================
// Cloud-provider key card
// =======================================================

export function createKeyCard(cfg, { isNew = false, dict = {}, variant, onChange } = {}) {
  const d = dict;
  const skin = CLOUD_SKIN[variant];
  const el = document.createElement('div');

  const providerOptions = DEFAULT_PROVIDERS.map(
    (p) => `<option value="${p.id}" ${cfg.provider === p.id ? 'selected' : ''}>${p.name}</option>`
  ).join('');

  const providerObj = DEFAULT_PROVIDERS.find((p) => p.id === cfg.provider) || DEFAULT_PROVIDERS[0];
  const isCustomModel = !providerObj.models.some((m) => m.id === cfg.model) || cfg.model === '__custom__';

  const buildModelOptions = () =>
    providerObj.models.map((m) => `<option value="${m.id}" ${cfg.model === m.id ? 'selected' : ''}>${m.name}</option>`).join('') +
    `<option value="__custom__" ${isCustomModel ? 'selected' : ''}>✏️ ${d.customModelOption || 'Tự điền model (Custom)...'}</option>`;

  const cooldownText = () =>
    cfg.cooldownUntil && cfg.cooldownUntil > Date.now()
      ? `${Icons.alertCircle(12)} ${fmt(d.statusCooldown || 'Cooling down ({time})', { time: new Date(cfg.cooldownUntil).toLocaleTimeString() })}`
      : d.statusReady || 'Status: Ready';

  const keyPlaceholder = () => {
    if (providerObj.requiresKey === false) {
      return d.localKeyOptionalPlaceholder || 'API Key (Không bắt buộc cho Local AI)';
    }
    return skin.layout === 'wide'
      ? `${d.keyPlaceholder || 'Enter API Key'} (sk-... / AIza...)`
      : (d.modalKeyPlaceholder || 'Enter API Key');
  };

  if (skin.layout === 'wide') {
    el.className = 'opt-key-card';
    el.setAttribute('data-id', cfg.id);
    el.innerHTML = `
      <div class="opt-key-header">
        <label class="opt-key-provider-title">
          <input type="checkbox" class="cfg-enabled" ${cfg.isEnabled ? 'checked' : ''}>
          <span class="cfg-provider-name">${providerObj.name}</span>
        </label>
        <button class="opt-btn-secondary cfg-delete" style="color:#ef4444; padding:4px 8px; font-size:12px;" title="${d.deleteKey || 'Delete'}">
          ${Icons.trash(14)} ${d.deleteKey || 'Delete'}
        </button>
      </div>
      <div class="opt-key-grid">
        <select class="opt-select cfg-provider" style="min-width:0;">${providerOptions}</select>
        <select class="opt-select cfg-model" style="min-width:0;">${buildModelOptions()}</select>
        <input type="password" class="opt-input cfg-key" placeholder="${keyPlaceholder()}" value="${cfg.apiKey || ''}">
      </div>
      <input type="text" class="opt-input cfg-custom-model" placeholder="${d.customModelPlaceholder || 'Nhập tên/mã model (vd: gemini-3.5-pro, gpt-5, claude-4...)'}" value="${isCustomModel && cfg.model !== '__custom__' ? cfg.model : ''}" style="margin-top:6px; ${isCustomModel ? 'display:block;' : 'display:none;'}">
      <input type="text" class="opt-input cfg-base-url" placeholder="${providerObj.defaultBaseUrl || 'Base URL (http://localhost:...)'}" value="${cfg.baseUrl || (providerObj.requiresBaseUrl ? providerObj.defaultBaseUrl : '')}" style="margin-top:6px; ${providerObj.requiresBaseUrl ? 'display:block;' : 'display:none;'}">
      <div class="opt-key-actions">
        <div class="cfg-status" style="font-size:12px; color:#64748b;">${cooldownText()}</div>
        <button class="opt-btn-secondary cfg-test" style="padding:4px 10px; font-size:12px;">${Icons.refresh(12)} ${d.testConnection || 'Test Connection'}</button>
      </div>
    `;
  } else {
    el.style.cssText = skin.cardStyle;
    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label style="display:flex; align-items:center; gap:6px; font-weight:600; font-size:13px;">
          <input type="checkbox" class="cfg-enabled" ${cfg.isEnabled ? 'checked' : ''}>
          <span class="cfg-provider-name">${providerObj.name}</span>
        </label>
        <button class="${skin.iconBtn} cfg-delete" style="color:#ef4444;" title="${d.deleteKey || 'Delete'}">${Icons.trash(14)}</button>
      </div>
      <div style="display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:6px;">
        <select class="${skin.select} cfg-provider" style="min-width:0;">${providerOptions}</select>
        <select class="${skin.select} cfg-model" style="min-width:0;">${buildModelOptions()}</select>
      </div>
      <input type="text" class="${skin.field} cfg-custom-model" placeholder="${d.customModelPlaceholder || 'Nhập tên/mã model (vd: gemini-3.5-pro, gpt-5, claude-4...)'}" value="${isCustomModel && cfg.model !== '__custom__' ? cfg.model : ''}" style="margin-top:2px; ${isCustomModel ? 'display:block;' : 'display:none;'}">
      <input type="text" class="${skin.field} cfg-base-url" placeholder="${providerObj.defaultBaseUrl || 'Base URL (http://localhost:...)'}" value="${cfg.baseUrl || (providerObj.requiresBaseUrl ? providerObj.defaultBaseUrl : '')}" style="margin-top:2px; ${providerObj.requiresBaseUrl ? 'display:block;' : 'display:none;'}">
      <input type="password" class="${skin.field} cfg-key" placeholder="${keyPlaceholder()}" value="${cfg.apiKey || ''}">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
        <span class="cfg-status" style="font-size:11px; color:#64748b; flex:1;">${cooldownText()}</span>
        <button class="${skin.iconBtn} cfg-test" title="${d.testConnection || 'Test Connection'}">${Icons.refresh(13)}</button>
      </div>
    `;
  }

  const providerSelect = el.querySelector('.cfg-provider');
  const modelSelect = el.querySelector('.cfg-model');
  const customModelInput = el.querySelector('.cfg-custom-model');
  const baseUrlInput = el.querySelector('.cfg-base-url');
  const keyInput = el.querySelector('.cfg-key');
  const enabledInput = el.querySelector('.cfg-enabled');
  const testBtn = el.querySelector('.cfg-test');
  const statusEl = el.querySelector('.cfg-status');

  const getSelectedModel = () =>
    modelSelect.value === '__custom__' ? customModelInput.value.trim() || '__custom__' : modelSelect.value;

  const save = async () => {
    await Storage.saveApiConfig({
      id: cfg.id,
      provider: providerSelect.value,
      model: getSelectedModel(),
      baseUrl: baseUrlInput.value.trim(),
      apiKey: keyInput.value.trim(),
      isEnabled: enabledInput.checked,
    });
    onChange?.();
  };

  const updateCustomModelVisibility = () => {
    customModelInput.style.display = modelSelect.value === '__custom__' ? 'block' : 'none';
    if (modelSelect.value === '__custom__') customModelInput.focus();
  };

  providerSelect.addEventListener('change', () => {
    const pObj = DEFAULT_PROVIDERS.find((p) => p.id === providerSelect.value) || DEFAULT_PROVIDERS[0];
    const nameEl = el.querySelector('.cfg-provider-name');
    if (nameEl) nameEl.textContent = pObj.name;
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

    keyInput.placeholder = pObj.requiresKey === false
      ? (d.localKeyOptionalPlaceholder || 'API Key (Không bắt buộc cho Local AI)')
      : (skin.layout === 'wide' ? `${d.keyPlaceholder || 'Enter API Key'} (sk-... / AIza...)` : (d.modalKeyPlaceholder || 'Enter API Key'));

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
  enabledInput.addEventListener('change', save);

  el.querySelector('.cfg-delete').addEventListener('click', async () => {
    await Storage.removeApiConfig(cfg.id);
    el.remove();
    onChange?.();
  });

  testBtn.addEventListener('click', () => {
    statusEl.textContent = d.testingConnection || 'Testing...';
    if (!keyInput.value.trim() && providerObj.requiresKey !== false) {
      statusEl.innerHTML = `<span style="color:#ef4444;">${d.enterKeyFirst || 'Please enter an API Key before testing'}</span>`;
      return;
    }
    chrome.runtime.sendMessage(
      { action: 'ASK_AI', payload: { prompt: 'Reply "Connected OK"', preferredConfigId: cfg.id } },
      (res) => {
        if (res?.success) {
          statusEl.innerHTML = `<span style="color:#16a34a;">${Icons.check(11)} ${d.keyValid || 'Key Valid & Working'}</span>`;
        } else {
          statusEl.innerHTML = `<span style="color:#ef4444;">${d.keyInvalid || 'Connection Failed:'} ${res?.error || 'Unknown Error'}</span>`;
        }
      }
    );
  });

  if (isNew) save();
  return el;
}

// =======================================================
// Local-model (Ollama / LM Studio) key card — compact row,
// no API key / provider-model dropdowns: baseUrl+model were
// already picked via the "Add Local Model" ping flow.
// =======================================================

export function createLocalKeyCard(cfg, { dict = {}, variant, onChange } = {}) {
  const d = dict;
  const skin = LOCAL_SKIN[variant];
  // Options is a full-width page — a labeled "Test Connection" button fits
  // fine there. Overlay/sidepanel are narrow popups (~380px); a labeled
  // button is wide enough to force the whole card into an awkward wrap, so
  // both stay icon-only regardless of which class-name skin they borrow.
  const isWide = variant === 'options';
  const el = document.createElement('div');
  el.className = skin === 'sp' ? 'sp-local-key-item' : 'opt-local-model-card';
  if (skin === 'opt') el.setAttribute('data-id', cfg.id);

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

  const toggleClass = skin === 'sp' ? 'sp-local-key-toggle' : 'opt-local-card-toggle';
  const iconClass = skin === 'sp' ? 'sp-local-key-icon' : 'opt-local-card-icon';
  const infoClass = skin === 'sp' ? 'sp-local-key-info' : 'opt-local-card-info';
  const titleRowClass = skin === 'sp' ? 'sp-local-key-title-row' : 'opt-local-card-title-row';
  const badgeClass = skin === 'sp' ? 'sp-local-key-badge' : 'opt-local-card-badge';
  const nameClass = skin === 'sp' ? 'sp-local-key-name' : 'opt-local-card-model-name';
  const metaClass = skin === 'sp' ? 'sp-local-key-meta' : 'opt-local-card-meta';
  const statusClass = skin === 'sp' ? 'sp-local-key-status' : 'opt-local-card-status';
  const actionsClass = skin === 'sp' ? 'sp-local-key-actions' : 'opt-local-card-actions';
  const ocrToggleClass = skin === 'sp' ? '' : 'opt-local-card-ocr-toggle';
  const iconBtn = skin === 'sp' ? 'sp-icon-btn' : (isWide ? 'opt-btn-secondary' : 'opt-icon-btn-plain');
  const deleteBtnClass = skin === 'sp' ? 'sp-icon-btn' : 'opt-icon-btn-danger';
  const helpIconAttrs = skin === 'sp'
    ? 'style="display:inline-flex; cursor:help; color:var(--text-muted);"'
    : 'class="opt-help-icon"';

  const visionTag = isVision
    ? `<span class="opt-local-vision-tag">${d.localVisionTag || 'Vision'}</span>`
    : `<span class="opt-local-textonly-tag">${d.localTextOnlyTag || 'Text only'}</span>`;

  el.innerHTML = `
    <label class="${toggleClass}">
      <input type="checkbox" class="cfg-enabled" ${cfg.isEnabled ? 'checked' : ''}>
    </label>
    <div class="${iconClass}">${Icons.server(skin === 'sp' ? 16 : 18)}</div>
    <div class="${infoClass}">
      <div class="${titleRowClass}">
        <span class="${badgeClass}">${providerLabel}</span>
        <span class="${nameClass}">${prettyName}</span>
        ${visionTag}
        <span ${helpIconAttrs} data-tooltip-title="${d.localModelHelpTitle || 'Can this model actually read images?'}" data-tooltip-desc="${d.localModelHelpDesc || ''}">${Icons.helpCircle(skin === 'sp' ? 12 : 13)}</span>
      </div>
      <div class="${metaClass}">${cfg.model} &middot; ${cfg.baseUrl || ''}</div>
      ${embeddingWarning ? `<div style="display:flex; align-items:center; gap:4px; font-size:11px; color:#d97706; margin-top:4px;">${Icons.alertCircle(12)} ${d.localEmbeddingCardWarning || 'Embedding model — cannot answer questions. Delete and add a chat model instead.'}</div>` : ''}
      ${!embeddingWarning && !isVision ? `
        <label class="${ocrToggleClass}" style="${skin === 'sp' ? 'display:flex; align-items:center; gap:5px; font-size:10px; color:var(--text-muted); margin-top:3px; cursor:pointer;' : ''}">
          <input type="checkbox" class="cfg-ocr-fallback" ${skin === 'sp' ? 'style="width:12px;height:12px;"' : ''} ${ocrFallbackOn ? 'checked' : ''}>
          <span>${d.localOcrFallbackToggle || 'Auto-OCR screenshots into text before sending'}</span>
        </label>
      ` : ''}
      <div class="${statusClass} cfg-status"></div>
    </div>
    <div class="${actionsClass}">
      <button class="${iconBtn} cfg-test" style="${isWide ? 'padding:4px 10px; font-size:12px;' : ''}" title="${d.testConnection || 'Test Connection'}">${Icons.refresh(skin === 'sp' ? 14 : 12)}${isWide ? ` ${d.testConnection || 'Test Connection'}` : ''}</button>
      <button class="${deleteBtnClass} cfg-delete" style="${skin === 'sp' ? 'color:#ef4444;' : ''}" title="${d.deleteKey || 'Delete'}">${Icons.trash(14)}</button>
    </div>
  `;

  const enabledInput = el.querySelector('.cfg-enabled');
  const ocrFallbackInput = el.querySelector('.cfg-ocr-fallback');
  const statusEl = el.querySelector('.cfg-status');
  const testBtn = el.querySelector('.cfg-test');

  enabledInput.addEventListener('change', async () => {
    await Storage.saveApiConfig({ id: cfg.id, isEnabled: enabledInput.checked });
    onChange?.();
  });

  ocrFallbackInput?.addEventListener('change', async () => {
    await Storage.saveApiConfig({ id: cfg.id, ocrFallback: ocrFallbackInput.checked });
  });

  el.querySelector('.cfg-delete').addEventListener('click', async () => {
    await Storage.removeApiConfig(cfg.id);
    el.remove();
    onChange?.();
  });

  testBtn.addEventListener('click', () => {
    statusEl.textContent = d.testingConnection || 'Testing...';
    chrome.runtime.sendMessage(
      { action: 'ASK_AI', payload: { prompt: 'Reply "Connected OK"', preferredConfigId: cfg.id } },
      (res) => {
        if (res?.success) {
          statusEl.innerHTML = `<span style="color:#16a34a;">${Icons.check(11)} ${d.keyValid || 'Key Valid & Working'}</span>`;
        } else {
          statusEl.innerHTML = `<span style="color:#ef4444;">${res?.error || d.keyInvalid || 'Connection failed'}</span>`;
        }
      }
    );
  });

  return el;
}

// =======================================================
// "Add Local Model" detect/ping panel
// =======================================================

// `state` is the host's own instance (e.g. `this`), used to persist
// `localModelType`/`localDiscoveredModels` across calls the way each of the
// 3 original implementations already did.
export function wireLocalModelPanel(root, { dict = {}, variant, state, onModelsAdded } = {}) {
  const p = ID_PREFIX[variant];
  const byId = (name) => root.querySelector(`#${p}${name}`);

  const openBtn = byId('BtnAddLocalModel');
  const panel = byId('LocalModelPanel');
  const baseUrlInput = byId('LocalBaseUrl');
  const pingBtn = byId('LocalBtnPing');
  const typeBtns = root.querySelectorAll(`#${p}LocalTypeToggle .opt-local-type-btn`);
  const cancelBtn = byId('LocalBtnCancel');
  const closeBtn = byId('LocalBtnClose');
  const addBtn = byId('LocalBtnAddSelected');
  if (!openBtn || !panel || !baseUrlInput) return;

  const openDisplay = variant === 'options' ? 'block' : 'flex';

  const resetResults = () => {
    state.localDiscoveredModels = [];
    const list = byId('LocalModelsList');
    const footer = byId('LocalPanelFooter');
    const statusText = byId('LocalStatusText');
    const btn = byId('LocalBtnPing');
    const statusIcon = byId('LocalStatusIcon');
    if (list) list.innerHTML = '';
    if (footer) footer.style.display = 'none';
    if (statusText) statusText.textContent = '';
    if (btn) btn.className = 'opt-local-ping-btn';
    if (statusIcon) statusIcon.innerHTML = Icons.check(15);
  };

  const closePanel = () => {
    panel.style.display = 'none';
    resetResults();
  };

  openBtn.addEventListener('click', () => {
    const willOpen = panel.style.display === 'none';
    panel.style.display = willOpen ? openDisplay : 'none';
    if (willOpen) baseUrlInput.focus();
    else resetResults();
  });

  closeBtn?.addEventListener('click', closePanel);
  cancelBtn?.addEventListener('click', closePanel);

  typeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      state.localModelType = type;
      typeBtns.forEach((b) => b.classList.toggle('active', b === btn));

      const otherDefault = Object.values(LOCAL_DEFAULT_BASE_URLS).find((u) => u === baseUrlInput.value.trim());
      if (!baseUrlInput.value.trim() || otherDefault) {
        baseUrlInput.value = LOCAL_DEFAULT_BASE_URLS[type];
      }
      resetResults();
    });
  });

  const pingServer = async () => {
    const statusIcon = byId('LocalStatusIcon');
    const statusText = byId('LocalStatusText');
    const list = byId('LocalModelsList');
    const footer = byId('LocalPanelFooter');

    const baseUrl = baseUrlInput.value.trim();
    pingBtn.className = 'opt-local-ping-btn checking';
    statusIcon.innerHTML = Icons.refresh(15);
    list.innerHTML = '';
    footer.style.display = 'none';
    statusText.textContent = '';

    const result = await detectLocalModels(state.localModelType, baseUrl);

    if (!result.ok) {
      pingBtn.className = 'opt-local-ping-btn offline';
      statusIcon.innerHTML = Icons.x(15);
      statusText.innerHTML = `<span style="color:#ef4444;">${dict.localStatusOffline || 'Could not connect to this server.'}</span>`;
      state.localDiscoveredModels = [];
      return;
    }

    // "localhost" can silently fail to connect (IPv6 loopback resolution)
    // even when the server is reachable at 127.0.0.1 — detectLocalModels()
    // already retried and found it there, so reflect the working address
    // back into the field instead of leaving the misleading "localhost" value.
    if (result.resolvedBaseUrl) baseUrlInput.value = result.resolvedBaseUrl;

    pingBtn.className = 'opt-local-ping-btn online';
    statusIcon.innerHTML = Icons.check(15);
    state.localDiscoveredModels = result.models;

    if (result.models.length === 0) {
      const emptyMsg =
        state.localModelType === 'ollama'
          ? dict.localNoModelsOllama || 'No models downloaded yet.'
          : dict.localNoModelsLmstudio || 'No model is currently running.';
      statusText.innerHTML = `<span style="color:#d97706;">${dict.localStatusOnlineEmpty || 'Connected but no model is loaded yet.'}</span><br>${emptyMsg}`;
      return;
    }

    statusText.innerHTML = `<span style="color:#16a34a;">${fmt(dict.localStatusOnline || 'Connected! Found {count} model(s).', { count: result.models.length })}</span>`;

    list.innerHTML = result.models
      .map((m, idx) => {
        const pretty = prettifyModelName(m.id);
        const showRawId = pretty !== m.id;
        const capabilityTag = m.isEmbedding
          ? `<span class="opt-local-embedding-tag">${dict.localEmbeddingTag || 'Embedding'}</span>`
          : m.isVision
            ? `<span class="opt-local-vision-tag">${dict.localVisionTag || 'Vision'}</span>`
            : `<span class="opt-local-textonly-tag">${dict.localTextOnlyTag || 'Text only'}</span>`;
        return `
        <label class="opt-local-model-row ${m.isEmbedding ? 'is-embedding' : ''}">
          <input type="checkbox" class="opt-local-model-check" value="${idx}" ${m.isEmbedding ? 'disabled' : 'checked'}>
          <span style="display:flex; flex-direction:column; flex:1;">
            <span>${pretty} ${capabilityTag} <span class="opt-help-icon" data-tooltip-title="${dict.localModelHelpTitle || 'Can this model actually read images?'}" data-tooltip-desc="${dict.localModelHelpDesc || ''}">${Icons.helpCircle(13)}</span></span>
            ${showRawId ? `<span style="font-size:11px; color:#94a3b8;">${m.id}</span>` : ''}
            ${m.isEmbedding ? `<span style="font-size:11px; color:#d97706;">${dict.localEmbeddingWarning || 'Embedding model — cannot answer questions.'}</span>` : ''}
            ${!m.isEmbedding && !m.isVision ? `<span style="font-size:11px; color:#64748b;">${dict.localTextOnlyHint || 'No direct image support — screenshots are OCR-extracted to text before sending.'}</span>` : ''}
          </span>
        </label>
      `;
      })
      .join('');
    footer.style.display = 'flex';
  };

  baseUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') pingServer();
  });
  pingBtn?.addEventListener('click', pingServer);

  addBtn?.addEventListener('click', async () => {
    const checks = root.querySelectorAll('.opt-local-model-check:checked');
    if (checks.length === 0) return;

    // ai-engine.js calls `${baseUrl}/chat/completions` directly, so the
    // stored baseUrl must already carry the OpenAI-compatible /v1 suffix.
    const baseUrl = `${baseUrlInput.value.trim().replace(/\/+$/, '').replace(/\/v1$/, '')}/v1`;
    const providerName = state.localModelType === 'ollama' ? 'Ollama (Local AI)' : 'LM Studio (Local AI)';

    const newConfigs = [];
    for (const check of checks) {
      const model = state.localDiscoveredModels[Number(check.value)];
      if (!model || model.isEmbedding) continue;
      const newCfg = {
        id: `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        provider: state.localModelType,
        name: providerName,
        model: model.id,
        baseUrl,
        apiKey: '',
        isEnabled: true,
        isVision: model.isVision,
        ocrFallback: true,
      };
      await Storage.saveApiConfig(newCfg);
      newConfigs.push(newCfg);
    }

    panel.style.display = 'none';
    resetResults();
    onModelsAdded?.(newConfigs);
  });
}
