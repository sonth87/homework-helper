/**
 * "Minimize" display mode for the floating solution/translation popup.
 *
 * A third alternative to the normal/compact card (see `popupCardSize` in
 * shared/storage.js): instead of showing the full card, a small circular
 * indicator sits fixed in the bottom-right corner of the page. It spins
 * while a Capture & Solve / selection-toolbar action is in flight, stops the
 * moment a result lands, and — hovering it reveals a small, bare-bones
 * preview of the answer/translation (no header, no footer, no title, none of
 * the full card's chrome) positioned relative to wherever the circle
 * actually is, always clamped inside the viewport.
 *
 * Deliberately a standalone component with its own DOM, not layered onto
 * OverlayFloatingCard's existing `.popupCard` — floating-card.js and
 * drawer.js only ever call the handful of methods below (start/updateContent/
 * finalize/showError/isActive/reset), never reach into this file's internals,
 * so this mode can evolve without risking the normal/compact card's own,
 * already-intricate rendering paths.
 */

import { Icons } from '../../shared/icons.js';
import { Storage } from '../../shared/storage.js';
import { renderAnswer } from '../../shared/markdown-katex.js';
import { speak, isSpeechAvailable } from '../../shared/tts.js';
import { resolveThemeColorRgb } from '../../shared/toolbar-theme-colors.js';
import { ensureStylesheet } from '../shadow-root.js';

