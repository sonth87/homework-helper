/**
 * In-Page Floating Assistant & Shadow DOM Coordinator (Content Script)
 * Encapsulates UI inside Shadow DOM and orchestrates modular subcomponents.
 */

import { Icons } from '../shared/icons.js';
import { Storage, SUPPORTED_LANGUAGES } from '../shared/storage.js';
import { getI18n, getFloatingPopupI18n } from '../shared/i18n.js';
import { OverlayFabs } from './overlay/fabs.js';
import { OverlayDrawer } from './overlay/drawer.js';
import { OverlayDrawerHistory } from './overlay/drawer-history.js';
import { OverlayFloatingCard } from './overlay/floating-card.js';
import { OverlayConfigModal } from './overlay/config-modal.js';
import { OverlayRichTooltips } from './overlay/rich-tooltips.js';

class InPageOverlay {
  constructor() {
    this.host = null;
    this.shadow = null;

    this.init();
  }

  async init() {
    this.createShadowDOM();
    this.mountSubcomponents();
    this.setupGlobalListeners();
    await this.applyAppearanceSettings();
    await this.applyLanguageI18n();
  }

  createShadowDOM() {
    this.host = document.createElement('div');
    this.host.id = 'homework-ai-root';
    this.host.style.position = 'absolute';
    this.host.style.top = '0';
    this.host.style.left = '0';
    this.host.style.zIndex = '2147483640';
    document.documentElement.appendChild(this.host);

    this.shadow = this.host.attachShadow({ mode: 'open' });

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('content/styles/overlay.css');
    this.shadow.appendChild(link);

    const katexLink = document.createElement('link');
    katexLink.rel = 'stylesheet';
    katexLink.href = chrome.runtime.getURL('shared/katex/katex.min.css');
    this.shadow.appendChild(katexLink);

    const container = document.createElement('div');
    container.className = 'hw-overlay-wrapper';

    container.innerHTML = `
      <!-- Jitter-free Slide-out FAB Container -->
      <div class="hw-fab-container" id="hwFabContainer">
        <div class="hw-fab-inner">
          <button class="hw-fab-btn" id="hwFabCrop" data-tooltip-title="Chụp màn hình (Alt+C)" data-tooltip-desc="Khoanh vùng bài tập hoặc đồ thị trên màn hình để giải ngay lập tức.">
            ${Icons.scissors(15)}
          </button>
          <button class="hw-fab-btn hw-fab-primary" id="hwFabToggle" data-tooltip-title="Mở chat panel (Alt+K)" data-tooltip-desc="Mở ngăn kéo AI hỗ trợ giải bài tập chi tiết và đặt câu hỏi.">
            ${Icons.sparkles(16)}
          </button>
        </div>
      </div>

      <!-- Resizable & Draggable Floating Homework Helper Solution Popup -->
      <div class="hw-solution-card" id="hwSolutionCard" style="display: none;">
        <!-- Header -->
        <div class="hw-card-header" id="hwCardHeader">
          <div class="hw-card-title">
            ${Icons.appLogo(16)}
            <span id="hwPopupTitle">Homework Helper</span>
          </div>
          <div class="hw-card-header-actions">
            <button class="hw-icon-btn" id="hwBtnCardHistory" data-tooltip-title="Lịch sử các câu hỏi" data-tooltip-desc="Xem lại các câu hỏi hoặc bài tập đã giải gần đây.">${Icons.history(14)}</button>
            <button class="hw-icon-btn" id="hwBtnCloseCard" data-tooltip-title="Đóng cửa sổ" data-tooltip-desc="Tắt popup giải bài">${Icons.x(14)}</button>
          </div>
        </div>

        <!-- History Popover inside Card -->
        <div class="hw-card-history-panel" id="hwCardHistoryPanel" style="display: none;">
          <div class="hw-card-history-header">
            <span>${Icons.history(14)} Lịch sử các câu hỏi</span>
            <div style="display:flex; align-items:center; gap:4px;">
              <button class="hw-icon-btn" id="hwBtnCardAddConv" data-tooltip-title="Đoạn chat mới" data-tooltip-desc="Bắt đầu một phiên hội thoại bài tập mới.">${Icons.plus(13)}</button>
              <button class="hw-icon-btn" id="hwBtnCloseCardHistory">${Icons.x(13)}</button>
            </div>
          </div>
          <div class="hw-card-history-list" id="hwCardHistoryList">
            <!-- Rendered dynamically -->
          </div>
          <div style="padding: 8px 10px; border-top: 1px solid rgba(226, 232, 240, 0.8); background: #f8fafc; text-align: center;">
            <button class="hw-btn-open-drawer" id="hwBtnCardOpenDrawer" style="font-size: 11.5px; padding: 4px 10px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer;">
              ${Icons.messageCircle(12)} Mở toàn bộ trong Khung Chat
            </button>
          </div>
        </div>

        <!-- Secondary Translate Target Language Bar -->
        <div class="hw-translate-bar" id="hwTranslateBar" style="display: none;">
          <span>Dịch sang:</span>
          <select class="hw-lang-target" id="hwLangTarget"></select>
        </div>

        <!-- Body & Output Content -->
        <div class="hw-card-body">
          <div class="hw-card-preview-thumb">
            <img id="hwCardThumb" src="" alt="Cropped" style="display: none;">
          </div>
          <div class="hw-card-source-text" id="hwCardSourceText" style="display: none;"></div>
          <div class="hw-card-answer-heading" id="hwCardAnswerHeading">Answer</div>
          <div class="hw-card-answer-content" id="hwCardAnswerContent">
            <span style="color:#94a3b8;">${Icons.sparkles(14)} Đang giải từng bước với công thức KaTeX...</span>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="hw-card-footer">
          <div class="hw-card-actions-left">
            <button class="hw-btn-card-action" id="hwBtnCardCopy">
              ${Icons.copy(14)} <span id="hwBtnCardCopyLabel">Sao chép</span>
            </button>
            <button class="hw-btn-card-action" id="hwBtnCardRetry">
              ${Icons.refresh(14)} <span id="hwBtnCardRetryLabel">Thử lại</span>
            </button>
          </div>
          <button class="hw-btn-card-primary" id="hwBtnCardPrimary">
            <span id="hwBtnPrimaryLabel">Next Question</span>
          </button>
        </div>
      </div>

      <!-- Slide-over Drawer Backdrop -->
      <div class="hw-drawer-backdrop" id="hwDrawerBackdrop" style="display: none;"></div>

      <!-- Slide-over Drawer Assistant -->
      <div class="hw-drawer" id="hwDrawer">
        <!-- Edge Collapse Handle -->
        <button class="hw-drawer-edge-close" id="hwDrawerEdgeClose" data-tooltip-title="Đóng chat panel (Alt+K)" data-tooltip-desc="Thu gọn ngăn kéo vào cạnh màn hình.">
          ${Icons.chevronRight(18)}
        </button>

        <!-- Header -->
        <div class="hw-header">
          <div class="hw-header-left">
            <div class="hw-logo">${Icons.appLogo(22)}</div>
            <div class="hw-header-titles">
              <span class="hw-header-title" id="hwHeaderTitle">Homework Helper</span>
              <span class="hw-active-conv-title" id="hwActiveConvTitle">Đoạn chat mới</span>
            </div>
          </div>
          <div class="hw-header-actions">
            <button class="hw-icon-btn" id="hwBtnDrawerNewChat" data-tooltip-title="Đoạn chat mới" data-tooltip-desc="Bắt đầu một phiên hội thoại bài tập mới.">${Icons.plus(16)}</button>
            <button class="hw-icon-btn" id="hwBtnDrawerHistory" data-tooltip-title="Lịch sử các hội thoại" data-tooltip-desc="Xem danh sách các phiên giải bài đã lưu.">${Icons.history(16)}</button>
            <button class="hw-icon-btn" id="hwBtnSettings" data-tooltip-title="Cài đặt Key & Model" data-tooltip-desc="Quản lý danh sách API Key và cơ chế xoay vòng thông minh.">${Icons.settings(16)}</button>
            <button class="hw-icon-btn" id="hwBtnClear" data-tooltip-title="Xóa đoạn chat" data-tooltip-desc="Xóa toàn bộ tin nhắn trong phiên trò chuyện hiện tại.">${Icons.trash(16)}</button>
            <button class="hw-icon-btn" id="hwBtnSidePanel" data-tooltip-title="Trang Cài đặt & Cấu hình" data-tooltip-desc="Mở trang cài đặt chi tiết để quản lý API Key, bật AI nội bộ và tùy biến giao diện.">${Icons.externalLink(16)}</button>
            <button class="hw-icon-btn" id="hwBtnClose" data-tooltip-title="Đóng chat panel" data-tooltip-desc="Thu gọn ngăn kéo vào cạnh màn hình.">${Icons.x(16)}</button>
          </div>
        </div>

        <!-- Drawer History Panel -->
        <div class="hw-drawer-history-panel" id="hwDrawerHistoryPanel" style="display: none;">
          <div class="hw-drawer-history-header">
            <span id="hwDrawerHistoryTitle">${Icons.history(14)} Lịch sử các hội thoại</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <button class="hw-btn-add-conv" id="hwBtnDrawerAddConv">${Icons.plus(13)} Đoạn chat mới</button>
              <button class="hw-icon-btn" id="hwBtnCloseDrawerHistory">${Icons.x(14)}</button>
            </div>
          </div>
          <div class="hw-drawer-history-list" id="hwDrawerHistoryList">
            <!-- Populated dynamically -->
          </div>
        </div>

        <!-- Active Model Rotation Bar (Matching Sidepanel) -->
        <div class="hw-model-bar" id="hwModelBar">
          <span class="hw-model-label">Model:</span>
          <span class="hw-model-tag" id="hwModelTag">
            ${Icons.layers(12)} Đang tải cấu hình Model...
          </span>
        </div>

        <!-- Chat Body -->
        <div class="hw-chat-body" id="hwChatBody">
          <div class="hw-msg hw-msg-ai">
            <div class="hw-msg-bubble">
              <div id="hwWelcomeText">Xin chào! Tôi là trợ lý Homework Helper. Bạn cần giải bài tập nào hôm nay?</div>
              <div class="hw-chips-container" id="hwChipsContainer">
                <button class="hw-chip" data-query="Giải phương trình bậc hai $ax^2 + bx + c = 0$">Phương trình bậc 2</button>
                <button class="hw-chip" data-query="Giải thích các định luật chuyển động của Newton">Định luật Newton</button>
                <button class="hw-chip" data-query="Dịch đoạn văn này sang tiếng Anh">Dịch bài tập</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Container -->
        <div class="hw-input-container">
          <div class="hw-tools">
            <div class="hw-tools-left">
              <button class="hw-btn-capture" id="hwBtnCapture" data-tooltip-title="Chụp màn hình (Alt+C)" data-tooltip-desc="Khoanh vùng bài tập hoặc đồ thị trên màn hình để giải ngay lập tức.">
                ${Icons.scissors(14)} <span id="hwCaptureBtnLabel">Chụp ảnh</span>
              </button>
              <button class="hw-tool-btn" id="hwBtnUploadImg" data-tooltip-title="Tải ảnh bài tập" data-tooltip-desc="Đính kèm file hình ảnh bài tập từ máy tính.">
                ${Icons.image(14)}
              </button>
              <input type="file" id="hwImgFileInput" accept="image/*" style="display: none;">
            </div>
            <div class="hw-tools-right">
              <select class="hw-select-mode" id="hwLangSelect" data-tooltip-title="Ngôn ngữ Phản hồi" data-tooltip-desc="AI sẽ tự động giải bài, giải thích các bước và đưa ra đáp án bằng ngôn ngữ này."></select>
              <select class="hw-select-mode" id="hwModeSelect" data-tooltip-title="Chế độ Giải bài" data-tooltip-desc="Chọn kiểu phản hồi: Từng bước (Step-by-Step), Đáp án ngay (Direct), Gợi ý (Hint), hoặc Giải thích sâu lý thuyết.">
                <option value="step-by-step">Giải từng bước</option>
                <option value="direct">Đáp án ngay</option>
                <option value="hint">Gợi ý & Hướng dẫn</option>
                <option value="explain">Giải thích sâu</option>
                <option value="translate">Dịch thuật</option>
              </select>
            </div>
          </div>

          <div class="hw-img-preview-row" id="hwImgPreviewRow" style="display: none;">
            <img class="hw-img-preview-thumb" id="hwImgThumb" src="" alt="preview">
            <span style="font-size: 11px; color: #64748b;">Hình ảnh đính kèm</span>
            <button class="hw-btn-remove-img" id="hwBtnRemoveImg">${Icons.x(12)}</button>
          </div>

          <div class="hw-input-box">
            <textarea class="hw-textarea" id="hwTextarea" rows="2" placeholder="Nhập câu hỏi hoặc đề bài tập của bạn vào đây..."></textarea>
            <div class="hw-input-footer">
              <span style="font-size: 11px; color: #94a3b8;" id="hwHintText">Enter để gửi, Shift+Enter để xuống dòng</span>
              <button class="hw-btn-send" id="hwBtnSend">
                <span id="hwSendBtnLabel">Hỏi AI</span> ${Icons.send(13)}
              </button>
            </div>
          </div>
        </div>

        <!-- Config Modal Container -->
        <div class="hw-modal-backdrop" id="hwConfigModal" style="display: none;">
          <div class="hw-modal-content">
            <div class="hw-modal-header">
              <div style="font-weight: 700; display:flex; align-items:center; gap:6px;">
                ${Icons.settings(16)} <span id="hwConfigModalTitle">Cấu hình AI Models & API Keys</span>
              </div>
              <button class="hw-icon-btn" id="hwBtnCloseModal">${Icons.x(16)}</button>
            </div>
            <div class="hw-modal-body" id="hwModalBody">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.shadow.appendChild(container);
  }

  mountSubcomponents() {
    this.richTooltips = new OverlayRichTooltips(this.shadow);
    this.drawer = new OverlayDrawer(this);
    this.drawerHistory = new OverlayDrawerHistory(this);
    this.floatingCard = new OverlayFloatingCard(this);
    this.configModal = new OverlayConfigModal(this);
    this.fabs = new OverlayFabs(this);
  }

  setupGlobalListeners() {
    // 1. Screenshot cropped -> Show Homework Helper Solution Popup
    window.addEventListener('HOMEWORK_AI_SOLVE_IMAGE', (e) => {
      const { imageBase64 } = e.detail || {};
      if (imageBase64) {
        this.floatingCard.showSolutionCard(imageBase64);
      }
    });

    // 2. Toolbar action clicked -> Open Homework Helper Popup directly
    window.addEventListener('HOMEWORK_AI_OPEN_POPUP', (e) => {
      const { type, text, rect } = e.detail || {};
      if (text) {
        this.floatingCard.openActionPopup(type, text, rect);
      }
    });

    // Stream chunk listener from background
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'AI_STREAM_CHUNK' && msg.requestId === this.drawer.activeRequestId) {
        this.drawer.appendStreamChunk(msg.chunk, msg.meta);
      } else if (msg.action === 'AI_STREAM_COMPLETE' && msg.requestId === this.drawer.activeRequestId) {
        this.drawer.finalizeStream();
      } else if (msg.action === 'AI_STREAM_ERROR' && msg.requestId === this.drawer.activeRequestId) {
        this.drawer.handleStreamError(msg.error);
      } else if (msg.action === 'CLOSE_DRAWER') {
        this.drawer.toggle(false);
      }
    });

    // Main World Bridge Nano Listeners
    window.addEventListener('HOMEWORK_AI_NANO_CHUNK', (e) => {
      const { requestId, chunk } = e.detail || {};
      if (this.drawer.isStreaming && (!this.drawer.activeRequestId || this.drawer.activeRequestId === requestId)) {
        this.drawer.appendStreamChunk(chunk, { model: 'Gemini Nano (On-Device)', isBuiltin: true });
      }
    });

    window.addEventListener('HOMEWORK_AI_NANO_FINISH', (e) => {
      const { requestId } = e.detail || {};
      if (this.drawer.isStreaming && (!this.drawer.activeRequestId || this.drawer.activeRequestId === requestId)) {
        this.drawer.finalizeStream();
      }
    });

    window.addEventListener('HOMEWORK_AI_NANO_ERROR', (e) => {
      const { requestId, error } = e.detail || {};
      if (this.drawer.isStreaming && (!this.drawer.activeRequestId || this.drawer.activeRequestId === requestId)) {
        this.drawer.handleStreamError(error);
      }
    });

    // Listen for real-time setting updates from options page
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          if (changes.enableFloatingButton || changes.fabSize || changes.popupOpacity || changes.popupBlur) {
            this.applyAppearanceSettings();
          }
          if (changes.uiLanguage) {
            this.applyLanguageI18n(changes.uiLanguage.newValue);
          }
          if (changes.isNanoReady || changes.apiConfigs) {
            this.drawer.updateActiveModelBadge();
          }
          if ((changes.chatHistory || changes.activeConversationId || changes.conversations) && this.drawer.isOpen && !this.drawer.isStreaming) {
            this.drawer.loadInitialHistory();
          }
        }
      });
    }
  }

  showToast(msg) {
    let toast = this.shadow.getElementById('hwToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hwToast';
      toast.className = 'hw-toast';
      this.shadow.appendChild(toast);
    }
    toast.innerHTML = `<span style="display:flex;align-items:center;gap:6px;">${Icons.checkCircle(14)} <span>${msg}</span></span>`;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  async applyAppearanceSettings() {
    const {
      enableFloatingButton = true,
      fabSize = 'normal',
      popupOpacity = 92,
      popupBlur = 16,
    } = await Storage.get();

    this.fabs.applyAppearance(enableFloatingButton, fabSize);

    const card = this.floatingCard?.popupCard;
    if (card) {
      const popAlpha = (popupOpacity / 100).toFixed(2);
      card.style.background = `rgba(255, 255, 255, ${popAlpha})`;
      card.style.backdropFilter = `blur(${popupBlur}px) saturate(180%)`;
      card.style.webkitBackdropFilter = `blur(${popupBlur}px) saturate(180%)`;
    }
  }

  async applyLanguageI18n(lang = null) {
    const { uiLanguage = 'vi', outputLanguage = 'en' } = await Storage.get(['uiLanguage', 'outputLanguage']);
    const currentLang = lang || uiLanguage;
    const dict = getI18n(currentLang);
    const cardDict = getFloatingPopupI18n(currentLang);
    const s = this.shadow;

    const textarea = s.getElementById('hwTextarea');
    const sendBtnLabel = s.getElementById('hwSendBtnLabel');
    const captureBtnLabel = s.getElementById('hwCaptureBtnLabel');
    const hintText = s.getElementById('hwHintText');
    const welcomeText = s.getElementById('hwWelcomeText');
    const chipsContainer = s.getElementById('hwChipsContainer');
    const modeSelect = s.getElementById('hwModeSelect');
    const langSelect = s.getElementById('hwLangSelect');
    const targetLangSelect = s.getElementById('hwLangTarget');
    const activeConvTitle = s.getElementById('hwActiveConvTitle');
    const btnDrawerAddConv = s.getElementById('hwBtnDrawerAddConv');
    const btnCardCopyLabel = s.getElementById('hwBtnCardCopyLabel');
    const btnCardRetryLabel = s.getElementById('hwBtnCardRetryLabel');
    const configModalTitle = s.getElementById('hwConfigModalTitle');

    if (textarea) textarea.placeholder = dict.placeholder;
    if (sendBtnLabel) sendBtnLabel.textContent = dict.askAiBtn;
    if (captureBtnLabel) captureBtnLabel.textContent = dict.captureBtn;
    if (hintText) hintText.textContent = dict.shiftEnterHint;
    if (welcomeText) welcomeText.textContent = dict.welcomeText;
    if (configModalTitle) configModalTitle.textContent = dict.modalConfigTitle || 'Cấu hình AI Models & API Keys';

    if (activeConvTitle && (!activeConvTitle.textContent || activeConvTitle.textContent === 'Đoạn chat mới' || activeConvTitle.textContent === 'New Chat')) {
      activeConvTitle.textContent = dict.newChat;
    }
    if (btnDrawerAddConv) btnDrawerAddConv.innerHTML = `${Icons.plus(13)} ${dict.newChat}`;
    if (btnCardCopyLabel) btnCardCopyLabel.textContent = cardDict.copy || 'Copy';
    if (btnCardRetryLabel) btnCardRetryLabel.textContent = cardDict.retry || 'Retry';

    // Populate native language options
    if (langSelect) {
      const curVal = langSelect.value || outputLanguage;
      langSelect.innerHTML = SUPPORTED_LANGUAGES.map(
        (l) => `<option value="${l.id}" ${l.id === curVal ? 'selected' : ''}>${l.name}</option>`
      ).join('');
    }

    if (targetLangSelect) {
      const curTarget = targetLangSelect.value || 'en';
      const targetLangs = SUPPORTED_LANGUAGES.filter((l) => l.id !== 'auto');
      targetLangSelect.innerHTML = targetLangs.map(
        (l) => `<option value="${l.id}" ${l.id === curTarget ? 'selected' : ''}>${l.name}</option>`
      ).join('');
    }

    if (chipsContainer && dict.chips) {
      chipsContainer.innerHTML = dict.chips.map(
        (c) => `<button class="hw-chip" data-query="${c.query}">${c.label}</button>`
      ).join('');
    }

    if (modeSelect && dict.modes) {
      const currentVal = modeSelect.value;
      modeSelect.innerHTML = Object.entries(dict.modes).map(
        ([k, v]) => `<option value="${k}" ${k === currentVal ? 'selected' : ''}>${v}</option>`
      ).join('');
    }

    // Update tooltips with refined strings
    if (dict.tooltips) {
      const t = dict.tooltips;
      s.getElementById('hwFabToggle')?.setAttribute('data-tooltip-title', t.open?.title || 'Mở chat panel (Alt+K)');
      s.getElementById('hwFabToggle')?.setAttribute('data-tooltip-desc', t.open?.desc || '');

      s.getElementById('hwFabCrop')?.setAttribute('data-tooltip-title', t.capture?.title || 'Chụp màn hình (Alt+C)');
      s.getElementById('hwFabCrop')?.setAttribute('data-tooltip-desc', t.capture?.desc || '');

      s.getElementById('hwDrawerEdgeClose')?.setAttribute('data-tooltip-title', t.close?.title || 'Đóng chat panel');
      s.getElementById('hwDrawerEdgeClose')?.setAttribute('data-tooltip-desc', t.close?.desc || '');

      s.getElementById('hwBtnClose')?.setAttribute('data-tooltip-title', t.close?.title || 'Đóng chat panel');
      s.getElementById('hwBtnClose')?.setAttribute('data-tooltip-desc', t.close?.desc || '');

      s.getElementById('hwBtnDrawerNewChat')?.setAttribute('data-tooltip-title', t.newChat?.title || dict.newChat);
      s.getElementById('hwBtnDrawerNewChat')?.setAttribute('data-tooltip-desc', t.newChat?.desc || '');

      s.getElementById('hwBtnDrawerHistory')?.setAttribute('data-tooltip-title', t.history?.title || dict.historyTitle);
      s.getElementById('hwBtnDrawerHistory')?.setAttribute('data-tooltip-desc', t.history?.desc || '');

      s.getElementById('hwBtnSettings')?.setAttribute('data-tooltip-title', t.settings?.title || 'Cài đặt Key & Model');
      s.getElementById('hwBtnSettings')?.setAttribute('data-tooltip-desc', t.settings?.desc || 'Quản lý danh sách API Key và cơ chế xoay vòng thông minh.');

      s.getElementById('hwBtnClear')?.setAttribute('data-tooltip-title', t.clear?.title || 'Xóa đoạn chat');
      s.getElementById('hwBtnClear')?.setAttribute('data-tooltip-desc', t.clear?.desc || 'Xóa hội thoại hiện tại.');

      s.getElementById('hwBtnSidePanel')?.setAttribute('data-tooltip-title', t.options?.title || 'Trang Cài đặt & Cấu hình');
      s.getElementById('hwBtnSidePanel')?.setAttribute('data-tooltip-desc', t.options?.desc || 'Mở trang cài đặt chi tiết để quản lý API Key, bật AI nội bộ và tùy biến giao diện.');

      s.getElementById('hwBtnCapture')?.setAttribute('data-tooltip-title', t.capture?.title || 'Chụp màn hình (Alt+C)');
      s.getElementById('hwBtnCapture')?.setAttribute('data-tooltip-desc', t.capture?.desc || 'Khoanh vùng bài tập hoặc đồ thị trên màn hình để giải ngay lập tức.');

      s.getElementById('hwBtnUploadImg')?.setAttribute('data-tooltip-title', t.upload?.title || 'Tải ảnh bài tập');
      s.getElementById('hwBtnUploadImg')?.setAttribute('data-tooltip-desc', t.upload?.desc || 'Đính kèm file hình ảnh bài tập từ máy tính.');

      s.getElementById('hwLangSelect')?.setAttribute('data-tooltip-title', t.lang?.title || 'Ngôn ngữ phản hồi');
      s.getElementById('hwLangSelect')?.setAttribute('data-tooltip-desc', t.lang?.desc || 'AI sẽ tự động giải bài và trả lời bằng ngôn ngữ này.');

      s.getElementById('hwModeSelect')?.setAttribute('data-tooltip-title', t.mode?.title || 'Chế độ giải bài');
      s.getElementById('hwModeSelect')?.setAttribute('data-tooltip-desc', t.mode?.desc || 'Chọn kiểu phản hồi: Từng bước, Đáp án ngay, Gợi ý, hoặc Giải thích sâu lý thuyết.');
    }
  }
}

export const inPageOverlay = new InPageOverlay();
