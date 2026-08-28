/**
 * Quick Hover Translate (Content Script)
 * Hovering over a word/sentence/paragraph on any webpage (optionally while
 * holding a modifier key) shows a compact translation tooltip, without
 * needing to select text first. Target language always follows the
 * extension's chat-panel language (outputLanguage).
 *
 * Deliberately independent of the AI Key Pool / Gemini Nano: firing on
 * every hovered word needs to be instant and free, not an LLM call per
 * lookup. Translation goes through the background's QUICK_TRANSLATE handler
 * (extension/background/service-worker.js), which calls the free,
 * unauthenticated Google Translate endpoint — the same "translatorVendor"
 * approach the reference ENVI extension uses, no API key or user setup
 * required. This is why the feature works even with zero AI providers
 * configured, unlike every other AI-backed tool in this extension.
 *
 * Standalone singleton, same shape as selection-tooltip.js: it renders
 * plain DOM nodes appended to document.body (styled by
 * content/styles/tooltip.css, loaded page-wide) rather than into the
 * Shadow DOM overlay.
 */

import { Storage } from '../shared/storage.js';
import { getHoverTranslateI18n } from '../shared/i18n.js';

const SETTINGS_KEYS = [
  'enableHoverTranslate', 'hoverTranslateModifiers', 'hoverTranslateGranularity', 'hoverTranslateDelay',
  'hoverTranslateOpacity', 'hoverTranslateBlur', 'hoverTranslateFontSize', 'hoverTranslateMaxWidth', 'hoverTranslateTheme',
  'hoverTranslateHighlight', 'hoverTranslateAnimation',
  'outputLanguage', 'disabledSites', 'uiLanguage',
];

const MODIFIER_EVENT_KEYS = { ctrl: 'ctrlKey', shift: 'shiftKey', alt: 'altKey', meta: 'metaKey' };

class HoverTranslate {
  constructor() {
    this.settings = {};
    this.dict = {};
    this.tooltip = null;
    this.lastPoint = null;
    this.dwellTimer = null;
    this.epoch = 0;
    this._activeRect = null;
    this._lastText = null;
    this._highlightBoxes = [];
    this.init();
  }

  async init() {
    await this.loadSettings();

    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
    document.addEventListener('mouseleave', () => this.hideTooltip());
    document.addEventListener('scroll', () => this.hideTooltip(), true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideTooltip();
    });
    document.addEventListener('mousedown', (e) => {
      if (this.tooltip && !e.target.closest('.hw-hover-translate-tip')) this.hideTooltip();
    });

