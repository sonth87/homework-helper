/**
 * Native Side Panel Controller (ES Module)
 * Orchestrates chat interactions, streaming responses, KaTeX math rendering, and subcomponents.
 */

import { Icons } from '../shared/icons.js';
import { Storage, SUPPORTED_LANGUAGES } from '../shared/storage.js';
import { formatMarkdownAndMath } from '../shared/markdown-katex.js';
import { getI18n } from '../shared/i18n.js';
import { SidePanelTooltips } from './sidepanel-tooltips.js';
import { SidePanelKeysModal } from './sidepanel-keys-modal.js';
import { SidePanelHistory } from './sidepanel-history.js';

export class SidePanelController {
  constructor() {
    this.attachedImageBase64 = null;
    this.currentStudyMode = 'step-by-step';
    this.isStreaming = false;
    this.activeRequestId = null;
    this.activeAiBubble = null;
    this.currentResponseText = '';
    this.loadingStepsInterval = null;

    this.keysModal = new SidePanelKeysModal(this);
    this.historyModal = new SidePanelHistory(this);

    this.init();
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
        <span class="sp-loading-text">
          ${Icons.sparkles(14)} ${steps[idx % steps.length]}<span class="sp-animated-dots"><span>.</span><span>.</span><span>.</span></span>
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

  async init() {
    this.populateStaticIcons();
    this.setupEventListeners();
    SidePanelTooltips.init();
    await this.loadChatHistory();
    await this.applyLanguageI18n();
    await this.updateModelBadge();

    // Mutual exclusivity: Close in-page drawer if sidepanel is open
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'CLOSE_DRAWER' }).catch(() => {});
      }
    });
  }

  populateStaticIcons() {
    const setInner = (id, iconHtml) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = iconHtml;
    };

    setInner('spLogo', Icons.appLogo(24));
    setInner('spBtnNewChat', Icons.plus(16));
    setInner('spBtnHistory', Icons.history(16));
    setInner('spBtnSettings', Icons.settings(16));
    setInner('spBtnClear', Icons.trash(16));
    setInner('spBtnOptions', Icons.externalLink(16));
    setInner('spBtnCapture', `${Icons.scissors(14)} <span class="sp-btn-capture-label">Capture</span>`);
    setInner('spBtnUpload', Icons.image(15));
    setInner('spBtnRemoveThumb', Icons.x(12));
    setInner('spBtnSend', `<span>Ask AI</span> ${Icons.send(13)}`);
    setInner('spBtnCloseModal', Icons.x(16));
    setInner('spBtnCloseHistoryModal', Icons.x(16));
  }

  setupEventListeners() {
    const textarea = document.getElementById('spTextarea');
    const sendBtn = document.getElementById('spBtnSend');
    const fileInput = document.getElementById('spFileInput');

    // Send on button click or Enter key
    sendBtn?.addEventListener('click', () => this.handleSend());
    textarea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // File input & drag-and-drop
    document.getElementById('spBtnUpload')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
    document.getElementById('spBtnRemoveThumb')?.addEventListener('click', () => this.clearImagePreview());

    // Capture screenshot
    document.getElementById('spBtnCapture')?.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'START_CROP' }).catch(() => {});
      }
    });

    // Study mode & Language selectors
    const modeSelect = document.getElementById('spSelectMode');
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

    const langSelect = document.getElementById('spSelectLang');
    if (langSelect) {
      Storage.get(['outputLanguage']).then(({ outputLanguage = 'en' }) => {
        langSelect.value = outputLanguage;
      });
      langSelect.addEventListener('change', (e) => {
        Storage.set({ outputLanguage: e.target.value });
      });
    }

    // Header buttons
    document.getElementById('spBtnClear')?.addEventListener('click', async () => {
      await Storage.clearChatHistory();
      const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
      const dict = getI18n(uiLanguage);
      const chatBody = document.getElementById('spChatBody');
      if (chatBody) {
        const chipsHtml = (dict.chips || []).map(
          (c) => `<button class="sp-chip" data-query="${c.query}">${c.label}</button>`
        ).join('');
        chatBody.innerHTML = `
          <div class="sp-msg sp-msg-ai">
            <div class="sp-msg-bubble">
              <div id="spWelcomeText">${dict.welcomeText}</div>
              <div class="sp-chips" id="spChipsContainer">
                ${chipsHtml}
              </div>
            </div>
          </div>
        `;
      }
    });

    // New Chat button
    document.getElementById('spBtnNewChat')?.addEventListener('click', async () => {
      await Storage.createNewConversation();
      await this.loadChatHistory();
      await this.applyLanguageI18n();
    });

    // Modals
    document.getElementById('spBtnSettings')?.addEventListener('click', () => this.keysModal.open());
    document.getElementById('spBtnCloseModal')?.addEventListener('click', () => {
      document.getElementById('spModal').style.display = 'none';
    });

    document.getElementById('spBtnHistory')?.addEventListener('click', () => this.historyModal.open());
    document.getElementById('spBtnCloseHistoryModal')?.addEventListener('click', () => {
      document.getElementById('spHistoryModal').style.display = 'none';
    });

    document.getElementById('spBtnOptions')?.addEventListener('click', () => chrome.runtime.openOptionsPage());

    // Listen for AI responses from background worker
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'AI_STREAM_CHUNK') {
        if (msg.requestId === this.activeRequestId) {
          this.appendChunk(msg.chunk, msg.meta);
        }
      } else if (msg.action === 'AI_STREAM_COMPLETE') {
        if (msg.requestId === this.activeRequestId) {
          this.finalizeStream();
        }
      } else if (msg.action === 'AI_STREAM_ERROR') {
        if (msg.requestId === this.activeRequestId) {
          this.handleError(msg.error);
        }
      } else if (msg.action === 'OCR_RESULT') {
        if (msg.payload?.text) {
          const textareaEl = document.getElementById('spTextarea');
          if (textareaEl) textareaEl.value = msg.payload.text;
        }
      }
    });

    // Delegate chip clicks
    document.getElementById('spChatBody')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.sp-chip');
      if (chip) {
        const query = chip.getAttribute('data-query');
        if (query) {
          this.askAi({ prompt: query });
        }
      }
    });

    // Listen for storage changes
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          if (changes.apiConfigs || changes.activeConfigId || changes.isNanoReady) {
            this.updateModelBadge();
          }
          if (changes.uiLanguage) {
            this.applyLanguageI18n(changes.uiLanguage.newValue);
          }
        }
      });
    }
  }

  async updateModelBadge() {
    const { apiConfigs = [], activeConfigId, rotationStrategy } = await Storage.getApiConfigs();
    const { isNanoReady } = await Storage.get(['isNanoReady']);
    const tag = document.getElementById('spModelTag');
    if (!tag) return;

    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const dict = getI18n(uiLanguage);
    const enabledCount = apiConfigs.filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin')).length;

    if (enabledCount === 0) {
      let isReady = !!isNanoReady;
      try {
        if (!isReady) {
          if (typeof chrome !== 'undefined' && chrome.aiOriginTrial?.languageModel) {
            isReady = true;
          } else if (typeof ai !== 'undefined' && ai?.languageModel) {
            isReady = true;
          }
        }
      } catch (e) {
        if (typeof chrome !== 'undefined' && chrome.aiOriginTrial?.languageModel) {
          isReady = true;
        }
      }

      if (isReady) {
        Storage.set({ isNanoReady: true });
        tag.innerHTML = `${Icons.cpu(12)} ${dict.modelNanoReady || 'Chrome Gemini Nano (Ready On-Device)'}`;
        tag.style.background = 'rgba(34, 197, 94, 0.15)';
        tag.style.color = '#16a34a';
        tag.style.border = '1px solid rgba(34, 197, 94, 0.3)';
        tag.style.cursor = 'default';
        tag.title = '';
        tag.onclick = null;
      } else {
        tag.innerHTML = `${Icons.alertCircle(12)} ${dict.modelNanoSetup || 'Chrome Gemini Nano (Setup Required)'}`;
        tag.style.background = 'rgba(234, 179, 8, 0.15)';
        tag.style.color = '#a16207';
        tag.style.border = '1px solid rgba(234, 179, 8, 0.4)';
        tag.style.cursor = 'pointer';
        tag.title = dict.modelNanoClick || 'Click to view guide in Settings';
        tag.onclick = () => {
          chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'builtin-nano' });
        };
      }
    } else if (activeConfigId === 'auto') {
      tag.innerHTML = `${Icons.layers(12)} ${dict.modelAutoRotate || 'Auto-Rotate'} (${enabledCount} keys)`;
      tag.style.background = 'rgba(2, 132, 199, 0.12)';
      tag.style.color = '#0284c7';
      tag.style.border = 'none';
      tag.style.cursor = 'default';
      tag.title = '';
      tag.onclick = null;
    } else {
      const selected = apiConfigs.find((c) => c.id === activeConfigId);
      tag.innerHTML = `${Icons.bot(12)} ${selected?.model || 'Custom'}`;
      tag.style.background = 'rgba(34, 197, 94, 0.12)';
      tag.style.color = '#16a34a';
      tag.style.border = 'none';
      tag.style.cursor = 'default';
      tag.title = '';
      tag.onclick = null;
    }
  }

  handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.attachedImageBase64 = reader.result;
      document.getElementById('spThumb').src = reader.result;
      document.getElementById('spImgPreview').style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  clearImagePreview() {
    this.attachedImageBase64 = null;
    document.getElementById('spImgPreview').style.display = 'none';
    const input = document.getElementById('spFileInput');
    if (input) input.value = '';
  }

  async handleSend() {
    const textarea = document.getElementById('spTextarea');
    const text = textarea?.value.trim() || '';
    const img = this.attachedImageBase64;

    if (!text && !img) return;
    if (this.isStreaming) return;

    if (textarea) textarea.value = '';
    this.attachedImageBase64 = null;
    document.getElementById('spImgPreview').style.display = 'none';

    this.askAi({ prompt: text || 'Please solve this attached question:', imageBase64: img });
  }

  async askAi({ prompt, imageBase64 = null }) {
    this.appendUserMessage(prompt, imageBase64);

    this.activeAiBubble = this.createAiBubble();
    this.currentResponseText = '';
    this.currentNotices = [];
    this.isStreaming = true;
    this.activeRequestId = `req_${Date.now()}`;
    const btnSend = document.getElementById('spBtnSend');
    if (btnSend) btnSend.disabled = true;

    const { outputLanguage = 'en', uiLanguage = 'en' } = await Storage.get(['outputLanguage', 'uiLanguage']);
    const dict = getI18n(uiLanguage);
    this.startLoadingSteps(this.activeAiBubble?.querySelector('.sp-ai-content'), dict.loadingSteps);

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
    const body = document.getElementById('spChatBody');
    if (!body) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'sp-msg sp-msg-user';

    let imgHtml = imageBase64 ? `<img src="${imageBase64}" class="sp-msg-img" alt="Attached">` : '';
    msgEl.innerHTML = `
      <div class="sp-msg-bubble">
        ${imgHtml}
        <div>${formatMarkdownAndMath(text)}</div>
      </div>
    `;

    body.appendChild(msgEl);
    body.scrollTop = body.scrollHeight;

    Storage.addChatMessage({ role: 'user', content: text, image: imageBase64 });
  }

  createAiBubble() {
    const body = document.getElementById('spChatBody');
    if (!body) return null;
    const msgEl = document.createElement('div');
    msgEl.className = 'sp-msg sp-msg-ai';

    msgEl.innerHTML = `
      <div class="sp-msg-bubble">
        <div class="sp-msg-notice-row" style="display:none;">
          <span class="sp-notice-icon" data-tooltip-title="Thông báo hệ thống"></span>
        </div>
        <div class="sp-ai-content" style="color:var(--text-muted);">${Icons.sparkles(14)} Đang suy nghĩ & giải bài...</div>
        <div class="sp-msg-footer" style="display:none;">
          <button class="sp-copy-btn">${Icons.copy(12)} <span>Sao chép</span></button>
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
    const row = bubbleEl.querySelector('.sp-msg-notice-row');
    const icon = bubbleEl.querySelector('.sp-notice-icon');
    if (!row || !icon) return;
    row.style.display = 'flex';
    icon.innerHTML = Icons.alertCircle(13);
    icon.setAttribute('data-tooltip-desc', notices.join('<br><br>'));
  }

  appendChunk(chunk, meta) {
    if (!this.activeAiBubble) return;

    if (meta?.notice) {
      this.currentNotices = this.currentNotices || [];
      this.currentNotices.push(meta.notice);
      this.updateNoticeIcon(this.activeAiBubble, this.currentNotices);
    }

    // ai-engine.js also sends onChunk('', {status: 'connecting'|'switching', ...})
    // as a status-only ping with no real text. Rendering that would blank the
    // placeholder with formatMarkdownAndMath('') before any real answer arrives.
    if (!chunk) return;

    this.stopLoadingSteps();
    this.currentResponseText += chunk;
    const content = this.activeAiBubble.querySelector('.sp-ai-content');
    if (content) {
      content.style.color = 'inherit';
      content.innerHTML = formatMarkdownAndMath(this.currentResponseText);
    }

    const body = document.getElementById('spChatBody');
    if (body) body.scrollTop = body.scrollHeight;
  }

  async finalizeStream() {
    this.isStreaming = false;
    const btnSend = document.getElementById('spBtnSend');
    if (btnSend) btnSend.disabled = false;
    Storage.set({ isNanoReady: true });
    this.updateModelBadge();

    if (this.activeAiBubble) {
      this.stopLoadingSteps();
      const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
      const dict = getI18n(uiLanguage);
      const footer = this.activeAiBubble.querySelector('.sp-msg-footer');
      if (footer) footer.style.display = 'flex';

      const copyBtn = this.activeAiBubble.querySelector('.sp-copy-btn');
      if (copyBtn) {
        copyBtn.innerHTML = `${Icons.copy(12)} <span>${dict.copyBtn || 'Sao chép'}</span>`;
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(this.currentResponseText);
          copyBtn.innerHTML = `${Icons.check(12)} <span>${dict.copiedBtn || 'Đã sao chép!'}</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = `${Icons.copy(12)} <span>${dict.copyBtn || 'Sao chép'}</span>`;
          }, 2000);
        };
      }

      Storage.addChatMessage({ role: 'assistant', content: this.currentResponseText });
    }
  }

  async applyLanguageI18n(lang = null) {
    const { uiLanguage = 'vi', outputLanguage = 'en' } = await Storage.get(['uiLanguage', 'outputLanguage']);
    const currentLang = lang || uiLanguage;
    const dict = getI18n(currentLang);

    const textarea = document.getElementById('spTextarea');
    const sendBtn = document.getElementById('spBtnSend');
    const captureBtn = document.getElementById('spBtnCapture');
    const hintSpan = document.querySelector('.sp-hint');
    const aiDisclaimer = document.getElementById('spAiDisclaimer');
    const welcomeText = document.getElementById('spWelcomeText');
    const chipsContainer = document.getElementById('spChipsContainer');
    const modeSelect = document.getElementById('spSelectMode');
    const langSelect = document.getElementById('spSelectLang');

    if (textarea) textarea.placeholder = dict.placeholder;
    if (sendBtn) sendBtn.innerHTML = `<span>${dict.askAiBtn}</span> ${Icons.send(13)}`;
    if (captureBtn) captureBtn.innerHTML = `${Icons.scissors(14)} <span class="sp-btn-capture-label">${dict.captureBtn}</span>`;
    if (hintSpan) hintSpan.textContent = dict.shiftEnterHint;
    if (aiDisclaimer) aiDisclaimer.textContent = dict.aiDisclaimer;
    if (welcomeText) welcomeText.textContent = dict.welcomeText;

    if (langSelect) {
      const curVal = langSelect.value || outputLanguage;
      langSelect.innerHTML = SUPPORTED_LANGUAGES.map(
        (l) => `<option value="${l.id}" ${l.id === curVal ? 'selected' : ''}>${l.name}</option>`
      ).join('');
    }

    if (chipsContainer && dict.chips) {
      chipsContainer.innerHTML = dict.chips.map(
        (c) => `<button class="sp-chip" data-query="${c.query}">${c.label}</button>`
      ).join('');
    }

    if (modeSelect && dict.modes) {
      const currentVal = modeSelect.value;
      modeSelect.innerHTML = Object.entries(dict.modes).map(
        ([k, v]) => `<option value="${k}" ${k === currentVal ? 'selected' : ''}>${v}</option>`
      ).join('');
    }

    const activeConvTitle = document.getElementById('spActiveConvTitle');
    if (activeConvTitle && (!activeConvTitle.textContent || activeConvTitle.textContent === 'Đoạn chat mới' || activeConvTitle.textContent === 'New Chat')) {
      activeConvTitle.textContent = dict.newChat;
    }

    // Modal titles
    const modalTitle = document.getElementById('spModalTitle');
    if (modalTitle) modalTitle.innerHTML = `${Icons.settings(16)} ${dict.modalConfigTitle || 'Cấu hình AI Models & API Keys'}`;
    const historyModalTitle = document.getElementById('spHistoryModalTitle');
    if (historyModalTitle) historyModalTitle.innerHTML = `${Icons.history(16)} ${dict.historyTitle || 'Lịch sử các hội thoại'}`;

    // Update tooltips
    if (dict.tooltips) {
      const t = dict.tooltips;
      document.getElementById('spBtnNewChat')?.setAttribute('data-tooltip-title', t.newChat?.title || dict.newChat);
      document.getElementById('spBtnNewChat')?.setAttribute('data-tooltip-desc', t.newChat?.desc || '');

      document.getElementById('spBtnHistory')?.setAttribute('data-tooltip-title', t.history?.title || dict.historyTitle);
      document.getElementById('spBtnHistory')?.setAttribute('data-tooltip-desc', t.history?.desc || '');

      document.getElementById('spBtnSettings')?.setAttribute('data-tooltip-title', t.settings?.title || 'Cài đặt Key & Model');
      document.getElementById('spBtnSettings')?.setAttribute('data-tooltip-desc', t.settings?.desc || 'Quản lý danh sách API Key và cơ chế xoay vòng thông minh.');

      document.getElementById('spBtnClear')?.setAttribute('data-tooltip-title', t.clear?.title || 'Xóa đoạn chat');
      document.getElementById('spBtnClear')?.setAttribute('data-tooltip-desc', t.clear?.desc || 'Xóa hội thoại hiện tại.');

      document.getElementById('spBtnOptions')?.setAttribute('data-tooltip-title', t.options?.title || 'Trang Cài đặt & Cấu hình');
      document.getElementById('spBtnOptions')?.setAttribute('data-tooltip-desc', t.options?.desc || 'Mở trang cài đặt chi tiết để quản lý API Key, bật AI nội bộ và tùy biến giao diện.');

      document.getElementById('spBtnCapture')?.setAttribute('data-tooltip-title', t.capture?.title || 'Chụp màn hình (Alt+C)');
      document.getElementById('spBtnCapture')?.setAttribute('data-tooltip-desc', t.capture?.desc || 'Khoanh vùng bài tập hoặc đồ thị trên màn hình để giải ngay lập tức.');

      document.getElementById('spBtnUpload')?.setAttribute('data-tooltip-title', t.upload?.title || 'Tải ảnh bài tập');
      document.getElementById('spBtnUpload')?.setAttribute('data-tooltip-desc', t.upload?.desc || 'Đính kèm file hình ảnh bài tập từ máy tính.');

      document.getElementById('spSelectLang')?.setAttribute('data-tooltip-title', t.lang?.title || 'Ngôn ngữ phản hồi');
      document.getElementById('spSelectLang')?.setAttribute('data-tooltip-desc', t.lang?.desc || 'AI sẽ tự động giải bài và trả lời bằng ngôn ngữ này.');

      document.getElementById('spSelectMode')?.setAttribute('data-tooltip-title', t.mode?.title || 'Chế độ giải bài');
      document.getElementById('spSelectMode')?.setAttribute('data-tooltip-desc', t.mode?.desc || 'Chọn kiểu phản hồi: Từng bước, Đáp án ngay, Gợi ý, hoặc Giải thích sâu lý thuyết.');
    }
  }

  async handleError(err) {
    this.isStreaming = false;
    const btnSend = document.getElementById('spBtnSend');
    if (btnSend) btnSend.disabled = false;

    if (!this.activeAiBubble) return;
    this.stopLoadingSteps();
    const content = this.activeAiBubble.querySelector('.sp-ai-content');

    const errStr = String(err || '');
    if (errStr.includes('NO_KEYS_NO_LOCAL_AI') || errStr.includes('CHROME_AI_UNAVAILABLE') || errStr.includes('QUOTA_EXHAUSTED')) {
      content.innerHTML = `
        <div style="background:rgba(239, 68, 68, 0.08); border:1px solid rgba(239, 68, 68, 0.25); border-radius:8px; padding:10px; color:#ef4444; font-size:12px;">
          <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
            ${Icons.alertCircle(14)} Chưa có AI Sẵn sàng
          </div>
          <div>${errStr}</div>
          <div style="margin-top:8px; display:flex; gap:6px;">
            <button class="sp-copy-btn" id="spErrBtnOpenKeys" style="background:#ef4444; color:#fff; font-size:11px; padding:3px 8px;">
              ${Icons.plus(11)} Thêm Key Miễn Phí
            </button>
            <button class="sp-copy-btn" id="spErrBtnOpenOptions" style="background:transparent; border:1px solid #ef4444; color:#ef4444; font-size:11px; padding:3px 8px;">
              ${Icons.externalLink(11)} Xem Hướng Dẫn
            </button>
          </div>
        </div>
      `;

      content.querySelector('#spErrBtnOpenKeys')?.addEventListener('click', () => this.keysModal.open());
      content.querySelector('#spErrBtnOpenOptions')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
    } else {
      content.innerHTML = `<span style="color:#ef4444;">${Icons.alertCircle(14)} ${err}</span>`;
    }
  }

  async loadChatHistory() {
    const history = await Storage.getChatHistory();
    const body = document.getElementById('spChatBody');
    if (!body) return;

    body.innerHTML = '';

    const { activeConversationId } = await Storage.get(['activeConversationId']);
    const convs = await Storage.getConversations();
    const activeConv = convs.find((c) => c.id === activeConversationId);
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const dict = getI18n(uiLanguage);

    const titleEl = document.getElementById('spActiveConvTitle');
    if (titleEl) {
      titleEl.textContent = activeConv?.title || 'New Chat';
    }

    if (history.length > 0) {
      history.forEach((msg) => {
        const el = document.createElement('div');
        el.className = `sp-msg ${msg.role === 'user' ? 'sp-msg-user' : 'sp-msg-ai'}`;

        let imgHtml = msg.image ? `<img src="${msg.image}" class="sp-msg-img" alt="Attached">` : '';
        let footerHtml =
          msg.role === 'assistant'
            ? `<div class="sp-msg-footer"><button class="sp-copy-btn">${Icons.copy(12)} <span>${dict.copyBtn || 'Sao chép'}</span></button></div>`
            : '';

        el.innerHTML = `
          <div class="sp-msg-bubble">
            ${imgHtml}
            <div class="${msg.role === 'assistant' ? 'sp-ai-content' : ''}">${formatMarkdownAndMath(msg.content)}</div>
            ${footerHtml}
          </div>
        `;

        if (msg.role === 'assistant') {
          const copyBtn = el.querySelector('.sp-copy-btn');
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
        (c) => `<button class="sp-chip" data-query="${c.query}">${c.label}</button>`
      ).join('');

      body.innerHTML = `
        <div class="sp-msg sp-msg-ai">
          <div class="sp-msg-bubble">
            <div id="spWelcomeText">${dict.welcomeText}</div>
            <div class="sp-chips" id="spChipsContainer">
              ${chipsHtml}
            </div>
          </div>
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanelController();
});
