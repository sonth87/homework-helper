/**
 * In-Page Slide-Over Chat Drawer Subcomponent
 */

import { Icons } from '../../shared/icons.js';
import { Storage, DEFAULT_NANO_SYSTEM_PROMPT, buildNanoPrompts } from '../../shared/storage.js';
import { formatMarkdownAndMath, renderAnswer } from '../../shared/markdown-katex.js';
import { getI18n } from '../../shared/i18n.js';
import { OcrEngine } from '../../shared/ocr-engine.js';
import { NANO_STATUS } from '../../shared/nano-status.js';

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
    this.loadingStepsInterval = null;

    this.init();
  }

  init() {
    this.setupListeners();
    this.applyDrawerWidth();
    this.makeDrawerResizable();
  }

  async applyDrawerWidth() {
    const { drawerWidth } = await Storage.get(['drawerWidth']);
    const drawer = this.shadow.getElementById('hwDrawer');
    if (drawer && typeof drawerWidth === 'number') {
      drawer.style.setProperty('--hw-drawer-width', `${drawerWidth}px`);
    }
  }

  // Drag the left-edge handle to widen/narrow the drawer; the chosen width is
  // saved and restored on the next page load — mirrors how the FAB cluster's
  // dragged position persists (see fabs.js makeFabContainerDraggable()).
  //
  // Sets the --hw-drawer-width custom property rather than .style.width
  // directly: overlay.css derives the drawer's off-screen "closed" offset
  // from that same variable via calc(), so the hidden position always
  // fully clears the drawer at whatever width it's been resized to. Setting
  // .style.width directly here would silently desync the two and leave a
  // resized-wider drawer peeking in from the edge while "closed".
  makeDrawerResizable() {
    const drawer = this.shadow.getElementById('hwDrawer');
    const handle = this.shadow.getElementById('hwDrawerResizeHandle');
    if (!drawer || !handle) return;

    const MIN_WIDTH = 380;
    const MAX_WIDTH = 820;
    let isResizing = false;
    let currentWidth = null;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      handle.classList.add('active');
      drawer.classList.add('resizing');
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const maxAllowed = Math.min(MAX_WIDTH, window.innerWidth - 80);
      currentWidth = Math.max(MIN_WIDTH, Math.min(maxAllowed, window.innerWidth - e.clientX));
      drawer.style.setProperty('--hw-drawer-width', `${currentWidth}px`);
    });

    window.addEventListener('mouseup', async () => {
      if (!isResizing) return;
      isResizing = false;
      handle.classList.remove('active');
      drawer.classList.remove('resizing');
      document.body.style.userSelect = '';
      if (currentWidth) await Storage.set({ drawerWidth: currentWidth });
    });
  }

  // Rotates through a set of short "thinking..." phrases every 5s while
  // waiting for the AI's first chunk, so the bubble doesn't sit frozen on
  // static placeholder text with nothing moving.
  startLoadingSteps(contentEl, steps) {
    this.stopLoadingSteps();
    if (!contentEl || !steps || steps.length === 0) return;

    let idx = 0;
    const render = () => {
      contentEl.innerHTML = `
        <span class="hw-loading-text">
          ${Icons.sparkles(14)} ${steps[idx % steps.length]}<span class="hw-animated-dots"><span>.</span><span>.</span><span>.</span></span>
        </span>
      `;
      idx++;
    };
    render();
    this.loadingStepsInterval = setInterval(render, 5000);
  }

  stopLoadingSteps() {
    if (this.loadingStepsInterval) {
      clearInterval(this.loadingStepsInterval);
      this.loadingStepsInterval = null;
    }
  }

  // Toggles the send button between "Ask AI" and "Stop" — used both for the
  // drawer's own requests and (via activeTarget === 'card') requests started
  // from the floating popup card, since they share this same streaming state.
  async setSendButtonStreaming(streaming) {
    const btn = this.shadow.getElementById('hwBtnSend');
    if (!btn) return;
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const dict = getI18n(uiLanguage);
    btn.classList.toggle('hw-btn-send-stop', streaming);
    btn.disabled = false;
    btn.innerHTML = streaming
      ? `<span id="hwSendBtnLabel">${dict.stopBtn || 'Stop'}</span> ${Icons.stopCircle(13)}`
      : `<span id="hwSendBtnLabel">${dict.askAiBtn || 'Ask AI'}</span> ${Icons.send(13)}`;
  }

  // Cancels the in-flight request: aborts it on the background/offscreen side
  // (so a local LM Studio/Ollama model actually stops generating instead of
  // grinding away unseen) and settles the UI as if the stream ended here.
  stopStream() {
    if (!this.isStreaming) return;
    if (this.activeRequestId) {
      chrome.runtime.sendMessage({ action: 'ABORT_STREAM', payload: { requestId: this.activeRequestId } }).catch(() => {});
    }
    this.isStreaming = false;
    this.setSendButtonStreaming(false);

    if (this.activeTarget === 'card') {
      this.overlay.floatingCard.stopLoadingSteps();
      if (this.overlay.floatingCard.activeCardResponseText) {
        Storage.addChatMessage({ role: 'assistant', content: this.overlay.floatingCard.activeCardResponseText });
      }
      return;
    }

    this.stopLoadingSteps();
    if (this.activeAiBubble) {
      const footer = this.activeAiBubble.querySelector('.hw-msg-footer');
      if (footer) footer.style.display = 'flex';
    }
    if (this.currentDrawerResponseText) {
      Storage.addChatMessage({ role: 'assistant', content: this.currentDrawerResponseText });
    }
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

    sendBtn?.addEventListener('click', () => {
      if (this.isStreaming) {
        this.stopStream();
      } else {
        this.handleSend();
      }
    });
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
        resolve(e.detail?.hasAi ? (e.detail?.status || NANO_STATUS.UNAVAILABLE) : NANO_STATUS.UNAVAILABLE);
      };
      window.addEventListener('HOMEWORK_AI_NANO_RESPONSE', handler);
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_CHECK'));
      setTimeout(() => {
        if (!resolved) {
          window.removeEventListener('HOMEWORK_AI_NANO_RESPONSE', handler);
          resolve(null); // unknown/timeout — callers must not treat this as a hard block
        }
      }, 300);
    });
  }

  // Only used by callers (fabs.js, floating-card.js) deciding whether to hard-block
  // an AI action: a null/unknown probe must fail OPEN, not block the user.
  async isNanoHardBlocked(enabledCount) {
    if (enabledCount > 0) return false;
    const status = await this.checkNanoAvailability();
    return status === NANO_STATUS.UNAVAILABLE;
  }

  async updateActiveModelBadge() {
    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { uiLanguage = 'en', nanoDownloadState } = await Storage.get(['uiLanguage', 'nanoDownloadState']);
    const dict = getI18n(uiLanguage);
    const tag = this.shadow.getElementById('hwModelTag');
    if (!tag) return;
    const enabledCount = apiConfigs.filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin')).length;

    if (enabledCount === 0) {
      // Always re-probe live — isNanoReady is a one-way "seen ready once" flag that
      // never gets cleared, so trusting it here would keep showing "Ready" forever
      // even after the on-device model files are deleted/reset outside the extension.
      let status = await this.checkNanoAvailability();
      if (nanoDownloadState?.inProgress) status = NANO_STATUS.DOWNLOADING;

      if (status === NANO_STATUS.AVAILABLE) {
        Storage.set({ isNanoReady: true });
        tag.innerHTML = `${Icons.cpu(12)} ${dict.modelNanoReady || 'Chrome Gemini Nano (Sẵn sàng On-Device)'}`;
        tag.style.background = 'rgba(var(--hw-success-rgb), 0.15)';
        tag.style.color = 'var(--hw-success)';
        tag.style.border = 'none';
        tag.style.cursor = 'default';
        tag.title = '';
        tag.onclick = null;
      } else if (status === NANO_STATUS.DOWNLOADING) {
        const pct = nanoDownloadState?.percent;
        tag.innerHTML = `${Icons.download(12)} ${dict.modelNanoDownloading || 'Downloading Gemini Nano'}${pct != null ? ` (${pct}%)` : '...'}`;
        tag.style.background = 'rgba(var(--hw-warning-rgb), 0.15)';
        tag.style.color = 'var(--hw-warning)';
        tag.style.border = '1px solid rgba(var(--hw-warning-rgb), 0.4)';
        tag.style.cursor = 'default';
        tag.title = '';
        tag.onclick = null;
      } else if (status === NANO_STATUS.UNAVAILABLE) {
        tag.innerHTML = `${Icons.alertCircle(12)} ${dict.modelNanoUnavailable || 'Gemini Nano unavailable on this device'}`;
        tag.style.background = 'rgba(var(--hw-danger-rgb), 0.12)';
        tag.style.color = 'var(--hw-danger)';
        tag.style.border = '1px solid rgba(var(--hw-danger-rgb), 0.35)';
        tag.style.cursor = 'pointer';
        tag.title = dict.modelNanoClick || 'Click to view Gemini Nano guide in Settings';
        tag.onclick = () => {
          chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'builtin-nano' });
        };
      } else {
        tag.innerHTML = `${Icons.alertCircle(12)} ${dict.modelNanoSetup || 'Chrome Gemini Nano (Yêu cầu thiết lập)'}`;
        tag.style.background = 'rgba(var(--hw-warning-rgb), 0.15)';
        tag.style.color = 'var(--hw-warning)';
        tag.style.border = '1px solid rgba(var(--hw-warning-rgb), 0.4)';
        tag.style.cursor = 'pointer';
        tag.title = dict.modelNanoClick || 'Click to view Gemini Nano guide in Settings';
        tag.onclick = () => {
          chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'builtin-nano' });
        };
      }
    } else {
      tag.innerHTML = `${Icons.layers(12)} ${dict.modelAutoRotate || 'Auto-Rotate'} (${enabledCount} Active)`;
      tag.style.background = 'rgba(var(--hw-accent-rgb), 0.12)';
      tag.style.color = 'var(--hw-accent)';
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
    this.currentNotices = [];
    this.isStreaming = true;
    this.activeTarget = 'drawer';
    this.activeRequestId = `req_${Date.now()}`;
    this.setSendButtonStreaming(true);

    const { apiConfigs = [], systemPrompt, nanoSystemPrompt, outputLanguage = 'en', uiLanguage = 'en' } = await Storage.get(['apiConfigs', 'systemPrompt', 'nanoSystemPrompt', 'outputLanguage', 'uiLanguage']);
    const dict = getI18n(uiLanguage);
    this.currentDict = dict;
    this.startLoadingSteps(this.activeAiBubble?.querySelector('.hw-ai-content'), dict.loadingSteps);
    const enabledKeys = (apiConfigs || []).filter(
      (c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin')
    );

    if (enabledKeys.length === 0) {
      const langNames = {
        en: 'English',
        vi: 'Vietnamese',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        'zh-CN': 'Simplified Chinese',
        'zh-TW': 'Traditional Chinese',
        ja: 'Japanese',
        ko: 'Korean',
        pt: 'Portuguese',
        id: 'Indonesian',
        ru: 'Russian',
      };
      const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'Vietnamese';
      
      let ocrText = '';
      if (imageBase64) {
        try {
          ocrText = await OcrEngine.recognize(imageBase64, outputLanguage);
        } catch (e) {
          console.warn('[Drawer] Nano OCR failed:', e);
        }
      }

      const { sysPrompt: nanoSysPrompt, userPrompt: nanoPrompt, responseConstraint: nanoConstraint } = buildNanoPrompts(
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
            responseConstraint: nanoConstraint,
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
        <div class="hw-msg-notice-row" style="display:none;">
          <span class="hw-notice-icon" data-tooltip-title="Thông báo hệ thống"></span>
        </div>
        <div class="hw-ai-content" style="color:var(--hw-text-muted);">${Icons.sparkles(14)} Đang suy nghĩ & giải bài...</div>
        <div class="hw-msg-footer" style="display:none;">
          <button class="hw-copy-btn">${Icons.copy(12)} <span>Sao chép</span></button>
        </div>
      </div>
    `;

    body.appendChild(msgEl);
    body.scrollTop = body.scrollHeight;
    return msgEl;
  }

  // Notices (auto-fallback / key rotation / OCR pre-processing messages) are
  // kept out of the visible answer text — they collect into a small hover
  // icon instead, so they don't get confused with the AI's actual answer.
  updateNoticeIcon(bubbleEl, notices) {
    if (!bubbleEl || !notices || notices.length === 0) return;
    const row = bubbleEl.querySelector('.hw-msg-notice-row');
    const icon = bubbleEl.querySelector('.hw-notice-icon');
    if (!row || !icon) return;
    row.style.display = 'flex';
    icon.innerHTML = Icons.alertCircle(13);
    icon.setAttribute('data-tooltip-desc', notices.join('<br><br>'));
  }

  appendStreamChunk(chunk, meta) {
    if (meta?.notice) {
      if (this.activeTarget === 'card') {
        const fc = this.overlay.floatingCard;
        fc.activeCardNotices = fc.activeCardNotices || [];
        fc.activeCardNotices.push(meta.notice);
        fc.updateNoticeIcon?.(fc.activeCardNotices);
      } else {
        this.currentNotices = this.currentNotices || [];
        this.currentNotices.push(meta.notice);
        this.updateNoticeIcon(this.activeAiBubble, this.currentNotices);
      }
    }

    if (meta?.status === 'downloading') {
      const dict = this.currentDict || {};
      const pctTxt = meta.percent != null ? ` ${meta.percent}%` : '';
      const label = `${Icons.download(14)} ${dict.modelNanoDownloading || 'Downloading the on-device model'}${pctTxt}`;
      if (this.activeTarget === 'card') {
        this.overlay.floatingCard.stopLoadingSteps();
        const content = this.shadow.getElementById('hwCardAnswerContent');
        if (content) content.innerHTML = `<span style="color:var(--hw-text-muted);">${label}</span>`;
      } else if (this.activeAiBubble) {
        this.stopLoadingSteps();
        const content = this.activeAiBubble.querySelector('.hw-ai-content');
        if (content) content.innerHTML = `<span style="color:var(--hw-text-muted);">${label}</span>`;
      }
      return;
    }

    // ai-engine.js also calls onChunk('', {status: 'connecting'|'switching', ...})
    // as a status-only ping carrying no real text (e.g. right as a request starts,
    // or when failing over to another key). Those pings used to be treated as real
    // content, which stopped the loading animation and blanked the display with
    // formatMarkdownAndMath('') within milliseconds of the request starting — before
    // any actual answer text ever arrived. Only real, non-empty chunks should touch
    // the rendered content.
    if (!chunk) return;

    if (this.activeTarget === 'card') {
      this.overlay.floatingCard.stopLoadingSteps();
      this.overlay.floatingCard.activeCardResponseText += chunk;
      const content = this.shadow.getElementById('hwCardAnswerContent');
      if (content) {
        content.innerHTML = renderAnswer(
          this.overlay.floatingCard.activeCardResponseText,
          { allowMarkdownDict: content.classList.contains('hw-dict-mode') }
        );
      }
      return;
    }

    if (!this.activeAiBubble) return;

    this.stopLoadingSteps();
    this.currentDrawerResponseText += chunk;
    const content = this.activeAiBubble.querySelector('.hw-ai-content');
    if (content) {
      content.style.color = 'var(--hw-text-main)';
      content.innerHTML = renderAnswer(this.currentDrawerResponseText);
    }

    const body = this.shadow.getElementById('hwChatBody');
    if (body) body.scrollTop = body.scrollHeight;
  }

  async finalizeStream() {
    this.isStreaming = false;
    this.setSendButtonStreaming(false);
    Storage.set({ isNanoReady: true });
    this.updateActiveModelBadge();

    if (this.activeTarget === 'card') {
      this.overlay.floatingCard.stopLoadingSteps();
      this.overlay.floatingCard.syncSpeakButton();
      Storage.addChatMessage({ role: 'assistant', content: this.overlay.floatingCard.activeCardResponseText });
      return;
    }

    if (this.activeAiBubble) {
      this.stopLoadingSteps();
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
    this.setSendButtonStreaming(false);

    const errStr = String(err || '');

    if (this.activeTarget === 'card') {
      this.overlay.floatingCard.stopLoadingSteps();
      const content = this.shadow.getElementById('hwCardAnswerContent');
      if (content) {
        content.innerHTML = `
          <div style="background:rgba(var(--hw-danger-rgb), 0.1); border:1px solid rgba(var(--hw-danger-rgb), 0.35); border-radius:8px; padding:10px; color:var(--hw-danger); font-size:12px;">
            <div style="font-weight:700; margin-bottom:4px;">${Icons.alertCircle(14)} Error solving question</div>
            <div>${errStr}</div>
          </div>
        `;
      }
      return;
    }

    if (!this.activeAiBubble) return;
    this.stopLoadingSteps();
    const content = this.activeAiBubble.querySelector('.hw-ai-content');

    if (errStr.includes('NO_KEYS_NO_LOCAL_AI') || errStr.includes('CHROME_AI_UNAVAILABLE') || errStr.includes('QUOTA_EXHAUSTED')) {
      if (content) {
        content.innerHTML = `
          <div style="background:rgba(var(--hw-danger-rgb), 0.1); border:1px solid rgba(var(--hw-danger-rgb), 0.35); border-radius:8px; padding:10px; color:var(--hw-danger); font-size:12px;">
            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
              ${Icons.alertCircle(14)} Chưa có AI Sẵn sàng
            </div>
            <div>${errStr}</div>
            <div style="margin-top:8px; display:flex; gap:6px;">
              <button class="hw-btn-copy" id="hwErrBtnOpenKeys" style="background:#ef4444; color:#fff; font-size:11px; padding:3px 8px;">
                ${Icons.plus(11)} Thêm Key Miễn Phí
              </button>
              <button class="hw-btn-copy" id="hwErrBtnOpenOptions" style="background:transparent; border:1px solid var(--hw-danger); color:var(--hw-danger); font-size:11px; padding:3px 8px;">
                ${Icons.externalLink(11)} Xem Hướng Dẫn
              </button>
            </div>
          </div>
        `;

        content.querySelector('#hwErrBtnOpenKeys')?.addEventListener('click', () => this.overlay.configModal.open());
        content.querySelector('#hwErrBtnOpenOptions')?.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'guide' }));
      }
    } else if (content) {
      content.innerHTML = `<span style="color:var(--hw-danger);">${Icons.alertCircle(14)} ${err}</span>`;
    }
  }

  async loadInitialHistory() {
    const history = await Storage.getChatHistory();
    const body = this.shadow.getElementById('hwChatBody');
    if (!body) return;

    // toggle(true) fires this without awaiting it. If a message gets sent
    // while this storage fetch is still in flight, askAi() has already
    // appended a live user+AI bubble (and set isStreaming) by the time we
    // get here — wiping the body now would destroy that bubble and orphan
    // whatever appendStreamChunk is still writing into it.
    if (this.isStreaming) return;

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
            <div class="${msg.role === 'assistant' ? 'hw-ai-content' : ''}">${msg.role === 'assistant' ? renderAnswer(msg.content) : formatMarkdownAndMath(msg.content)}</div>
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
