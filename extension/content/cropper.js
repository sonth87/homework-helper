/**
 * Screenshot Visual Snipper (Content Script)
 * Renders drag-selection overlay and slices high-DPI viewport image via Canvas.
 */

import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';
import { getCropperI18n, getI18n } from '../shared/i18n.js';
import { getSharedShadowRoot, ensureStylesheet } from './shadow-root.js';
import { attachLiquidGlassRefraction } from '../shared/liquid-glass-refraction.js';

const RESIZE_HANDLE_DIRS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const MIN_SELECTION_SIZE = 20;

class ScreenCropper {
  constructor() {
    this.overlay = null;
    this.startX = 0;
    this.startY = 0;
    this.selectionBox = null;
    this.toolbar = null;
    this.rawImageDataUrl = null;

    // Interaction state machine: null | 'draw' | 'resize' | 'move'
    this.dragMode = null;
    this.resizeDir = null;
    this.dragStartRect = null;
    this.moveOffset = { x: 0, y: 0 };

    // Bound once and reused for both addEventListener/removeEventListener —
    // `fn.bind(this)` creates a NEW function every time it's called, so
    // passing a fresh `.bind()` to removeEventListener() would never match
    // the one actually registered, silently leaking these 3 global
    // listeners on every crop session forever. Capture phase (see where
    // these are attached below) so a host page's own capture-phase
    // keydown/mousemove handler — common for custom hotkeys, video players,
    // drag-to-resize widgets — calling stopPropagation() can't swallow the
    // event before it ever reaches us; this only guarantees delivery, it
    // never calls stopPropagation() itself, so the page's own handling of
    // the same event is unaffected.
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundKeyDown = this.onKeyDown.bind(this);

    // Loaded eagerly (not on first start()) so the sheet has landed well
    // before the user ever presses Alt+C — see shadow-root.js. tooltip.css is
    // needed too: the crop toolbar (renderToolbar()) reuses the text-selection
    // toolbar's own .hw-selection-toolbar/.hw-tb-btn classes for a fully
    // identical UI instead of a separate lookalike stylesheet.
    ensureStylesheet('content/styles/cropper.css');
    ensureStylesheet('content/styles/tooltip.css');
  }

