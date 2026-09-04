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
 * plain DOM nodes into the shared Shadow DOM root (shadow-root.js), styled
 * by content/styles/tooltip.css.
 */

import { Storage } from '../shared/storage.js';
import { getHoverTranslateI18n } from '../shared/i18n.js';
import { Icons } from '../shared/icons.js';
import { speak, isSpeechAvailable } from '../shared/tts.js';
import { buildHighlight, isValidHighlightStyle, DEFAULT_HIGHLIGHT_STYLE } from '../shared/highlight-styles.js';
import { getSharedShadowRoot, ensureStylesheet } from './shadow-root.js';

const SETTINGS_KEYS = [
  'enableHoverTranslate', 'hoverTranslateModifiers', 'hoverTranslateGranularity', 'hoverTranslateDelay',
  'hoverTranslateOpacity', 'hoverTranslateBlur', 'hoverTranslateFontSize', 'hoverTranslateMaxWidth', 'hoverTranslateTheme',
  'hoverTranslateHighlight', 'hoverTranslateHighlightColor', 'hoverTranslateHighlightOpacity', 'hoverTranslateHighlightStyle',
  'hoverTranslateAnimation', 'outputLanguage', 'disabledSites', 'uiLanguage',
];

const MODIFIER_EVENT_KEYS = { ctrl: 'ctrlKey', shift: 'shiftKey', alt: 'altKey', meta: 'metaKey' };

// '#rrggbb' -> 'R, G, B' for CSS custom properties (tooltip.css's --hl-rgb),
// which need bare components to compose rgba(var(--hl-rgb), alpha) — a hex
// string can't be dropped straight into rgba(). Returns null on anything
// that isn't a plain 6-digit hex color, so callers can fall back cleanly
// instead of painting a broken/transparent highlight from a bad setting.
function hexToRgbString(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// Shared by detectParagraph() and findBlockContainer(): the tags treated as
// "one block of text" when walking up from a hovered Text node.
const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'TD', 'TH', 'ARTICLE', 'SECTION', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'FIGCAPTION']);

