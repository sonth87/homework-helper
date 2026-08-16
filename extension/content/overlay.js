/**
 * In-Page Floating Assistant & Shadow DOM Drawer (Content Script)
 * Encapsulated inside Shadow DOM with KaTeX math rendering, Zero-Login config modal,
 * Jitter-free slide-out FAB, and Resizable "Homework Helper" Floating Solution/Translate/Search Popup.
 */

import { Icons } from '../shared/icons.js';
import { Storage, DEFAULT_PROVIDERS } from '../shared/storage.js';
import { formatMarkdownAndMath } from '../shared/markdown-katex.js';
import { getI18n, getFloatingPopupI18n } from '../shared/i18n.js';

const LANGUAGE_OPTIONS = [
  { id: 'en', name: 'English' },
  { id: 'vi', name: 'Tiếng Việt' },
  { id: 'th', name: 'ไทย (Thai)' },
  { id: 'zh', name: 'Chinese (中文)' },
  { id: 'es', name: 'Spanish (Español)' },
  { id: 'fr', name: 'French (Français)' },
  { id: 'de', name: 'German (Deutsch)' },
  { id: 'ja', name: 'Japanese (日本語)' },
  { id: 'ko', name: 'Korean (한국어)' },
];

class InPageOverlay {
  constructor() {
    this.host = null;
    this.shadow = null;
    this.isOpen = false;
    this.attachedImageBase64 = null;
    this.currentStudyMode = 'step-by-step';
    this.isStreaming = false;
    this.activeRequestId = null;

    // Solution / Translate / Search Popup Card State
    this.popupCard = null;
    this.popupMode = 'solution'; // 'solution' | 'translate' | 'search' | 'explain' | 'summarize' | 'grammar'
    this.popupSourceText = '';
    this.popupImageBase64 = null;
    this.activeCardResponseText = '';
    this.targetLang = 'en';

    this.init();
  }

  async init() {
    if (document.getElementById('homework-ai-shadow-host')) return;

    // Create host element
    this.host = document.createElement('div');
    this.host.id = 'homework-ai-shadow-host';
    this.shadow = this.host.attachShadow({ mode: 'open' });

    // Load styles
    const styleEl = document.createElement('link');
    styleEl.rel = 'stylesheet';
    styleEl.href = chrome.runtime.getURL('content/styles/overlay.css');
    this.shadow.appendChild(styleEl);

    // Load KaTeX css
    const katexStyle = document.createElement('link');
    katexStyle.rel = 'stylesheet';
    katexStyle.href = chrome.runtime.getURL('shared/katex/katex.min.css');
    this.shadow.appendChild(katexStyle);

    // Render HTML structure
    this.render();

    const mount = () => {
      if (!document.getElementById('homework-ai-shadow-host')) {
        const target = document.body || document.documentElement;
        if (target) {
          target.appendChild(this.host);
        }
      }
    };

    if (document.body || document.documentElement) {
      mount();
    } else {
      document.addEventListener('DOMContentLoaded', mount);
    }

    // Apply visual appearance settings
    await this.applyAppearanceSettings();
    await this.applyLanguageI18n();

    // Event listeners
    this.setupEventListeners();
    this.loadInitialHistory();
  }