  /**
   * Start the screen cropping process
   */
  async start() {
    if (this.overlay) return;

    // 1. Notify all extension UI (drawer, floating FABs, tooltips, popups) to hide immediately
    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_HIDE_ALL_UI'));

    // 2. Wait a brief moment for browser to repaint cleanly
    await new Promise((resolve) => setTimeout(resolve, 60));

    // 3. Request crisp screenshot from background service worker
    chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, async (res) => {
      if (!res?.success || !res.dataUrl) {
        console.error('Failed to capture tab:', res?.error);
        window.dispatchEvent(new CustomEvent('HOMEWORK_AI_RESTORE_UI'));
        return;
      }

      this.rawImageDataUrl = res.dataUrl;
      await this.renderOverlay();
    });
  }

  async renderOverlay() {
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const dict = getCropperI18n(uiLanguage);

    this.overlay = document.createElement('div');
    this.overlay.className = 'hw-crop-overlay';

    // Tip at top
    const tip = document.createElement('div');
    tip.className = 'hw-crop-tip';
    tip.innerHTML = `${Icons.scissors(16)} <span>${dict.tip}</span>`;
    this.overlay.appendChild(tip);
    this.tipEl = tip;

    // Selection box
    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'hw-crop-selection';
    this.selectionBox.style.display = 'none';
    this.overlay.appendChild(this.selectionBox);

    // Attach mouse event listeners
    this.overlay.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.boundMouseMove, true);
    window.addEventListener('mouseup', this.boundMouseUp, true);
    window.addEventListener('keydown', this.boundKeyDown, true);

    getSharedShadowRoot().appendChild(this.overlay);
    // getRootNode() (inside attachLiquidGlassRefraction()) only resolves to
    // the shared shadow root once connected — has to run after the line
    // above, not right after creating `tip`. This whole overlay (tip
    // included) is fresh per crop session and torn down in cleanup(), where
    // this handle's destroy() runs so the filter/ResizeObserver don't leak
    // across repeated Alt+C presses.
    this.tipGlass = attachLiquidGlassRefraction(this.tipEl, { blur: 16, saturate: 1.8 });
  }

  clearHandles() {
    this.selectionBox.querySelectorAll('.hw-crop-handle').forEach((h) => h.remove());
  }

  renderHandles() {
    this.clearHandles();
    RESIZE_HANDLE_DIRS.forEach((dir) => {
      const handle = document.createElement('div');
      handle.className = `hw-crop-handle hw-crop-handle-${dir}`;
      handle.dataset.dir = dir;
      this.selectionBox.appendChild(handle);
    });
  }

  onMouseDown(e) {
    if (e.target.closest('.hw-crop-toolbar')) return;

    const handle = e.target.closest('.hw-crop-handle');
    if (handle) {
      this.dragMode = 'resize';
      this.resizeDir = handle.dataset.dir;
      this.dragStartRect = this.selectionBox.getBoundingClientRect();
      if (this.toolbar) this.toolbar.style.display = 'none';
      e.preventDefault();
      return;
    }

    if (e.target === this.selectionBox && this.selectionBox.style.display !== 'none') {
      this.dragMode = 'move';
      const rect = this.selectionBox.getBoundingClientRect();
      this.dragStartRect = rect;
      this.moveOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (this.toolbar) this.toolbar.style.display = 'none';
      e.preventDefault();
      return;
    }

    // Start a brand new selection
    this.dragMode = 'draw';
    this.startX = e.clientX;
    this.startY = e.clientY;

    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }
    this.clearHandles();
    this.selectionBox.classList.remove('hw-crop-selection-active');

    this.selectionBox.style.left = `${this.startX}px`;
    this.selectionBox.style.top = `${this.startY}px`;
    this.selectionBox.style.width = '0px';
    this.selectionBox.style.height = '0px';
    this.selectionBox.style.display = 'block';
  }

  onMouseMove(e) {
    if (!this.dragMode) return;

    // e.buttons is a live snapshot of what's held down right now — if this
    // page ever swallowed the real mouseup (see the capture-phase comment in
    // the constructor), this self-corrects on the very next mousemove by
    // finalizing the selection exactly as a real mouseup would, instead of
    // leaving dragMode stuck and the box endlessly tracking the cursor.
    if (e.buttons === 0) { this.onMouseUp(); return; }

    if (this.dragMode === 'draw') {
      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(this.startX, currentX);
      const top = Math.min(this.startY, currentY);
      const width = Math.abs(currentX - this.startX);
      const height = Math.abs(currentY - this.startY);

      this.selectionBox.style.left = `${left}px`;
      this.selectionBox.style.top = `${top}px`;
      this.selectionBox.style.width = `${width}px`;
      this.selectionBox.style.height = `${height}px`;
      return;
    }

    if (this.dragMode === 'move') {
      const { width, height } = this.dragStartRect;
      const left = Math.max(0, Math.min(window.innerWidth - width, e.clientX - this.moveOffset.x));
      const top = Math.max(0, Math.min(window.innerHeight - height, e.clientY - this.moveOffset.y));
      this.selectionBox.style.left = `${left}px`;
      this.selectionBox.style.top = `${top}px`;
      return;
    }

    if (this.dragMode === 'resize') {
      this.applyResize(e);
    }
  }

  applyResize(e) {
    const start = this.dragStartRect;
    let left = start.left;
    let top = start.top;
    let right = start.left + start.width;
    let bottom = start.top + start.height;

    const clampedX = Math.max(0, Math.min(window.innerWidth, e.clientX));
    const clampedY = Math.max(0, Math.min(window.innerHeight, e.clientY));

    const dir = this.resizeDir;
    if (dir.includes('w')) left = Math.min(clampedX, right - MIN_SELECTION_SIZE);
    if (dir.includes('e')) right = Math.max(clampedX, left + MIN_SELECTION_SIZE);
    if (dir.includes('n')) top = Math.min(clampedY, bottom - MIN_SELECTION_SIZE);
    if (dir.includes('s')) bottom = Math.max(clampedY, top + MIN_SELECTION_SIZE);

    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
    this.selectionBox.style.width = `${right - left}px`;
    this.selectionBox.style.height = `${bottom - top}px`;
  }

  onMouseUp() {
    if (!this.dragMode) return;
    const mode = this.dragMode;
    this.dragMode = null;

    const rect = this.selectionBox.getBoundingClientRect();

    if (mode === 'draw' && (rect.width < 10 || rect.height < 10)) {
      this.selectionBox.style.display = 'none';
      return;
    }

    this.selectionBox.classList.add('hw-crop-selection-active');
    this.renderHandles();
    this.renderToolbar(rect);
  }

  async renderToolbar(rect) {
    if (this.toolbar) this.toolbar.remove();

    // Renders with the exact same classes/CSS vars as the text-selection
    // toolbar (selection-tooltip.js's .hw-selection-toolbar/.hw-tb-btn) —
    // same UI, not just a lookalike — so every Options > Appearance toolbar
    // setting (theme, size, show-text, opacity, blur) styles both
    // identically instead of drifting apart as two parallel stylesheets.
    // 'hw-crop-toolbar' rides along as a bare marker class (no CSS of its
    // own) purely so onMouseDown's click-guard below can target this toolbar
    // specifically.
    const {
      uiLanguage = 'en',
      toolbarShowText = true,
      toolbarSize = 'normal',
      toolbarTheme = 'auto',
      toolbarOpacity = 25,
      toolbarBlur = 6,
    } = await Storage.get(['uiLanguage', 'toolbarShowText', 'toolbarSize', 'toolbarTheme', 'toolbarOpacity', 'toolbarBlur']);
    const dict = getCropperI18n(uiLanguage);
    const genDict = getI18n(uiLanguage);
    const iconOnlyCls = toolbarShowText ? '' : 'icon-only';
    // Same resolution as selection-tooltip.js's renderToolbar(): 'auto' picks
    // whichever of the two Liquid Glass looks matches the OS preference,
    // since tooltip.css never styled a third .theme-auto variant.
    const resolvedTheme = toolbarTheme === 'auto'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'glass-dark' : 'glass-light')
      : toolbarTheme;

    this.toolbar = document.createElement('div');
    this.toolbar.className = `hw-selection-toolbar hw-crop-toolbar size-${toolbarSize} theme-${resolvedTheme}`;
    this.toolbar.style.setProperty('--tb-alpha', `${(toolbarOpacity / 100).toFixed(2)}`);
    this.toolbar.style.setProperty('--tb-blur', `${toolbarBlur}px`);
    // .hw-selection-toolbar's own position:absolute is left as-is — it's
    // appended into .hw-crop-overlay below, a position:fixed 100vw/100vh box
    // pinned at viewport (0,0), so absolute coordinates inside it already
    // line up 1:1 with the getBoundingClientRect() viewport coordinates used
    // below (same reason the toolbar this replaces never needed position:fixed).
    this.toolbar.style.visibility = 'hidden';
    this.toolbar.style.left = '0px';
    this.toolbar.style.top = '0px';

    this.toolbar.innerHTML = `
      <button class="hw-tb-btn ${iconOnlyCls}" id="hwCropCancel">${Icons.x(14)} <span class="hw-tb-label">${dict.cancel}</span></button>
      <button class="hw-tb-btn ${iconOnlyCls}" id="hwCropCopy">${Icons.copy(14)} <span class="hw-tb-label" id="hwCropCopyLabel">${genDict.copyBtn}</span></button>
      <button class="hw-tb-btn ${iconOnlyCls}" id="hwCropTranslate">${Icons.languages(14)} <span class="hw-tb-label">${genDict.modes?.translate || dict.askAi}</span></button>
      <button class="hw-tb-btn ${iconOnlyCls}" id="hwCropSolve">${Icons.sparkles(14)} <span class="hw-tb-label">${dict.askAi}</span></button>
    `;

    this.overlay.appendChild(this.toolbar);

    // Measure the real rendered size before placing it, so the wider
    // 4-button bar doesn't get clipped off the viewport edge.
    const tbWidth = this.toolbar.offsetWidth;
    const tbHeight = this.toolbar.offsetHeight;
    let left = Math.max(10, Math.min(window.innerWidth - tbWidth - 10, rect.left + rect.width - tbWidth));
    let top = rect.bottom + 10;
    if (top + tbHeight > window.innerHeight - 10) {
      top = Math.max(10, rect.top - tbHeight - 10);
    }
    this.toolbar.style.left = `${left}px`;
    this.toolbar.style.top = `${top}px`;
    this.toolbar.style.visibility = 'visible';

    this.toolbar.querySelector('#hwCropCancel').addEventListener('click', () => this.cleanup());
    this.toolbar.querySelector('#hwCropCopy').addEventListener('click', () => this.copySelection(rect, genDict));
    this.toolbar.querySelector('#hwCropTranslate').addEventListener('click', () => this.cropAndTranslate(rect));
    this.toolbar.querySelector('#hwCropSolve').addEventListener('click', () => this.cropAndSolve(rect));
  }

  async getCroppedCanvas(rect) {
    const dpr = window.devicePixelRatio || 1;
    const img = new Image();
    img.src = this.rawImageDataUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      Math.round(rect.left * dpr),
      Math.round(rect.top * dpr),
      Math.round(rect.width * dpr),
      Math.round(rect.height * dpr),
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas;
  }

  async cropAndSolve(rect) {
    const canvas = await this.getCroppedCanvas(rect);
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    this.cleanup();

    // Broadcast the cropped image to overlay and sidepanel
    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_SOLVE_IMAGE', {
      detail: { imageBase64: croppedBase64 }
    }));
  }

  async cropAndTranslate(rect) {
    const canvas = await this.getCroppedCanvas(rect);
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    this.cleanup();

    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_SOLVE_IMAGE', {
      detail: { imageBase64: croppedBase64, mode: 'translate' }
    }));
  }

  async copySelection(rect, genDict) {
    const copyBtn = this.toolbar?.querySelector('#hwCropCopy');

    try {
      const canvas = await this.getCroppedCanvas(rect);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

      if (copyBtn) {
        copyBtn.innerHTML = `${Icons.check(14)} <span class="hw-tb-label" id="hwCropCopyLabel">${genDict.copiedBtn}</span>`;
      }
    } catch (err) {
      console.error('Failed to copy cropped image:', err);
    }

    setTimeout(() => this.cleanup(), 500);
  }

  onKeyDown(e) {
    // Guards against ever reacting to Escape presses outside an active crop
    // session — belt-and-suspenders alongside the removeEventListener fix
    // below, so a future regression there can't resurrect the old bug where
    // a leaked listener re-ran cleanup() on every unrelated Escape press.
    if (!this.overlay) return;
    if (e.key === 'Escape') {
      this.cleanup();
    }
  }

  cleanup() {
    this.tipGlass?.destroy();
    this.tipGlass = null;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.dragMode = null;
    // Capture flag must match what was passed to addEventListener() above —
    // omitting it here (defaults to false) would silently fail to remove a
    // capture-phase listener, same class of bug as the stale-bind() one this
    // replaced.
    window.removeEventListener('mousemove', this.boundMouseMove, true);
    window.removeEventListener('mouseup', this.boundMouseUp, true);
    window.removeEventListener('keydown', this.boundKeyDown, true);
    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_RESTORE_UI'));
  }
}

export const screenCropper = new ScreenCropper();

// Listen for START_CROP message from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'START_CROP') {
    screenCropper.start();
  }
});
