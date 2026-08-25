/**
 * Zero-Login In-Page Configuration Modal Subcomponent
 */

import { Icons } from '../../shared/icons.js';
import { getI18n } from '../../shared/i18n.js';
import { Storage } from '../../shared/storage.js';
import { isLocalProvider, createKeyCard, createLocalKeyCard, wireLocalModelPanel } from '../../shared/api-config-ui.js';

export class OverlayConfigModal {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this.localModelType = 'lmstudio';
    this.localDiscoveredModels = [];
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
      <div style="font-size:12px; color:var(--hw-text-muted); line-height:1.4;">
        ${dict.modalConfigDesc || 'Add one or more API Keys. The extension automatically load-balances and falls back to backup keys when hitting rate limits.'}
      </div>

      <!-- Chrome Built-in AI Gemini Nano Guide Section in In-Page Modal -->
      <div style="margin-top: 8px; padding: 10px; background: rgba(var(--hw-accent-rgb), 0.08); border-radius: 8px; border: 1px solid rgba(var(--hw-accent-rgb), 0.25);">
        <div style="font-weight: 700; font-size: 12.5px; color: var(--hw-accent); display:flex; align-items:center; gap:6px;">
          ${Icons.cpu(14)} ${dict.modalNanoTitle || 'Chrome Gemini Nano (Local AI)'}
        </div>
        <div style="font-size:11.5px; color:var(--hw-text-muted); margin-top:4px; line-height:1.5;">
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
      <button class="hw-btn-add" id="hwBtnAddLocalModel" style="border-color:var(--hw-success); background:rgba(var(--hw-success-rgb),0.06); color:var(--hw-success);">${Icons.server(16)} ${dict.btnAddLocalModel || 'Add Local Model'}</button>

      <!-- Local AI Server (Ollama / LM Studio) Config Panel -->
      <div id="hwLocalModelPanel" style="display:none; border:1px solid rgba(var(--hw-success-rgb),0.3); border-radius:10px; padding:10px; background:rgba(var(--hw-success-rgb),0.05); flex-direction:column; gap:8px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:12.5px; font-weight:700; color:var(--hw-success);">${dict.localPanelTitle || 'Connect Local AI Server'}</span>
          <span style="display:inline-flex; cursor:help; color:var(--hw-success);" data-tooltip-title="${dict.localPanelHelpTitle || 'Picking the right local model'}" data-tooltip-desc="${dict.localPanelHelpDesc || ''}">${Icons.helpCircle(13)}</span>
          <span style="flex:1;"></span>
          <button type="button" class="hw-icon-btn" id="hwLocalBtnClose" title="${dict.localBtnCancel || 'Cancel'}" style="width:24px; height:24px;">${Icons.x(14)}</button>
        </div>

        <div style="display:flex; gap:6px;" id="hwLocalTypeToggle">
          <button type="button" class="opt-local-type-btn active" data-type="lmstudio">LM Studio</button>
          <button type="button" class="opt-local-type-btn" data-type="ollama">Ollama</button>
        </div>

        <div style="display:flex; gap:6px; align-items:center;">
          <input type="text" class="hw-input" id="hwLocalBaseUrl" style="flex:1;" placeholder="http://127.0.0.1:1234" value="http://127.0.0.1:1234">
          <button type="button" class="opt-local-ping-btn" id="hwLocalBtnPing" title="${dict.localBtnPing || 'Test Connection'}">
            <span id="hwLocalStatusIcon">${Icons.check(15)}</span>
          </button>
        </div>

        <div id="hwLocalStatusText" style="font-size:11px; color:var(--hw-text-muted); line-height:1.4;"></div>
        <div id="hwLocalModelsList" style="display:flex; flex-direction:column; gap:4px;"></div>

        <div id="hwLocalPanelFooter" style="display:none; justify-content:flex-end; gap:8px;">
          <button type="button" class="hw-icon-btn" id="hwLocalBtnCancel" style="width:auto; padding:4px 10px; font-size:11px;">${dict.localBtnCancel || 'Cancel'}</button>
          <button type="button" class="hw-btn-copy" id="hwLocalBtnAddSelected" style="background:#16a34a;">${dict.localBtnAddSelected || 'Add Selected'}</button>
        </div>
      </div>

      <div style="text-align:right; margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
        <a href="#" id="hwLinkLocalGuide" style="font-size:12px; color:var(--hw-success); text-decoration:none;">
          ${dict.localGuideLinkText || 'Local Model setup guide →'}
        </a>
        <a href="#" id="hwLinkFullOptions" style="font-size:12px; color:var(--hw-accent); text-decoration:none;">
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
    const onChange = () => this.overlay.drawer.updateActiveModelBadge();

    apiConfigs.forEach((cfg) => {
      const item = isLocalProvider(cfg.provider)
        ? createLocalKeyCard(cfg, { dict, variant: 'overlay', onChange })
        : createKeyCard(cfg, { isNew: false, dict, variant: 'overlay', onChange });
      list.appendChild(item);
    });

    body.querySelector('#hwBtnAddKey').addEventListener('click', () => {
      const newCfg = {
        id: `cfg_${Date.now()}`,
        provider: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-3.7-flash',
        apiKey: '',
        isEnabled: true,
      };
      list.appendChild(createKeyCard(newCfg, { isNew: true, dict, variant: 'overlay', onChange }));
    });

    body.querySelector('#hwLinkFullOptions').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'guide' });
    });

    body.querySelector('#hwLinkLocalGuide')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'local-model-guide' });
    });

    wireLocalModelPanel(body, {
      dict,
      variant: 'overlay',
      state: this,
      onModelsAdded: (newConfigs) => {
        newConfigs.forEach((cfg) => list.appendChild(createLocalKeyCard(cfg, { dict, variant: 'overlay', onChange })));
        onChange();
      },
    });
  }
}
