/**
 * Screenshot Visual Snipper (Content Script)
 * Renders drag-selection overlay and slices high-DPI viewport image via Canvas.
 */

import { Icons } from '../shared/icons.js';

class ScreenCropper {
  constructor() {
    this.overlay = null;
    this.startX = 0;
    this.startY = 0;
    this.isDragging = false;
    this.selectionBox = null;
    this.toolbar = null;
    this.rawImageDataUrl = null;
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
    chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, (res) => {
      if (!res?.success || !res.dataUrl) {
        console.error('Failed to capture tab:', res?.error);
        window.dispatchEvent(new CustomEvent('HOMEWORK_AI_RESTORE_UI'));
        return;
      }

      this.rawImageDataUrl = res.dataUrl;
      this.renderOverlay();
    });
  }

  renderOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'hw-crop-overlay';

    // Tip at top
    const tip = document.createElement('div');
    tip.className = 'hw-crop-tip';
    tip.innerHTML = `${Icons.scissors(16)} <span>Click and drag to select a formula or question (ESC to cancel)</span>`;
    this.overlay.appendChild(tip);

    // Selection box
    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'hw-crop-selection';
    this.selectionBox.style.display = 'none';
    this.overlay.appendChild(this.selectionBox);

    // Attach mouse event listeners
    this.overlay.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));

    document.body.appendChild(this.overlay);
  }

  onMouseDown(e) {
    if (e.target.closest('.hw-crop-toolbar')) return;

    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;

    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }

    this.selectionBox.style.left = `${this.startX}px`;
    this.selectionBox.style.top = `${this.startY}px`;
    this.selectionBox.style.width = '0px';
    this.selectionBox.style.height = '0px';
    this.selectionBox.style.display = 'block';
  }

  onMouseMove(e) {
    if (!this.isDragging) return;

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
  }

  onMouseUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    const rect = this.selectionBox.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      this.selectionBox.style.display = 'none';
      return;
    }

    this.renderToolbar(rect);
  }

  renderToolbar(rect) {
    if (this.toolbar) this.toolbar.remove();

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'hw-crop-toolbar';
    this.toolbar.style.left = `${Math.min(window.innerWidth - 180, rect.left + rect.width - 160)}px`;
    this.toolbar.style.top = `${rect.bottom + 10}px`;

    this.toolbar.innerHTML = `
      <button class="hw-crop-btn hw-crop-btn-cancel" id="hwCropCancel">Cancel</button>
      <button class="hw-crop-btn hw-crop-btn-primary" id="hwCropSolve">${Icons.sparkles(14)} Ask AI</button>
    `;

    this.overlay.appendChild(this.toolbar);

    this.toolbar.querySelector('#hwCropCancel').addEventListener('click', () => this.cleanup());
    this.toolbar.querySelector('#hwCropSolve').addEventListener('click', () => this.cropAndSolve(rect));
  }

  async cropAndSolve(rect) {
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

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    this.cleanup();

    // Broadcast the cropped image to overlay and sidepanel
    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_SOLVE_IMAGE', {
      detail: { imageBase64: croppedBase64 }
    }));
  }

  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.cleanup();
    }
  }

  cleanup() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyDown);
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
