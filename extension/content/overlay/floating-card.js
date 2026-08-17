/**
 * In-Page Floating Solution / Translation / Search Popup Card Subcomponent
 */

import { Icons } from '../../shared/icons.js';
import { Storage } from '../../shared/storage.js';
import { formatMarkdownAndMath } from '../../shared/markdown-katex.js';
import { getFloatingPopupI18n } from '../../shared/i18n.js';

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

    this.init();
  }

  init() {
    this.makeCardDraggable();
    this.setupListeners();
  }

  setupListeners() {
    const s = this.shadow;

    s.getElementById('hwBtnCloseCard')?.addEventListener('click', () => {
      this.popupCard.style.display = 'none';
      s.getElementById('hwCardHistoryPanel').style.display = 'none';
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
    this.overlay.drawer.isStreaming = true;
    this.overlay.drawer.activeTarget = 'card';
    this.overlay.drawer.activeRequestId = `req_${Date.now()}`;

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
              requestId: this.overlay.drawer.activeRequestId,
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
    this.overlay.drawer.isStreaming = true;
    this.overlay.drawer.activeTarget = 'card';
    this.overlay.drawer.activeRequestId = `req_${Date.now()}`;

    let prompt = text;
    let studyMode = 'step-by-step';
    let userLabel = text;

    if (type === 'translate') {
      const targetLangName = LANGUAGE_OPTIONS.find((l) => l.id === this.targetLang)?.name || 'English';
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
      const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'English';
      const nanoSysPrompt = `${systemPrompt || ''}\n\n[STRICT LANGUAGE]: You MUST reply in ${targetLangName}.`.trim();
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