  async applyAppearanceSettings() {
    const {
      enableFloatingButton = true,
      fabSize = 'normal',
      popupOpacity = 100,
      popupBlur = 12,
    } = await Storage.get();

    const fabContainer = this.shadow.getElementById('hwFabContainer');
    if (fabContainer) {
      fabContainer.style.display = enableFloatingButton ? 'flex' : 'none';
      fabContainer.className = `hw-fab-container size-${fabSize}`;
    }

    if (this.popupCard) {
      this.popupCard.style.setProperty('--popup-alpha', (popupOpacity / 100).toFixed(2));
      this.popupCard.style.setProperty('--popup-blur', `${popupBlur}px`);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'hw-root-container';
    container.innerHTML = `
      <!-- Compact Floating Action Buttons (Jitter-free fixed hit area) -->
      <div class="hw-fab-container" id="hwFabContainer">
        <div class="hw-fab-inner">
          <button class="hw-fab-btn hw-fab-crop" id="hwFabCrop" title="Crop & Solve Formula (Alt+C)">
            ${Icons.scissors(16)}
          </button>
          <button class="hw-fab-btn" id="hwFabToggle" title="Open Homework Helper">
            ${Icons.sparkles(18)}
          </button>
        </div>
      </div>

      <!-- Resizable Homework Helper Floating Popup (Answer / Translate / Search) -->
      <div class="hw-solution-card" id="hwSolutionCard" style="display: none;">
        <div class="hw-card-header" id="hwCardHeader">
          <div class="hw-card-brand">
            ${Icons.appLogo(20)}
            <span id="hwPopupTitle">Homework Helper</span>
          </div>
          <div class="hw-card-drag-handle" title="Drag to move">
            ${Icons.gripHorizontal(16)}
          </div>
          <div class="hw-card-actions">
            <button class="hw-icon-btn" id="hwBtnCardNewChat" title="Tạo hội thoại mới" style="width:24px;height:24px;">
              ${Icons.plus(14)}
            </button>
            <button class="hw-icon-btn" id="hwBtnCardHistory" title="Danh sách các hội thoại đã giải" style="width:24px;height:24px;">
              ${Icons.history(14)}
            </button>
            <button class="hw-icon-btn" id="hwBtnCloseCard" title="Close" style="width:24px;height:24px;">
              ${Icons.x(14)}
            </button>
          </div>
        </div>

        <!-- History Overlay Panel inside Card -->
        <div class="hw-card-history-panel" id="hwCardHistoryPanel" style="display: none;">
          <div class="hw-card-history-header">
            <div style="display:flex; align-items:center; gap:6px;">
              ${Icons.history(14)} <span>Lịch sử các hội thoại</span>
            </div>
            <div style="display:flex; align-items:center; gap:4px;">
              <button class="hw-btn-mini-options" id="hwBtnCardAddConv" style="padding: 3px 8px; font-size: 11px;">
                ${Icons.plus(12)} Mới
              </button>
              <button class="hw-icon-btn" id="hwBtnCloseCardHistory" style="width:22px;height:22px;">
                ${Icons.x(12)}
              </button>
            </div>
          </div>
          <div class="hw-card-history-list" id="hwCardHistoryList"></div>
          <button class="hw-btn-mini-options" id="hwBtnCardOpenDrawer" style="margin-top:6px; width:100%; justify-content:center; padding: 7px 12px;">
            ${Icons.messageCircle(13)} Mở toàn bộ trong Chat Drawer &rarr;
          </button>
        </div>

        <div class="hw-card-body" id="hwCardBody">
          <!-- Translation Top Bar (Active when mode === 'translate') -->
          <div id="hwTranslateBar" class="hw-translate-bar" style="display: none;">
            <select class="hw-lang-pill" id="hwLangSource" disabled>
              <option value="auto">Auto-detect</option>
            </select>
            <span class="hw-lang-arrow">&rarr;</span>
            <select class="hw-lang-pill" id="hwLangTarget">
              ${LANGUAGE_OPTIONS.map((l) => `<option value="${l.id}" ${l.id === 'en' ? 'selected' : ''}>${l.name}</option>`).join('')}
            </select>
          </div>

          <!-- Source Text Preview for Text Queries -->
          <div id="hwCardSourceText" class="hw-card-source-text" style="display: none;"></div>

          <!-- Image Preview for Screenshots -->
          <img id="hwCardThumb" class="hw-card-img-preview" src="" alt="Captured question" style="display: none;">

          <div class="hw-card-answer-heading" id="hwCardAnswerHeading">Answer</div>
          <div class="hw-card-answer-content" id="hwCardAnswerContent">
            <span style="color:#94a3b8;">${Icons.sparkles(14)} Thinking & Solving...</span>
          </div>
        </div>

        <div class="hw-card-footer">
          <button class="hw-btn-primary-action" id="hwBtnCardPrimary">
            ${Icons.scissors(14)} <span id="hwBtnPrimaryLabel">Next Question</span>
          </button>
          <div class="hw-card-footer-right">
            <button class="hw-btn-card-action" id="hwBtnCardCopy">
              ${Icons.copy(14)} Copy
            </button>
            <button class="hw-btn-card-action" id="hwBtnCardRetry">
              ${Icons.refresh(14)} Retry
            </button>
          </div>
        </div>
        <div class="hw-card-resizer" title="Drag corner to resize">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1L1 9M9 5L5 9M9 9L9 9.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <!-- Slide-over Drawer -->
      <div class="hw-drawer" id="hwDrawer">
        <!-- Header -->
        <div class="hw-header">
          <div class="hw-header-title">
            ${Icons.appLogo(22)}
            <div style="display:flex;flex-direction:column;gap:1px;min-width:0;">
              <span id="hwHeaderTitle">Homework Helper</span>
              <span id="hwActiveConvTitle" style="font-size:11px;font-weight:500;color:#64748b;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Đoạn chat mới</span>
            </div>
          </div>
          <div class="hw-header-actions">
            <button class="hw-icon-btn" id="hwBtnDrawerNewChat" data-tooltip-title="Tạo đoạn chat mới" data-tooltip-desc="Bắt đầu phiên hội thoại bài tập mới.">
              ${Icons.plus(16)}
            </button>
            <button class="hw-icon-btn" id="hwBtnDrawerHistory" data-tooltip-title="Lịch sử các hội thoại" data-tooltip-desc="Xem danh sách các phiên giải bài đã lưu.">
              ${Icons.history(16)}
            </button>
            <button class="hw-icon-btn" id="hwBtnSettings" data-tooltip-title="Cài đặt Key & Model" data-tooltip-desc="Quản lý danh sách API Key và cơ chế xoay vòng thông minh.">
              ${Icons.settings(16)}
            </button>
            <button class="hw-icon-btn" id="hwBtnClear" data-tooltip-title="Xóa đoạn chat" data-tooltip-desc="Xóa hội thoại hiện tại.">
              ${Icons.trash(16)}
            </button>
            <button class="hw-icon-btn" id="hwBtnSidePanel" data-tooltip-title="Trang Cài đặt & Cấu hình" data-tooltip-desc="Mở trang cài đặt chi tiết để quản lý API Key, bật AI nội bộ và tùy biến giao diện.">
              ${Icons.externalLink(16)}
            </button>
            <button class="hw-icon-btn" id="hwBtnClose" data-tooltip-title="Đóng bảng giải bài" data-tooltip-desc="Thu gọn ngăn kéo vào cạnh màn hình.">
              ${Icons.x(16)}
            </button>
          </div>
        </div>

        <!-- Drawer History Overlay Panel -->
        <div class="hw-drawer-history-panel" id="hwDrawerHistoryPanel" style="display: none;">
          <div class="hw-drawer-history-header">
            <div style="display:flex; align-items:center; gap:6px; font-weight:700; font-size:13.5px; color:#0f172a;">
              ${Icons.history(16)} <span>Lịch sử các hội thoại</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <button class="hw-btn-mini-options" id="hwBtnDrawerAddConv" style="padding: 4px 10px; font-size: 11.5px;">
                ${Icons.plus(13)} Đoạn chat mới
              </button>
              <button class="hw-icon-btn" id="hwBtnCloseDrawerHistory" style="width:24px;height:24px;">
                ${Icons.x(14)}
              </button>
            </div>
          </div>
          <div class="hw-drawer-history-list" id="hwDrawerHistoryList"></div>
        </div>

        <!-- Model Status Badge -->
        <div class="hw-model-badge" id="hwModelBadge">
          <span>Active Pool:</span>
          <span class="hw-model-pill" id="hwModelPill">${Icons.layers(12)} Auto-Rotate</span>
        </div>

        <!-- Chat Messages -->
        <div class="hw-chat-body" id="hwChatBody">
          <div class="hw-msg hw-msg-ai">
            <div class="hw-msg-bubble" id="hwWelcomeBubble">
              <div id="hwWelcomeText">Xin chào! Tôi là trợ lý Homework Helper. Bạn cần giải bài tập nào hôm nay?</div>
              <div class="hw-chips-row" id="hwChipsContainer">
                <button class="hw-chip" data-query="Giải phương trình bậc hai $ax^2 + bx + c = 0$">Phương trình bậc 2</button>
                <button class="hw-chip" data-query="Giải thích các định luật chuyển động của Newton">Định luật Newton</button>
                <button class="hw-chip" data-query="Cân bằng phương trình hóa học và tính số mol">Cân bằng hóa học</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="hw-input-container">
          <div class="hw-tools-bar">
            <div class="hw-tools-left">
              <button class="hw-btn-capture" id="hwBtnCapture" data-tooltip-title="Chụp màn hình (Alt+C)" data-tooltip-desc="Khoanh vùng bài tập hoặc đồ thị trên màn hình để giải ngay lập tức.">
                ${Icons.scissors(14)} Chụp ảnh
              </button>
              <button class="hw-tool-icon-btn" id="hwBtnUploadImg" data-tooltip-title="Tải ảnh bài tập" data-tooltip-desc="Đính kèm file hình ảnh bài tập từ máy tính.">
                ${Icons.image(15)}
              </button>
              <input type="file" id="hwImgFileInput" accept="image/*" style="display: none;">
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <select class="hw-mode-select" id="hwLangSelect" data-tooltip-title="Ngôn ngữ phản hồi" data-tooltip-desc="AI sẽ tự động giải bài và trả lời bằng ngôn ngữ này.">
                <option value="en">English</option>
                <option value="vi" selected>Tiếng Việt</option>
                <option value="th">ไทย (Thai)</option>
                <option value="zh-CN">中文</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="auto">Auto</option>
              </select>
              <select class="hw-mode-select" id="hwModeSelect" data-tooltip-title="Chế độ giải bài" data-tooltip-desc="Chọn kiểu phản hồi: Từng bước (Step-by-Step), Đáp án ngay (Direct), Gợi ý (Hint), hoặc Giải thích sâu lý thuyết.">
                <option value="step-by-step">Giải từng bước</option>
                <option value="direct">Đáp án trực tiếp</option>
                <option value="hint">Gợi ý & Hướng dẫn</option>
                <option value="explain">Giải thích sâu</option>
                <option value="translate">Dịch thuật</option>
              </select>
            </div>
          </div>

          <!-- Textbox -->
          <div class="hw-input-box">
            <div id="hwImgPreviewRow" style="display: none;" class="hw-preview-thumb">
              <img id="hwImgThumb" src="" alt="preview">
              <span>Ảnh đã đính kèm</span>
              <button class="hw-icon-btn" id="hwBtnRemoveImg" style="width:20px;height:20px;">${Icons.x(12)}</button>
            </div>
            <textarea class="hw-textarea" id="hwTextarea" placeholder="Nhập câu hỏi hoặc đề bài tập của bạn vào đây..."></textarea>
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
                ${Icons.settings(16)} Cấu hình AI Models & API Keys
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
    this.popupCard = this.shadow.getElementById('hwSolutionCard');
    this.makeCardDraggable();
  }

  setupEventListeners() {
    const s = this.shadow;

    // Toggle Drawer
    s.getElementById('hwFabToggle').addEventListener('click', () => this.toggleDrawer());
    s.getElementById('hwBtnClose').addEventListener('click', () => this.toggleDrawer(false));

    // Crop trigger (Temporarily hide drawer while cropping)
    const triggerCrop = async () => {
      const { routingStrategy = 'prefer_nano', apiConfigs = [], installedOcrModels = {} } = await Storage.get(['routingStrategy', 'apiConfigs', 'installedOcrModels']);
      const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && c.apiKey);
      const hasOcr = Object.values(installedOcrModels).some((m) => m.isInstalled || m.isBundled);

      if (routingStrategy === 'config_only' && enabledKeys.length === 0) {
        chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
        return;
      }

      if (this.isOpen) {
        this.wasOpenBeforeCrop = true;
        this.toggleDrawer(false);
      }
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_START_CROP'));
    };

    s.getElementById('hwFabCrop').addEventListener('click', triggerCrop);
    s.getElementById('hwBtnCapture').addEventListener('click', triggerCrop);

    window.addEventListener('HOMEWORK_AI_START_CROP', () => {
      if (this.isOpen) {
        this.wasOpenBeforeCrop = true;
        this.toggleDrawer(false);
      }
    });

    // Hide all in-page extension elements when screenshot capture starts
    window.addEventListener('HOMEWORK_AI_HIDE_ALL_UI', () => {
      const drawer = s.getElementById('hwDrawer');
      const fab = s.getElementById('hwFabContainer');
      const card = this.popupCard;
      if (drawer) drawer.style.display = 'none';
      if (fab) fab.style.display = 'none';
      if (card) card.style.display = 'none';
    });

    // Restore extension UI when crop is completed or cancelled
    window.addEventListener('HOMEWORK_AI_RESTORE_UI', () => {
      const drawer = s.getElementById('hwDrawer');
      const fab = s.getElementById('hwFabContainer');
      if (drawer) drawer.style.display = '';
      Storage.get(['enableFloatingButton']).then(({ enableFloatingButton = true }) => {
        if (enableFloatingButton && fab) {
          fab.style.display = 'flex';
        }
      });
    });

    // Options Page trigger (Replaced Native Side Panel button as requested)
    s.getElementById('hwBtnSidePanel').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
    });

    // Clear Chat
    s.getElementById('hwBtnClear').addEventListener('click', async () => {
      await Storage.clearChatHistory();
      const { outputLanguage = 'en' } = await Storage.get(['outputLanguage']);
      const dict = getI18n(outputLanguage);
      const body = s.getElementById('hwChatBody');
      body.innerHTML = `
        <div class="hw-msg hw-msg-ai">
          <div class="hw-msg-bubble">
            ${dict.chatCleared}
          </div>
        </div>
      `;
    });

    // Settings Modal
    s.getElementById('hwBtnSettings').addEventListener('click', () => this.openSettingsModal());
    s.getElementById('hwBtnCloseModal').addEventListener('click', () => {
      s.getElementById('hwConfigModal').style.display = 'none';
      this.updateActiveModelBadge();
      this.applyAppearanceSettings();
    });

    // Upload Image in Drawer
    const fileInput = s.getElementById('hwImgFileInput');
    s.getElementById('hwBtnUploadImg').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
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

    s.getElementById('hwBtnRemoveImg').addEventListener('click', () => {
      this.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      fileInput.value = '';
    });

    // Send Button & Textarea in Drawer
    const textarea = s.getElementById('hwTextarea');
    const sendBtn = s.getElementById('hwBtnSend');

    sendBtn.addEventListener('click', () => this.handleSend());
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Chips delegation for prompt suggestions
    s.getElementById('hwChatBody').addEventListener('click', (e) => {
      const chip = e.target.closest('.hw-chip');
      if (chip) {
        const q = chip.getAttribute('data-query');
        if (q) {
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

    this.setupRichTooltips();

    // =======================================================
    // Popup Card Listeners
    // =======================================================
    s.getElementById('hwBtnCloseCard').addEventListener('click', () => {
      this.popupCard.style.display = 'none';
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
    });

    s.getElementById('hwBtnCardNewChat').addEventListener('click', async () => {
      await Storage.createNewConversation('Đoạn chat mới');
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
      this.popupCard.style.display = 'none';
      this.toggleDrawer(true);
      s.getElementById('hwTextarea').value = '';
      this.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      await this.loadInitialHistory();
      this.showToast('Đã bắt đầu đoạn chat mới');
      setTimeout(() => s.getElementById('hwTextarea').focus(), 100);
    });

    s.getElementById('hwBtnCardAddConv').addEventListener('click', async () => {
      await Storage.createNewConversation('Đoạn chat mới');
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
      this.popupCard.style.display = 'none';
      this.toggleDrawer(true);
      s.getElementById('hwTextarea').value = '';
      this.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      await this.loadInitialHistory();
      this.showToast('Đã bắt đầu đoạn chat mới');
      setTimeout(() => s.getElementById('hwTextarea').focus(), 100);
    });

    s.getElementById('hwBtnCardHistory').addEventListener('click', () => {
      const panel = s.getElementById('hwCardHistoryPanel');
      const isVisible = panel.style.display === 'flex';
      if (isVisible) {
        panel.style.display = 'none';
      } else {
        panel.style.display = 'flex';
        this.renderCardHistory();
      }
    });

    s.getElementById('hwBtnCloseCardHistory').addEventListener('click', () => {
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
    });

    s.getElementById('hwBtnCardOpenDrawer').addEventListener('click', () => {
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
      this.popupCard.style.display = 'none';
      this.toggleDrawer(true);
    });

    s.getElementById('hwBtnDrawerNewChat').addEventListener('click', async () => {
      await Storage.createNewConversation('Đoạn chat mới');
      s.getElementById('hwDrawerHistoryPanel').style.display = 'none';
      s.getElementById('hwTextarea').value = '';
      this.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      await this.loadInitialHistory();
      this.showToast('Đã bắt đầu đoạn chat mới');
      setTimeout(() => s.getElementById('hwTextarea').focus(), 100);
    });

    s.getElementById('hwBtnDrawerAddConv').addEventListener('click', async () => {
      await Storage.createNewConversation('Đoạn chat mới');
      s.getElementById('hwDrawerHistoryPanel').style.display = 'none';
      s.getElementById('hwTextarea').value = '';
      this.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      await this.loadInitialHistory();
      this.showToast('Đã bắt đầu đoạn chat mới');
      setTimeout(() => s.getElementById('hwTextarea').focus(), 100);
    });

    s.getElementById('hwBtnDrawerHistory').addEventListener('click', () => {
      const panel = s.getElementById('hwDrawerHistoryPanel');
      const isVisible = panel.style.display === 'flex';
      if (isVisible) {
        panel.style.display = 'none';
      } else {
        panel.style.display = 'flex';
        this.renderDrawerHistory();
      }
    });

    s.getElementById('hwBtnCloseDrawerHistory').addEventListener('click', () => {
      s.getElementById('hwDrawerHistoryPanel').style.display = 'none';
    });

    // Primary action button (Next Question OR Continue in chat)
    s.getElementById('hwBtnCardPrimary').addEventListener('click', () => {
      if (this.popupMode === 'screenshot') {
        this.popupCard.style.display = 'none';
        triggerCrop();
      } else {
        // Continue in chat (opens drawer with context)
        this.popupCard.style.display = 'none';
        this.toggleDrawer(true);
        s.getElementById('hwTextarea').value = `Regarding this: "${this.popupSourceText.slice(0, 80)}..." - `;
      }
    });

    s.getElementById('hwBtnCardCopy').addEventListener('click', () => {
      navigator.clipboard.writeText(this.activeCardResponseText);
      const copyBtn = s.getElementById('hwBtnCardCopy');
      copyBtn.innerHTML = `${Icons.check(14)} Copied!`;
      setTimeout(() => {
        copyBtn.innerHTML = `${Icons.copy(14)} Copy`;
      }, 2000);
    });

    s.getElementById('hwBtnCardRetry').addEventListener('click', () => {
      if (this.popupMode === 'screenshot' && this.popupImageBase64) {
        this.showSolutionCard(this.popupImageBase64);
      } else if (this.popupSourceText) {
        this.executePopupAction(this.popupMode, this.popupSourceText);
      }
    });

    // Target language change for Translate
    s.getElementById('hwLangTarget').addEventListener('change', (e) => {
      this.targetLang = e.target.value;
      if (this.popupSourceText) {
        this.executePopupAction('translate', this.popupSourceText);
      }
    });

    // =======================================================
    // Global Event Listeners
    // =======================================================
    // 1. Screenshot cropped -> Show Homework Helper Solution Popup
    window.addEventListener('HOMEWORK_AI_SOLVE_IMAGE', (e) => {
      const { imageBase64 } = e.detail || {};
      if (imageBase64) {
        this.popupImageBase64 = imageBase64;
        this.showSolutionCard(imageBase64);
      }
    });

    // 2. Toolbar action clicked -> Open Homework Helper Popup directly!
    window.addEventListener('HOMEWORK_AI_OPEN_POPUP', (e) => {
      const { type, text, rect } = e.detail || {};
      if (text) {
        this.openActionPopup(type, text, rect);
      }
    });

    // Stream chunk listener from background
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'AI_STREAM_CHUNK' && msg.requestId === this.activeRequestId) {
        this.appendStreamChunk(msg.chunk, msg.meta);
      } else if (msg.action === 'AI_STREAM_COMPLETE' && msg.requestId === this.activeRequestId) {
        this.finalizeStream();
      } else if (msg.action === 'AI_STREAM_ERROR' && msg.requestId === this.activeRequestId) {
        this.handleStreamError(msg.error);
      } else if (msg.action === 'CLOSE_DRAWER') {
        this.toggleDrawer(false);
      }
    });

    // Main World Bridge Nano Listeners
    window.addEventListener('HOMEWORK_AI_NANO_CHUNK', (e) => {
      const { requestId, chunk } = e.detail || {};
      if (this.isStreaming && (!this.activeRequestId || this.activeRequestId === requestId)) {
        this.appendStreamChunk(chunk, { model: 'Gemini Nano (On-Device)', isBuiltin: true });
      }
    });

    window.addEventListener('HOMEWORK_AI_NANO_FINISH', (e) => {
      const { requestId } = e.detail || {};
      if (this.isStreaming && (!this.activeRequestId || this.activeRequestId === requestId)) {
        this.finalizeStream();
      }
    });

    window.addEventListener('HOMEWORK_AI_NANO_ERROR', (e) => {
      const { requestId, error } = e.detail || {};
      if (this.isStreaming && (!this.activeRequestId || this.activeRequestId === requestId)) {
        this.handleStreamError(error);
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
            this.updateActiveModelBadge();
          }
          if ((changes.chatHistory || changes.activeConversationId || changes.conversations) && this.isOpen && !this.isStreaming) {
            this.loadInitialHistory();
          }
        }
      });
    }
  }

  setupRichTooltips() {
    let tooltipEl = this.shadow.getElementById('hwTooltipPopup');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'hwTooltipPopup';
      tooltipEl.className = 'hw-rich-tooltip';
      this.shadow.appendChild(tooltipEl);
    }

    const showTooltip = (el) => {
      const title = el.getAttribute('data-tooltip-title') || el.getAttribute('title');
      const desc = el.getAttribute('data-tooltip-desc') || '';
      if (!title && !desc) return;

      tooltipEl.innerHTML = `
        ${title ? `<div class="hw-tooltip-title">${title}</div>` : ''}
        ${desc ? `<div class="hw-tooltip-desc">${desc}</div>` : ''}
      `;

      tooltipEl.style.display = 'block';
      tooltipEl.style.visibility = 'hidden';
      tooltipEl.classList.remove('show');

      const tooltipHeight = tooltipEl.offsetHeight || 44;
      const tooltipWidth = Math.min(280, Math.max(180, tooltipEl.offsetWidth || 200));

      const rect = el.getBoundingClientRect();
      let top;
      if (rect.top < 90) {
        // Place BELOW header buttons
        top = rect.bottom + 8;
      } else {
        // Place ABOVE
        top = rect.top - tooltipHeight - 8;
      }

      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      if (left + tooltipWidth > window.innerWidth - 12) {
        left = window.innerWidth - tooltipWidth - 12;
      }
      if (left < 10) {
        left = 10;
      }

      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.visibility = 'visible';
      tooltipEl.classList.add('show');
    };

    const hideTooltip = () => {
      tooltipEl.classList.remove('show');
    };

    // Event delegation on Shadow Root ensures all current and future elements trigger tooltips reliably
    this.shadow.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip-title]');
      if (target) {
        showTooltip(target);
      }
    });

    this.shadow.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip-title]');
      if (target) {
        hideTooltip();
      }
    });
  }

  async applyLanguageI18n(lang = null) {
    const { uiLanguage = 'vi', outputLanguage = 'en' } = await Storage.get(['uiLanguage', 'outputLanguage']);
    const currentLang = lang || uiLanguage;
    const dict = getI18n(currentLang);
    const cardDict = getFloatingPopupI18n(currentLang);
    const s = this.shadow;

    const textarea = s.getElementById('hwTextarea');
    const sendBtnLabel = s.getElementById('hwSendBtnLabel');
    const captureBtn = s.getElementById('hwBtnCapture');
    const hintText = s.getElementById('hwHintText');
    const welcomeText = s.getElementById('hwWelcomeText');
    const chipsContainer = s.getElementById('hwChipsContainer');
    const modeSelect = s.getElementById('hwModeSelect');
    const activeConvTitle = s.getElementById('hwActiveConvTitle');
    const btnDrawerAddConv = s.getElementById('hwBtnDrawerAddConv');
    const btnCardCopy = s.getElementById('hwBtnCardCopy');
    const btnCardRetry = s.getElementById('hwBtnCardRetry');

    if (textarea) textarea.placeholder = dict.placeholder;
    if (sendBtnLabel) sendBtnLabel.textContent = dict.askAiBtn;
    if (captureBtn) captureBtn.innerHTML = `${Icons.scissors(14)} ${dict.captureBtn}`;
    if (hintText) hintText.textContent = dict.shiftEnterHint;
    if (welcomeText) welcomeText.textContent = dict.welcomeText;
    if (activeConvTitle && (!activeConvTitle.textContent || activeConvTitle.textContent === 'Đoạn chat mới' || activeConvTitle.textContent === 'New Chat')) {
      activeConvTitle.textContent = dict.newChat;
    }
    if (btnDrawerAddConv) btnDrawerAddConv.innerHTML = `${Icons.plus(13)} ${dict.newChat}`;
    if (btnCardCopy) btnCardCopy.innerHTML = `${Icons.copy(14)} ${cardDict.copy}`;
    if (btnCardRetry) btnCardRetry.innerHTML = `${Icons.refresh(14)} ${cardDict.retry}`;

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

    // Update tooltips
    if (dict.tooltips) {
      const t = dict.tooltips;
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

      s.getElementById('hwBtnClose')?.setAttribute('data-tooltip-title', t.close?.title || 'Đóng bảng giải bài');
      s.getElementById('hwBtnClose')?.setAttribute('data-tooltip-desc', t.close?.desc || 'Thu gọn ngăn kéo vào cạnh màn hình.');

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

  // =======================================================
  // Floating Homework Helper Popup Logic
  // =======================================================
  async showSolutionCard(imageBase64) {
    const s = this.shadow;
    this.popupMode = 'screenshot';
    this.popupSourceText = '';

    const { uiLanguage = 'en', outputLanguage = 'en' } = await Storage.get(['uiLanguage', 'outputLanguage']);
    const isVi = outputLanguage === 'vi';
    const cardDict = getFloatingPopupI18n(uiLanguage);

    s.getElementById('hwPopupTitle').textContent = cardDict.helperTitle;
    s.getElementById('hwTranslateBar').style.display = 'none';
    s.getElementById('hwCardSourceText').style.display = 'none';

    const thumb = s.getElementById('hwCardThumb');
    thumb.src = imageBase64;
    thumb.style.display = 'block';

    s.getElementById('hwCardAnswerHeading').textContent = cardDict.answerHeading;
    s.getElementById('hwBtnPrimaryLabel').textContent = cardDict.nextQuestion;
    s.getElementById('hwBtnCardPrimary').querySelector('.lucide-icon')?.remove();
    s.getElementById('hwBtnCardPrimary').insertAdjacentHTML('afterbegin', Icons.scissors(14));

    const content = s.getElementById('hwCardAnswerContent');
    content.innerHTML = `<span style="color:#94a3b8;">${Icons.sparkles(14)} ${cardDict.solvingStepByStep}</span>`;

    this.popupCard.style.display = 'flex';
    this.activeCardResponseText = '';
    this.isStreaming = true;
    this.activeTarget = 'card';
    this.activeRequestId = `req_${Date.now()}`;

    const prompt = isVi
      ? 'Vui lòng giải chi tiết từng bước bài tập trong hình ảnh này kèm công thức toán học LaTeX ($...$) và đóng khung đáp án cuối cùng:'
      : 'Please solve this homework question with clear step-by-step reasoning, mathematical formulas in LaTeX ($...$), and highlight the final answer:';

    Storage.addChatMessage({
      role: 'user',
      content: isVi ? 'Giải bài tập trong hình ảnh đã chụp' : 'Solve homework problem from captured image',
      image: imageBase64,
    });

    const { apiConfigs = [], systemPrompt, routingStrategy = 'prefer_nano' } = await Storage.get(['apiConfigs', 'systemPrompt', 'routingStrategy']);
    const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && c.apiKey);

    // If running in Gemini Nano mode (no keys or nano_only), run Local OCR first!
    if (enabledKeys.length === 0 || routingStrategy === 'nano_only') {
      content.innerHTML = `<span style="color:#94a3b8;">${Icons.sparkles(14)} ${cardDict.scanningOcr}</span>`;

      chrome.runtime.sendMessage({
        action: 'PERFORM_OCR',
        payload: { imageBase64, targetLang: outputLanguage }
      }, (res) => {
        const ocrText = res?.text || '';
        const nanoPrompt = isVi
          ? `Đề bài toán/bài tập trích xuất từ hình ảnh:\n${ocrText || '(Hình ảnh bài tập)'}\n\nVui lòng giải chi tiết từng bước bằng Tiếng Việt kèm công thức toán LaTeX ($...$) và đóng khung kết quả cuối cùng:`
          : `Homework problem from image:\n${ocrText || '(Homework image)'}\n\nPlease solve this step-by-step with LaTeX formulas ($...$) and highlight the final answer:`;

        const nanoSysPrompt = `${systemPrompt || ''}\n\n[STRICT LANGUAGE]: You MUST reply and explain in ${isVi ? 'Tiếng Việt (Vietnamese)' : outputLanguage}.`;

        window.dispatchEvent(
          new CustomEvent('HOMEWORK_AI_NANO_EXEC', {
            detail: {
              prompt: nanoPrompt,
              requestId: this.activeRequestId,
              systemPrompt: nanoSysPrompt,
            },
          })
        );
      });
      return;
    }

    chrome.runtime.sendMessage({
      action: 'ASK_AI',
      payload: {
        prompt,
        imageBase64,
        studyMode: 'step-by-step',
        outputLanguage,
        requestId: this.activeRequestId,
      },
    });
  }

  async openActionPopup(type, text, rect) {
    const s = this.shadow;
    this.popupMode = type;
    this.popupSourceText = text;
    this.popupImageBase64 = null;

    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const cardDict = getFloatingPopupI18n(uiLanguage);

    s.getElementById('hwCardThumb').style.display = 'none';

    const sourceTextEl = s.getElementById('hwCardSourceText');
    sourceTextEl.textContent = text;
    sourceTextEl.style.display = 'block';

    const translateBar = s.getElementById('hwTranslateBar');
    const titleEl = s.getElementById('hwPopupTitle');
    const headingEl = s.getElementById('hwCardAnswerHeading');
    const primaryBtn = s.getElementById('hwBtnCardPrimary');
    const primaryLabel = s.getElementById('hwBtnPrimaryLabel');

    primaryLabel.textContent = cardDict.continueInChat;
    primaryBtn.querySelector('.lucide-icon')?.remove();
    primaryBtn.insertAdjacentHTML('afterbegin', Icons.messageCircle(14));

    if (type === 'translate') {
      titleEl.textContent = cardDict.translateTitle;
      headingEl.textContent = cardDict.translateHeading;
      translateBar.style.display = 'flex';
    } else if (type === 'search') {
      titleEl.textContent = cardDict.searchTitle;
      headingEl.textContent = cardDict.searchHeading;
      translateBar.style.display = 'none';
    } else if (type === 'explain') {
      titleEl.textContent = cardDict.explainTitle;
      headingEl.textContent = cardDict.explainHeading;
      translateBar.style.display = 'none';
    } else if (type === 'summarize') {
      titleEl.textContent = cardDict.summarizeTitle;
      headingEl.textContent = cardDict.summarizeHeading;
      translateBar.style.display = 'none';
    } else if (type === 'grammar') {
      titleEl.textContent = cardDict.grammarTitle;
      headingEl.textContent = cardDict.grammarHeading;
      translateBar.style.display = 'none';
    } else {
      titleEl.textContent = cardDict.helperTitle;
      headingEl.textContent = cardDict.answerHeading;
      translateBar.style.display = 'none';
    }

    // Position popup near selection
    if (rect) {
      const top = Math.min(window.innerHeight - 340, Math.max(20, rect.bottom + 10));
      const left = Math.min(window.innerWidth - 440, Math.max(20, rect.left));
      this.popupCard.style.top = `${top}px`;
      this.popupCard.style.left = `${left}px`;
      this.popupCard.style.right = 'auto';
    }

    this.popupCard.style.display = 'flex';
    this.executePopupAction(type, text);
  }

  async executePopupAction(type, text) {
    const s = this.shadow;
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const cardDict = getFloatingPopupI18n(uiLanguage);

    const content = s.getElementById('hwCardAnswerContent');
    content.innerHTML = `<span style="color:#94a3b8;">${Icons.sparkles(14)} ${cardDict.processing}</span>`;

    this.activeCardResponseText = '';
    this.isStreaming = true;
    this.activeTarget = 'card';
    this.activeRequestId = `req_${Date.now()}`;

    let prompt = text;
    let studyMode = 'step-by-step';

    let userLabel = text;
    if (type === 'translate') {
      const targetLangName = LANGUAGE_OPTIONS.find((l) => l.id === this.targetLang)?.name || 'English';
      prompt = `Translate the following text accurately into ${targetLangName}:\n\n${text}`;
      studyMode = 'translate';
      userLabel = `[Dịch sang ${targetLangName}]: ${text}`;
    } else if (type === 'search') {
      prompt = `Search, verify facts, and solve this homework question:\n\n${text}`;
      studyMode = 'direct';
      userLabel = `[Tìm kiếm & Giải bài]: ${text}`;
    } else if (type === 'explain') {
      prompt = `Provide a comprehensive educational explanation of the following concept:\n\n${text}`;
      studyMode = 'explain';
      userLabel = `[Giải thích khái niệm]: ${text}`;
    } else if (type === 'summarize') {
      prompt = `Summarize the following text concisely with key points:\n\n${text}`;
      studyMode = 'summarize';
      userLabel = `[Tóm tắt nội dung]: ${text}`;
    } else if (type === 'grammar') {
      prompt = `Check and correct grammar, spelling, and phrasing in the following text. Highlight improvements:\n\n${text}`;
      studyMode = 'explain';
      userLabel = `[Kiểm tra ngữ pháp]: ${text}`;
    }

    Storage.addChatMessage({
      role: 'user',
      content: userLabel,
    });

    const { apiConfigs = [], systemPrompt, outputLanguage = 'en' } = await Storage.get(['apiConfigs', 'systemPrompt', 'outputLanguage']);
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
      const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'Tiếng Việt (Vietnamese)';
      const nanoSysPrompt = `${systemPrompt || ''}\n\n[STRICT LANGUAGE]: You MUST reply in ${targetLangName}.`.trim();
      const nanoPrompt = `${prompt}\n\n[Output entirely in ${targetLangName}]`;

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
        studyMode,
        outputLanguage,
        requestId: this.activeRequestId,
      },
    });
  }

  makeCardDraggable() {
    const header = this.shadow.getElementById('hwCardHeader');
    const card = this.popupCard;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.hw-icon-btn, select')) return;
      isDragging = true;
      offsetX = e.clientX - card.getBoundingClientRect().left;
      offsetY = e.clientY - card.getBoundingClientRect().top;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const left = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - offsetX));
      const top = Math.max(10, Math.min(window.innerHeight - 200, e.clientY - offsetY));
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.style.right = 'auto';
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
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

  async renderCardHistory() {
    const conversations = await Storage.getConversations();
    const { activeConversationId } = await Storage.get(['activeConversationId']);
    const listEl = this.shadow.getElementById('hwCardHistoryList');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (conversations.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:24px 10px; color:#94a3b8; font-size:12px;">
          Chưa có hội thoại nào được lưu.<br>Hãy tạo bài tập mới để bắt đầu!
        </div>
      `;
      return;
    }

    // Render newest first
    [...conversations].reverse().forEach((conv) => {
      const el = document.createElement('div');
      el.className = `hw-card-history-item ${conv.id === activeConversationId ? 'active' : ''}`;

      let thumbHtml = conv.thumbnail
        ? `<img src="${conv.thumbnail}" class="hw-card-history-thumb" alt="thumb">`
        : `<div class="hw-card-history-thumb" style="display:flex;align-items:center;justify-content:center;color:#0284c7;background:#e0f2fe;">${Icons.fileText(18)}</div>`;

      const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const msgCount = conv.messages?.length || 0;

      el.innerHTML = `
        ${thumbHtml}
        <div class="hw-card-history-info">
          <div class="hw-card-history-title">${conv.title || 'Hội thoại không tên'}</div>
          <div class="hw-card-history-time">${Icons.clock(11)} ${dateStr} &bull; ${msgCount} tin nhắn</div>
        </div>
        <button class="hw-icon-btn hw-btn-del-conv" title="Xóa hội thoại này" style="width:22px;height:22px;color:#94a3b8;flex-shrink:0;">
          ${Icons.trash(12)}
        </button>
      `;

      // Delete conversation button
      el.querySelector('.hw-btn-del-conv').addEventListener('click', async (e) => {
        e.stopPropagation();
        await Storage.deleteConversation(conv.id);
        this.renderCardHistory();
      });

      // Switch conversation
      el.addEventListener('click', async () => {
        await Storage.switchConversation(conv.id);
        this.shadow.getElementById('hwCardHistoryPanel').style.display = 'none';
        this.popupCard.style.display = 'flex';

        const lastAssistant = [...(conv.messages || [])].reverse().find((m) => m.role === 'assistant');
        const lastUser = [...(conv.messages || [])].reverse().find((m) => m.role === 'user');

        if (lastUser?.image) {
          this.popupMode = 'screenshot';
          this.popupImageBase64 = lastUser.image;
          this.popupSourceText = '';
          const thumb = this.shadow.getElementById('hwCardThumb');
          thumb.src = lastUser.image;
          thumb.style.display = 'block';
          this.shadow.getElementById('hwCardSourceText').style.display = 'none';
        } else if (lastUser?.content) {
          this.popupMode = 'text';
          this.popupImageBase64 = null;
          this.popupSourceText = lastUser.content;
          this.shadow.getElementById('hwCardThumb').style.display = 'none';
          const srcEl = this.shadow.getElementById('hwCardSourceText');
          srcEl.textContent = lastUser.content;
          srcEl.style.display = 'block';
        } else {
          this.popupMode = 'text';
          this.popupImageBase64 = null;
          this.popupSourceText = '';
          this.shadow.getElementById('hwCardThumb').style.display = 'none';
          this.shadow.getElementById('hwCardSourceText').style.display = 'none';
        }

        const ansContent = this.shadow.getElementById('hwCardAnswerContent');
        const replyText = lastAssistant?.content || lastUser?.content || 'Hội thoại rỗng';
        ansContent.innerHTML = formatMarkdownAndMath(replyText);
        this.activeCardResponseText = replyText;
      });

      listEl.appendChild(el);
    });
  }

