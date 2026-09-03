/**
 * In-Page Floating Solution / Translation / Search Popup Card Subcomponent
 */

import { Icons } from '../../shared/icons.js';
import { Storage, SUPPORTED_LANGUAGES, buildNanoPrompts } from '../../shared/storage.js';
import { renderAnswer } from '../../shared/markdown-katex.js';
import { getFloatingPopupI18n, getI18n } from '../../shared/i18n.js';
import { OcrEngine } from '../../shared/ocr-engine.js';
import { speak, isSpeechAvailable, bindSpeakButtons } from '../../shared/tts.js';
import { parseDictionaryEntry } from '../../shared/dictionary.js';
import { EnginePicker } from '../../shared/engine-picker.js';
import { AI_PROVIDER_ID, PICKABLE_PROVIDER_IDS } from '../../shared/translate-providers.js';
import { TranslateHistorySheet } from '../../shared/translate-history-sheet.js';
import { ensureStylesheet } from '../shadow-root.js';

export class OverlayFloatingCard {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this.popupCard = this.shadow.getElementById('hwSolutionCard');
    this.popupMode = 'screenshot';
    this.popupSourceText = '';
    this.popupImageBase64 = null;
    this.popupImageMode = 'solve';
    this.targetLang = 'en';
    // Which service translates a selection. Kept separate from the toolbar
    // popup's own `popupTranslateEngine`: this card has always run on the
    // user's AI models, and defaulting it to anything else would silently
    // change what an existing user gets from Translate.
    this.translateEngine = AI_PROVIDER_ID;
    this.enginePicker = null;
    this.historySheet = null;
    // The Storage.translateHistory entry the currently displayed translate
    // result was recorded as — null whenever the card isn't showing a fresh
    // translation (any other mode, or nothing translated yet this run).
    this.currentHistoryEntryId = null;
    // Title for the listen buttons a rendered reply draws inline. Held here
    // because the drawer renders into this card while streaming and has only
    // the general dictionary in hand, not the card's own.
    this.speakLabel = 'Listen';
    // Bumped per free-engine request so a reply that arrives after the user
    // has moved on cannot overwrite a newer one.
    this.freeTranslateEpoch = 0;
    this.activeCardResponseText = '';
    this.activeCardNotices = [];
    this.loadingStepsInterval = null;
    // Pixel size of the collapsed FAB, kept in sync with the shared `fabSize`
    // setting by applyFabAppearance() — must match .hw-card-collapsed-fab.hw-fab-size-*
    // in overlay.css. Used for drag-bounds clamping and edge-snapping math.
    this.fabSize = 36;
    this.fabEdgeMargin = 10;