    window.addEventListener('HOMEWORK_AI_HIDE_ALL_UI', () => this.hideTooltip());

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && SETTINGS_KEYS.some((k) => k in changes)) {
          this.loadSettings();
        }
      });
    }
  }

  async loadSettings() {
    this.settings = await Storage.get(SETTINGS_KEYS);
    this.dict = getHoverTranslateI18n(this.settings.uiLanguage || 'en');
    if (!this.settings.enableHoverTranslate) this.hideTooltip();
  }

  handleMouseMove(e) {
    this.lastPoint = {
      x: e.clientX, y: e.clientY,
      ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey,
      target: e.target,
    };
    clearTimeout(this.dwellTimer);

    if (this.tooltip) {
      const overTooltip = e.target.closest && e.target.closest('.hw-hover-translate-tip');
      const nearWord = this._activeRect && this.pointNearRect(e.clientX, e.clientY, this._activeRect);
      if (!overTooltip && !nearWord) this.hideTooltip();
    }

    if (!this.settings.enableHoverTranslate) return;
    this.dwellTimer = setTimeout(() => this.onDwell(), this.settings.hoverTranslateDelay || 350);
  }

  pointNearRect(x, y, rect, buffer = 40) {
    return x >= rect.left - buffer && x <= rect.right + buffer && y >= rect.top - buffer && y <= rect.bottom + buffer;
  }

  modifiersMatch(p) {
    const required = this.settings.hoverTranslateModifiers || [];
    if (required.length === 0) return true;
    return required.every((m) => p[MODIFIER_EVENT_KEYS[m]]);
  }

  isGuardedTarget(target) {
    if (!target || !target.closest) return true;
    if (target.closest('#homework-ai-root')) return true;
    if (target.closest('.hw-selection-toolbar, .hw-tb-dropdown, .hw-hover-translate-tip')) return true;
    // Only real form controls are excluded — a contenteditable rich-text
    // region (ProseMirror/Notion/ChatGPT-style editors, AI chat replies you
    // can edit) is a legitimate place to read and hover-translate text, not
    // just plain webpage content.
    if (target.closest('input, textarea, select')) return true;
    return false;
  }

  onDwell() {
    const p = this.lastPoint;
    if (!p || !this.settings.enableHoverTranslate) return;
    if (!this.modifiersMatch(p)) return;
    if (this.isGuardedTarget(p.target)) return;
    if ((this.settings.disabledSites || []).includes(window.location.hostname)) return;

    const selection = window.getSelection();
    if (selection && selection.toString().trim()) return;

    const detection = this.detectTextAtPoint(p.x, p.y, this.settings.hoverTranslateGranularity || 'word');
    if (!detection || !detection.text || detection.text.length < 2) return;
    if (detection.text === this._lastText && this.tooltip) return;

    this._lastText = detection.text;
    // Order matters: showLoadingTooltip() clears the previous tooltip AND
    // any stale highlight boxes (via removeTooltip()) before either is
    // recreated — applying the new highlight after it, not before, so it
    // isn't immediately wiped out by that cleanup.
    this.showLoadingTooltip(detection.rect);
    this.applyTextEffects(detection.range);
    this.runTranslate(detection.text, detection.rect);
  }

  // ============================================================
  // Word/sentence/paragraph boundary detection at a screen point
  // ============================================================

  detectTextAtPoint(x, y, granularity) {
    if (!document.caretRangeFromPoint) return null;
    const range = document.caretRangeFromPoint(x, y);
    if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return null;

    if (granularity === 'paragraph') {
      return this.detectParagraph(range.startContainer);
    }
    return this.detectSegment(range.startContainer, range.startOffset, granularity === 'sentence' ? 'sentence' : 'word');
  }

  detectSegment(textNode, offset, granularity) {
    const data = textNode.data || '';
    if (!data.trim()) return null;

    let segStart = -1;
    let segEnd = -1;
    let segText = '';

    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity });
        for (const s of segmenter.segment(data)) {
          const end = s.index + s.segment.length;
          if (offset >= s.index && offset < end) {
            if (granularity === 'word' && !s.isWordLike) return null; // hovering whitespace/punctuation
            segStart = s.index;
            segEnd = end;
            segText = s.segment;
            break;
          }
        }
      } catch (e) {
        // fall through to regex below
      }
    }

    if (segStart === -1) {
      const re = granularity === 'word' ? /[\p{L}\p{N}_'-]+/gu : /[^.!?…]+[.!?…]*\s*/g;
      let m;
      while ((m = re.exec(data))) {
        if (offset >= m.index && offset < m.index + m[0].length) {
          segStart = m.index;
          segEnd = m.index + m[0].length;
          segText = m[0];
          break;
        }
      }
    }

    if (segStart === -1 || !segText.trim()) return null;

    const range = document.createRange();
    range.setStart(textNode, segStart);
    range.setEnd(textNode, segEnd);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    return { text: segText.trim(), rect, range };
  }

  detectParagraph(textNode) {
    const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'TD', 'TH', 'ARTICLE', 'SECTION', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'FIGCAPTION']);
    let el = textNode.parentElement;
    let hops = 0;
    while (el && hops < 6) {
      const text = (el.innerText || el.textContent || '').trim();
      if (text.length >= 20 || BLOCK_TAGS.has(el.tagName)) break;
      if (!el.parentElement) break;
      el = el.parentElement;
      hops++;
    }
    if (!el) return null;

    let text = (el.innerText || el.textContent || '').trim();
    if (!text) return null;
    if (text.length > 800) text = text.slice(0, 800);

    const rect = el.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    const range = document.createRange();
    range.selectNodeContents(el);

    return { text, rect, range };
  }

  // ============================================================
  // Tooltip rendering
  // ============================================================

  showLoadingTooltip(rect) {
    this.epoch++;
    this.removeTooltip();

    const tip = document.createElement('div');
    tip.className = `hw-hover-translate-tip theme-${this.settings.hoverTranslateTheme || 'glass-light'}`;
    tip.style.setProperty('--ht-alpha', ((this.settings.hoverTranslateOpacity ?? 96) / 100).toFixed(2));
    tip.style.setProperty('--ht-blur', `${this.settings.hoverTranslateBlur ?? 18}px`);
    tip.style.setProperty('--ht-font-size', `${this.settings.hoverTranslateFontSize ?? 13}px`);
    tip.style.setProperty('--ht-max-width', `${this.settings.hoverTranslateMaxWidth ?? 300}px`);
    tip.innerHTML = `<div class="hw-ht-body hw-ht-loading">${this.dict.loadingLabel || 'Translating…'}</div>`;
    tip.addEventListener('mousedown', (e) => e.stopPropagation());

    document.body.appendChild(tip);
    this.tooltip = tip;
    this._activeRect = rect;
    this.positionTooltip(tip, rect);
  }

  positionTooltip(tip, rect) {
    if (!tip || !rect) return;
    const margin = 8;
    tip.style.visibility = 'hidden';
    tip.style.display = 'block';
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;

    let top = window.scrollY + rect.top - th - 10;
    if (rect.top - th - 10 < margin) {
      top = window.scrollY + rect.bottom + 10;
    }
    let left = window.scrollX + rect.left;
    if (left + tw > window.scrollX + window.innerWidth - margin) {
      left = window.scrollX + window.innerWidth - tw - margin;
    }
    if (left < window.scrollX + margin) left = window.scrollX + margin;

    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    tip.style.visibility = 'visible';
    tip.classList.add('show');
  }

  renderResult(translation) {
    if (!this.tooltip) return;
    const body = this.tooltip.querySelector('.hw-ht-body');
    if (!body) return;
    body.classList.remove('hw-ht-loading');
    const text = (translation || '').trim();
    body.textContent = text || (this.dict.errorLabel || 'Could not translate');
    this.positionTooltip(this.tooltip, this._activeRect);
  }

  showError() {
    if (!this.tooltip) return;
    const body = this.tooltip.querySelector('.hw-ht-body');
    if (body) {
      body.classList.remove('hw-ht-loading');
      body.textContent = this.dict.errorLabel || 'Could not translate';
    }
  }

  hideTooltip() {
    this.epoch++;
    this._lastText = null;
    this.removeTooltip();
  }

  removeTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    this._activeRect = null;
    this.clearTextEffects();
  }

  // ============================================================
  // Highlight / animation overlay on the source text itself
  //
  // Deliberately never mutates the page's own DOM (no wrapping the text in
  // a <mark>/<span>) — arbitrary third-party pages may run React/Vue/etc.
  // that would immediately revert or error on an unexpected child, and
  // Range.surroundContents() itself throws on a range that only partially
  // selects a node. Instead this overlays plain, pointer-events:none boxes
  // positioned from Range.getClientRects() — one rect per visual line the
  // range spans, so a wrapped sentence/paragraph highlights correctly
  // across line breaks instead of one big rectangle with dead space.
  // ============================================================

  applyTextEffects(range) {
    this.clearTextEffects();
    if (!range) return;

    const highlightOn = !!this.settings.hoverTranslateHighlight;
    const anim = this.settings.hoverTranslateAnimation || 'none';
    if (!highlightOn && anim === 'none') return;

    this._highlightBoxes = Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r, i) => {
        const box = document.createElement('div');
        box.className = 'hw-hlbox';
        if (highlightOn) box.classList.add('hw-hl-on');
        if (anim !== 'none') box.classList.add(`hw-anim-${anim}`);
        // "draw" mimics a highlighter pen moving across the text: each line
        // rect starts its reveal a little after the previous one instead of
        // all lines filling in at once.
        if (anim === 'draw') box.style.animationDelay = `${i * 120}ms`;
        box.style.top = `${window.scrollY + r.top}px`;
        box.style.left = `${window.scrollX + r.left}px`;
        box.style.width = `${r.width}px`;
        box.style.height = `${r.height}px`;
        document.body.appendChild(box);
        return box;
      });
  }

  clearTextEffects() {
    (this._highlightBoxes || []).forEach((box) => box.remove());
    this._highlightBoxes = [];
  }

  // ============================================================
  // Translation — routed through the background service worker's
  // QUICK_TRANSLATE handler (free Google Translate endpoint), never
  // through the AI Key Pool / Gemini Nano.
  // ============================================================

  runTranslate(text, rect) {
    const epoch = this.epoch;
    const targetLang = this.settings.outputLanguage || 'en';

    chrome.runtime.sendMessage(
      { action: 'QUICK_TRANSLATE', payload: { text, targetLang } },
      (res) => {
        if (epoch !== this.epoch) return; // hidden/moved on while the request was in flight
        if (chrome.runtime.lastError || !res?.success) {
          this.showError();
          return;
        }
        this.renderResult(res.translation);
      }
    );
  }
}

export const hoverTranslate = new HoverTranslate();
