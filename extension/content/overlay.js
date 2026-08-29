/**
 * In-Page Floating Assistant & Shadow DOM Coordinator (Content Script)
 * Encapsulates UI inside Shadow DOM and orchestrates modular subcomponents.
 */

import { Icons } from '../shared/icons.js';
import { Storage, SUPPORTED_LANGUAGES } from '../shared/storage.js';
import { getI18n, getFloatingPopupI18n, getOptionsI18n } from '../shared/i18n.js';
import { getOverlayThemeAttr } from '../shared/theme.js';
import { OverlayFabs } from './overlay/fabs.js';
import { OverlayDrawer } from './overlay/drawer.js';
import { OverlayDrawerHistory } from './overlay/drawer-history.js';
import { OverlayFloatingCard } from './overlay/floating-card.js';
import { OverlayConfigModal } from './overlay/config-modal.js';
import { OverlayRichTooltips } from './overlay/rich-tooltips.js';
import { getSharedShadowRoot, ensureStylesheet } from './shadow-root.js';

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
    this.shadow = getSharedShadowRoot();
    this.host = this.shadow.host;

    // A <link> inside a shadow root does not block that tree from painting, so
    // the wrapper below would render for a few frames with no CSS at all — the
    // FAB showing up as a row of bare buttons in the top-left corner before
    // snapping to the screen edge. This inline rule applies synchronously and
    // holds the UI back until the real sheet has landed (see reveal below).
    const bootStyle = document.createElement('style');
    bootStyle.textContent =
      '.hw-overlay-wrapper{visibility:hidden}.hw-overlay-wrapper.hw-styles-ready{visibility:visible}';
    this.shadow.appendChild(bootStyle);

    const link = ensureStylesheet('content/styles/overlay.css');
    ensureStylesheet('shared/katex/katex.min.css');

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
            <button class="hw-icon-btn" id="hwBtnCardCollapse" data-tooltip-title="Thu gọn" data-tooltip-desc="Thu popup thành một nút tròn nổi, kéo thả để di chuyển.">${Icons.chevronDown(14)}</button>
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
          <div style="padding: 8px 10px; border-top: 1px solid var(--hw-border-color); background: var(--hw-bg-secondary); text-align: center;">
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
          <div class="hw-card-answer-heading-row">
            <div class="hw-card-answer-heading" id="hwCardAnswerHeading">Answer</div>
            <div class="hw-msg-notice-row" id="hwCardNoticeRow" style="display:none;">
              <span class="hw-notice-icon" id="hwCardNoticeIcon" data-tooltip-title="Thông báo hệ thống"></span>
            </div>
          </div>
          <div class="hw-card-answer-content" id="hwCardAnswerContent">
            <span style="color:var(--hw-text-muted);">${Icons.sparkles(14)} Đang giải từng bước với công thức KaTeX...</span>
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

      <!-- Compact-mode floating title tab — sibling of .hw-solution-card
           (not a descendant), positioned via JS so it can slide above the
           card's own top edge without being clipped by the card's
           overflow:hidden. Its content is mirrored from .hw-card-title. -->
      <div class="hw-card-float-tab" id="hwCardFloatTab" style="display: none;"></div>

      <!-- Collapsed Solution Popup — round draggable FAB, snaps to nearest screen edge -->
      <button class="hw-card-collapsed-fab" id="hwCardCollapsedFab" style="display: none;">
        ${Icons.appLogo(36)}
      </button>

      <!-- Slide-over Drawer Backdrop -->
      <div class="hw-drawer-backdrop" id="hwDrawerBackdrop" style="display: none;"></div>

      <!-- Slide-over Drawer Assistant -->
      <div class="hw-drawer" id="hwDrawer">
        <!-- Resize Handle (drag to widen/narrow the drawer) -->
        <div class="hw-drawer-resize-handle" id="hwDrawerResizeHandle"></div>

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
          <button class="hw-icon-btn" id="hwBtnModelGuide" style="margin-left:auto; width:24px; height:24px;" data-tooltip-title="Xem hướng dẫn nhanh" data-tooltip-desc="Giải thích các cách cấu hình AI và các tính năng chính.">${Icons.helpCircle(14)}</button>
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
            <span style="font-size: 11px; color: var(--hw-text-muted);">Hình ảnh đính kèm</span>
            <button class="hw-btn-remove-img" id="hwBtnRemoveImg">${Icons.x(12)}</button>
          </div>

          <div class="hw-input-box">
            <textarea class="hw-textarea" id="hwTextarea" rows="2" placeholder="Nhập câu hỏi hoặc đề bài tập của bạn vào đây..."></textarea>
            <div class="hw-input-footer">
              <span style="font-size: 11px; color: var(--hw-text-muted);" id="hwHintText">Enter để gửi, Shift+Enter để xuống dòng</span>
              <button class="hw-btn-send" id="hwBtnSend">
                <span id="hwSendBtnLabel">Hỏi AI</span> ${Icons.send(13)}
              </button>
            </div>
          </div>
          <div style="font-size: 10px; color: var(--hw-text-muted); text-align: center; opacity: 0.8;" id="hwAiDisclaimer">AI có thể mắc sai sót, và phụ thuộc nhiều vào model đang sử dụng.</div>
        </div>

        <!-- Config Modal Container -->
        <div class="hw-modal-backdrop" id="hwConfigModal" style="display: none;">
          <div class="hw-modal-content">
            <div class="hw-modal-header">
              <div style="font-weight: 700; display:flex; align-items:center; gap:6px;">
                ${Icons.settings(16)} <span id="hwConfigModalTitle">Cấu hình AI Models & API Keys</span>
              </div>
              <div style="display:flex; align-items:center; gap:4px;">
                <button class="hw-icon-btn" id="hwBtnConfigGuide" data-tooltip-title="Xem hướng dẫn nhanh" data-tooltip-desc="Giải thích API Key, Local Model, và Gemini Nano là gì.">${Icons.helpCircle(16)}</button>
                <button class="hw-icon-btn" id="hwBtnCloseModal">${Icons.x(16)}</button>
              </div>
            </div>
            <div class="hw-modal-body" id="hwModalBody">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <!-- Quick Guide Modal (Model row "?" and Config modal "?") -->
        <div class="hw-modal-backdrop" id="hwGuideModal" style="display: none;">
          <div class="hw-modal-content" style="max-width: 460px;">
            <div class="hw-modal-header">
              <div style="font-weight: 700;" id="hwGuideModalTitle"></div>
              <button class="hw-icon-btn" id="hwBtnCloseGuideModal">${Icons.x(16)}</button>
            </div>
            <div class="hw-modal-body" id="hwGuideModalBody" style="max-height:60vh; overflow-y:auto;">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.shadow.appendChild(container);

    // Reveal as soon as overlay.css is in. katex.min.css is deliberately not
    // waited on — it only matters inside a rendered answer and is far heavier,
    // so gating the FAB on it would trade a flash for a stall. An error or a
    // slow fetch reveals anyway: the UI must never end up stuck invisible.
    const reveal = () => container.classList.add('hw-styles-ready');
    if (link.sheet) {
      reveal();
    } else {
      link.addEventListener('load', reveal, { once: true });
      link.addEventListener('error', reveal, { once: true });
      setTimeout(reveal, 2000);
    }
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
      const { imageBase64, mode = 'solve' } = e.detail || {};
      if (imageBase64) {
        this.floatingCard.showSolutionCard(imageBase64, mode);
      }
    });

    // 2. Toolbar action clicked -> Open Homework Helper Popup directly
    window.addEventListener('HOMEWORK_AI_OPEN_POPUP', (e) => {
      const { type, text, rect } = e.detail || {};
      if (text) {
        // openActionPopup is async, so anything it throws would otherwise
        // surface only as an unhandled rejection — the toolbar would vanish on
        // click with no card and no clue why. Log it loudly instead.
        this.floatingCard.openActionPopup(type, text, rect).catch((err) => {
          console.error('[HomeworkAI] Failed to open the action popup:', type, err);
        });
      }
    });

    // 3. Direct AI question solver trigger (e.g. Google Forms)
    window.addEventListener('HOMEWORK_AI_ASK', (e) => {
      const { prompt, text, rect, studyMode = 'step-by-step' } = e.detail || {};
      const query = prompt || text;
      if (query) {
        if (rect) {
          this.floatingCard.openActionPopup('answer', query, rect);
        } else {
          this.drawer.toggle(true);
          this.drawer.askAi({ prompt: query });
        }
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
      this.clearNanoDownloadState();
      const { requestId, chunk } = e.detail || {};
      if (this.drawer.isStreaming && (!this.drawer.activeRequestId || this.drawer.activeRequestId === requestId)) {
        this.drawer.appendStreamChunk(chunk, { model: 'Gemini Nano (On-Device)', isBuiltin: true });
      }
    });

    window.addEventListener('HOMEWORK_AI_NANO_FINISH', (e) => {
      this.clearNanoDownloadState();
      const { requestId } = e.detail || {};
      if (this.drawer.isStreaming && (!this.drawer.activeRequestId || this.drawer.activeRequestId === requestId)) {
        this.drawer.finalizeStream();
      }
    });

    window.addEventListener('HOMEWORK_AI_NANO_ERROR', (e) => {
      this.clearNanoDownloadState();
      const { requestId, error } = e.detail || {};
      if (this.drawer.isStreaming && (!this.drawer.activeRequestId || this.drawer.activeRequestId === requestId)) {
        this.drawer.handleStreamError(error);
      }
    });

    // Model not downloaded yet — a request is about to trigger the download.
    window.addEventListener('HOMEWORK_AI_NANO_DOWNLOAD_START', (e) => {
      const { status } = e.detail || {};
      Storage.set({ nanoDownloadState: { inProgress: true, percent: status === 'downloading' ? null : 0, updatedAt: Date.now() } });
    });

    // Live download progress ticks (from the MAIN-world create() monitor).
    window.addEventListener('HOMEWORK_AI_NANO_PROGRESS', (e) => {
      const { requestId, percent } = e.detail || {};
      Storage.set({ nanoDownloadState: { inProgress: true, percent, updatedAt: Date.now() } });
      if (this.drawer.isStreaming && (!this.drawer.activeRequestId || this.drawer.activeRequestId === requestId)) {
        this.drawer.appendStreamChunk('', { status: 'downloading', percent });
      }
    });

    // Listen for real-time setting updates from options page
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          if (changes.enableFloatingButton || changes.fabSize || changes.fabOpacity || changes.popupOpacity || changes.popupBlur || changes.popupCardSize || changes.overlayTheme) {
            this.applyAppearanceSettings();
          }
          if (changes.uiLanguage) {
            this.applyLanguageI18n(changes.uiLanguage.newValue);
          }
          if (changes.isNanoReady || changes.apiConfigs || changes.nanoDownloadState) {
            this.drawer.updateActiveModelBadge();
            this.fabs.updateGatingVisual?.();
          }
          if ((changes.chatHistory || changes.activeConversationId || changes.conversations) && this.drawer.isOpen && !this.drawer.isStreaming) {
            this.drawer.loadInitialHistory();
          }
        }
      });
    }

    // Quick guide modal
    this.shadow.getElementById('hwBtnModelGuide')?.addEventListener('click', () => this.showGuideModal('features'));
    this.shadow.getElementById('hwBtnConfigGuide')?.addEventListener('click', () => this.showGuideModal('providers'));
    this.shadow.getElementById('hwBtnCloseGuideModal')?.addEventListener('click', () => {
      const modal = this.shadow.getElementById('hwGuideModal');
      if (modal) modal.style.display = 'none';
    });
  }

  clearNanoDownloadState() {
    Storage.set({ nanoDownloadState: { inProgress: false, percent: null, updatedAt: Date.now() } });
  }

  // topic: 'features' (Model row "?") | 'providers' (Config modal "?")
  async showGuideModal(topic) {
    const { uiLanguage = 'en', hoverTranslateModifiers = ['ctrl'] } = await Storage.get(['uiLanguage', 'hoverTranslateModifiers']);
    const dict = getI18n(uiLanguage);
    const optDict = getOptionsI18n(uiLanguage);
    const modal = this.shadow.getElementById('hwGuideModal');
    const titleEl = this.shadow.getElementById('hwGuideModalTitle');
    const bodyEl = this.shadow.getElementById('hwGuideModalBody');
    if (!modal || !titleEl || !bodyEl) return;

    const renderSections = (sections) => (sections || []).map((s) => `
      <div style="margin-bottom:10px;">
        <div style="font-weight:600; font-size:13px; color:var(--hw-text-main); margin-bottom:2px;">${s.title}</div>
        <div style="font-size:12.5px; color:var(--hw-text-muted); line-height:1.5;">${s.desc}</div>
      </div>
    `).join('');

    const renderGroupRows = (title, items) => `
      <tr><td colspan="2" style="padding:10px 6px 4px; font-weight:700; font-size:12.5px; color:var(--hw-accent);">${title || ''}</td></tr>
      ${(items || []).map((s) => `
        <tr>
          <td style="padding:5px 8px 5px 6px; font-weight:600; font-size:12.5px; color:var(--hw-text-main); white-space:nowrap; vertical-align:top; border-bottom:1px solid var(--hw-border-color);">${s.title}</td>
          <td style="padding:5px 6px; font-size:12.5px; color:var(--hw-text-muted); line-height:1.4; border-bottom:1px solid var(--hw-border-color);">${s.desc}</td>
        </tr>
      `).join('')}
    `;

    if (topic === 'providers') {
      const g = dict.guideProviders || {};
      titleEl.textContent = g.title || '';
      bodyEl.innerHTML = renderSections(g.sections);
    } else {
      const g = dict.guideFeatures || {};
      titleEl.textContent = g.title || '';

      // Reflects whatever modifier keys are currently configured in
      // Options > Appearance > "Dịch nhanh khi di chuột" — re-read fresh
      // every time the guide is opened, so switching e.g. Ctrl -> Alt there
      // shows up here on the next open without any extra wiring.
      const modKeyLabels = { ctrl: optDict.hoverModCtrl, shift: optDict.hoverModShift, alt: optDict.hoverModAlt, meta: optDict.hoverModMeta };
      const hoverAction = (hoverTranslateModifiers && hoverTranslateModifiers.length > 0)
        ? {
            title: g.hoverTranslateTitle || '',
            desc: (g.hoverTranslateDescKey || '').replace('{key}', hoverTranslateModifiers.map((m) => modKeyLabels[m] || m).join(' + ')),
          }
        : { title: g.hoverTranslateTitle || '', desc: g.hoverTranslateDescNoKey || '' };
      const actions = [...(g.actions || []), hoverAction];

      bodyEl.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
          ${renderGroupRows(g.providersTitle, g.providers)}
          ${renderGroupRows(g.actionsTitle, actions)}
          ${renderGroupRows(g.modesTitle, g.modes)}
        </table>
      `;
    }
    modal.style.display = 'flex';
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
      fabOpacity = 90,
      popupOpacity = 92,
      popupBlur = 16,
      popupCardSize = 'normal',
    } = await Storage.get();

    this.fabs.applyAppearance(enableFloatingButton, fabSize, fabOpacity);

    const themeAttr = await getOverlayThemeAttr();
    if (themeAttr) this.host.setAttribute('data-theme', themeAttr);
    else this.host.removeAttribute('data-theme');

    const card = this.floatingCard?.popupCard;
    if (card) {
      const popAlpha = (popupOpacity / 100).toFixed(2);
      card.style.background = `rgba(var(--hw-glass-rgb), ${popAlpha})`;
      card.style.backdropFilter = `blur(${popupBlur}px) saturate(180%)`;
      card.style.webkitBackdropFilter = `blur(${popupBlur}px) saturate(180%)`;
      card.classList.toggle('hw-card-compact', popupCardSize === 'compact');
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
    const aiDisclaimer = s.getElementById('hwAiDisclaimer');
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
    if (aiDisclaimer) aiDisclaimer.textContent = dict.aiDisclaimer;
    if (welcomeText) welcomeText.textContent = dict.welcomeText;
    if (configModalTitle) configModalTitle.textContent = dict.modalConfigTitle || 'Cấu hình AI Models & API Keys';

    if (activeConvTitle && (!activeConvTitle.textContent || activeConvTitle.textContent === 'Đoạn chat mới' || activeConvTitle.textContent === 'New Chat')) {
      activeConvTitle.textContent = dict.newChat;
    }
    if (btnDrawerAddConv) btnDrawerAddConv.innerHTML = `${Icons.plus(13)} ${dict.newChat}`;
    if (btnCardCopyLabel) btnCardCopyLabel.textContent = cardDict.copy || 'Copy';
    if (btnCardRetryLabel) btnCardRetryLabel.textContent = cardDict.retry || 'Retry';

    // Populate native language options (with compact names for display)
    if (langSelect) {
      const curVal = langSelect.value || outputLanguage;
      const langDisplayNames = {
        'vi': 'Tiếng Việt',
        'en': 'English',
        'th': 'ไทย',
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
        'ja': '日本語',
        'ko': '한국어',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch',
        'pt': 'Português',
        'id': 'Bahasa Indo',
        'ru': 'Русский',
        'auto': 'Auto'
      };
      langSelect.innerHTML = SUPPORTED_LANGUAGES.map(
        (l) => `<option value="${l.id}" ${l.id === curVal ? 'selected' : ''}>${langDisplayNames[l.id] || l.name}</option>`
      ).join('');
    }

    if (targetLangSelect) {
      const curTarget = targetLangSelect.value || outputLanguage;
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

      s.getElementById('hwBtnModelGuide')?.setAttribute('data-tooltip-title', t.guide?.title || 'Xem hướng dẫn nhanh');
      s.getElementById('hwBtnModelGuide')?.setAttribute('data-tooltip-desc', t.guide?.desc || '');
      s.getElementById('hwBtnConfigGuide')?.setAttribute('data-tooltip-title', t.guide?.title || 'Xem hướng dẫn nhanh');
      s.getElementById('hwBtnConfigGuide')?.setAttribute('data-tooltip-desc', t.guide?.desc || '');

      s.getElementById('hwBtnCapture')?.setAttribute('data-tooltip-title', t.capture?.title || 'Chụp màn hình (Alt+C)');
      s.getElementById('hwBtnCapture')?.setAttribute('data-tooltip-desc', t.capture?.desc || 'Khoanh vùng bài tập hoặc đồ thị trên màn hình để giải ngay lập tức.');

      // Floating Solution Card Popups Tooltips
      s.getElementById('hwBtnCardHistory')?.setAttribute('data-tooltip-title', cardDict.historyTitle || 'Lịch sử các câu hỏi');
      s.getElementById('hwBtnCardHistory')?.setAttribute('data-tooltip-desc', cardDict.historyDesc || 'Xem lại các câu hỏi hoặc bài tập đã giải gần đây.');

      s.getElementById('hwBtnCloseCard')?.setAttribute('data-tooltip-title', cardDict.closeTitle || 'Đóng cửa sổ');
      s.getElementById('hwBtnCloseCard')?.setAttribute('data-tooltip-desc', cardDict.closeDesc || 'Tắt popup giải bài');

      s.getElementById('hwBtnCardCollapse')?.setAttribute('data-tooltip-title', cardDict.collapseTitle || 'Thu gọn');
      s.getElementById('hwBtnCardCollapse')?.setAttribute('data-tooltip-desc', cardDict.collapseDesc || 'Thu popup thành một nút tròn nổi, kéo thả để di chuyển.');

      // s.getElementById('hwCardCollapsedFab')?.setAttribute('data-tooltip-title', cardDict.reopenTitle || 'Mở lại popup');
      // s.getElementById('hwCardCollapsedFab')?.setAttribute('data-tooltip-desc', cardDict.reopenDesc || 'Kéo để di chuyển, thả ra sẽ tự bay về cạnh màn hình gần nhất.');

      s.getElementById('hwBtnCardAddConv')?.setAttribute('data-tooltip-title', cardDict.addConvTitle || 'Đoạn chat mới');
      s.getElementById('hwBtnCardAddConv')?.setAttribute('data-tooltip-desc', cardDict.addConvDesc || 'Bắt đầu một phiên hội thoại bài tập mới.');

      s.getElementById('hwBtnCloseCardHistory')?.setAttribute('data-tooltip-title', cardDict.closeHistoryTitle || 'Đóng lịch sử');
      s.getElementById('hwBtnCloseCardHistory')?.setAttribute('data-tooltip-desc', cardDict.closeHistoryDesc || 'Đóng bảng lịch sử.');

      const btnCardOpenDrawer = s.getElementById('hwBtnCardOpenDrawer');
      if (btnCardOpenDrawer) {
        btnCardOpenDrawer.innerHTML = `${Icons.messageCircle(12)} ${cardDict.openInDrawerBtn || 'Mở toàn bộ trong Khung Chat'}`;
      }

      const cardHistHeader = s.getElementById('hwCardHistoryPanel')?.querySelector('.hw-card-history-header > span');
      if (cardHistHeader) {
        cardHistHeader.innerHTML = `${Icons.history(14)} ${cardDict.historyTitle || 'Lịch sử các câu hỏi'}`;
      }

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
