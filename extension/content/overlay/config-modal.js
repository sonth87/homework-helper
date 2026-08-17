/**
 * Zero-Login In-Page Configuration Modal Subcomponent
 */

import { Icons } from '../../shared/icons.js';
import { Storage, DEFAULT_PROVIDERS } from '../../shared/storage.js';
import { getI18n } from '../../shared/i18n.js';

export class OverlayConfigModal {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this.init();
  }

  init() {
    const s = this.shadow;

    s.getElementById('hwBtnSettings')?.addEventListener('click', () => this.open());
    s.getElementById('hwBtnCloseModal')?.addEventListener('click', () => {
      s.getElementById('hwConfigModal').style.display = 'none';
      this.overlay.drawer.updateActiveModelBadge();
      this.overlay.applyAppearanceSettings();
    });
  }

  async open() {
    const s = this.shadow;
    const modal = s.getElementById('hwConfigModal');
    const body = s.getElementById('hwModalBody');
    if (!modal || !body) return;
    modal.style.display = 'flex';

    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const dict = getI18n(uiLanguage);

    body.innerHTML = `
      <div style="font-size:12px; color:#64748b; line-height:1.4;">
        ${dict.modalConfigDesc || 'Add one or more API Keys. The extension automatically load-balances and falls back to backup keys when hitting rate limits.'}
      </div>

      <!-- Chrome Built-in AI Gemini Nano Guide Section in In-Page Modal -->
      <div style="margin-top: 8px; padding: 10px; background: rgba(2, 132, 199, 0.08); border-radius: 8px; border: 1px solid rgba(2, 132, 199, 0.25);">
        <div style="font-weight: 700; font-size: 12.5px; color: #0284c7; display:flex; align-items:center; gap:6px;">
          ${Icons.cpu(14)} ${dict.modalNanoTitle || 'Chrome Gemini Nano (Local AI)'}
        </div>
        <div style="font-size:11.5px; color:#64748b; margin-top:4px; line-height:1.5;">
          ${dict.modalNanoDesc || 'On-Device AI running offline. Click links below to open flags directly:'}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
          <button class="hw-btn-copy" id="hwModalBtnFlagPrompt" style="background:#0284c7; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${dict.modalBtnFlagPrompt || '1. Open #prompt-api'}
          </button>
          <button class="hw-btn-copy" id="hwModalBtnFlagOptGuide" style="background:#0284c7; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${dict.modalBtnFlagOptGuide || '2. Open #optimization-guide'}
          </button>
          <button class="hw-btn-copy" id="hwModalBtnComponents" style="background:#0369a1; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${dict.modalBtnComponents || '3. Open components'}
          </button>
        </div>
      </div>

      <div id="hwModalKeyList" style="display:flex; flex-direction:column; gap:10px; margin-top:8px;"></div>

      <button class="hw-btn-add" id="hwBtnAddKey">${Icons.plus(16)} ${dict.modalBtnAddKey || 'Add Model & Key'}</button>

      <div style="text-align:right; margin-top:6px;">
        <a href="#" id="hwLinkFullOptions" style="font-size:12px; color:#0284c7; text-decoration:none;">
          ${dict.modalLinkGuide || 'View free API key guide →'}
        </a>
      </div>
    `;

    body.querySelector('#hwModalBtnFlagPrompt')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api-for-gemini-nano' });
    });

    body.querySelector('#hwModalBtnFlagOptGuide')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#optimization-guide-on-device-model' });
    });

    body.querySelector('#hwModalBtnComponents')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://components' });
    });

    const list = body.querySelector('#hwModalKeyList');
    apiConfigs.forEach((cfg) => list.appendChild(this.renderKeyItem(cfg, false, dict)));

    body.querySelector('#hwBtnAddKey').addEventListener('click', () => {
      const newCfg = {
        id: `cfg_${Date.now()}`,
        provider: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-2.5-flash',
        apiKey: '',
        isEnabled: true,
      };
      list.appendChild(this.renderKeyItem(newCfg, true, dict));
    });

    body.querySelector('#hwLinkFullOptions').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'guide' });
    });
  }

  renderKeyItem(cfg, isNew = false, dict = null) {
    const d = dict || getI18n();
    const el = document.createElement('div');
    el.style.cssText = 'border:1px solid rgba(226, 232, 240, 0.9); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; background:#f8fafc;';

    const providerOptions = DEFAULT_PROVIDERS.map(
      (p) => `<option value="${p.id}" ${cfg.provider === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const providerObj = DEFAULT_PROVIDERS.find((p) => p.id === cfg.provider) || DEFAULT_PROVIDERS[0];
    const modelOptions = providerObj.models.map(
      (m) => `<option value="${m.id}" ${cfg.model === m.id ? 'selected' : ''}>${m.name}</option>`
    ).join('');

    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label style="display:flex; align-items:center; gap:6px; font-weight:600; font-size:13px; color:#0f172a;">
          <input type="checkbox" class="cfg-enabled" ${cfg.isEnabled ? 'checked' : ''}>
          <span>${providerObj.name}</span>
        </label>
        <button class="hw-icon-btn cfg-delete" style="color:#ef4444;">${Icons.trash(14)}</button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <select class="hw-select cfg-provider">${providerOptions}</select>
        <select class="hw-select cfg-model">${modelOptions}</select>
      </div>

      <input type="password" class="hw-input cfg-key" placeholder="${d.modalKeyPlaceholder || 'Enter API Key (sk-... / AIza...)'}" value="${cfg.apiKey || ''}">
    `;

    const providerSelect = el.querySelector('.cfg-provider');
    const modelSelect = el.querySelector('.cfg-model');
    const keyInput = el.querySelector('.cfg-key');
    const enabledInput = el.querySelector('.cfg-enabled');

    const save = async () => {
      await Storage.saveApiConfig({
        id: cfg.id,
        provider: providerSelect.value,
        model: modelSelect.value,
        apiKey: keyInput.value.trim(),
        isEnabled: enabledInput.checked,
      });
      this.overlay.drawer.updateActiveModelBadge();
    };

    providerSelect.addEventListener('change', () => {
      const pObj = DEFAULT_PROVIDERS.find((p) => p.id === providerSelect.value) || DEFAULT_PROVIDERS[0];
      modelSelect.innerHTML = pObj.models.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
      save();
    });

    modelSelect.addEventListener('change', save);
    keyInput.addEventListener('input', save);
    enabledInput.addEventListener('change', save);

    el.querySelector('.cfg-delete').addEventListener('click', async () => {
      await Storage.removeApiConfig(cfg.id);
      el.remove();
      this.overlay.drawer.updateActiveModelBadge();
    });

    if (isNew) save();
    return el;
  }
}