    this.init();
  }

  init() {
    this.makeCardDraggable();
    this.makeCollapsedFabDraggable();
    this.setupListeners();
    this.setupFloatTab();
    this.setupEnginePicker();
    this.setupHistorySheet();
    // One delegated listener for every listen button a rendered reply draws
    // inline — they are re-created on each streamed chunk, so nothing can be
    // wired per button. See bindSpeakButtons() in shared/tts.js.
    bindSpeakButtons(this.shadow);
  }

  /**
   * Past translations, shared with the toolbar popup (see
   * Storage.addTranslateHistory()) — never with the AI chat history the
   * hwBtnCardHistory button opens in every other mode. Mounted straight into
   * the card itself (already position:fixed) rather than portalled, per
   * translate-history-sheet.js's own doc comment — the sheet is meant to
   * cover exactly this card's content area, clipped by the card's own
   * overflow:hidden.
   */
  async setupHistorySheet() {
    ensureStylesheet('shared/translate-history-sheet.css');
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const cardDict = getFloatingPopupI18n(uiLanguage);
    this.historySheet = new TranslateHistorySheet(this.popupCard, {
      labels: this.historyLabels(cardDict),
      speakLabel: () => this.speakLabel,
    });
  }

  // Prefixed (unlike the toolbar popup's own historyLabels()) because this
  // dictionary already has a historyTitle/historyDesc pair for the
  // hwBtnCardHistory button's *other* job — the chat conversation panel
  // every non-translate mode opens with it.
  historyLabels(cardDict = {}) {
    return {
      title: cardDict.translateHistoryTitle,
      tabHistory: cardDict.translateHistoryTabHistory,
      tabFavorite: cardDict.translateHistoryTabFavorite,
      close: cardDict.translateHistoryClose,
      favorite: cardDict.favorite,
      emptyHistory: cardDict.translateHistoryEmpty,
      emptyFavorite: cardDict.translateHistoryEmptyFavorite,
      clear: cardDict.translateHistoryClear,
      confirmClear: cardDict.translateHistoryConfirmClear,
      deleteAll: cardDict.translateHistoryDeleteAll,
      moreDeleteOptions: cardDict.translateHistoryMoreDeleteOptions,
      confirmClearAll: cardDict.translateHistoryConfirmClearAll,
      selectedCount: cardDict.translateHistorySelectedCount,
    };
  }

  /** Called by the overlay when the interface language changes. */
  applyHistorySheetLabels(cardDict) {
    this.historySheet?.setLabels(this.historyLabels(cardDict));
  }

  /**
   * Records the just-finished translation into the shared history and syncs
   * the footer's Favorite button + an already-open history sheet to match.
   * Called from both translate paths — the free-engine one-shot reply and
   * the AI streaming one (via OverlayDrawer.finalizeStream()) — never for a
   * screenshot/image translation, which isn't a text lookup a history list
   * of source→translated pairs makes sense for.
   */
  async recordTranslateHistory(sourceText, translatedRaw) {
    if (!sourceText?.trim() || !translatedRaw) return;
    const entry = await Storage.addTranslateHistory({
      sourceText,
      translatedRaw,
      sourceLang: 'auto',
      targetLang: this.targetLang,
    });
    this.currentHistoryEntryId = entry?.id || null;
    this.syncFavoriteButton(entry?.isFavorite);
    this.historySheet?.refresh();
  }

  /**
   * Only meaningful once a translation has actually been recorded — an
   * always-visible star with nothing to attach to would be worse than none,
   * same reasoning as the Listen button (syncSpeakButton()).
   */
  syncFavoriteButton(isFavorite) {
    const btn = this.shadow.getElementById('hwBtnCardFavorite');
    if (!btn) return;
    btn.style.display = this.currentHistoryEntryId ? 'flex' : 'none';
    btn.classList.toggle('is-active', !!isFavorite);
  }

  /**
   * The translation-source dropdown in the card's translate bar. Its menu is
   * portalled to the shadow root (the card clips its own children), so the
   * stylesheet has to be in that root too — overlay.css alone would not carry
   * it.
   */
  async setupEnginePicker() {
    ensureStylesheet('shared/engine-picker.css');
    const mount = this.shadow.getElementById('hwCardEnginePicker');
    if (!mount) return;

    const { cardTranslateEngine, uiLanguage = 'en' } = await Storage.get(['cardTranslateEngine', 'uiLanguage']);
    if (PICKABLE_PROVIDER_IDS.includes(cardTranslateEngine)) this.translateEngine = cardTranslateEngine;
    const cardDict = getFloatingPopupI18n(uiLanguage);
    this.speakLabel = cardDict.listen || this.speakLabel;

    this.enginePicker = new EnginePicker(mount, {
      value: this.translateEngine,
      labels: this.engineLabels(cardDict),
      onChange: (id) => {
        this.translateEngine = id;
        Storage.set({ cardTranslateEngine: id });
        // Re-run immediately rather than making the user press Retry — the
        // whole point of switching source is to see the other result.
        if (this.popupSourceText) this.executePopupAction('translate', this.popupSourceText);
      },
    });
  }

  engineLabels(cardDict = {}) {
    return {
      groupFree: cardDict.sourceGroupFree || 'Free services',
      groupAi: cardDict.sourceGroupAi || 'Your AI',
      ai: cardDict.sourceAi || 'AI models',
    };
  }

  /** Called by the overlay when the interface language changes. */
  applyEnginePickerLabels(cardDict) {
    this.speakLabel = cardDict?.listen || this.speakLabel;
    this.enginePicker?.setLabels(this.engineLabels(cardDict));
  }

  // Compact mode's floating chrome lives outside .hw-solution-card (see
  // overlay.js/overlay.css) so it can slide above the card's own top edge
  // without being clipped by the card's overflow:hidden (needed for its
  // rounded corners + native resize handle) and without ever pushing the
  // card's own content down. Since these are siblings rather than
  // descendants, plain CSS :hover on the card can't reveal them — position
  // and visibility are kept in sync here instead.
  //
  // Deliberately TWO separate floating elements, not one bar spanning the
  // card's width: a small title chip (icon + name, sized to its own content)
  // on the left, and the three history/collapse/close buttons — with no
  // shared background of their own — pinned to the right. The buttons move
  // here for real (not cloned — a clone would lose its click listeners),
  // physically relocated while compact. In every other card size they stay
  // put inside the real header; compact is the one mode where that header
  // collapses to zero height, which used to leave these three absolutely
  // positioned right on top of whatever content starts at the card's very
  // top edge — the translate bar's two selects, most often.
  setupFloatTab() {
    const tab = this.shadow.getElementById('hwCardFloatTab');
    const titleMirror = this.shadow.getElementById('hwCardFloatTabTitle');
    const actionsFloat = this.shadow.getElementById('hwCardFloatActions');
    const header = this.shadow.getElementById('hwCardHeader');
    const actions = this.shadow.getElementById('hwCardHeaderActions');
    const card = this.popupCard;
    if (!tab || !titleMirror || !actionsFloat || !header || !actions || !card) return;

    const syncPosition = () => {
      const isOpen = getComputedStyle(card).display !== 'none';
      const isCompact = card.classList.contains('hw-card-compact');

      if (isCompact && actions.parentElement !== actionsFloat) actionsFloat.appendChild(actions);
      else if (!isCompact && actions.parentElement !== header) header.appendChild(actions);

      if (!isOpen || !isCompact) {
        tab.style.display = 'none';
        actionsFloat.style.display = 'none';
        return;
      }
      const titleEl = card.querySelector('.hw-card-title');
      if (titleEl) {
        titleMirror.innerHTML = titleEl.innerHTML;
        // Strip any mirrored id (e.g. #hwPopupTitle) so it doesn't collide
        // with the original still living inside the (hidden) header.
        titleMirror.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      }

      tab.style.display = 'flex';
      actionsFloat.style.display = 'flex';
      const cardRect = card.getBoundingClientRect();
      tab.style.left = `${Math.round(cardRect.left + 10)}px`;
      const tabRect = tab.getBoundingClientRect();
      const actionsRect = actionsFloat.getBoundingClientRect();
      // Both sit on the same horizontal band above the card — the taller of
      // the two (usually the actions row, whose 24px buttons stand slightly
      // taller than the title chip's own text+padding) sets that band so
      // neither one looks like it's floating half a step off from the other.
      const bandHeight = Math.max(tabRect.height, actionsRect.height);
      const top = Math.round(cardRect.top - bandHeight + 2);
      tab.style.top = `${top}px`;
      actionsFloat.style.top = `${top}px`;
      actionsFloat.style.left = `${Math.round(cardRect.right - actionsRect.width - 8)}px`;
    };

    let hideTimer = null;
    const reveal = () => {
      clearTimeout(hideTimer);
      tab.classList.add('hw-visible');
      actionsFloat.classList.add('hw-visible');
    };
    const scheduleHide = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        tab.classList.remove('hw-visible');
        actionsFloat.classList.remove('hw-visible');
      }, 120);
    };

    card.addEventListener('mouseenter', reveal);
    card.addEventListener('mouseleave', scheduleHide);
    card.addEventListener('focusin', reveal);
    card.addEventListener('focusout', scheduleHide);
    tab.addEventListener('mouseenter', reveal);
    tab.addEventListener('mouseleave', scheduleHide);
    actionsFloat.addEventListener('mouseenter', reveal);
    actionsFloat.addEventListener('mouseleave', scheduleHide);

    new ResizeObserver(syncPosition).observe(card);
    new ResizeObserver(syncPosition).observe(actionsFloat);
    new MutationObserver(syncPosition).observe(card, { attributes: true, attributeFilter: ['style', 'class'] });
    const titleEl = card.querySelector('.hw-card-title');
    if (titleEl) new MutationObserver(syncPosition).observe(titleEl, { childList: true, characterData: true, subtree: true });
    window.addEventListener('resize', syncPosition);

    syncPosition();
  }

  hideCollapsedFab() {
    const fab = this.shadow.getElementById('hwCardCollapsedFab');
    if (fab) fab.style.display = 'none';
  }

  // Same 'tiny'|'small'|'normal'|'large' size and 30-100% opacity settings
  // that style the standing FAB cluster (OverlayFabs.applyAppearance) also
  // style this collapsed-popup FAB — they're visually the same kind of
  // control, so one pair of settings covers both.
  static FAB_SIZE_PX = { tiny: 22, small: 28, normal: 36, large: 42 };

  applyFabAppearance(fabSize = 'normal', fabOpacity = 90) {
    this.fabSize = OverlayFloatingCard.FAB_SIZE_PX[fabSize] || OverlayFloatingCard.FAB_SIZE_PX.normal;

    const fab = this.shadow.getElementById('hwCardCollapsedFab');
    if (!fab) return;
    fab.classList.remove('hw-fab-size-tiny', 'hw-fab-size-small', 'hw-fab-size-normal', 'hw-fab-size-large');
    fab.classList.add(`hw-fab-size-${fabSize || 'normal'}`);
    fab.style.setProperty('--hw-fab-icon-alpha', (fabOpacity / 100).toFixed(2));
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
      const left = Math.max(0, Math.min(window.innerWidth - this.fabSize, e.clientX - offsetX));
      const top = Math.max(0, Math.min(window.innerHeight - this.fabSize, e.clientY - offsetY));
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
      // Closing the popup mid-answer used to just hide the UI while the
      // request kept running unseen in the background/offscreen document
      // (burning tokens, or leaving a local LM Studio/Ollama model still
      // generating) — abort it for real instead.
      if (this.overlay.drawer.isStreaming && this.overlay.drawer.activeTarget === 'card') {
        this.overlay.drawer.stopStream();
      }
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
      // Translate mode opens the shared translate-history sheet instead of
      // the chat conversation panel every other mode uses here — the two
      // are deliberately separate concepts (see recordTranslateHistory()).
      if (this.popupMode === 'translate') {
        this.historySheet?.toggle();
        return;
      }
      const panel = s.getElementById('hwCardHistoryPanel');
      const isVisible = panel.style.display === 'flex';
      if (isVisible) {
        panel.style.display = 'none';
      } else {
        panel.style.display = 'flex';
        this.renderCardHistory();
      }
    });

    s.getElementById('hwBtnCardFavorite')?.addEventListener('click', async () => {
      if (!this.currentHistoryEntryId) return;
      const updated = await Storage.toggleTranslateFavorite(this.currentHistoryEntryId);
      this.syncFavoriteButton(updated?.isFavorite);
      this.historySheet?.refresh();
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

    s.getElementById('hwBtnCardSpeak')?.addEventListener('click', () => {
      const target = this.getSpeechTarget();
      // The page's own language disambiguates Han text — see guessLang().
      if (target) speak(target.text, target.lang, document.documentElement.lang || '');
    });

    s.getElementById('hwBtnCardRetry')?.addEventListener('click', () => {
      if (this.popupMode === 'screenshot' && this.popupImageBase64) {
        this.showSolutionCard(this.popupImageBase64, this.popupImageMode);
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

  /**
   * What the Listen button should pronounce. For a word lookup that is the
   * headword in its own language — the pronunciation the reader is looking up
   * — not the translation of it. Anything else reads back the reply in the
   * language it was written in.
   */
  getSpeechTarget() {
    const reply = this.activeCardResponseText || '';
    if (!reply.trim()) return null;

    const entry = parseDictionaryEntry(reply);
    if (entry?.word) {
      // The card has no source-language selector, so the headword's own script
      // decides the voice — see guessLang().
      return { text: entry.word, lang: 'auto' };
    }
    if (this.popupMode !== 'translate') return null;
    return { text: this.shadow.getElementById('hwCardAnswerContent')?.textContent || '', lang: this.targetLang };
  }

  /**
   * The button is only meaningful once a reply has arrived, and only where the
   * browser actually has a voice — an always-visible control that does nothing
   * would read as a broken feature.
   */
  syncSpeakButton() {
    const btn = this.shadow.getElementById('hwBtnCardSpeak');
    if (!btn) return;
    // A dictionary reply draws its own listen buttons beside the phonetic and
    // beside the translation, which is where a reader looks for them — the
    // footer button only stands in for replies that have no such row.
    const hasInline = !!this.shadow.getElementById('hwCardAnswerContent')?.querySelector('[data-hw-speak]');
    const target = (!hasInline && isSpeechAvailable()) ? this.getSpeechTarget() : null;
    btn.style.display = target?.text ? 'flex' : 'none';
  }

  makeCardDraggable() {
    const header = this.shadow.getElementById('hwCardHeader');
    const floatTab = this.shadow.getElementById('hwCardFloatTab');
    const card = this.popupCard;
    if (!header || !card) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const startDrag = (e) => {
      if (e.target.closest('.hw-icon-btn, select')) return;
      isDragging = true;
      offsetX = e.clientX - card.getBoundingClientRect().left;
      offsetY = e.clientY - card.getBoundingClientRect().top;
    };

    // In compact mode the header collapses to zero height and the floating
    // title tab (outside the card, see setupFloatTab()) becomes the only
    // visible drag surface, so it needs its own listener too.
    header.addEventListener('mousedown', startDrag);
    floatTab?.addEventListener('mousedown', startDrag);

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

  async showSolutionCard(imageBase64, mode = 'solve') {
    // PHẢI lấy TRƯỚC Storage.addChatMessage() ở dưới (dòng ghi tin nhắn "đã
    // chụp ảnh" của chính lượt này) — lấy sau sẽ dính đua tranh.
    const priorMessages = await Storage.getChatHistory();
    const s = this.shadow;
    this.popupMode = 'screenshot';
    this.popupSourceText = '';
    this.popupImageBase64 = imageBase64;
    this.popupImageMode = mode;

    const {
      uiLanguage = 'en',
      outputLanguage = 'en',
      studyMode: savedStudyMode = 'step-by-step',
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
    this.speakLabel = cardDict.listen || this.speakLabel;
    const genDict = getI18n(uiLanguage);
    this.overlay.drawer.currentDict = genDict;
    const studyMode = mode === 'translate' ? 'translate' : savedStudyMode;
    // A screenshot solve/translate is never a text lookup — no history entry
    // to favorite here, regardless of what the last text translation left behind.
    this.currentHistoryEntryId = null;
    this.syncFavoriteButton(false);

    s.getElementById('hwPopupTitle').textContent = mode === 'translate' ? cardDict.translateTitle : cardDict.helperTitle;
    s.getElementById('hwTranslateBar').style.display = 'none';
    s.getElementById('hwCardSourceText').style.display = 'none';

    const thumb = s.getElementById('hwCardThumb');
    thumb.src = imageBase64;
    thumb.style.display = 'block';

    let headingText;
    if (mode === 'translate') {
      headingText = cardDict.translateHeading;
    } else if (studyMode === 'direct') {
      headingText = genDict.modes?.direct || 'ĐÁP ÁN TRỰC TIẾP';
    } else if (studyMode === 'hint') {
      headingText = genDict.modes?.hint || 'GỢI Ý & HƯỚNG DẪN';
    } else {
      headingText = cardDict.answerHeading;
    }
    s.getElementById('hwCardAnswerHeading').textContent = headingText.toUpperCase();
    s.getElementById('hwBtnPrimaryLabel').textContent = cardDict.nextQuestion;
    s.getElementById('hwBtnCardPrimary').querySelector('.lucide-icon')?.remove();
    s.getElementById('hwBtnCardPrimary').insertAdjacentHTML('afterbegin', Icons.scissors(14));

    const content = s.getElementById('hwCardAnswerContent');
    this.startLoadingSteps(content, genDict.loadingSteps);

    this.hideCollapsedFab();
    this.popupCard.style.display = 'flex';
    this.activeCardResponseText = '';
    this.syncSpeakButton();
    this.activeCardNotices = [];
    this.resetNoticeIcon();
    this.overlay.drawer.isStreaming = true;
    this.overlay.drawer.activeTarget = 'card';
    this.overlay.drawer.activeRequestId = `req_${Date.now()}`;
    this.overlay.drawer.setSendButtonStreaming(true);

    const prompt = mode === 'translate'
      ? (genDict.imageTranslatePromptHeader || 'Please translate all text shown in this image accurately:')
      : (genDict.imagePromptHeader || 'Please solve the homework question shown in this image:');

    Storage.addChatMessage({
      role: 'user',
      content: mode === 'translate'
        ? (genDict.captureTranslateText || 'Translate text from captured image')
        : (genDict.captureSolveText || 'Solve homework problem from captured image'),
      image: imageBase64,
    });

    const enabledKeys = (apiConfigs || []).filter(
      (c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin')
    );

    if (await this.overlay.drawer.isNanoHardBlocked(enabledKeys.length)) {
      this.overlay.drawer.handleStreamError('CHROME_AI_UNAVAILABLE: Gemini Nano is not available on this device, and no Cloud/Local API key is configured.');
      return;
    }

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
              <summary style="cursor:pointer; font-size:10.5px; color:var(--hw-text-muted); user-select:none; list-style:none; display:flex; align-items:center; gap:4px; padding:3px 0;">
                <span style="font-size:9px; transition:transform .2s;">▶</span>
                <span>Chi tiết log OCR</span>
              </summary>
              <div style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace; font-size:10.5px; color:var(--hw-text-main); background:rgba(var(--hw-glass-rgb), 0.85); padding:6px 10px; border-radius:6px; max-height:80px; overflow-y:auto; line-height:1.45; border:1px solid var(--hw-border-color); margin-top:2px;">
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
              <div style="padding:12px; background:rgba(var(--hw-warning-rgb), 0.1); border:1px solid rgba(var(--hw-warning-rgb), 0.35); border-radius:8px; font-size:12px; color:var(--hw-warning); line-height:1.5;">
                <div style="font-weight:700; display:flex; align-items:center; gap:6px; font-size:12.5px;">
                  ${Icons.alertCircle(14)} Không trích xuất được văn bản từ ảnh
                </div>
                <div style="margin-top:4px;">
                  Mô hình OCR cục bộ chưa nhận diện được chữ từ ảnh này (${res?.error || 'Trống'}). Bạn có thể mở <strong>Cài đặt</strong> và thêm <strong>API Key Google Gemini (Miễn phí)</strong> để AI đọc thẳng ảnh bằng Vision AI.
                </div>
                <div style="margin-top:8px; font-family:monospace; font-size:10.5px; background:rgba(var(--hw-glass-rgb), 0.7); padding:6px; border-radius:4px; color:var(--hw-text-main); max-height:80px; overflow-y:auto;">
                  ${logLines.join('<br>')}
                </div>
              </div>
            `;
            return;
          }

          const ocrText = res.text || '';
          if (!ocrText.trim()) {
            content.innerHTML = `
              <div style="padding:12px; background:rgba(var(--hw-warning-rgb), 0.1); border:1px solid rgba(var(--hw-warning-rgb), 0.35); border-radius:8px; font-size:12px; color:var(--hw-warning); line-height:1.5;">
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

          const { sysPrompt: nanoSysPrompt, userPrompt: nanoPrompt, responseConstraint: nanoConstraint } = buildNanoPrompts(
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
            responseConstraint: nanoConstraint,
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
        history: priorMessages.map((m) => ({ role: m.role, content: m.content })),
      },
    });
  }

  async openActionPopup(type, text, rect) {
    const s = this.shadow;
    this.popupMode = type;
    this.popupSourceText = text;
    this.popupImageBase64 = null;

    const { uiLanguage = 'en', outputLanguage = 'en' } = await Storage.get(['uiLanguage', 'outputLanguage']);
    const cardDict = getFloatingPopupI18n(uiLanguage);
    this.speakLabel = cardDict.listen || this.speakLabel;

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

    // Dictionary-style markdown (POS tags, highlighted example words) only
    // applies to translate mode's single-word lookups — see hw-dict-mode in overlay.css.
    s.getElementById('hwCardAnswerContent')?.classList.toggle('hw-dict-mode', type === 'translate');

    if (type === 'translate') {
      titleEl.textContent = cardDict.translateTitle;
      headingEl.textContent = cardDict.translateHeading;
      translateBar.style.display = 'flex';
      const targetLangSelect = s.getElementById('hwLangTarget');
      this.targetLang = (targetLangSelect && targetLangSelect.value) || outputLanguage;
      if (targetLangSelect) targetLangSelect.value = this.targetLang;
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

    // Position popup near the new selection — but only if the card isn't already
    // open. If the user left a previous popup open (possibly dragged elsewhere),
    // keep it where they put it instead of jumping to the new selection.
    const wasAlreadyOpen = this.popupCard.style.display === 'flex';
    if (rect && !wasAlreadyOpen) {
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

  /**
   * Translate through one of the keyless services (Microsoft, Google, …)
   * instead of the user's AI models.
   *
   * The background's TRANSLATE_TEXT handler does the work, including the
   * dictionary lookup it runs first for a single word — which is why a free
   * engine can still fill the same card layout, phonetic and all, that the AI
   * path produces.
   */
  async runFreeEngineTranslate(text) {
    const s = this.shadow;
    const content = s.getElementById('hwCardAnswerContent');
    if (!content) return;

    // A stream still writing into this card would overwrite the free engine's
    // answer the moment its next chunk lands — switching source has to end it,
    // not race it.
    if (this.overlay.drawer.isStreaming && this.overlay.drawer.activeTarget === 'card') {
      this.overlay.drawer.stopStream();
    }

    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const cardDict = getFloatingPopupI18n(uiLanguage);
    this.speakLabel = cardDict.listen || this.speakLabel;

    this.stopLoadingSteps();
    this.activeCardResponseText = '';
    this.activeCardNotices = [];
    this.resetNoticeIcon();
    this.currentHistoryEntryId = null;
    this.syncFavoriteButton(false);
    this.syncSpeakButton();
    content.innerHTML = `<span style="color:var(--hw-text-muted);">${cardDict.processing || 'Translating…'}</span>`;

    const epoch = ++this.freeTranslateEpoch;
    let res = null;
    try {
      res = await chrome.runtime.sendMessage({
        action: 'TRANSLATE_TEXT',
        payload: { text, from: 'auto', to: this.targetLang, engine: this.translateEngine },
      });
    } catch {
      res = null;
    }
    if (epoch !== this.freeTranslateEpoch) return;

    if (!res?.success) {
      content.innerHTML = `<span style="color:var(--hw-danger);">${cardDict.translateFailed || 'Could not translate'}</span>`;
      this.syncSpeakButton();
      return;
    }

    this.activeCardResponseText = res.translation;
    content.innerHTML = renderAnswer(res.translation, {
      speakLabel: cardDict.listen,
      targetLang: this.targetLang,
    });
    this.syncSpeakButton();
    this.recordTranslateHistory(text, res.translation);
  }

  async executePopupAction(type, text) {
    // A free service answers in one shot over a plain message, with no key
    // pool, no streaming, and nothing to record in the chat history — none of
    // the AI setup below applies to it.
    if (type === 'translate' && this.translateEngine !== AI_PROVIDER_ID) {
      return this.runFreeEngineTranslate(text);
    }

    // PHẢI lấy TRƯỚC Storage.addChatMessage() ở dưới — lấy sau sẽ dính đua tranh.
    const priorMessages = await Storage.getChatHistory();
    const s = this.shadow;
    const { uiLanguage = 'en', studyMode: savedStudyMode = 'step-by-step' } = await Storage.get(['uiLanguage', 'studyMode']);
    const cardDict = getFloatingPopupI18n(uiLanguage);
    const genDict = getI18n(uiLanguage);
    this.overlay.drawer.currentDict = genDict;

    const content = s.getElementById('hwCardAnswerContent');
    this.startLoadingSteps(content, genDict.loadingSteps);

    this.activeCardResponseText = '';
    this.syncSpeakButton();
    this.activeCardNotices = [];
    this.resetNoticeIcon();
    if (type === 'translate') {
      this.currentHistoryEntryId = null;
      this.syncFavoriteButton(false);
    }
    this.overlay.drawer.isStreaming = true;
    this.overlay.drawer.activeTarget = 'card';
    this.overlay.drawer.activeRequestId = `req_${Date.now()}`;
    this.overlay.drawer.setSendButtonStreaming(true);

    let prompt = text;
    let studyMode = savedStudyMode;
    let userLabel = text;

    if (type === 'translate') {
      const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.id === this.targetLang)?.name || 'English';
      // The raw selected text is passed through as-is — formatStudyPrompt /
      // buildNanoPrompts build the actual translate instruction from
      // studyMode + outputLanguage. Pre-wrapping it here too used to produce
      // a doubled, conflicting instruction (see effectiveOutputLanguage below).
      prompt = text;
      studyMode = 'translate';
      userLabel = `[Translate to ${targetLangName}]: ${text}`;
    } else if (type === 'search') {
      prompt = `Search, verify facts, and solve this homework question:\n\n${text}`;
      studyMode = 'direct';
      userLabel = `[Search & Solve]: ${text}`;
    } else if (type === 'explain' || type === 'summarize' || type === 'grammar') {
      // Same rule as translate above: the selected text goes through raw and
      // the instruction comes from the study mode alone. Wrapping it here as
      // well produced two competing instructions — and 'grammar' additionally
      // used to be sent as studyMode 'explain', so a proofreading request came
      // back as a theory lecture about the sentence.
      prompt = text;
      studyMode = type;
      userLabel = `${{ explain: '[Deep Explanation]', summarize: '[Summarize]', grammar: '[Grammar Checker]' }[type]}: ${text}`;
    }

    Storage.addChatMessage({
      role: 'user',
      content: userLabel,
    });

    const { apiConfigs = [], systemPrompt, nanoSystemPrompt, outputLanguage = 'en' } = await Storage.get(['apiConfigs', 'systemPrompt', 'nanoSystemPrompt', 'outputLanguage']);
    const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin'));

    if (await this.overlay.drawer.isNanoHardBlocked(enabledKeys.length)) {
      this.overlay.drawer.handleStreamError('CHROME_AI_UNAVAILABLE: Gemini Nano is not available on this device, and no Cloud/Local API key is configured.');
      return;
    }

    // For translate mode the "language to reply in" IS the chosen translate
    // target — reusing the general outputLanguage setting here would tell
    // the model to reply in one language while translating into another.
    const effectiveOutputLanguage = type === 'translate' ? this.targetLang : outputLanguage;

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
      const targetLangName = (effectiveOutputLanguage && effectiveOutputLanguage !== 'auto') ? (langNames[effectiveOutputLanguage] || effectiveOutputLanguage) : 'English';
      const { sysPrompt: nanoSysPrompt, userPrompt: nanoPrompt, responseConstraint: nanoConstraint } = buildNanoPrompts(studyMode, prompt, '', targetLangName, nanoSystemPrompt);

      window.dispatchEvent(
        new CustomEvent('HOMEWORK_AI_NANO_EXEC', {
          detail: {
            prompt: nanoPrompt,
            requestId: this.overlay.drawer.activeRequestId,
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
        studyMode,
        outputLanguage: effectiveOutputLanguage,
        requestId: this.overlay.drawer.activeRequestId,
        history: priorMessages.map((m) => ({ role: m.role, content: m.content })),
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
        <div style="text-align:center; padding:32px 10px; color:var(--hw-text-muted); font-size:13px;">
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
        : `<div class="hw-card-history-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--hw-accent);background:var(--hw-accent-tint);">${Icons.fileText(18)}</div>`;

      const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const msgCount = conv.messages?.length || 0;

      el.innerHTML = `
        ${thumbHtml}
        <div class="hw-card-history-info">
          <div class="hw-card-history-title">${conv.title || 'Hội thoại không tên'}</div>
          <div class="hw-card-history-time">${Icons.clock(11)} ${dateStr} &bull; ${msgCount} tin nhắn</div>
        </div>
        <button class="hw-icon-btn hw-btn-del-conv" title="Xóa hội thoại này" style="width:24px;height:24px;color:var(--hw-text-muted);flex-shrink:0;">
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
        const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
        await Storage.switchConversation(conv.id);
        this.shadow.getElementById('hwCardHistoryPanel').style.display = 'none';

        const lastUser = (conv.messages || []).filter((m) => m.role === 'user').pop();
        const lastAssistant = (conv.messages || []).filter((m) => m.role === 'assistant').pop();

        if (lastUser?.image) {
          this.popupMode = 'screenshot';
          this.popupImageBase64 = lastUser.image;
          this.popupImageMode = 'solve';
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
        // History doesn't record which studyMode produced a message. The
        // dict-mode class only scopes the styling for the older markdown-shaped
        // replies still sitting in saved conversations — structured JSON
        // entries carry their own layout classes and need no such hint.
        ansContent.classList.toggle('hw-dict-mode', /^\*\*.+?\*\*\s*\/[^/\n]+\//.test(replyText.trim()));
        ansContent.innerHTML = renderAnswer(replyText, {
          allowMarkdownDict: true,
          speakLabel: getFloatingPopupI18n(uiLanguage).listen,
          targetLang: this.targetLang,
        });
        this.activeCardResponseText = replyText;
        this.syncSpeakButton();
      });

      listEl.appendChild(el);
    });
  }
}
