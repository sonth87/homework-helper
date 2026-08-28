/**
 * Floating Action Buttons (FABs) Subcomponent
 */

import { Storage } from '../../shared/storage.js';
import { getI18n } from '../../shared/i18n.js';
import { NANO_STATUS } from '../../shared/nano-status.js';

export class OverlayFabs {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this.suppressNextClick = false;
    this.init();
  }

  init() {
    const s = this.shadow;

    // Toggle Drawer
    s.getElementById('hwFabToggle')?.addEventListener('click', () => {
      if (this.suppressNextClick) { this.suppressNextClick = false; return; }
      this.overlay.drawer.toggle();
    });

    // Crop trigger
    const triggerCrop = async () => {
      if (this.suppressNextClick) { this.suppressNextClick = false; return; }
      const { routingStrategy = 'prefer_nano', apiConfigs = [], nanoDownloadState } = await Storage.get(['routingStrategy', 'apiConfigs', 'nanoDownloadState']);
      const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin'));

      if (routingStrategy === 'config_only' && enabledKeys.length === 0) {
        chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
        return;
      }

      if (enabledKeys.length === 0 && !nanoDownloadState?.inProgress) {
        const blocked = await this.overlay.drawer.isNanoHardBlocked(enabledKeys.length);
        if (blocked) {
          const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
          this.overlay.showToast(getI18n(uiLanguage).aiUnavailableToast || 'No AI provider ready — open Settings to add one.');
          chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS', hash: 'builtin-nano' });
          return;
        }
      }

      if (this.overlay.drawer.isOpen) {
        this.overlay.drawer.wasOpenBeforeCrop = true;
        this.overlay.drawer.toggle(false);
      }
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_START_CROP'));
    };

    s.getElementById('hwFabCrop')?.addEventListener('click', triggerCrop);
    s.getElementById('hwBtnCapture')?.addEventListener('click', triggerCrop);

    this.makeFabContainerDraggable();
    Storage.get(['fabPosition']).then(({ fabPosition }) => this.applyPosition(fabPosition));
    this.updateGatingVisual();

    window.addEventListener('HOMEWORK_AI_START_CROP', () => {
      if (this.overlay.drawer.isOpen) {
        this.overlay.drawer.wasOpenBeforeCrop = true;
        this.overlay.drawer.toggle(false);
      }
    });

    // Hide all in-page extension elements when screenshot capture starts
    window.addEventListener('HOMEWORK_AI_HIDE_ALL_UI', () => {
      const drawer = s.getElementById('hwDrawer');
      const fab = s.getElementById('hwFabContainer');
      const card = this.overlay.floatingCard?.popupCard;
      const collapsedFab = s.getElementById('hwCardCollapsedFab');
      if (drawer) drawer.style.display = 'none';
      if (fab) fab.style.display = 'none';
      if (card) card.style.display = 'none';
      if (collapsedFab) collapsedFab.style.display = 'none';
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
  }

  async updateGatingVisual() {
    const crop = this.shadow.getElementById('hwFabCrop');
    if (!crop) return;
    const { apiConfigs = [], nanoDownloadState } = await Storage.get(['apiConfigs', 'nanoDownloadState']);
    const enabledCount = (apiConfigs || []).filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin')).length;
    let blocked = false;
    if (enabledCount === 0 && !nanoDownloadState?.inProgress) {
      blocked = await this.overlay.drawer.isNanoHardBlocked(enabledCount);
    }
    crop.classList.toggle('hw-fab-blocked', blocked);
  }

  applyAppearance(enableFloatingButton = true, fabSize = 'normal', fabOpacity = 90) {
    const fab = this.shadow.getElementById('hwFabContainer');
    if (!fab) return;

    fab.style.display = enableFloatingButton ? 'flex' : 'none';
    fab.classList.remove('hw-fab-size-tiny', 'hw-fab-size-small', 'hw-fab-size-normal', 'hw-fab-size-large');
    fab.classList.add(`hw-fab-size-${fabSize || 'normal'}`);
    fab.style.setProperty('--hw-fab-alpha', (fabOpacity / 100).toFixed(2));
  }

  // Docks the FAB cluster at a saved { dock: 'left'|'right', top } position
  // (from a previous drag), or resets to the default right/bottom-120px CSS
  // position when there is none yet.
  applyPosition(fabPosition) {
    const fab = this.shadow.getElementById('hwFabContainer');
    if (!fab) return;

    if (!fabPosition || typeof fabPosition.top !== 'number') {
      fab.style.left = '';
      fab.style.right = '';
      fab.style.top = '';
      fab.style.bottom = '';
      fab.classList.remove('hw-fab-dock-left');
      return;
    }

    const margin = 12;
    const height = fab.offsetHeight || 104;
    const top = Math.max(margin, Math.min(window.innerHeight - height - margin, fabPosition.top));

    fab.style.bottom = 'auto';
    fab.style.top = `${top}px`;
    if (fabPosition.dock === 'left') {
      fab.style.right = '';
      fab.style.left = '0px';
      fab.classList.add('hw-fab-dock-left');
    } else {
      fab.style.left = '';
      fab.style.right = '0px';
      fab.classList.remove('hw-fab-dock-left');
    }
  }

  // Click-and-hold on either button drags the whole cluster; releasing snaps
  // it flush against whichever side (left/right) it's nearest to and saves
  // that position so it's restored on the next page load.
  makeFabContainerDraggable() {
    const fab = this.shadow.getElementById('hwFabContainer');
    if (!fab) return;

    const margin = 12;
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
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPressed) return;

      if (!hasMoved) {
        // Small threshold so a plain click doesn't jitter the cluster by a pixel.
        if (Math.abs(e.clientX - startX) < 4 && Math.abs(e.clientY - startY) < 4) return;
        hasMoved = true;
        this.suppressNextClick = true;
        fab.classList.add('hw-fab-dragging');
        this.overlay.richTooltips?.suppress(true);
      }

      const width = fab.offsetWidth;
      const height = fab.offsetHeight;
      const left = Math.max(0, Math.min(window.innerWidth - width, e.clientX - offsetX));
      const top = Math.max(0, Math.min(window.innerHeight - height, e.clientY - offsetY));

      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
      fab.style.left = `${left}px`;
      fab.style.top = `${top}px`;
    });

    window.addEventListener('mouseup', async () => {
      if (!isPressed) return;
      isPressed = false;
      if (!hasMoved) return;

      fab.classList.remove('hw-fab-dragging');
      this.overlay.richTooltips?.suppress(false);

      const rect = fab.getBoundingClientRect();
      const dockLeft = rect.left + rect.width / 2 < window.innerWidth / 2;
      const top = Math.max(margin, Math.min(window.innerHeight - rect.height - margin, rect.top));

      const fabPosition = { dock: dockLeft ? 'left' : 'right', top };
      this.applyPosition(fabPosition);
      await Storage.set({ fabPosition });
    });
  }
}