// Quick granularity switcher rendered on the tooltip (see showLoadingTooltip()
// and changeGranularity()). Icons are a deliberate 1/2/3-line progression —
// more lines standing in for "more text" — rather than pulling in new global
// icons from shared/icons.js for a control this narrowly scoped.
const GRANULARITY_OPTIONS = [
  {
    id: 'word',
    dictKey: 'granularityWord',
    icon: '<svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="2" y1="7" x2="9" y2="7"/></svg>',
  },
  {
    id: 'sentence',
    dictKey: 'granularitySentence',
    icon: '<svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="2" y1="5" x2="12" y2="5"/><line x1="2" y1="9" x2="8" y2="9"/></svg>',
  },
  {
    id: 'paragraph',
    dictKey: 'granularityParagraph',
    icon: '<svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="2" y1="3.5" x2="12" y2="3.5"/><line x1="2" y1="7" x2="12" y2="7"/><line x1="2" y1="10.5" x2="8" y2="10.5"/></svg>',
  },
];

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
    this._spokenText = '';
    this._lastPoint = null;
    this._highlightBoxes = [];
    this.init();
  }

  async init() {
    // Loaded eagerly so the sheet has landed well before the user ever
    // dwells over text — see shadow-root.js.
    ensureStylesheet('content/styles/tooltip.css');

    await this.loadSettings();

    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
    document.addEventListener('mouseleave', () => this.hideTooltip());
    document.addEventListener('scroll', () => this.hideTooltip(), true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideTooltip();
      this.refreshModifierState(e);
    });
    // ctrlKey/shiftKey/altKey/metaKey on this.lastPoint are otherwise only
    // ever refreshed by mousemove — pressing (or releasing) the configured
    // modifier while the cursor is already resting still on text, with no
    // further mouse movement, left the pending dwell check reading whatever
    // modifier state happened to be true on the last real mousemove instead
    // of what's actually held right now, so it silently failed
    // modifiersMatch() until the next move. See refreshModifierState().
    document.addEventListener('keyup', (e) => this.refreshModifierState(e));
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
      // Not e.target.closest(...): the tip lives inside the shared Shadow
      // DOM (shadow-root.js), and this listener is on document — outside
      // that tree — so a mousemove originating inside the tip gets
      // retargeted to the shadow host, never the tip itself. composedPath()
      // still carries the real path across the shadow boundary.
      const overTooltip = e.composedPath ? e.composedPath().includes(this.tooltip) : false;
      const nearWord = this._activeRect && this.pointNearRect(e.clientX, e.clientY, this._activeRect);
      if (!overTooltip && !nearWord) this.hideTooltip();
    }

    if (!this.settings.enableHoverTranslate) return;
    this.dwellTimer = setTimeout(() => this.onDwell(), this.settings.hoverTranslateDelay || 350);
  }

  // Keydown/keyup handler: the cursor doesn't move when a modifier key alone
  // is pressed or released, so if the mouse was already resting still on
  // text before/without any further mousemove, this.lastPoint's
  // ctrlKey/shiftKey/altKey/metaKey would otherwise stay frozen at whatever
  // they were on the last real mousemove — e.g. still false right after
  // pressing Ctrl, since no mousemove has happened since to update it. That
  // made the feature only reliably fire when the modifier was already held
  // *before* the cursor arrived (so a genuine mousemove captured it), not
  // when pressed while already hovering. Refreshing here and re-arming the
  // dwell timer makes both orders work the same way.
  refreshModifierState(e) {
    if (!this.lastPoint) return;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
    this.lastPoint = {
      ...this.lastPoint,
      ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey,
    };
    clearTimeout(this.dwellTimer);
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

    // Kept separate from this.lastPoint (which handleMouseMove overwrites on
    // every pixel of movement): changeGranularity() needs to re-run
    // detection at the point the user was originally hovering, not wherever
    // the cursor ended up after they moved it onto the tooltip to click a
    // granularity dot.
    this._lastPoint = { x: p.x, y: p.y };
    this.renderDetection(detection);
  }

  renderDetection(detection) {
    this._lastText = detection.text;
    // Order matters: showLoadingTooltip() clears the previous tooltip AND
    // any stale highlight boxes (via removeTooltip()) before either is
    // recreated — applying the new highlight after it, not before, so it
    // isn't immediately wiped out by that cleanup.
    this.showLoadingTooltip(detection.rect, detection.text);
    this.applyTextEffects(detection.range);
    this.runTranslate(detection.text, detection.rect);
  }

  // Wired to the granularity switcher's dots (showLoadingTooltip()). Persists
  // the choice as the new default (so Options' own dropdown stays in sync —
  // loadSettings() is already subscribed to storage.onChanged) and
  // re-detects at the same anchor point immediately, rather than waiting for
  // the next hover.
  async changeGranularity(gran) {
    if (gran === this.settings.hoverTranslateGranularity || !this._lastPoint) return;
    this.settings.hoverTranslateGranularity = gran;
    await Storage.set({ hoverTranslateGranularity: gran });

    const detection = this.detectTextAtPoint(this._lastPoint.x, this._lastPoint.y, gran);
    if (!detection || !detection.text) return;
    this.renderDetection(detection);
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

  // A sentence (or, more rarely, a word) frequently isn't one single DOM
  // Text node — a <strong>/<a>/<em>/<span> in the middle (bolded keyword, a
  // link) splits it into several sibling Text nodes even though it reads as
  // one unbroken sentence. Segmenting only textNode.data, as before, made
  // the segmenter see nothing but whatever fragment happened to be under the
  // cursor, so a bolded phrase or a link got detected as its own "sentence".
  // Fix: flatten the whole containing block's text into one string, segment
  // that, then map the winning segment's [start,end) back onto a Range that
  // is free to start in one Text node and end in another.
  detectSegment(textNode, offset, granularity) {
    const container = this.findBlockContainer(textNode);
    if (!container) return null;

    const { nodes, text } = this.collectTextNodes(container);
    const entry = nodes.find((n) => n.node === textNode);
    if (!entry || !text.trim()) return null;
    const globalOffset = entry.start + offset;

    let segStart = -1;
    let segEnd = -1;
    let segText = '';

    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity });
        for (const s of segmenter.segment(text)) {
          const end = s.index + s.segment.length;
          if (globalOffset >= s.index && globalOffset < end) {
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
      while ((m = re.exec(text))) {
        if (globalOffset >= m.index && globalOffset < m.index + m[0].length) {
          segStart = m.index;
          segEnd = m.index + m[0].length;
          segText = m[0];
          break;
        }
      }
    }

    if (segStart === -1 || !segText.trim()) return null;

    const start = this.offsetToBoundary(nodes, segStart);
    const end = this.offsetToBoundary(nodes, segEnd);
    if (!start || !end) return null;

    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    return { text: segText.trim(), rect, range };
  }

  // Walks up from a hovered Text node to the nearest element worth treating
  // as "one block of text" for flattening — a recognized block tag, or
  // <body> as the last resort.
  findBlockContainer(node) {
    let el = node.parentElement;
    let hops = 0;
    while (el && hops < 8) {
      if (BLOCK_TAGS.has(el.tagName) || el === document.body) return el;
      if (!el.parentElement) return el;
      el = el.parentElement;
      hops++;
    }
    return el;
  }

  // Flattens every descendant Text node of `container`, in document order,
  // into one string, recording each node's starting offset within it — the
  // mapping offsetToBoundary() uses to turn a segment's character range back
  // into real DOM boundary points.
  //
  // Also walks <br> elements (SHOW_ELEMENT, filtered to just those) purely to
  // insert a space at each one — without it, a heading like
  // `<h1>foo <br><span>bar</span></h1>` flattened to "foo" + "bar" with
  // nothing in between the two text nodes, so "foo bar" came out as
  // "foobar" (a real page hit this with a <br> splitting one visual line
  // into two: "...vai trò" / "dựng từ..." merged into "...vai tròdựng từ...").
  // Other block-level splits don't need this: findBlockContainer() already
  // stops at the nearest real block tag, so everything collectTextNodes()
  // walks is inline content where <br> is the only element that introduces
  // a line break without its own text node.
  collectTextNodes(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return node.tagName === 'BR' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    let text = '';
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        if (text && !/\s$/.test(text)) text += ' ';
        continue;
      }
      nodes.push({ node: n, start: text.length });
      text += n.data;
    }
    return { nodes, text };
  }

  offsetToBoundary(nodes, globalOffset) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const { node, start } = nodes[i];
      if (globalOffset >= start) {
        return { node, offset: Math.min(globalOffset - start, node.data.length) };
      }
    }
    return null;
  }

  detectParagraph(textNode) {
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

  showLoadingTooltip(rect, sourceText = '') {
    this.epoch++;
    this.removeTooltip();
    this._spokenText = sourceText;

    const tip = document.createElement('div');
    tip.className = `hw-hover-translate-tip theme-${this.settings.hoverTranslateTheme || 'glass-light'}`;
    tip.style.setProperty('--ht-alpha', ((this.settings.hoverTranslateOpacity ?? 90) / 100).toFixed(2));
    tip.style.setProperty('--ht-blur', `${this.settings.hoverTranslateBlur ?? 16}px`);
    tip.style.setProperty('--ht-font-size', `${this.settings.hoverTranslateFontSize ?? 13}px`);
    tip.style.setProperty('--ht-max-width', `${this.settings.hoverTranslateMaxWidth ?? 300}px`);

    const currentGran = this.settings.hoverTranslateGranularity || 'sentence';
    const granDotsHtml = GRANULARITY_OPTIONS
      .map(({ id, dictKey, icon }) => `
        <button class="hw-ht-gran-dot${id === currentGran ? ' active' : ''}" data-gran="${id}" title="${this.dict[dictKey] || ''}">${icon}</button>
      `)
      .join('');

    // Pronounces the hovered text, not the translation: the reader already
    // reads their own language in the tip — what they cannot do is say the
    // foreign word they just looked up. Same reasoning as the solution card's
    // Listen button (content/overlay/floating-card.js). Omitted entirely where
    // the browser has no speech engine, rather than left there doing nothing.
    const speakBtnHtml = (sourceText && isSpeechAvailable())
      ? `<button class="hw-ht-speak-btn" title="${this.dict.listenSource || ''}">${Icons.volume2(13)}</button>`
      : '';

    if (speakBtnHtml) tip.classList.add('has-speak');

    tip.innerHTML = `
      ${speakBtnHtml}
      <div class="hw-ht-gran-switch">${granDotsHtml}</div>
      <div class="hw-ht-body hw-ht-loading">${this.dict.loadingLabel || 'Translating…'}</div>
    `;
    tip.addEventListener('mousedown', (e) => e.stopPropagation());
    tip.querySelectorAll('.hw-ht-gran-dot').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.changeGranularity(btn.dataset.gran);
      });
    });
    tip.querySelector('.hw-ht-speak-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // 'auto' — the hovered text carries no declared language, so its script
      // picks the voice, with the page's own lang breaking the Han tie.
      speak(this._spokenText, 'auto', document.documentElement.lang || '');
    });

    getSharedShadowRoot().appendChild(tip);
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
    // Centered over the hovered word/sentence/paragraph rather than
    // left-aligned to its start, then clamped back onto the viewport.
    let left = window.scrollX + rect.left + rect.width / 2 - tw / 2;
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
    this._spokenText = '';
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

    const style = isValidHighlightStyle(this.settings.hoverTranslateHighlightStyle)
      ? this.settings.hoverTranslateHighlightStyle
      : DEFAULT_HIGHLIGHT_STYLE;
    const hlRgb = hexToRgbString(this.settings.hoverTranslateHighlightColor) || '254, 240, 138';
    const hlAlpha = ((this.settings.hoverTranslateHighlightOpacity ?? 40) / 100).toFixed(2);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);

    this._highlightBoxes = this.mergeRectsByLine(rects)
      .map((r, i) => {
        const box = document.createElement('div');
        box.style.setProperty('--hl-rgb', hlRgb);
        box.style.setProperty('--hl-alpha', hlAlpha);

        // The chosen style (fill/underline/marker/pencil/...) only actually
        // draws when the highlight toggle is on — "glow"/"sweep" below stay
        // available as a lighter decoration even with it off, same as
        // before. A fresh seed per box+render keeps the hand-drawn styles
        // looking freshly stroked every time text is hovered again, instead
        // of the exact same wobble reappearing.
        let pad = { left: 0, right: 0, top: 0, bottom: 0 };
        if (highlightOn) {
          const built = buildHighlight(style, r.width, r.height, (Date.now() ^ (i * 2654435761)) >>> 0);
          box.className = `hw-hlbox ${built.wrapperClass} hw-hl-on`;
          box.innerHTML = built.innerHTML;
          pad = built.pad;
        } else {
          box.className = 'hw-hlbox';
        }
        if (anim !== 'none') box.classList.add(`hw-anim-${anim}`);
        // "draw" mimics a highlighter pen moving across the text: each line
        // rect starts its reveal a little after the previous one instead of
        // all lines filling in at once.
        if (anim === 'draw') box.style.animationDelay = `${i * 120}ms`;
        box.style.top = `${window.scrollY + r.top - pad.top}px`;
        box.style.left = `${window.scrollX + r.left - pad.left}px`;
        box.style.width = `${r.width + pad.left + pad.right}px`;
        box.style.height = `${r.height + pad.top + pad.bottom}px`;
        getSharedShadowRoot().appendChild(box);
        return box;
      });
  }

  // Range.getClientRects() returns one fragment per inline "run" it crosses,
  // not one per visual line — a sentence broken up by a few <b> tags reports
  // a separate rect for every plain/bold run even where two runs sit on the
  // very same line. Bold text's slightly different font metrics then give
  // that run's rect a marginally different top/height than the plain-text
  // run right next to it on the same line, so drawing one highlight box per
  // fragment produced visibly overlapping, unevenly-shaded bands instead of
  // one clean strip per line (see the bug report's screenshot). Fix: merge
  // every fragment whose vertical span overlaps another's into a single
  // line-level box spanning their combined width — same idea PDF.js and
  // other text-highlighting implementations use for this exact quirk.
  mergeRectsByLine(rects) {
    const lines = [];
    for (const r of [...rects].sort((a, b) => a.top - b.top)) {
      const line = lines.find((l) => r.top < l.bottom && r.bottom > l.top);
      if (line) {
        line.left = Math.min(line.left, r.left);
        line.right = Math.max(line.right, r.right);
        line.top = Math.min(line.top, r.top);
        line.bottom = Math.max(line.bottom, r.bottom);
      } else {
        lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }
    }
    return lines.map((l) => ({ left: l.left, top: l.top, width: l.right - l.left, height: l.bottom - l.top }));
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