  async renderDrawerHistory() {
    const conversations = await Storage.getConversations();
    const { activeConversationId, uiLanguage = 'en' } = await Storage.get(['activeConversationId', 'uiLanguage']);
    const dict = getI18n(uiLanguage);
    const listEl = this.shadow.getElementById('hwDrawerHistoryList');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (conversations.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:32px 10px; color:#94a3b8; font-size:13px;">
          ${dict.emptyHistory || 'Chưa có hội thoại nào được lưu.<br>Hãy tạo đoạn chat mới để bắt đầu!'}
        </div>
      `;
      return;
    }

    [...conversations].reverse().forEach((conv) => {
      const el = document.createElement('div');
      el.className = `hw-card-history-item ${conv.id === activeConversationId ? 'active' : ''}`;

      let thumbHtml = conv.thumbnail
        ? `<img src="${conv.thumbnail}" class="hw-card-history-thumb" alt="thumb">`
        : `<div class="hw-card-history-thumb" style="display:flex;align-items:center;justify-content:center;color:#0284c7;background:#e0f2fe;">${Icons.fileText(18)}</div>`;

      const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const msgCount = conv.messages?.length || 0;

      el.innerHTML = `
        ${thumbHtml}
        <div class="hw-card-history-info">
          <div class="hw-card-history-title">${conv.title || dict.newChat || 'Hội thoại không tên'}</div>
          <div class="hw-card-history-time">${Icons.clock(11)} ${dateStr} &bull; ${msgCount} tin nhắn</div>
        </div>
        <button class="hw-icon-btn hw-btn-del-conv" title="Delete" style="width:24px;height:24px;color:#94a3b8;flex-shrink:0;">
          ${Icons.trash(13)}
        </button>
      `;

      el.querySelector('.hw-btn-del-conv').addEventListener('click', async (e) => {
        e.stopPropagation();
        await Storage.deleteConversation(conv.id);
        this.renderDrawerHistory();
        this.loadInitialHistory();
      });

      el.addEventListener('click', async () => {
        await Storage.switchConversation(conv.id);
        this.shadow.getElementById('hwDrawerHistoryPanel').style.display = 'none';
        this.loadInitialHistory();
      });

      listEl.appendChild(el);
    });
  }

  // =======================================================
  // Drawer & Chat Logic
  // =======================================================
  toggleDrawer(forceState = null) {
    const drawer = this.shadow.getElementById('hwDrawer');
    this.isOpen = forceState !== null ? forceState : !this.isOpen;
    if (this.isOpen) {
      drawer.classList.add('open');
      this.loadInitialHistory();
      this.updateActiveModelBadge();
      setTimeout(() => this.shadow.getElementById('hwTextarea').focus(), 150);
    } else {
      drawer.classList.remove('open');
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
    const pill = this.shadow.getElementById('hwModelPill');
    const enabledCount = apiConfigs.filter((c) => c.isEnabled && c.apiKey).length;

    if (enabledCount === 0) {
      let isReady = !!isNanoReady;
      if (!isReady) {
        isReady = await this.checkNanoAvailability();
      }

      if (isReady) {
        Storage.set({ isNanoReady: true });
        pill.innerHTML = `${Icons.cpu(12)} ${dict.modelNanoReady || 'Chrome Gemini Nano (Ready On-Device)'}`;
        pill.style.background = '#dcfce7';
        pill.style.color = '#15803d';
        pill.style.border = '1px solid rgba(34, 197, 94, 0.3)';
        pill.style.cursor = 'default';
        pill.title = '';
        pill.onclick = null;
      } else {
        pill.innerHTML = `${Icons.alertCircle(12)} ${dict.modelNanoSetup || 'Chrome Gemini Nano (Setup Required)'}`;
        pill.style.background = '#fef9c3';
        pill.style.color = '#a16207';
        pill.style.border = '1px solid rgba(234, 179, 8, 0.4)';
        pill.style.cursor = 'pointer';
        pill.title = dict.modelNanoClick || 'Click to view Gemini Nano guide in Settings';
        pill.onclick = () => {
          chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'builtin-nano' });
        };
      }
    } else {
      pill.innerHTML = `${Icons.layers(12)} ${dict.modelAutoRotate || 'Auto-Rotate'} (${enabledCount} Active)`;
      pill.style.background = '#e0f2fe';
      pill.style.color = '#0369a1';
      pill.style.border = '1px solid rgba(2, 132, 199, 0.25)';
      pill.style.cursor = 'default';
      pill.title = '';
      pill.onclick = null;
    }
  }

  async handleSend() {
    const textarea = this.shadow.getElementById('hwTextarea');
    const text = textarea.value.trim();
    const img = this.attachedImageBase64;

    if (!text && !img) return;
    if (this.isStreaming) return;

    textarea.value = '';
    this.attachedImageBase64 = null;
    this.shadow.getElementById('hwImgPreviewRow').style.display = 'none';

    this.askAiWithPayload({ prompt: text || 'Please analyze this attached image:', imageBase64: img });
  }

  async askAiWithPayload({ prompt, imageBase64 = null }) {
    this.activeTarget = 'drawer';
    this.appendUserMessage(prompt, imageBase64);

    this.activeAiBubble = this.createAiBubble();
    this.currentResponseText = '';
    this.isStreaming = true;
    this.activeRequestId = `req_${Date.now()}`;

    this.shadow.getElementById('hwBtnSend').disabled = true;

    const { apiConfigs = [], systemPrompt, outputLanguage = 'en' } = await Storage.get(['apiConfigs', 'systemPrompt', 'outputLanguage']);
    const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && c.apiKey);

    // If no keys configured and no image, execute via Main World Gemini Nano directly!
    if (enabledKeys.length === 0 && !imageBase64) {
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
      const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'Tiếng Việt (Vietnamese)';
      const nanoSysPrompt = `${systemPrompt || ''}\n\n[STRICT LANGUAGE]: You MUST reply and explain in ${targetLangName}.`.trim();
      const nanoPrompt = `${prompt}\n\n[Output entirely in ${targetLangName}]`;

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
    const msgEl = document.createElement('div');
    msgEl.className = 'hw-msg hw-msg-user';

    let imgHtml = '';
    if (imageBase64) {
      imgHtml = `<img src="${imageBase64}" class="hw-msg-img" alt="uploaded question">`;
    }

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
    const msgEl = document.createElement('div');
    msgEl.className = 'hw-msg hw-msg-ai';

    msgEl.innerHTML = `
      <div class="hw-msg-bubble">
        <div class="hw-ai-content"><span style="color:#94a3b8;">${Icons.sparkles(14)} Thinking & Solving...</span></div>
        <div class="hw-msg-footer" style="display:none;">
          <button class="hw-copy-btn">${Icons.copy(12)} Copy</button>
        </div>
      </div>
    `;

    body.appendChild(msgEl);
    body.scrollTop = body.scrollHeight;
    return msgEl;
  }

  appendStreamChunk(chunk, meta) {
    if (this.activeTarget === 'card') {
      this.activeCardResponseText += chunk;
      const content = this.shadow.getElementById('hwCardAnswerContent');
      content.innerHTML = formatMarkdownAndMath(this.activeCardResponseText);
      const cardBody = this.shadow.getElementById('hwCardBody');
      cardBody.scrollTop = cardBody.scrollHeight;
      return;
    }

    if (!this.activeAiBubble) return;
    this.currentResponseText += chunk;
    const contentEl = this.activeAiBubble.querySelector('.hw-ai-content');
    contentEl.innerHTML = formatMarkdownAndMath(this.currentResponseText);

    const body = this.shadow.getElementById('hwChatBody');
    body.scrollTop = body.scrollHeight;
  }

  finalizeStream() {
    this.isStreaming = false;
    this.shadow.getElementById('hwBtnSend').disabled = false;

    if (this.activeTarget === 'card') {
      Storage.addChatMessage({ role: 'assistant', content: this.activeCardResponseText });
      return;
    }

    if (this.activeAiBubble) {
      const footer = this.activeAiBubble.querySelector('.hw-msg-footer');
      if (footer) footer.style.display = 'flex';

      const copyBtn = this.activeAiBubble.querySelector('.hw-copy-btn');
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

  async handleStreamError(err) {
    this.isStreaming = false;
    this.shadow.getElementById('hwBtnSend').disabled = false;

    const errStr = String(err || '');
    const isNanoError = errStr.includes('Gemini Nano') || errStr.includes('prompt-api') || errStr.includes('Optimization Guide');
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const isVi = uiLanguage === 'vi';

    if (this.activeTarget === 'card') {
      const content = this.shadow.getElementById('hwCardAnswerContent');
      content.innerHTML = `
        <div style="color: #dc2626; display:flex; align-items:center; gap:6px;">
          ${Icons.alertCircle(16)} <strong>${isVi ? 'Lỗi:' : 'Error:'}</strong> ${err}
        </div>
      `;
      return;
    }

    if (this.activeAiBubble) {
      const contentEl = this.activeAiBubble.querySelector('.hw-ai-content');

      if (isNanoError) {
        contentEl.innerHTML = `
          <div class="hw-nano-guide-card">
            <div class="hw-nano-guide-header">
              ${Icons.cpu(16)} <span>${isVi ? 'Hướng dẫn Kích hoạt Chrome Gemini Nano (Local AI)' : 'Chrome Gemini Nano Activation Guide (Local AI)'}</span>
            </div>
            <div class="hw-nano-steps">
              <div class="hw-nano-step">
                <span class="hw-step-num">1</span>
                <div>${isVi ? 'Bật cờ' : 'Enable flag'} <strong>Prompt API</strong>:
                  <button class="hw-btn-mini-flags" id="hwBtnFlagPromptApi">${Icons.externalLink(11)} ${isVi ? 'Mở #prompt-api' : 'Open #prompt-api'}</button>
                </div>
              </div>
              <div class="hw-nano-step">
                <span class="hw-step-num">2</span>
                <div>${isVi ? 'Bật cờ' : 'Set flag'} <strong>Optimization Guide</strong> ${isVi ? 'sang' : 'to'} <em>Enabled BypassPerfRequirement</em>:
                  <button class="hw-btn-mini-flags" id="hwBtnFlagOptGuide">${Icons.externalLink(11)} ${isVi ? 'Mở #optimization-guide' : 'Open #optimization-guide'}</button>
                </div>
              </div>
              <div class="hw-nano-step">
                <span class="hw-step-num">3</span>
                <div>${isVi ? 'Nhấn <strong>Relaunch</strong> ở góc dưới để khởi động lại Chrome.' : 'Click <strong>Relaunch</strong> to restart Chrome.'}</div>
              </div>
              <div class="hw-nano-step">
                <span class="hw-step-num">4</span>
                <div>${isVi ? 'Tải model tại <strong>chrome://components</strong> (nhấn Check for update):' : 'Download model at <strong>chrome://components</strong> (Click Check for update):'}
                  <button class="hw-btn-mini-flags" id="hwBtnOpenCompTab">${Icons.externalLink(11)} ${isVi ? 'Mở components' : 'Open components'}</button>
                </div>
              </div>
            </div>
            <div class="hw-nano-guide-footer">
              <button class="hw-btn-mini-options" id="hwBtnAddKeyFallback">
                ${Icons.plus(12)} ${isVi ? 'Hoặc thêm API Key Miễn phí (Gemini / Groq)' : 'Or Add Free Cloud Key (Gemini / Groq)'}
              </button>
            </div>
          </div>
        `;

        contentEl.querySelector('#hwBtnFlagPromptApi')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api-for-gemini-nano' });
        });

        contentEl.querySelector('#hwBtnFlagOptGuide')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#optimization-guide-on-device-model' });
        });

        contentEl.querySelector('#hwBtnOpenCompTab')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://components' });
        });

        contentEl.querySelector('#hwBtnAddKeyFallback')?.addEventListener('click', () => {
          this.openSettingsModal();
        });
      } else {
        contentEl.innerHTML = `
          <div style="color: #dc2626; display: flex; align-items: center; gap: 6px;">
            ${Icons.alertCircle(16)} <strong>${isVi ? 'Lỗi:' : 'Error:'}</strong> ${err}
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
            ${isVi ? `Nhấn vào <strong>Cài đặt (${Icons.settings(12)})</strong> để thêm hoặc kiểm tra lại các API Key.` : `Click <strong>Settings (${Icons.settings(12)})</strong> to add or verify your API Keys.`}
          </div>
        `;
      }
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
    toast.innerHTML = `<span style="display:flex;align-items:center;gap:6px;">${Icons.checkCircle(14)} ${msg}</span>`;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  async loadInitialHistory() {
    const activeConv = await Storage.getActiveConversation();
    const history = activeConv?.messages || [];
    const body = this.shadow.getElementById('hwChatBody');
    if (!body) return;

    const titleEl = this.shadow.getElementById('hwActiveConvTitle');
    if (titleEl) {
      titleEl.textContent = activeConv?.title || 'Đoạn chat mới';
      titleEl.title = activeConv?.title || 'Đoạn chat mới';
    }

    body.innerHTML = '';
    if (history.length > 0) {
      history.forEach((msg) => {
        const msgEl = document.createElement('div');
        msgEl.className = `hw-msg ${msg.role === 'user' ? 'hw-msg-user' : 'hw-msg-ai'}`;

        let imgHtml = msg.image ? `<img src="${msg.image}" class="hw-msg-img" alt="image">` : '';
        msgEl.innerHTML = `
          <div class="hw-msg-bubble">
            ${imgHtml}
            <div>${formatMarkdownAndMath(msg.content)}</div>
          </div>
        `;
        body.appendChild(msgEl);
      });
      body.scrollTop = body.scrollHeight;
    } else {
      const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
      const dict = getI18n(uiLanguage);
      body.innerHTML = `
        <div class="hw-msg hw-msg-ai">
          <div class="hw-msg-bubble" id="hwWelcomeBubble">
            <div id="hwWelcomeText">${dict.welcomeText || 'Xin chào! Tôi là trợ lý Homework Helper. Bạn cần giải bài tập nào hôm nay?'}</div>
            <div class="hw-chips-row" id="hwChipsContainer">
              <button class="hw-chip" data-query="Giải phương trình bậc hai $ax^2 + bx + c = 0$">${uiLanguage === 'vi' ? 'Phương trình bậc 2' : 'Quadratic Equation'}</button>
              <button class="hw-chip" data-query="Giải thích các định luật chuyển động của Newton">${uiLanguage === 'vi' ? 'Định luật Newton' : 'Newton Laws'}</button>
              <button class="hw-chip" data-query="Dịch đoạn văn này sang tiếng Anh">${uiLanguage === 'vi' ? 'Dịch bài tập' : 'Translate Question'}</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  async openSettingsModal() {
    const modal = this.shadow.getElementById('hwConfigModal');
    const body = this.shadow.getElementById('hwModalBody');
    modal.style.display = 'flex';

    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const isVi = uiLanguage === 'vi';

    body.innerHTML = `
      <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
        ${isVi ? 'Thêm một hoặc nhiều API Key. Tiện ích tự động xoay vòng cân bằng tải và chuyển sang key dự phòng khi gặp giới hạn Rate Limit.' : 'Add one or more API Keys. The extension automatically load-balances and falls back to backup keys when hitting rate limits.'}
      </div>

      <!-- Chrome Built-in AI Gemini Nano Guide Section in Modal -->
      <div style="margin-top: 10px; padding: 10px 12px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
        <div style="font-weight: 700; font-size: 12.5px; color: #0369a1; display:flex; align-items:center; gap:6px;">
          ${Icons.cpu(14)} Chrome Gemini Nano (Local AI)
        </div>
        <div style="font-size:11.5px; color:#334155; margin-top:6px; line-height:1.6;">
          ${isVi ? 'Mô hình AI nội bộ chạy Offline. Nhấn các liên kết bên dưới để mở trực tiếp:' : 'On-Device AI running offline. Click links below to open flags directly:'}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
          <button class="hw-copy-btn" id="hwModalBtnFlagPrompt" style="background:#0284c7; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${isVi ? '1. Mở #prompt-api' : '1. Open #prompt-api'}
          </button>
          <button class="hw-copy-btn" id="hwModalBtnFlagOptGuide" style="background:#0284c7; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${isVi ? '2. Mở #optimization-guide' : '2. Open #optimization-guide'}
          </button>
          <button class="hw-copy-btn" id="hwModalBtnComponents" style="background:#0369a1; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${isVi ? '3. Mở components' : '3. Open components'}
          </button>
        </div>
      </div>

      <!-- Configured Keys List -->
      <div id="hwModalKeyList" style="display:flex; flex-direction:column; gap:10px; margin-top: 10px;">
        ${apiConfigs.length === 0 ? `<div style="text-align:center; padding:12px; color:#94a3b8; font-size:12px;">${isVi ? 'Chưa có API Key nào. Nhấn nút bên dưới để thêm.' : 'No API Key configured. Click below to add.'}</div>` : ''}
      </div>

      <!-- Add New Key Button -->
      <button class="hw-btn-add" id="hwBtnAddKey">
        ${Icons.plus(16)} ${isVi ? 'Thêm AI Provider / Key' : 'Add AI Provider / Key'}
      </button>

      <div style="text-align:right; margin-top:6px;">
        <a href="#" id="hwLinkFullOptions" style="font-size:12px; color:#0284c7; text-decoration:none;">
          ${isVi ? 'Xem hướng dẫn lấy Key miễn phí & cài đặt nâng cao →' : 'View free key guide & advanced settings →'}
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

    // Render key items
    const listContainer = body.querySelector('#hwModalKeyList');
    apiConfigs.forEach((cfg) => {
      const itemEl = this.renderKeyItemElement(cfg);
      listContainer.appendChild(itemEl);
    });

    // Add key button
    body.querySelector('#hwBtnAddKey').addEventListener('click', () => {
      const newConfig = {
        id: `cfg_${Date.now()}`,
        provider: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-2.5-flash',
        apiKey: '',
        baseUrl: '',
        isEnabled: true,
      };
      listContainer.appendChild(this.renderKeyItemElement(newConfig, true));
    });

    body.querySelector('#hwLinkFullOptions').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
    });
  }

  renderKeyItemElement(cfg, isNew = false) {
    const el = document.createElement('div');
    el.className = 'hw-key-item';
    el.setAttribute('data-id', cfg.id);

    const providerOptions = DEFAULT_PROVIDERS.map(
      (p) => `<option value="${p.id}" ${cfg.provider === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const providerObj = DEFAULT_PROVIDERS.find((p) => p.id === cfg.provider) || DEFAULT_PROVIDERS[0];
    const modelOptions = providerObj.models.map(
      (m) => `<option value="${m.id}" ${cfg.model === m.id ? 'selected' : ''}>${m.name}</option>`
    ).join('');

    el.innerHTML = `
      <div class="hw-key-item-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" class="hw-cfg-enabled" ${cfg.isEnabled ? 'checked' : ''}>
          <span>${providerObj.name}</span>
        </div>
        <button class="hw-icon-btn hw-cfg-delete" style="color:#ef4444;" title="Delete">${Icons.trash(14)}</button>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <select class="hw-input-field hw-cfg-provider">${providerOptions}</select>
        <select class="hw-input-field hw-cfg-model">${modelOptions}</select>
      </div>

      <input type="password" class="hw-input-field hw-cfg-key" placeholder="API Key (sk-... / AIza...)" value="${cfg.apiKey || ''}">
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
        <button class="hw-copy-btn hw-cfg-test" style="background:#e0f2fe; color:#0369a1;">
          ${Icons.refresh(12)} Test Key
        </button>
        <span class="hw-cfg-status" style="font-size:11px; color:#64748b;">${cfg.cooldownUntil && cfg.cooldownUntil > Date.now() ? `${Icons.alertCircle(12)} Cooldown 60s` : ''}</span>
      </div>
    `;

    const providerSelect = el.querySelector('.hw-cfg-provider');
    const modelSelect = el.querySelector('.hw-cfg-model');
    const keyInput = el.querySelector('.hw-cfg-key');
    const enableCheckbox = el.querySelector('.hw-cfg-enabled');
    const testBtn = el.querySelector('.hw-cfg-test');
    const statusSpan = el.querySelector('.hw-cfg-status');

    const saveChanges = async () => {
      await Storage.saveApiConfig({
        id: cfg.id,
        provider: providerSelect.value,
        model: modelSelect.value,
        apiKey: keyInput.value.trim(),
        isEnabled: enableCheckbox.checked,
      });
      this.updateActiveModelBadge();
    };

    providerSelect.addEventListener('change', () => {
      const pObj = DEFAULT_PROVIDERS.find((p) => p.id === providerSelect.value) || DEFAULT_PROVIDERS[0];
      modelSelect.innerHTML = pObj.models.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
      saveChanges();
    });

    modelSelect.addEventListener('change', saveChanges);
    keyInput.addEventListener('input', saveChanges);
    enableCheckbox.addEventListener('change', saveChanges);

    el.querySelector('.hw-cfg-delete').addEventListener('click', async () => {
      await Storage.removeApiConfig(cfg.id);
      el.remove();
      this.updateActiveModelBadge();
    });

    testBtn.addEventListener('click', async () => {
      testBtn.innerHTML = `${Icons.refresh(12)} Đang kiểm tra...`;
      try {
        chrome.runtime.sendMessage({
          action: 'ASK_AI',
          payload: { prompt: 'Reply "Connected OK"', preferredConfigId: cfg.id }
        }, (res) => {
          if (res?.success) {
            statusSpan.innerHTML = `<span style="color:#16a34a;">${Icons.check(12)} Key Hợp lệ</span>`;
          } else {
            statusSpan.innerHTML = `<span style="color:#dc2626;">Thất bại</span>`;
          }
        });
      } catch (err) {
        statusSpan.innerHTML = `<span style="color:#dc2626;">Lỗi</span>`;
      } finally {
        setTimeout(() => {
          testBtn.innerHTML = `${Icons.refresh(12)} Kiểm tra`;
        }, 1000);
      }
    });

    if (isNew) saveChanges();
    return el;
  }
}

export const inPageOverlay = new InPageOverlay();