export class MinimizedCard {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this.responseText = '';
    this.status = 'idle'; // 'idle' | 'loading' | 'done' | 'error'
    this._popupVisible = false;
    this._hideTimer = null;
    this.circleEl = null;
    this.popupEl = null;
    this.init();
  }

  init() {
    ensureStylesheet('content/styles/minimized-card.css');
    this.buildDom();
  }

  buildDom() {
    const circle = document.createElement('div');
    circle.className = 'hw-mini-circle';
    circle.innerHTML = `<button class="hw-mini-close" title="${this.overlay.drawer.currentDict?.miniCloseLabel || ''}">${Icons.x(8)}</button>`;
    this.shadow.appendChild(circle);
    this.circleEl = circle;

    const popup = document.createElement('div');
    popup.className = 'hw-mini-popup';
    // The scrollable area (long answers) is a separate inner box from the
    // outer popup on purpose: #hwMiniModeSwitch below pokes half outside the
    // *outer* box's edge (see minimized-card.css), same trick as the card's
    // own #hwCardModeSwitch and hover-translate.js's granularity switcher.
    // If the switch's poke were inside the scrolling element instead, it'd
    // count as scrollable overflow and silently spawn a scrollbar even when
    // the actual content fits — this inner/outer split keeps "what scrolls"
    // and "what's allowed to visually stick out" as two different boxes.
    popup.innerHTML = `
      <div class="hw-mini-popup-scroll">
        <div class="hw-mini-popup-content"></div>
        <div class="hw-mini-popup-actions">
          <button type="button" class="hw-mini-icon-btn hw-mini-listen" title="${this.overlay.drawer.currentDict?.listen || ''}">${Icons.volume2(14)}</button>
          <button type="button" class="hw-mini-icon-btn hw-mini-copy" title="${this.overlay.drawer.currentDict?.copyBtn || ''}">${Icons.copy(14)}</button>
        </div>
      </div>
      <div class="hw-mode-switch hw-mini-mode-switch" id="hwMiniModeSwitch">
        <button class="hw-mode-dot" data-mode="normal" title="Normal">${Icons.layoutNormal(13)}</button>
        <button class="hw-mode-dot" data-mode="compact" title="Compact">${Icons.layoutCompact(13)}</button>
        <button class="hw-mode-dot" data-mode="minimize" title="Minimize">${Icons.layoutMinimize(13)}</button>
      </div>
    `;
    this.shadow.appendChild(popup);
    this.popupEl = popup;

    circle.addEventListener('mouseenter', () => this.openPopup());
    circle.addEventListener('mouseleave', () => this.scheduleClosePopup());
    popup.addEventListener('mouseenter', () => this.cancelClosePopup());
    popup.addEventListener('mouseleave', () => this.scheduleClosePopup());

    circle.querySelector('.hw-mini-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.reset();
    });

    popup.querySelector('.hw-mini-listen').addEventListener('click', () => {
      // 'auto': the answer carries no declared language, so its own script
      // picks the voice — same reasoning as every other Listen button in
      // this extension (hover-translate.js, floating-card.js).
      speak(this.responseText, 'auto', document.documentElement.lang || '');
    });

    popup.querySelector('.hw-mini-copy').addEventListener('click', (e) => {
      navigator.clipboard.writeText(this.responseText || '');
      const btn = e.currentTarget;
      btn.classList.add('hw-mini-copied');
      const original = btn.innerHTML;
      btn.innerHTML = Icons.check(14);
      setTimeout(() => {
        btn.classList.remove('hw-mini-copied');
        btn.innerHTML = original;
      }, 1200);
    });

    if (!isSpeechAvailable()) {
      popup.querySelector('.hw-mini-listen').style.display = 'none';
    }

    // Same quick display-mode switcher as the real card's footer (see
    // overlay.js's #hwCardModeSwitch) — needed here too since there's no
    // card footer visible at all while minimized. Just writes the setting;
    // overlay.js's reactive applyAppearanceSettings() does the actual
    // handoff back to the real card.
    popup.querySelectorAll('#hwMiniModeSwitch .hw-mode-dot').forEach((btn) => {
      btn.addEventListener('click', () => {
        Storage.set({ popupCardSize: btn.dataset.mode });
      });
    });
  }

  isActive() {
    return this.status === 'loading' || this.status === 'done' || this.status === 'error';
  }

  // Fire-and-forget: both the ring and the popup already have sensible glass
  // defaults (see minimized-card.css) and don't need to block on this — they
  // just repaint a moment later. The ring and its hover-revealed popup are
  // one and the same widget visually, so both follow the Homework Helper
  // Popup's own settings (popupCardTheme/popupOpacity/popupBlur) — the ring's
  // accent colour matches whatever the popup above it will show instead of
  // the unrelated Selection Toolbar theme — same as everything else in this
  // file re-reading its settings fresh rather than caching them.
  _applyGlassTheme() {
    Storage.get(['popupCardTheme', 'popupOpacity', 'popupBlur']).then(
      ({ popupCardTheme, popupOpacity = 60, popupBlur = 10 }) => {
        this.circleEl.style.setProperty('--hw-mini-rgb', resolveThemeColorRgb(popupCardTheme));
        this.circleEl.style.setProperty('--hw-mini-alpha', (popupOpacity / 100).toFixed(2));
        this.circleEl.style.setProperty('--hw-mini-blur', `${popupBlur}px`);
        this.popupEl.style.setProperty('--hw-mini-popup-alpha', (popupOpacity / 100).toFixed(2));
        this.popupEl.style.setProperty('--hw-mini-popup-blur', `${popupBlur}px`);
        // 'glass-light'/'glass-dark' pin this popup's own glass regardless of
        // the global overlayTheme, same override .hw-solution-card gets from
        // its own identical .theme-glass-light/.theme-glass-dark classes.
        this.popupEl.classList.remove('theme-glass-light', 'theme-glass-dark');
        if (popupCardTheme === 'glass-light' || popupCardTheme === 'glass-dark') {
          this.popupEl.classList.add(`theme-${popupCardTheme}`);
        }
      }
    );
  }

  // Called instead of showing the real card — starts (or restarts, if one
  // was already showing) the loading spin. A fresh solve/translate always
  // reuses the same circle rather than stacking a second one.
  start() {
    this.responseText = '';
    this.status = 'loading';
    this.circleEl.classList.remove('hw-mini-done', 'hw-mini-error');
    this.circleEl.classList.add('hw-mini-loading');
    this.circleEl.style.display = 'flex';
    if (this._popupVisible) this.renderPopupContent();
    this._applyGlassTheme();
  }

  // Takes over an in-flight or already-finished/errored response that was
  // showing in the real card — used when the mode switcher (or the Options
  // page's own setting) flips to Minimize mid-session. Unlike start(), this
  // doesn't reset back to a fresh loading state; it adopts whatever
  // status/text the card already had, including 'done'/'error', so the
  // circle picks up exactly where the card left off instead of restarting.
  adopt(status, responseText) {
    this.status = status || 'loading';
    this.responseText = responseText || '';
    this.circleEl.classList.remove('hw-mini-loading', 'hw-mini-done', 'hw-mini-error');
    this.circleEl.classList.add(`hw-mini-${this.status}`);
    this.circleEl.style.display = 'flex';
    if (this._popupVisible) this.renderPopupContent();
    this._applyGlassTheme();
  }

  // The inverse of adopt() — used when the switcher flips away from Minimize
  // mid-session. Hands back whatever status/text the circle was showing so
  // the real card can pick up exactly where it left off, then clears itself:
  // resetting status to 'idle' makes isActive() false, which is what makes
  // drawer.js's per-chunk isActive() check route the *next* stream chunk
  // back into the real card instead of this circle.
  handoff() {
    const snapshot = { status: this.status, responseText: this.responseText };
    this.circleEl.classList.remove('hw-mini-loading', 'hw-mini-done', 'hw-mini-error');
    this.circleEl.style.display = 'none';
    this.closePopup();
    this.status = 'idle';
    this.responseText = '';
    return snapshot;
  }

  // `text` is the full accumulated answer so far (drawer.js appends chunks
  // itself and passes the running total), not just the new delta.
  updateContent(text) {
    this.responseText = text;
    if (this._popupVisible) this.renderPopupContent();
  }

  finalize() {
    this.status = 'done';
    this.circleEl.classList.remove('hw-mini-loading');
    this.circleEl.classList.add('hw-mini-done');
    if (this._popupVisible) this.renderPopupContent();
  }

  showError(message) {
    this.status = 'error';
    this.responseText = message || '';
    this.circleEl.classList.remove('hw-mini-loading');
    this.circleEl.classList.add('hw-mini-error');
    if (this._popupVisible) this.renderPopupContent();
  }

  // Fully dismisses the indicator (the hover "X"). Nothing else in the
  // extension currently calls this — a fresh start() on the next solve/
  // translate is what normally replaces whatever's showing.
  reset() {
    this.status = 'idle';
    this.responseText = '';
    this.circleEl.classList.remove('hw-mini-loading', 'hw-mini-done', 'hw-mini-error');
    this.circleEl.style.display = 'none';
    this.closePopup();
  }

  openPopup() {
    this.cancelClosePopup();
    this.renderPopupContent();
    this.positionPopup();
    this.popupEl.style.display = 'block';
    this._popupVisible = true;
  }

  scheduleClosePopup() {
    this.cancelClosePopup();
    // Short grace period so moving the cursor from the circle up into the
    // popup (or back) doesn't flicker it shut mid-transit.
    this._hideTimer = setTimeout(() => this.closePopup(), 180);
  }

  cancelClosePopup() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  }

  closePopup() {
    this.popupEl.style.display = 'none';
    this._popupVisible = false;
  }

  renderPopupContent() {
    const el = this.popupEl.querySelector('.hw-mini-popup-content');
    if (!el) return;
    // Listen/Copy act on this.responseText — meaningless for an error
    // message or while nothing has streamed back yet, so they're hidden
    // rather than left there doing nothing (or copying an error string).
    const actions = this.popupEl.querySelector('.hw-mini-popup-actions');
    if (actions) actions.style.display = this.status === 'done' && this.responseText ? 'flex' : 'none';

    if (this.status === 'error') {
      el.innerHTML = `<span style="color:#ef4444;">${this.responseText || 'Error'}</span>`;
    } else if (this.responseText) {
      // allowMarkdownDict so a single-word translate result (the free
      // engines' own legacy markdown shape, see floating-card.js's own
      // /^\*\*.+?\*\*\s*\/[^/\n]+\// check) renders through the same
      // structured word/phonetic/POS/gloss layout the real card uses,
      // instead of a flat dump of plain text lines — see
      // minimized-card.css's own .hw-mini-popup-content .hw-dict-* rules
      // for why those need their own, non-theme-aware copy of overlay.css's
      // dictionary styling. The inline per-term Listen icons this also
      // draws work automatically: bindSpeakButtons() in floating-card.js's
      // init() already delegates from the whole shared shadow root, not
      // just the real card.
      el.innerHTML = renderAnswer(this.responseText, {
        allowMarkdownDict: true,
        speakLabel: this.overlay.drawer.currentDict?.listen || 'Listen',
        targetLang: this.overlay.floatingCard?.targetLang || 'auto',
      });
    } else {
      el.innerHTML = `<span class="hw-mini-loading-text">${this.overlay.drawer.currentDict?.thinking || 'Đang xử lý…'}</span>`;
    }
  }

  // Keeps the preview anchored to the circle's actual position (fixed
  // bottom-right today, but never hardcoded here) and fully inside the
  // viewport — opens upward/leftward since the circle itself sits in the
  // bottom-right corner, with margin-based clamping for anything narrower.
  positionPopup() {
    const rect = this.circleEl.getBoundingClientRect();
    const margin = 10;

    this.popupEl.style.visibility = 'hidden';
    this.popupEl.style.display = 'block';
    const pw = this.popupEl.offsetWidth;
    const ph = this.popupEl.offsetHeight;

    let left = rect.right - pw;
    if (left < margin) left = margin;
    if (left + pw > window.innerWidth - margin) left = window.innerWidth - pw - margin;

    let top = rect.top - ph - 10;
    if (top < margin) top = Math.min(rect.bottom + 10, window.innerHeight - ph - margin);

    this.popupEl.style.left = `${left}px`;
    this.popupEl.style.top = `${top}px`;
    this.popupEl.style.visibility = 'visible';
  }
}
