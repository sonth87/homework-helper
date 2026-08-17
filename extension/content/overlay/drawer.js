/**
 * In-Page Slide-Over Chat Drawer Subcomponent
 */

import { Icons } from '../../shared/icons.js';
import { Storage, DEFAULT_NANO_SYSTEM_PROMPT, buildNanoPrompts } from '../../shared/storage.js';
import { formatMarkdownAndMath } from '../../shared/markdown-katex.js';
import { getI18n } from '../../shared/i18n.js';
import { OcrEngine } from '../../shared/ocr-engine.js';

export class OverlayDrawer {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;

    this.isOpen = false;
    this.wasOpenBeforeCrop = false;
    this.currentStudyMode = 'step-by-step';
    this.attachedImageBase64 = null;
    this.isStreaming = false;
    this.activeRequestId = null;
    this.activeAiBubble = null;
    this.activeTarget = 'drawer';
    this.currentDrawerResponseText = '';

    this.init();
  }

  init() {
    this.setupListeners();
  }

  setupListeners() {
    const s = this.shadow;

    // Close buttons & backdrop
    s.getElementById('hwBtnClose')?.addEventListener('click', () => this.toggle(false));
    s.getElementById('hwDrawerEdgeClose')?.addEventListener('click', () => this.toggle(false));
    s.getElementById('hwDrawerBackdrop')?.addEventListener('click', () => this.toggle(false));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.toggle(false);
      }
    });

    // Clear Chat
    s.getElementById('hwBtnClear')?.addEventListener('click', async () => {
      await Storage.clearChatHistory();
      const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
      const dict = getI18n(uiLanguage);
      const body = s.getElementById('hwChatBody');
      if (body) {
        const chipsHtml = (dict.chips || []).map(
          (c) => `<button class="hw-chip" data-query="${c.query}">${c.label}</button>`
        ).join('');
        body.innerHTML = `
          <div class="hw-msg hw-msg-ai">
            <div class="hw-msg-bubble">
              <div id="hwWelcomeText">${dict.welcomeText}</div>
              <div class="hw-chips-container" id="hwChipsContainer">
                ${chipsHtml}
              </div>
            </div>
          </div>
        `;
      }
    });

    // Options Page trigger
    s.getElementById('hwBtnSidePanel')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
    });

    // Upload Image in Drawer
    const fileInput = s.getElementById('hwImgFileInput');
    s.getElementById('hwBtnUploadImg')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.attachedImageBase64 = reader.result;
          s.getElementById('hwImgThumb').src = reader.result;
          s.getElementById('hwImgPreviewRow').style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });

    s.getElementById('hwBtnRemoveImg')?.addEventListener('click', () => {
      this.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      if (fileInput) fileInput.value = '';
    });

    // Send Button & Textarea in Drawer
    const textarea = s.getElementById('hwTextarea');
    const sendBtn = s.getElementById('hwBtnSend');

    sendBtn?.addEventListener('click', () => this.handleSend());
    textarea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Chips delegation for prompt suggestions
    s.getElementById('hwChatBody')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.hw-chip');
      if (chip) {
        const q = chip.getAttribute('data-query');
        if (q && textarea) {
          textarea.value = q;
          this.handleSend();
        }
      }
    });

    // Study mode selector
    const modeSelect = s.getElementById('hwModeSelect');
    if (modeSelect) {
      Storage.get(['studyMode']).then(({ studyMode = 'step-by-step' }) => {
        modeSelect.value = studyMode;
        this.currentStudyMode = studyMode;
      });
      modeSelect.addEventListener('change', (e) => {
        this.currentStudyMode = e.target.value;
        Storage.set({ studyMode: e.target.value });
      });
    }

    // Response Language selector
    const langSelect = s.getElementById('hwLangSelect');
    if (langSelect) {
      Storage.get(['outputLanguage']).then(({ outputLanguage = 'en' }) => {
        langSelect.value = outputLanguage;
      });
      langSelect.addEventListener('change', (e) => {
        Storage.set({ outputLanguage: e.target.value });
      });
    }
  }

  toggle(forceState = null) {
    const drawer = this.shadow.getElementById('hwDrawer');
    const backdrop = this.shadow.getElementById('hwDrawerBackdrop');
    if (!drawer) return;

    this.isOpen = forceState !== null ? forceState : !this.isOpen;
    if (this.isOpen) {
      drawer.classList.add('open');
      if (backdrop) backdrop.style.display = 'block';
      this.loadInitialHistory();
      this.updateActiveModelBadge();
      setTimeout(() => this.shadow.getElementById('hwTextarea')?.focus(), 150);
    } else {
      drawer.classList.remove('open');
      if (backdrop) backdrop.style.display = 'none';
    }
  }

  async checkNanoAvailability() {
    return new Promise((resolve) => {
      let resolved = false;
      const handler = (e) => {
        window.removeEventListener('HOMEWORK_AI_NANO_RESPONSE', handler);
        resolved = true;
        resolve(e.detail?.hasAi && e.detail?.available !== 'no');
      };
      window.addEventListener('HOMEWORK_AI_NANO_RESPONSE', handler);
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_CHECK'));
      setTimeout(() => {
        if (!resolved) {
          window.removeEventListener('HOMEWORK_AI_NANO_RESPONSE', handler);
          resolve(false);
        }
      }, 300);
    });
  }

  async updateActiveModelBadge() {
    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { isNanoReady, uiLanguage = 'en' } = await Storage.get(['isNanoReady', 'uiLanguage']);
    const dict = getI18n(uiLanguage);
    const tag = this.shadow.getElementById('hwModelTag');
    if (!tag) return;
    const enabledCount = apiConfigs.filter((c) => c.isEnabled && c.apiKey).length;

    if (enabledCount === 0) {
      let isReady = !!isNanoReady;
      if (!isReady) {
        isReady = await this.checkNanoAvailability();
      }

      if (isReady) {
        Storage.set({ isNanoReady: true });
        tag.innerHTML = `${Icons.cpu(12)} ${dict.modelNanoReady || 'Chrome Gemini Nano (Sẵn sàng On-Device)'}`;
        tag.style.background = 'rgba(34, 197, 94, 0.15)';
        tag.style.color = '#16a34a';
        tag.style.border = 'none';
        tag.style.cursor = 'default';
        tag.title = '';
        tag.onclick = null;
      } else {
        tag.innerHTML = `${Icons.alertCircle(12)} ${dict.modelNanoSetup || 'Chrome Gemini Nano (Yêu cầu thiết lập)'}`;
        tag.style.background = 'rgba(234, 179, 8, 0.15)';
        tag.style.color = '#a16207';
        tag.style.border = '1px solid rgba(234, 179, 8, 0.4)';
        tag.style.cursor = 'pointer';
        tag.title = dict.modelNanoClick || 'Click to view Gemini Nano guide in Settings';
        tag.onclick = () => {
          chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'builtin-nano' });
        };
      }
    } else {
      tag.innerHTML = `${Icons.layers(12)} ${dict.modelAutoRotate || 'Auto-Rotate'} (${enabledCount} Active)`;
      tag.style.background = 'rgba(2, 132, 199, 0.12)';
      tag.style.color = '#0284c7';
      tag.style.border = 'none';
      tag.style.cursor = 'default';
      tag.title = '';
      tag.onclick = null;
    }
  }

  async handleSend() {
    const textarea = this.shadow.getElementById('hwTextarea');
    const text = textarea?.value.trim() || '';
    const img = this.attachedImageBase64;

    if (!text && !img) return;
    if (this.isStreaming) return;

    if (textarea) textarea.value = '';
    this.attachedImageBase64 = null;
    const previewRow = this.shadow.getElementById('hwImgPreviewRow');
    if (previewRow) previewRow.style.display = 'none';

    this.askAi({ prompt: text || 'Please solve this attached question:', imageBase64: img });
  }

  async askAi({ prompt, imageBase64 = null }) {
    this.appendUserMessage(prompt, imageBase64);

    this.activeAiBubble = this.createAiBubble();
    this.currentDrawerResponseText = '';
    this.isStreaming = true;
    this.activeTarget = 'drawer';
    this.activeRequestId = `req_${Date.now()}`;
    const btnSend = this.shadow.getElementById('hwBtnSend');
    if (btnSend) btnSend.disabled = true;

    const { apiConfigs = [], systemPrompt, nanoSystemPrompt, outputLanguage = 'en' } = await Storage.get(['apiConfigs', 'systemPrompt', 'nanoSystemPrompt', 'outputLanguage']);
    const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && c.apiKey);

    if (enabledKeys.length === 0) {
      const langNames = {
        en: 'English',
        vi: 'Tiếng Việt (Vietnamese)',
        es: 'Español (Spanish)',
        fr: 'Français (French)',
        de: 'Deutsch (German)',
        'zh-CN': 'Simplified Chinese (简体中文)',
        'zh-TW': 'Traditional Chinese (繁體中文)',
        ja: 'Japanese (日本語)',
        ko: 'Korean (한국어)',
        pt: 'Portuguese (Português)',
        id: 'Bahasa Indonesia',
        ru: 'Russian (Русский)',
      };
      const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'Tiếng Việt';
      
      let ocrText = '';
      if (imageBase64) {
        try {
          ocrText = await OcrEngine.recognize(imageBase64, outputLanguage);
        } catch (e) {
          console.warn('[Drawer] Nano OCR failed:', e);
        }
      }

      const { sysPrompt: nanoSysPrompt, userPrompt: nanoPrompt } = buildNanoPrompts(
        this.currentStudyMode || 'step-by-step',
        prompt,
        ocrText,
        targetLangName,
        nanoSystemPrompt
      );

      window.dispatchEvent(
        new CustomEvent('HOMEWORK_AI_NANO_EXEC', {
          detail: {
            prompt: nanoPrompt,
            requestId: this.activeRequestId,
            systemPrompt: nanoSysPrompt,
          },
        })
      );
      return;
    }

    chrome.runtime.sendMessage({
      action: 'ASK_AI',
      payload: {
        prompt,
        imageBase64,
        studyMode: this.currentStudyMode,
        outputLanguage,
        requestId: this.activeRequestId,
      },
    });
  }

  appendUserMessage(text, imageBase64) {
    const body = this.shadow.getElementById('hwChatBody');
    if (!body) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'hw-msg hw-msg-user';

    let imgHtml = imageBase64 ? `<img src="${imageBase64}" class="hw-msg-img" alt="Attached">` : '';
    msgEl.innerHTML = `
      <div class="hw-msg-bubble">
        ${imgHtml}
        <div>${formatMarkdownAndMath(text)}</div>
      </div>
    `;

    body.appendChild(msgEl);
    body.scrollTop = body.scrollHeight;

    Storage.addChatMessage({ role: 'user', content: text, image: imageBase64 });
  }

  createAiBubble() {
    const body = this.shadow.getElementById('hwChatBody');
    if (!body) return null;
    const msgEl = document.createElement('div');
    msgEl.className = 'hw-msg hw-msg-ai';

    msgEl.innerHTML = `
      <div class="hw-msg-bubble">
        <div class="hw-ai-content" style="color:#94a3b8;">${Icons.sparkles(14)} Đang suy nghĩ & giải bài...</div>
        <div class="hw-msg-footer" style="display:none;">
          <button class="hw-copy-btn">${Icons.copy(12)} <span>Sao chép</span></button>
        </div>
      </div>
    `;

    body.appendChild(msgEl);
    body.scrollTop = body.scrollHeight;
    return msgEl;
  }

  appendStreamChunk(chunk, meta) {
    if (this.activeTarget === 'card') {
      this.overlay.floatingCard.activeCardResponseText += chunk;
      const content = this.shadow.getElementById('hwCardAnswerContent');
      if (content) {
        content.innerHTML = formatMarkdownAndMath(this.overlay.floatingCard.activeCardResponseText);
      }
      return;
    }

    if (!this.activeAiBubble) return;

    this.currentDrawerResponseText += chunk;
    const content = this.activeAiBubble.querySelector('.hw-ai-content');
    if (content) {
      content.style.color = '#0f172a';
      content.innerHTML = formatMarkdownAndMath(this.currentDrawerResponseText);
    }

    const body = this.shadow.getElementById('hwChatBody');
    if (body) body.scrollTop = body.scrollHeight;
  }

  async finalizeStream() {
    this.isStreaming = false;
    const btnSend = this.shadow.getElementById('hwBtnSend');
    if (btnSend) btnSend.disabled = false;
    Storage.set({ isNanoReady: true });
    this.updateActiveModelBadge();

    if (this.activeTarget === 'card') {
      Storage.addChatMessage({ role: 'assistant', content: this.overlay.floatingCard.activeCardResponseText });
      return;
    }

    if (this.activeAiBubble) {
      const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
      const dict = getI18n(uiLanguage);
      const footer = this.activeAiBubble.querySelector('.hw-msg-footer');
      if (footer) footer.style.display = 'flex';

      const copyBtn = this.activeAiBubble.querySelector('.hw-copy-btn');
      if (copyBtn) {
        copyBtn.innerHTML = `${Icons.copy(12)} <span>${dict.copyBtn || 'Sao chép'}</span>`;
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(this.currentDrawerResponseText);
          copyBtn.innerHTML = `${Icons.check(12)} <span>${dict.copiedBtn || 'Đã sao chép!'}</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = `${Icons.copy(12)} <span>${dict.copyBtn || 'Sao chép'}</span>`;
          }, 2000);
        };
      }

      Storage.addChatMessage({ role: 'assistant', content: this.currentDrawerResponseText });
    }
  }

  handleStreamError(err) {
    this.isStreaming = false;
    const btnSend = this.shadow.getElementById('hwBtnSend');
    if (btnSend) btnSend.disabled = false;

    const errStr = String(err || '');

    if (this.activeTarget === 'card') {
      const content = this.shadow.getElementById('hwCardAnswerContent');
      if (content) {
        content.innerHTML = `
          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px; color:#ef4444; font-size:12px;">
            <div style="font-weight:700; margin-bottom:4px;">${Icons.alertCircle(14)} Error solving question</div>
            <div>${errStr}</div>
          </div>
        `;
      }
      return;
    }

    if (!this.activeAiBubble) return;
    const content = this.activeAiBubble.querySelector('.hw-ai-content');

    if (errStr.includes('NO_KEYS_NO_LOCAL_AI') || errStr.includes('CHROME_AI_UNAVAILABLE') || errStr.includes('QUOTA_EXHAUSTED')) {
      if (content) {
        content.innerHTML = `
          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px; color:#ef4444; font-size:12px;">
            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
              ${Icons.alertCircle(14)} Chưa có AI Sẵn sàng
            </div>
            <div>${errStr}</div>
            <div style="margin-top:8px; display:flex; gap:6px;">
              <button class="hw-btn-copy" id="hwErrBtnOpenKeys" style="background:#ef4444; color:#fff; font-size:11px; padding:3px 8px;">
                ${Icons.plus(11)} Thêm Key Miễn Phí
              </button>
              <button class="hw-btn-copy" id="hwErrBtnOpenOptions" style="background:transparent; border:1px solid #ef4444; color:#ef4444; font-size:11px; padding:3px 8px;">
                ${Icons.externalLink(11)} Xem Hướng Dẫn
              </button>
            </div>
          </div>
        `;

        content.querySelector('#hwErrBtnOpenKeys')?.addEventListener('click', () => this.overlay.configModal.open());
        content.querySelector('#hwErrBtnOpenOptions')?.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'guide' }));
      }
    } else if (content) {
      content.innerHTML = `<span style="color:#ef4444;">${Icons.alertCircle(14)} ${err}</span>`;
    }
  }

  async loadInitialHistory() {
    const history = await Storage.getChatHistory();
    const body = this.shadow.getElementById('hwChatBody');
    if (!body) return;

    body.innerHTML = '';

    const { activeConversationId } = await Storage.get(['activeConversationId']);
    const convs = await Storage.getConversations();
    const activeConv = convs.find((c) => c.id === activeConversationId);

    const titleEl = this.shadow.getElementById('hwActiveConvTitle');
    if (titleEl) {
      titleEl.textContent = activeConv?.title || 'New Chat';
    }

    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const dict = getI18n(uiLanguage);

    if (history.length > 0) {
      history.forEach((msg) => {
        const el = document.createElement('div');
        el.className = `hw-msg ${msg.role === 'user' ? 'hw-msg-user' : 'hw-msg-ai'}`;

        let imgHtml = msg.image ? `<img src="${msg.image}" class="hw-msg-img" alt="Attached">` : '';
        let footerHtml =
          msg.role === 'assistant'
            ? `<div class="hw-msg-footer"><button class="hw-copy-btn">${Icons.copy(12)} <span>${dict.copyBtn || 'Sao chép'}</span></button></div>`
            : '';

        el.innerHTML = `
          <div class="hw-msg-bubble">
            ${imgHtml}
            <div class="${msg.role === 'assistant' ? 'hw-ai-content' : ''}">${formatMarkdownAndMath(msg.content)}</div>
            ${footerHtml}
          </div>
        `;

        if (msg.role === 'assistant') {
          const copyBtn = el.querySelector('.hw-copy-btn');
          copyBtn?.addEventListener('click', () => {
            navigator.clipboard.writeText(msg.content);
            copyBtn.innerHTML = `${Icons.check(12)} <span>${dict.copiedBtn || 'Đã sao chép!'}</span>`;
            setTimeout(() => {
              copyBtn.innerHTML = `${Icons.copy(12)} <span>${dict.copyBtn || 'Sao chép'}</span>`;
            }, 2000);
          });
        }

        body.appendChild(el);
      });
      body.scrollTop = body.scrollHeight;
    } else {
      const chipsHtml = (dict.chips || []).map(
        (c) => `<button class="hw-chip" data-query="${c.query}">${c.label}</button>`
      ).join('');

      body.innerHTML = `
        <div class="hw-msg hw-msg-ai">
          <div class="hw-msg-bubble">
            <div id="hwWelcomeText">${dict.welcomeText}</div>
            <div class="hw-chips-container" id="hwChipsContainer">
              ${chipsHtml}
            </div>
          </div>
        </div>
      `;
    }
  }
}
