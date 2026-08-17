/**
 * Model & API Key Configuration Modal for SidePanel
 */

import { Icons } from '../shared/icons.js';
import { Storage, DEFAULT_PROVIDERS } from '../shared/storage.js';

export class SidePanelKeysModal {
  constructor(controller) {
    this.controller = controller;
  }

  async open() {
    const modal = document.getElementById('spModal');
    const body = document.getElementById('spModalBody');
    if (!modal || !body) return;

    modal.style.display = 'flex';

    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const isVi = uiLanguage === 'vi';

    body.innerHTML = `
      <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">
        ${isVi ? 'Thêm một hoặc nhiều API Key. Tiện ích tự động xoay vòng cân bằng tải và chuyển sang key dự phòng khi gặp giới hạn Rate Limit.' : 'Add one or more API Keys. The extension automatically load-balances and falls back to backup keys when hitting rate limits.'}
      </div>

      <!-- Chrome Built-in AI Gemini Nano Guide Section in Modal -->
      <div style="margin-top: 8px; padding: 10px; background: rgba(2, 132, 199, 0.08); border-radius: 8px; border: 1px solid rgba(2, 132, 199, 0.25);">
        <div style="font-weight: 700; font-size: 12.5px; color: #0284c7; display:flex; align-items:center; gap:6px;">
          ${Icons.cpu(14)} Chrome Gemini Nano (Local AI)
        </div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-top:4px; line-height:1.5;">
          ${isVi ? 'Mô hình AI nội bộ chạy Offline. Nhấn các liên kết bên dưới để mở trực tiếp:' : 'On-Device AI running offline. Click links below to open flags directly:'}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
          <button class="sp-copy-btn" id="spModalBtnFlagPrompt" style="background:#0284c7; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${isVi ? '1. Mở #prompt-api' : '1. Open #prompt-api'}
          </button>
          <button class="sp-copy-btn" id="spModalBtnFlagOptGuide" style="background:#0284c7; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${isVi ? '2. Mở #optimization-guide' : '2. Open #optimization-guide'}
          </button>
          <button class="sp-copy-btn" id="spModalBtnComponents" style="background:#0369a1; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${isVi ? '3. Mở components' : '3. Open components'}
          </button>
        </div>
      </div>

      <div id="spModalKeyList" style="display:flex; flex-direction:column; gap:10px; margin-top:8px;"></div>

      <button class="sp-btn-add" id="spBtnAddKey">${Icons.plus(16)} ${isVi ? 'Thêm Model & Key' : 'Add Model & Key'}</button>

      <div style="text-align:right; margin-top:6px;">
        <a href="#" id="spLinkFullOptions" style="font-size:12px; color:var(--accent); text-decoration:none;">
          ${isVi ? 'Xem hướng dẫn lấy Key miễn phí →' : 'View free API key guide →'}
        </a>
      </div>
    `;

    body.querySelector('#spModalBtnFlagPrompt')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api-for-gemini-nano' });
    });

    body.querySelector('#spModalBtnFlagOptGuide')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#optimization-guide-on-device-model' });
    });

    body.querySelector('#spModalBtnComponents')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://components' });
    });

    const list = body.querySelector('#spModalKeyList');
    apiConfigs.forEach((cfg) => list.appendChild(this.renderKeyItem(cfg)));

    body.querySelector('#spBtnAddKey').addEventListener('click', () => {
      const newCfg = {
        id: `cfg_${Date.now()}`,
        provider: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-2.5-flash',
        apiKey: '',
        isEnabled: true,
      };
      list.appendChild(this.renderKeyItem(newCfg, true));
    });

    body.querySelector('#spLinkFullOptions').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }

  renderKeyItem(cfg, isNew = false) {
    const el = document.createElement('div');
    el.style.cssText = 'border:1px solid var(--border-color); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; background:var(--bg-secondary);';

    const providerOptions = DEFAULT_PROVIDERS.map(
      (p) => `<option value="${p.id}" ${cfg.provider === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const providerObj = DEFAULT_PROVIDERS.find((p) => p.id === cfg.provider) || DEFAULT_PROVIDERS[0];
    const modelOptions = providerObj.models.map(
      (m) => `<option value="${m.id}" ${cfg.model === m.id ? 'selected' : ''}>${m.name}</option>`
    ).join('');

    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label style="display:flex; align-items:center; gap:6px; font-weight:600; font-size:13px;">
          <input type="checkbox" class="cfg-enabled" ${cfg.isEnabled ? 'checked' : ''}>
          <span>${providerObj.name}</span>
        </label>
        <button class="sp-icon-btn cfg-delete" style="color:#ef4444;">${Icons.trash(14)}</button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <select class="sp-field cfg-provider">${providerOptions}</select>
        <select class="sp-field cfg-model">${modelOptions}</select>
      </div>

      <input type="password" class="sp-field cfg-key" placeholder="Enter API Key" value="${cfg.apiKey || ''}">
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
      this.controller.updateModelBadge();
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
      this.controller.updateModelBadge();
    });

    if (isNew) save();
    return el;
  }
}
