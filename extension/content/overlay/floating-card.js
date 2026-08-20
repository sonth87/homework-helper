/**
 * In-Page Floating Solution / Translation / Search Popup Card Subcomponent
 */

import { Icons } from '../../shared/icons.js';
import { Storage, SUPPORTED_LANGUAGES, DEFAULT_NANO_SYSTEM_PROMPT, buildNanoPrompts } from '../../shared/storage.js';
import { formatMarkdownAndMath } from '../../shared/markdown-katex.js';
import { getFloatingPopupI18n, getI18n } from '../../shared/i18n.js';
import { OcrEngine } from '../../shared/ocr-engine.js';

export class OverlayFloatingCard {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this.popupCard = this.shadow.getElementById('hwSolutionCard');
    this.popupMode = 'screenshot';
    this.popupSourceText = '';
    this.popupImageBase64 = null;
    this.targetLang = 'en';
    this.activeCardResponseText = '';
    this.activeCardNotices = [];
    this.loadingStepsInterval = null;
    // Must match .hw-card-collapsed-fab's width/height in overlay.css.
    this.fabSize = 36;
    this.fabEdgeMargin = 10;

    this.init();
  }

  init() {
    this.makeCardDraggable();
    this.makeCollapsedFabDraggable();
    this.setupListeners();
  }

  hideCollapsedFab() {
    const fab = this.shadow.getElementById('hwCardCollapsedFab');
    if (fab) fab.style.display = 'none';
  }

  // Whichever of the 4 screen edges (left/right/top/bottom) the FAB's
  // current rect is closest to, snap flush against that edge and clamp the
  // other axis within the viewport — used both right after collapsing and
  // after a drag ends.
  snapRectToNearestEdge(rect) {
    const { fabSize, fabEdgeMargin: margin } = this;
    const distLeft = rect.left;
    const distRight = window.innerWidth - rect.right;
    const distTop = rect.top;
    const distBottom = window.innerHeight - rect.bottom;
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    let left = Math.max(margin, Math.min(window.innerWidth - fabSize - margin, rect.left));
    let top = Math.max(margin, Math.min(window.innerHeight - fabSize - margin, rect.top));

    if (minDist === distLeft) {
      left = margin;
    } else if (minDist === distRight) {
      left = window.innerWidth - fabSize - margin;
    } else if (minDist === distTop) {
      top = margin;
    } else {
      top = window.innerHeight - fabSize - margin;
    }

    return { left, top };
  }

  // Hides the popup and shows a small round FAB in its place; the card's
  // own position styles are left untouched so expandCard() can just show it
  // again without needing to save/restore anything.
  collapseCard() {
    const card = this.popupCard;
    const fab = this.shadow.getElementById('hwCardCollapsedFab');
    if (!card || !fab) return;

    const rect = card.getBoundingClientRect();
    card.style.display = 'none';

    const { left, top } = this.snapRectToNearestEdge(rect);
    fab.style.left = `${left}px`;
    fab.style.top = `${top}px`;
    fab.style.display = 'flex';
  }

  expandCard() {
    this.hideCollapsedFab();
    if (this.popupCard) this.popupCard.style.display = 'flex';
  }

  makeCollapsedFabDraggable() {
    const fab = this.shadow.getElementById('hwCardCollapsedFab');
    if (!fab) return;

    const { fabSize } = this;
    let isPressed = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;

    fab.addEventListener('mousedown', (e) => {
      isPressed = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = fab.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPressed) return;
      if (!hasMoved) {
        // Small threshold so a plain click doesn't jitter the FAB by a pixel.
        if (Math.abs(e.clientX - startX) < 4 && Math.abs(e.clientY - startY) < 4) return;
        hasMoved = true;
        fab.classList.add('hw-fab-dragging');
      }
      const left = Math.max(0, Math.min(window.innerWidth - fabSize, e.clientX - offsetX));
      const top = Math.max(0, Math.min(window.innerHeight - fabSize, e.clientY - offsetY));
      fab.style.left = `${left}px`;
      fab.style.top = `${top}px`;
    });

    window.addEventListener('mouseup', () => {
      if (!isPressed) return;
      isPressed = false;

      if (!hasMoved) {
        this.expandCard();
        return;
      }

      fab.classList.remove('hw-fab-dragging');
      const { left, top } = this.snapRectToNearestEdge(fab.getBoundingClientRect());
      fab.style.left = `${left}px`;
      fab.style.top = `${top}px`;
    });
  }

  // Rotates through a set of short "thinking..." phrases every 5s while
  // waiting for the AI's first chunk, so the popup doesn't look stuck on
  // just the static "Lời giải chi tiết" heading with nothing moving under it.
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

  // Notices (auto-fallback / key rotation / OCR pre-processing messages) are
  // kept out of the visible answer text — they collect into a small hover
  // icon instead, so they don't get confused with the AI's actual answer.
  resetNoticeIcon() {
    const row = this.shadow.getElementById('hwCardNoticeRow');
    if (row) row.style.display = 'none';
  }

  updateNoticeIcon(notices) {
    if (!notices || notices.length === 0) return;
    const row = this.shadow.getElementById('hwCardNoticeRow');
    const icon = this.shadow.getElementById('hwCardNoticeIcon');
    if (!row || !icon) return;
    row.style.display = 'flex';
    icon.innerHTML = Icons.alertCircle(13);
    icon.setAttribute('data-tooltip-desc', notices.join('<br><br>'));
  }

  setupListeners() {
    const s = this.shadow;

    s.getElementById('hwBtnCloseCard')?.addEventListener('click', () => {
      this.stopLoadingSteps();
      this.popupCard.style.display = 'none';
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
    });

    s.getElementById('hwBtnCardCollapse')?.addEventListener('click', () => {
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
      this.collapseCard();
    });

    s.getElementById('hwBtnCardNewChat')?.addEventListener('click', async () => {
      await Storage.createNewConversation('Đoạn chat mới');
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
      this.popupCard.style.display = 'none';
      this.overlay.drawer.toggle(true);
      s.getElementById('hwTextarea').value = '';
      this.overlay.drawer.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      await this.overlay.drawer.loadInitialHistory();
      this.overlay.showToast('Đã bắt đầu đoạn chat mới');
      setTimeout(() => s.getElementById('hwTextarea').focus(), 100);
    });

    s.getElementById('hwBtnCardAddConv')?.addEventListener('click', async () => {
      await Storage.createNewConversation('Đoạn chat mới');
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
      this.popupCard.style.display = 'none';
      this.overlay.drawer.toggle(true);
      s.getElementById('hwTextarea').value = '';
      this.overlay.drawer.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      await this.overlay.drawer.loadInitialHistory();
      this.overlay.showToast('Đã bắt đầu đoạn chat mới');
      setTimeout(() => s.getElementById('hwTextarea').focus(), 100);
    });

    s.getElementById('hwBtnCardHistory')?.addEventListener('click', () => {
      const panel = s.getElementById('hwCardHistoryPanel');
      const isVisible = panel.style.display === 'flex';
      if (isVisible) {
        panel.style.display = 'none';
      } else {
        panel.style.display = 'flex';
        this.renderCardHistory();
      }
    });

    s.getElementById('hwBtnCloseCardHistory')?.addEventListener('click', () => {
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
    });

    s.getElementById('hwBtnCardOpenDrawer')?.addEventListener('click', () => {
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
      this.popupCard.style.display = 'none';
      this.overlay.drawer.toggle(true);
    });

    // Primary action button (Next Question OR Continue in chat)
    s.getElementById('hwBtnCardPrimary')?.addEventListener('click', () => {
      if (this.popupMode === 'screenshot') {
        this.popupCard.style.display = 'none';
        window.dispatchEvent(new CustomEvent('HOMEWORK_AI_START_CROP'));
      } else {
        this.popupCard.style.display = 'none';
        this.overlay.drawer.toggle(true);
        const textarea = s.getElementById('hwTextarea');
        if (textarea) {
          textarea.value = `Regarding this: "${this.popupSourceText.slice(0, 80)}..." - `;
          setTimeout(() => textarea.focus(), 100);
        }
      }
    });

    s.getElementById('hwBtnCardCopy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.activeCardResponseText);
      const copyBtn = s.getElementById('hwBtnCardCopy');
      copyBtn.innerHTML = `${Icons.check(14)} Copied!`;
      setTimeout(() => {
        copyBtn.innerHTML = `${Icons.copy(14)} Copy`;
      }, 2000);
    });

    s.getElementById('hwBtnCardRetry')?.addEventListener('click', () => {
      if (this.popupMode === 'screenshot' && this.popupImageBase64) {
        this.showSolutionCard(this.popupImageBase64);
      } else if (this.popupSourceText) {
        this.executePopupAction(this.popupMode, this.popupSourceText);
      }
    });

    // Target language change for Translate
    s.getElementById('hwLangTarget')?.addEventListener('change', (e) => {
      this.targetLang = e.target.value;
      if (this.popupSourceText) {
        this.executePopupAction('translate', this.popupSourceText);
      }
    });
  }

  makeCardDraggable() {
    const header = this.shadow.getElementById('hwCardHeader');
    const card = this.popupCard;
    if (!header || !card) return;

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

  async showSolutionCard(imageBase64) {
    const s = this.shadow;
    this.popupMode = 'screenshot';
    this.popupSourceText = '';
    this.popupImageBase64 = imageBase64;

    const {
      uiLanguage = 'en',
      outputLanguage = 'en',
      studyMode = 'step-by-step',
      apiConfigs = [],
      systemPrompt,
      nanoSystemPrompt,
      routingStrategy = 'prefer_config',
    } = await Storage.get([
      'uiLanguage',
      'outputLanguage',
      'studyMode',
      'apiConfigs',
      'systemPrompt',
      'nanoSystemPrompt',
      'routingStrategy',
    ]);
    const cardDict = getFloatingPopupI18n(uiLanguage);
    const genDict = getI18n(uiLanguage);

    s.getElementById('hwPopupTitle').textContent = cardDict.helperTitle;
    s.getElementById('hwTranslateBar').style.display = 'none';
    s.getElementById('hwCardSourceText').style.display = 'none';

    const thumb = s.getElementById('hwCardThumb');
    thumb.src = imageBase64;
    thumb.style.display = 'block';

    const headingText = studyMode === 'direct'
      ? (genDict.modes?.direct || 'ĐÁP ÁN TRỰC TIẾP')
      : (studyMode === 'hint' ? (genDict.modes?.hint || 'GỢI Ý & HƯỚNG DẪN') : cardDict.answerHeading);
    s.getElementById('hwCardAnswerHeading').textContent = headingText.toUpperCase();
    s.getElementById('hwBtnPrimaryLabel').textContent = cardDict.nextQuestion;
    s.getElementById('hwBtnCardPrimary').querySelector('.lucide-icon')?.remove();
    s.getElementById('hwBtnCardPrimary').insertAdjacentHTML('afterbegin', Icons.scissors(14));

    const content = s.getElementById('hwCardAnswerContent');
    this.startLoadingSteps(content, genDict.loadingSteps);

    this.hideCollapsedFab();
    this.popupCard.style.display = 'flex';
    this.activeCardResponseText = '';
    this.activeCardNotices = [];
    this.resetNoticeIcon();
    this.overlay.drawer.isStreaming = true;
    this.overlay.drawer.activeTarget = 'card';
    this.overlay.drawer.activeRequestId = `req_${Date.now()}`;

    const prompt = genDict.imagePromptHeader || 'Please solve this homework question with clear step-by-step reasoning, mathematical formulas in LaTeX ($...$), and highlight the final answer:';

    Storage.addChatMessage({
      role: 'user',
      content: genDict.captureSolveText || 'Solve homework problem from captured image',
      image: imageBase64,
    });

    const enabledKeys = (apiConfigs || []).filter(
      (c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin')
    );

    // If running in Gemini Nano mode (no keys or nano_only), run Local OCR first!
    if (enabledKeys.length === 0 || routingStrategy === 'nano_only') {
      this.stopLoadingSteps();
      const reqId = this.overlay.drawer.activeRequestId || `ocr_${Date.now()}`;
      const logLines = [`[${new Date().toLocaleTimeString()}] Bắt đầu gửi yêu cầu OCR...`];

      const renderOcrProgress = (stepText = 'Khởi động bộ máy OCR...', pct = 15) => {
        const logId = `hw-ocr-log-${reqId}`;
        const isOpen = content.querySelector(`#${logId}`)?.open;
        content.innerHTML = `
          <div class="hw-ocr-progress-container">
            <div class="hw-ocr-step-row">
              <div class="hw-ocr-step-text">
                ${Icons.sparkles(14)}
                <span>${stepText}</span>
                <span class="hw-animated-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
              <span style="font-weight:700; font-size:11.5px;">${pct}%</span>
            </div>
            <div class="hw-ocr-bar-bg">
              <div class="hw-ocr-bar-fill" style="width:${Math.max(5, Math.min(100, pct))}%;"></div>
            </div>
            <details id="${logId}" style="margin-top:4px;" ${isOpen ? 'open' : ''}>
              <summary style="cursor:pointer; font-size:10.5px; color:#64748b; user-select:none; list-style:none; display:flex; align-items:center; gap:4px; padding:3px 0;">
                <span style="font-size:9px; transition:transform .2s;">▶</span>
                <span>Chi tiết log OCR</span>
              </summary>
              <div style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace; font-size:10.5px; color:#334155; background:rgba(255,255,255,0.85); padding:6px 10px; border-radius:6px; max-height:80px; overflow-y:auto; line-height:1.45; border:1px solid rgba(203,213,225,0.8); margin-top:2px;">
                ${logLines.map((l) => `<div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">• ${l}</div>`).join('')}
              </div>
            </details>
          </div>
        `;
        const logBox = content.querySelector('div[style*="overflow-y:auto"]');
        if (logBox) logBox.scrollTop = logBox.scrollHeight;
      };

      renderOcrProgress('Khởi tạo tiến trình OCR...', 15);

      const progressListener = (msg) => {
        if (msg.action === 'OCR_PROGRESS_UPDATE' && msg.payload?.requestId === reqId) {
          const time = msg.payload.time || new Date().toLocaleTimeString();
          logLines.push(`[${time}] ${msg.payload.step} (${msg.payload.pct}%)`);
          renderOcrProgress(msg.payload.step, msg.payload.pct);
        }
      };
      chrome.runtime.onMessage.addListener(progressListener);

      chrome.runtime.sendMessage(
        {
          action: 'PERFORM_OCR',
          payload: { imageBase64, targetLang: outputLanguage, requestId: reqId },
        },
        (res) => {
          chrome.runtime.onMessage.removeListener(progressListener);
          if (!res || !res.success) {
            console.warn('[FloatingCard] OCR Error:', res?.error);
            logLines.push(`[${new Date().toLocaleTimeString()}] LỖI: ${res?.error || 'Không phản hồi'}`);
            content.innerHTML = `
              <div style="padding:12px; background:rgba(234, 179, 8, 0.1); border:1px solid rgba(234, 179, 8, 0.35); border-radius:8px; font-size:12px; color:#a16207; line-height:1.5;">
                <div style="font-weight:700; display:flex; align-items:center; gap:6px; font-size:12.5px;">
                  ${Icons.alertCircle(14)} Không trích xuất được văn bản từ ảnh
                </div>
                <div style="margin-top:4px;">
                  Mô hình OCR cục bộ chưa nhận diện được chữ từ ảnh này (${res?.error || 'Trống'}). Bạn có thể mở <strong>Cài đặt</strong> và thêm <strong>API Key Google Gemini (Miễn phí)</strong> để AI đọc thẳng ảnh bằng Vision AI.
                </div>
                <div style="margin-top:8px; font-family:monospace; font-size:10.5px; background:rgba(255,255,255,0.7); padding:6px; border-radius:4px; color:#334155; max-height:80px; overflow-y:auto;">
                  ${logLines.join('<br>')}
                </div>
              </div>
            `;
            return;
          }

          const ocrText = res.text || '';
          if (!ocrText.trim()) {
            content.innerHTML = `
              <div style="padding:12px; background:rgba(234, 179, 8, 0.1); border:1px solid rgba(234, 179, 8, 0.35); border-radius:8px; font-size:12px; color:#a16207; line-height:1.5;">
                <div style="font-weight:700; display:flex; align-items:center; gap:6px; font-size:12.5px;">
                  ${Icons.alertCircle(14)} Không trích xuất được văn bản từ ảnh
                </div>
                <div style="margin-top:4px;">
                  Mô hình OCR cục bộ chưa nhận diện được chữ từ hình ảnh này. Bạn có thể mở <strong>Cài đặt</strong> và thêm <strong>API Key Google Gemini (Miễn phí)</strong> để AI giải trực tiếp từ ảnh.
                </div>
              </div>
            `;
            return;
          }

          const targetLangObj = SUPPORTED_LANGUAGES.find((l) => l.id === outputLanguage);
          const targetLangName = targetLangObj ? targetLangObj.name : 'English';

          const { sysPrompt: nanoSysPrompt, userPrompt: nanoPrompt } = buildNanoPrompts(
            studyMode,
            prompt,
            ocrText,
            targetLangName,
            nanoSystemPrompt
          );

          window.dispatchEvent(
            new CustomEvent('HOMEWORK_AI_NANO_EXEC', {
              detail: {
                prompt: nanoPrompt,
                requestId: this.overlay.drawer.activeRequestId,
                systemPrompt: nanoSysPrompt,
              },
            })
          );
        }
      );
      return;
    }

    chrome.runtime.sendMessage({
      action: 'ASK_AI',
      payload: {
        prompt,
        imageBase64,
        studyMode,
        outputLanguage,
        requestId: this.overlay.drawer.activeRequestId,
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

    this.hideCollapsedFab();
    this.popupCard.style.display = 'flex';
    this.executePopupAction(type, text);
  }

  async executePopupAction(type, text) {
    const s = this.shadow;
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const cardDict = getFloatingPopupI18n(uiLanguage);
    const genDict = getI18n(uiLanguage);

    const content = s.getElementById('hwCardAnswerContent');
    this.startLoadingSteps(content, genDict.loadingSteps);

    this.activeCardResponseText = '';
    this.activeCardNotices = [];
    this.resetNoticeIcon();
    this.overlay.drawer.isStreaming = true;
    this.overlay.drawer.activeTarget = 'card';
    this.overlay.drawer.activeRequestId = `req_${Date.now()}`;

    let prompt = text;
    let studyMode = 'step-by-step';
    let userLabel = text;

    if (type === 'translate') {
      const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.id === this.targetLang)?.name || 'English';
      prompt = `Translate the following text accurately into ${targetLangName}:\n\n${text}`;
      studyMode = 'translate';
      userLabel = `[Translate to ${targetLangName}]: ${text}`;
    } else if (type === 'search') {
      prompt = `Search, verify facts, and solve this homework question:\n\n${text}`;
      studyMode = 'direct';
      userLabel = `[Search & Solve]: ${text}`;
    } else if (type === 'explain') {
      prompt = `Provide a comprehensive educational explanation of the following concept:\n\n${text}`;
      studyMode = 'explain';
      userLabel = `[Deep Explanation]: ${text}`;
    } else if (type === 'summarize') {
      prompt = `Summarize the following text concisely with key points:\n\n${text}`;
      studyMode = 'summarize';
      userLabel = `[Summarize]: ${text}`;
    } else if (type === 'grammar') {
      prompt = `Check and correct grammar, spelling, and phrasing in the following text. Highlight improvements:\n\n${text}`;
      studyMode = 'explain';
      userLabel = `[Grammar Checker]: ${text}`;
    }

    Storage.addChatMessage({
      role: 'user',
      content: userLabel,
    });

    const { apiConfigs = [], systemPrompt, nanoSystemPrompt, outputLanguage = 'en' } = await Storage.get(['apiConfigs', 'systemPrompt', 'nanoSystemPrompt', 'outputLanguage']);
    const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin'));

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
      const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'English';
      const promptToUse = nanoSystemPrompt || DEFAULT_NANO_SYSTEM_PROMPT;
      const nanoSysPrompt = `${promptToUse}\n\n[STRICT LANGUAGE]: You MUST reply in ${targetLangName}.`.trim();
      const nanoPrompt = `${prompt}\n\n[Output entirely in ${targetLangName}]`;

      window.dispatchEvent(
        new CustomEvent('HOMEWORK_AI_NANO_EXEC', {
          detail: {
            prompt: nanoPrompt,
            requestId: this.overlay.drawer.activeRequestId,
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
        requestId: this.overlay.drawer.activeRequestId,
      },
    });
  }

  async renderCardHistory() {
    const conversations = await Storage.getConversations();
    const { activeConversationId } = await Storage.get(['activeConversationId']);
    const listEl = this.shadow.getElementById('hwCardHistoryList');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (conversations.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:32px 10px; color:#94a3b8; font-size:13px;">
          Chưa có hội thoại nào được lưu.<br>Hãy tạo đoạn chat mới để bắt đầu!
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
          <div class="hw-card-history-title">${conv.title || 'Hội thoại không tên'}</div>
          <div class="hw-card-history-time">${Icons.clock(11)} ${dateStr} &bull; ${msgCount} tin nhắn</div>
        </div>
        <button class="hw-icon-btn hw-btn-del-conv" title="Xóa hội thoại này" style="width:24px;height:24px;color:#94a3b8;flex-shrink:0;">
          ${Icons.trash(13)}
        </button>
      `;

      el.querySelector('.hw-btn-del-conv').addEventListener('click', async (e) => {
        e.stopPropagation();
        await Storage.deleteConversation(conv.id);
        this.renderCardHistory();
        this.overlay.drawer.loadInitialHistory();
      });

      el.addEventListener('click', async () => {
        this.stopLoadingSteps();
        await Storage.switchConversation(conv.id);
        this.shadow.getElementById('hwCardHistoryPanel').style.display = 'none';

        const lastUser = (conv.messages || []).filter((m) => m.role === 'user').pop();
        const lastAssistant = (conv.messages || []).filter((m) => m.role === 'assistant').pop();

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
}
