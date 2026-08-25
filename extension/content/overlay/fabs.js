/**
 * Floating Action Buttons (FABs) Subcomponent
 */

import { Storage } from '../../shared/storage.js';

export class OverlayFabs {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this.init();
  }

  init() {
    const s = this.shadow;

    // Toggle Drawer
    s.getElementById('hwFabToggle')?.addEventListener('click', () => this.overlay.drawer.toggle());

    // Crop trigger
    const triggerCrop = async () => {
      const { routingStrategy = 'prefer_nano', apiConfigs = [] } = await Storage.get(['routingStrategy', 'apiConfigs']);
      const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin'));

      if (routingStrategy === 'config_only' && enabledKeys.length === 0) {
        chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
        return;
      }

      if (this.overlay.drawer.isOpen) {
        this.overlay.drawer.wasOpenBeforeCrop = true;
        this.overlay.drawer.toggle(false);
      }
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_START_CROP'));
    };

    s.getElementById('hwFabCrop')?.addEventListener('click', triggerCrop);
    s.getElementById('hwBtnCapture')?.addEventListener('click', triggerCrop);

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

  applyAppearance(enableFloatingButton = true, fabSize = 'normal', fabOpacity = 90) {
    const fab = this.shadow.getElementById('hwFabContainer');
    if (!fab) return;

    fab.style.display = enableFloatingButton ? 'flex' : 'none';
    fab.classList.remove('hw-fab-size-tiny', 'hw-fab-size-small', 'hw-fab-size-normal', 'hw-fab-size-large');
    fab.classList.add(`hw-fab-size-${fabSize || 'normal'}`);
    fab.style.setProperty('--hw-fab-alpha', (fabOpacity / 100).toFixed(2));
  }
}
