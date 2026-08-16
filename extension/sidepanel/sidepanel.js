/**
 * Native Side Panel Controller
 * Handles chat interactions, streaming responses, KaTeX math parsing, and key rotation config modal.
 */

import { Icons } from '../shared/icons.js';
import { Storage, DEFAULT_PROVIDERS } from '../shared/storage.js';
import { formatMarkdownAndMath } from '../shared/markdown-katex.js';
import { getI18n } from '../shared/i18n.js';

class SidePanelController {
  constructor() {
    this.attachedImageBase64 = null;
    this.currentStudyMode = 'step-by-step';
    this.isStreaming = false;
    this.activeRequestId = null;
    this.activeAiBubble = null;
    this.currentResponseText = '';

    this.init();
  }

  async init() {
    this.populateStaticIcons();
    this.setupEventListeners();
    this.setupRichTooltips();
    await this.applyLanguageI18n();
    await this.updateModelBadge();
    await this.loadChatHistory();

    // Mutual exclusivity: Close in-page drawer if sidepanel is open
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'CLOSE_DRAWER' }).catch(() => {});
      }
    });
  }

  populateStaticIcons() {
    document.getElementById('spLogo').innerHTML = Icons.appLogo(24);
    document.getElementById('spBtnNewChat').innerHTML = Icons.plus(16);
    document.getElementById('spBtnHistory').innerHTML = Icons.history(16);
    document.getElementById('spBtnSettings').innerHTML = Icons.settings(16);
    document.getElementById('spBtnClear').innerHTML = Icons.trash(16);
    document.getElementById('spBtnOptions').innerHTML = Icons.externalLink(16);
    document.getElementById('spBtnCapture').innerHTML = `${Icons.scissors(14)} Capture`;
    document.getElementById('spBtnUpload').innerHTML = Icons.image(15);
    document.getElementById('spBtnRemoveThumb').innerHTML = Icons.x(12);
    document.getElementById('spBtnSend').innerHTML = `<span>Ask AI</span> ${Icons.send(13)}`;
    document.getElementById('spModalTitle').innerHTML = `${Icons.settings(16)} Model & API Key Configuration`;
    document.getElementById('spBtnCloseModal').innerHTML = Icons.x(16);
    document.getElementById('spHistoryModalTitle').innerHTML = `${Icons.history(16)} Lịch sử các hội thoại`;
    document.getElementById('spBtnCloseHistoryModal').innerHTML = Icons.x(16);
  }

  setupEventListeners() {
    const textarea = document.getElementById('spTextarea');
    const sendBtn = document.getElementById('spBtnSend');
    const fileInput = document.getElementById('spFileInput');

    // Send on button click or Enter key
    sendBtn.addEventListener('click', () => this.handleSend());
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // File input & drag-and-drop
    document.getElementById('spBtnUpload').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
    document.getElementById('spBtnRemoveThumb').addEventListener('click', () => this.clearImagePreview());

    // Capture screenshot
    document.getElementById('spBtnCapture').addEventListener('click', async () => {
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
    document.getElementById('spBtnClear').addEventListener('click', async () => {
      await Storage.clearChatHistory();
      const { outputLanguage = 'en' } = await Storage.get(['outputLanguage']);
      const dict = getI18n(outputLanguage);
      document.getElementById('spChatBody').innerHTML = `
        <div class="sp-msg sp-msg-ai">
          <div class="sp-msg-bubble">
            ${dict.chatCleared}
          </div>
        </div>
      `;
    });

    // New Chat button
    document.getElementById('spBtnNewChat').addEventListener('click', async () => {
      await Storage.createNewConversation('Đoạn chat mới');
      document.getElementById('spHistoryModal').style.display = 'none';
      document.getElementById('spTextarea').value = '';
      this.clearImagePreview();
      await this.loadChatHistory();
      this.showToast('Đã bắt đầu đoạn chat mới');
      document.getElementById('spTextarea').focus();
    });

    // History button -> Opens History Modal with past questions
    document.getElementById('spBtnHistory').addEventListener('click', () => {
      this.openHistoryModal();
    });

    document.getElementById('spBtnCloseHistoryModal').addEventListener('click', () => {
      document.getElementById('spHistoryModal').style.display = 'none';
    });

    document.getElementById('spBtnOptions').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Model bar / tag click -> Opens Model & Key Settings Modal
    document.getElementById('spModelBar')?.addEventListener('click', () => this.openSettingsModal());

    // Settings Modal
    document.getElementById('spBtnSettings')?.addEventListener('click', () => this.openSettingsModal());
    document.getElementById('spBtnCloseModal')?.addEventListener('click', () => {
      const modal = document.getElementById('spModal');
      if (modal) modal.style.display = 'none';
      this.updateModelBadge();
    });

    // Close modal when clicking on backdrop
    document.getElementById('spModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'spModal') {
        document.getElementById('spModal').style.display = 'none';
        this.updateModelBadge();
      }
    });

    document.getElementById('spHistoryModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'spHistoryModal') {
        document.getElementById('spHistoryModal').style.display = 'none';
      }
    });

    // Chips delegation
    document.getElementById('spChatBody').addEventListener('click', (e) => {
      const chip = e.target.closest('.sp-chip');
      if (chip) {
        const q = chip.getAttribute('data-query');
        if (q) {
          textarea.value = q;
          this.handleSend();
        }
      }
    });

    // Stream listener
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'AI_STREAM_CHUNK' && msg.requestId === this.activeRequestId) {
        this.appendChunk(msg.chunk, msg.meta);
      } else if (msg.action === 'AI_STREAM_COMPLETE' && msg.requestId === this.activeRequestId) {
        this.finalizeStream();
      } else if (msg.action === 'AI_STREAM_ERROR' && msg.requestId === this.activeRequestId) {
        this.handleError(msg.error);
      } else if (msg.action === 'QUICK_ASK_TEXT' && msg.text) {
        textarea.value = msg.text;
        this.handleSend();
      }
    });

    // Real-time sync with popup actions and options
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          if (changes.uiLanguage) {
            this.applyLanguageI18n(changes.uiLanguage.newValue);
          }
          if ((changes.chatHistory || changes.activeConversationId || changes.conversations) && !this.isStreaming) {
            this.loadChatHistory();
          }
          if (changes.isNanoReady || changes.apiConfigs) {
            this.updateModelBadge();
          }
        }
      });
    }
  }

  async updateModelBadge() {
    const { apiConfigs = [], activeConfigId, rotationStrategy } = await Storage.getApiConfigs();
    const { isNanoReady } = await Storage.get(['isNanoReady']);
    const tag = document.getElementById('spModelTag');
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const dict = getI18n(uiLanguage);

    if (enabledCount === 0) {
      let isReady = !!isNanoReady;
      try {
        if (!isReady) {
          if (typeof chrome !== 'undefined' && chrome.aiOriginTrial?.languageModel) {
            isReady = true;
          } else if (typeof ai !== 'undefined' && ai?.languageModel) {
            isReady = true;
          } else {
            const tabs = await chrome.tabs.query({ url: ['https://*/*', 'http://*/*'] });
            if (tabs && tabs.length > 0) {
              const targetTab = tabs.find((t) => t.active) || tabs[0];
              if (targetTab?.id) {
                const results = await chrome.scripting.executeScript({
                  target: { tabId: targetTab.id },
                  world: 'MAIN',
                  func: async () => {
                    const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
                    return !!(g.ai?.languageModel || g.ai?.assistant || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null));
                  },
                });
                isReady = !!results?.[0]?.result;
              }
            }
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
    const text = textarea.value.trim();
    const img = this.attachedImageBase64;

    if (!text && !img) return;
    if (this.isStreaming) return;

    textarea.value = '';
    this.attachedImageBase64 = null;
    document.getElementById('spImgPreview').style.display = 'none';

    this.askAi({ prompt: text || 'Please solve this attached question:', imageBase64: img });
  }

  async askAi({ prompt, imageBase64 = null }) {
    this.appendUserMessage(prompt, imageBase64);

    this.activeAiBubble = this.createAiBubble();
    this.currentResponseText = '';
    this.isStreaming = true;
    this.activeRequestId = `req_${Date.now()}`;
    document.getElementById('spBtnSend').disabled = true;

    const { outputLanguage = 'en' } = await Storage.get(['outputLanguage']);

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
    const msgEl = document.createElement('div');
    msgEl.className = 'sp-msg sp-msg-ai';

    msgEl.innerHTML = `
      <div class="sp-msg-bubble">
        <div class="sp-ai-content" style="color:var(--text-muted);">${Icons.sparkles(14)} Solving & Analyzing...</div>
        <div class="sp-msg-footer" style="display:none;">
          <button class="sp-copy-btn">${Icons.copy(12)} Copy</button>
        </div>
      </div>
    `;

    body.appendChild(msgEl);
    body.scrollTop = body.scrollHeight;
    return msgEl;
  }

  appendChunk(chunk, meta) {
    if (!this.activeAiBubble) return;

    this.currentResponseText += chunk;
    const content = this.activeAiBubble.querySelector('.sp-ai-content');
    content.style.color = 'inherit';
    content.innerHTML = formatMarkdownAndMath(this.currentResponseText);

    const body = document.getElementById('spChatBody');
    body.scrollTop = body.scrollHeight;
  }

  finalizeStream() {
    this.isStreaming = false;
    document.getElementById('spBtnSend').disabled = false;
    Storage.set({ isNanoReady: true });
    this.updateModelBadge();

    if (this.activeAiBubble) {
      const footer = this.activeAiBubble.querySelector('.sp-msg-footer');
      if (footer) footer.style.display = 'flex';

      const copyBtn = this.activeAiBubble.querySelector('.sp-copy-btn');
      copyBtn?.addEventListener('click', () => {
        navigator.clipboard.writeText(this.currentResponseText);
        copyBtn.innerHTML = `${Icons.check(12)} Copied!`;
        setTimeout(() => {
          copyBtn.innerHTML = `${Icons.copy(12)} Copy`;
        }, 2000);
      });

      Storage.addChatMessage({ role: 'assistant', content: this.currentResponseText });
    }
  }

  setupRichTooltips() {
    let tooltipEl = document.getElementById('spTooltipPopup');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'spTooltipPopup';
      tooltipEl.className = 'sp-rich-tooltip';
      document.body.appendChild(tooltipEl);
    }

    const showTooltip = (el) => {
      const title = el.getAttribute('data-tooltip-title') || el.getAttribute('title');
      const desc = el.getAttribute('data-tooltip-desc') || '';
      if (!title && !desc) return;

      tooltipEl.innerHTML = `
        ${title ? `<div class="sp-tooltip-title">${title}</div>` : ''}
        ${desc ? `<div class="sp-tooltip-desc">${desc}</div>` : ''}
      `;

      tooltipEl.style.display = 'block';
      tooltipEl.style.visibility = 'hidden';
      tooltipEl.classList.remove('show');

      const tooltipHeight = tooltipEl.offsetHeight || 44;
      const tooltipWidth = Math.min(260, Math.max(160, tooltipEl.offsetWidth || 180));

      const rect = el.getBoundingClientRect();
      let top;
      if (rect.top < 90) {
        // Place BELOW
        top = rect.bottom + 8;
      } else {
        // Place ABOVE
        top = rect.top - tooltipHeight - 8;
      }

      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      if (left + tooltipWidth > window.innerWidth - 12) {
        left = window.innerWidth - tooltipWidth - 12;
      }
      if (left < 8) {
        left = 8;
      }

      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.visibility = 'visible';
      tooltipEl.classList.add('show');
    };

    const hideTooltip = () => {
      tooltipEl.classList.remove('show');
    };

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip-title]');
      if (target) {
        showTooltip(target);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip-title]');
      const related = e.relatedTarget ? e.relatedTarget.closest('[data-tooltip-title]') : null;
      if (target && target !== related) {
        hideTooltip();
      }
    });

    // Also hide on click
    document.addEventListener('click', () => hideTooltip());
  }

  async applyLanguageI18n(lang = null) {
    const { uiLanguage = 'vi', outputLanguage = 'en' } = await Storage.get(['uiLanguage', 'outputLanguage']);
    const currentLang = lang || uiLanguage;
    const dict = getI18n(currentLang);

    const textarea = document.getElementById('spTextarea');
    const sendBtn = document.getElementById('spBtnSend');
    const captureBtn = document.getElementById('spBtnCapture');
    const hintSpan = document.querySelector('.sp-hint');
    const welcomeText = document.getElementById('spWelcomeText');
    const chipsContainer = document.getElementById('spChipsContainer');
    const modeSelect = document.getElementById('spSelectMode');

    if (textarea) textarea.placeholder = dict.placeholder;
    if (sendBtn) sendBtn.innerHTML = `<span>${dict.askAiBtn}</span> ${Icons.send(13)}`;
    if (captureBtn) captureBtn.innerHTML = `${Icons.scissors(14)} ${dict.captureBtn}`;
    if (hintSpan) hintSpan.textContent = dict.shiftEnterHint;
    if (welcomeText) welcomeText.textContent = dict.welcomeText;

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
    if (modalTitle) modalTitle.innerHTML = `${Icons.settings(16)} ${dict.tooltips?.settings?.title || 'Model & API Key Configuration'}`;
    const historyModalTitle = document.getElementById('spHistoryModalTitle');
    if (historyModalTitle) historyModalTitle.innerHTML = `${Icons.history(16)} ${dict.historyTitle || 'Chat History'}`;

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
    document.getElementById('spBtnSend').disabled = false;

    if (!this.activeAiBubble) return;
    const content = this.activeAiBubble.querySelector('.sp-ai-content');

    const errStr = String(err || '');
    const isNanoError = errStr.includes('Gemini Nano') || errStr.includes('prompt-api') || errStr.includes('Optimization Guide');
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const isVi = uiLanguage === 'vi';

    if (isNanoError) {
      content.innerHTML = `
        <div class="sp-nano-guide-card">
          <div class="sp-nano-guide-header">
            ${Icons.cpu(16)} <span>${isVi ? 'Hướng dẫn Kích hoạt Chrome Gemini Nano (Local AI)' : 'Chrome Gemini Nano Activation Guide (Local AI)'}</span>
          </div>
          <div class="sp-nano-steps">
            <div class="sp-nano-step">
              <span class="sp-step-num">1</span>
              <div>${isVi ? 'Bật cờ' : 'Enable flag'} <strong>Prompt API</strong>:
                <button class="sp-btn-mini-flags" id="spBtnFlagPromptApi">${Icons.externalLink(11)} ${isVi ? 'Mở #prompt-api' : 'Open #prompt-api'}</button>
              </div>
            </div>
            <div class="sp-nano-step">
              <span class="sp-step-num">2</span>
              <div>${isVi ? 'Bật cờ' : 'Set flag'} <strong>Optimization Guide</strong> ${isVi ? 'sang' : 'to'} <em>Enabled BypassPerfRequirement</em>:
                <button class="sp-btn-mini-flags" id="spBtnFlagOptGuide">${Icons.externalLink(11)} ${isVi ? 'Mở #optimization-guide' : 'Open #optimization-guide'}</button>
              </div>
            </div>
            <div class="sp-nano-step">
              <span class="sp-step-num">3</span>
              <div>${isVi ? 'Nhấn <strong>Relaunch</strong> ở góc dưới để khởi động lại Chrome.' : 'Click <strong>Relaunch</strong> to restart Chrome.'}</div>
            </div>
            <div class="sp-nano-step">
              <span class="sp-step-num">4</span>
              <div>${isVi ? 'Tải model tại <strong>chrome://components</strong> (nhấn Check for update):' : 'Download model at <strong>chrome://components</strong> (Click Check for update):'}
                <button class="sp-btn-mini-flags" id="spBtnOpenCompTab">${Icons.externalLink(11)} ${isVi ? 'Mở components' : 'Open components'}</button>
              </div>
            </div>
          </div>
          <div class="sp-nano-guide-footer">
            <button class="sp-btn-mini-options" id="spBtnAddKeyFallback">
              ${Icons.plus(12)} ${isVi ? 'Hoặc thêm API Key Miễn phí (Gemini / Groq)' : 'Or Add Free Cloud Key (Gemini / Groq)'}
            </button>
          </div>
        </div>
      `;

      content.querySelector('#spBtnFlagPromptApi')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api-for-gemini-nano' });
      });

      content.querySelector('#spBtnFlagOptGuide')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#optimization-guide-on-device-model' });
      });

      content.querySelector('#spBtnOpenCompTab')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://components' });
      });

      content.querySelector('#spBtnAddKeyFallback')?.addEventListener('click', () => {
        this.openSettingsModal();
      });
    } else {
      content.innerHTML = `
        <div style="color: #ef4444; display:flex; align-items:center; gap:6px;">
          ${Icons.alertCircle(16)} <strong>Lỗi:</strong> ${err}
        </div>
        <div style="margin-top:8px; font-size:12px; color:var(--text-muted);">
          Nhấn Cài đặt (${Icons.settings(12)}) để thêm hoặc kiểm tra lại các API Key.
        </div>
      `;
    }
  }

  showToast(msg) {
    const toast = document.getElementById('spToast');
    if (!toast) return;
    toast.innerHTML = `<span style="display:flex;align-items:center;gap:6px;">${Icons.checkCircle(13)} ${msg}</span>`;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  async loadChatHistory() {
    const activeConv = await Storage.getActiveConversation();
    const history = activeConv?.messages || [];
    const body = document.getElementById('spChatBody');
    if (!body) return;

    const titleEl = document.getElementById('spActiveConvTitle');
    if (titleEl) {
      titleEl.textContent = activeConv?.title || 'Đoạn chat mới';
      titleEl.title = activeConv?.title || 'Đoạn chat mới';
    }

    body.innerHTML = '';
    if (history.length > 0) {
      history.forEach((msg) => {
        const el = document.createElement('div');
        el.className = `sp-msg ${msg.role === 'user' ? 'sp-msg-user' : 'sp-msg-ai'}`;
        let imgHtml = msg.image ? `<img src="${msg.image}" class="sp-msg-img" alt="image">` : '';
        el.innerHTML = `
          <div class="sp-msg-bubble">
            ${imgHtml}
            <div>${formatMarkdownAndMath(msg.content)}</div>
          </div>
        `;
        body.appendChild(el);
      });
      body.scrollTop = body.scrollHeight;
    } else {
      const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
      const dict = getI18n(uiLanguage);
      const chipsHtml = (dict.chips || []).map(
        (c) => `<button class="sp-chip" data-query="${c.query}">${c.label}</button>`
      ).join('');

      body.innerHTML = `
        <div class="sp-msg sp-msg-ai">
          <div class="sp-msg-bubble">
            <div id="spWelcomeText">${dict.welcomeText}</div>
            <div class="sp-chips-row" id="spChipsContainer">
              ${chipsHtml}
            </div>
          </div>
        </div>
      `;
    }
  }

  parseHistorySessions(history) {
    const sessions = [];
    let current = null;

    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      if (msg.role === 'user') {
        current = {
          user: msg,
          assistant: null,
          timestamp: msg.timestamp || Date.now(),
        };
        sessions.push(current);
      } else if (msg.role === 'assistant') {
        if (current && !current.assistant) {
          current.assistant = msg;
        } else {
          sessions.push({
            user: { role: 'user', content: msg.content ? msg.content.slice(0, 60) : 'Bài tập đã giải' },
            assistant: msg,
            timestamp: msg.timestamp || Date.now(),
          });
        }
      }
    }
    return sessions;
  }

  async openHistoryModal() {
    const modal = document.getElementById('spHistoryModal');
    const body = document.getElementById('spHistoryModalBody');
    if (!modal || !body) return;

    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const dict = getI18n(uiLanguage);

    modal.style.display = 'flex';
    body.innerHTML = `<div style="text-align:center; padding:16px; color:#94a3b8;">${dict.loadingHistory || 'Loading conversations...'}</div>`;

    const conversations = await Storage.getConversations();
    const { activeConversationId } = await Storage.get(['activeConversationId']);

    if (conversations.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; padding:32px 10px; color:#94a3b8; font-size:13px;">
          ${dict.emptyHistory || 'No conversations saved yet.<br>Start a new chat to begin!'}
        </div>
      `;
      return;
    }

    body.innerHTML = '';
    [...conversations].reverse().forEach((conv) => {
      const el = document.createElement('div');
      el.className = `sp-history-item ${conv.id === activeConversationId ? 'active' : ''}`;

      let thumbHtml = conv.thumbnail
        ? `<img src="${conv.thumbnail}" class="sp-history-thumb" alt="thumb">`
        : `<div class="sp-history-thumb" style="display:flex;align-items:center;justify-content:center;color:#0284c7;background:#e0f2fe;">${Icons.fileText(20)}</div>`;

      const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const msgCount = conv.messages?.length || 0;

      el.innerHTML = `
        ${thumbHtml}
        <div class="sp-history-info">
          <div class="sp-history-title">${conv.title || 'Hội thoại không tên'}</div>
          <div class="sp-history-time">${Icons.clock(12)} ${dateStr} &bull; ${msgCount} tin nhắn</div>
        </div>
        <button class="sp-icon-btn sp-btn-del-conv" title="Xóa hội thoại này" style="width:26px;height:26px;color:#94a3b8;flex-shrink:0;">
          ${Icons.trash(13)}
        </button>
      `;

      el.querySelector('.sp-btn-del-conv').addEventListener('click', async (e) => {
        e.stopPropagation();
        await Storage.deleteConversation(conv.id);
        this.openHistoryModal();
        this.loadChatHistory();
      });

      el.addEventListener('click', async () => {
        await Storage.switchConversation(conv.id);
        modal.style.display = 'none';
        this.loadChatHistory();
      });

      body.appendChild(el);
    });
  }

  async openSettingsModal() {
    const modal = document.getElementById('spModal');
    const body = document.getElementById('spModalBody');
    modal.style.display = 'flex';

    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
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
      this.updateModelBadge();
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
      this.updateModelBadge();
    });

    if (isNew) save();
    return el;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanelController();
});
