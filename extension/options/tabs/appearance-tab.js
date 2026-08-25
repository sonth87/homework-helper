import { Storage } from '../../shared/storage.js';

export class AppearanceTab {
  constructor(optionsController) {
    this.controller = optionsController;
  }

  async init() {
    await this.loadAppearanceSettings();
  }

  async loadAppearanceSettings() {
    const {
      overlayTheme = 'auto',
      enableFloatingButton = true,
      fabSize = 'normal',
      fabOpacity = 90,
      popupOpacity = 92,
      popupBlur = 16,
      toolbarShowText = true,
      toolbarSize = 'normal',
      toolbarTheme = 'glass-light',
      toolbarOpacity = 90,
      toolbarBlur = 14,
    } = await Storage.get();

    // DOM Controls
    const overlayThemeSelect = document.getElementById('optOverlayThemeSelect');
    const checkFab = document.getElementById('optCheckFab');
    const fabSizeSelect = document.getElementById('optFabSizeSelect');
    const rangeFabOpacity = document.getElementById('optRangeFabOpacity');
    const valFabOpacity = document.getElementById('valFabOpacity');
    const checkToolbarText = document.getElementById('optCheckToolbarText');
    const toolbarSizeSelect = document.getElementById('optToolbarSizeSelect');
    const toolbarThemeSelect = document.getElementById('optToolbarThemeSelect');

    const rangeToolbarOpacity = document.getElementById('optRangeToolbarOpacity');
    const valToolbarOpacity = document.getElementById('valToolbarOpacity');
    const rangeToolbarBlur = document.getElementById('optRangeToolbarBlur');
    const valToolbarBlur = document.getElementById('valToolbarBlur');

    const rangePopupOpacity = document.getElementById('optRangePopupOpacity');
    const valPopupOpacity = document.getElementById('valPopupOpacity');
    const rangePopupBlur = document.getElementById('optRangePopupBlur');
    const valPopupBlur = document.getElementById('valPopupBlur');

    // Live Preview Elements
    const prevToolbar = document.getElementById('prevToolbar');
    const prevPopup = document.getElementById('prevPopup');
    const prevFab = document.getElementById('prevFab');

    if (!checkFab) return;

    // Populate initial values
    if (overlayThemeSelect) overlayThemeSelect.value = overlayTheme;
    checkFab.checked = enableFloatingButton;
    if (fabSizeSelect) fabSizeSelect.value = fabSize;
    if (rangeFabOpacity) {
      rangeFabOpacity.value = fabOpacity;
      if (valFabOpacity) valFabOpacity.textContent = `${fabOpacity}%`;
    }
    if (checkToolbarText) checkToolbarText.checked = toolbarShowText;
    if (toolbarSizeSelect) toolbarSizeSelect.value = toolbarSize;
    if (toolbarThemeSelect) toolbarThemeSelect.value = toolbarTheme;

    if (rangeToolbarOpacity) {
      rangeToolbarOpacity.value = toolbarOpacity;
      if (valToolbarOpacity) valToolbarOpacity.textContent = `${toolbarOpacity}%`;
    }
    if (rangeToolbarBlur) {
      rangeToolbarBlur.value = toolbarBlur;
      if (valToolbarBlur) valToolbarBlur.textContent = `${toolbarBlur}px`;
    }

    if (rangePopupOpacity) {
      rangePopupOpacity.value = popupOpacity;
      if (valPopupOpacity) valPopupOpacity.textContent = `${popupOpacity}%`;
    }
    if (rangePopupBlur) {
      rangePopupBlur.value = popupBlur;
      if (valPopupBlur) valPopupBlur.textContent = `${popupBlur}px`;
    }

    // Live update function
    const updatePreview = () => {
      // 1. FAB
      if (prevFab) {
        const isFabVisible = checkFab.checked;
        const fSize = fabSizeSelect?.value || 'normal';
        const fabAlpha = rangeFabOpacity ? (parseInt(rangeFabOpacity.value, 10) / 100).toFixed(2) : '0.9';
        prevFab.style.display = isFabVisible ? 'flex' : 'none';
        prevFab.querySelectorAll('.prev-fab-btn').forEach((btn) => {
          if (fSize === 'tiny') {
            btn.style.width = '22px';
            btn.style.height = '22px';
          } else if (fSize === 'small') {
            btn.style.width = '28px';
            btn.style.height = '28px';
          } else if (fSize === 'large') {
            btn.style.width = '42px';
            btn.style.height = '42px';
          } else {
            btn.style.width = '34px';
            btn.style.height = '34px';
          }
          btn.style.background = btn.classList.contains('prev-fab-crop')
            ? `rgba(2, 132, 199, ${fabAlpha})`
            : `rgba(255, 255, 255, ${fabAlpha})`;
        });
      }

      // 2. Toolbar
      if (prevToolbar && rangeToolbarOpacity && rangeToolbarBlur && toolbarThemeSelect) {
        const tbAlpha = (parseInt(rangeToolbarOpacity.value, 10) / 100).toFixed(2);
        const tbBlurVal = parseInt(rangeToolbarBlur.value, 10);
        const tbTheme = toolbarThemeSelect.value;
        const showText = checkToolbarText ? checkToolbarText.checked : true;

        prevToolbar.querySelectorAll('.prev-tb-label').forEach((lbl) => {
          lbl.style.display = showText ? 'inline' : 'none';
        });

        prevToolbar.style.backdropFilter = `blur(${tbBlurVal}px) saturate(180%)`;
        prevToolbar.style.webkitBackdropFilter = `blur(${tbBlurVal}px) saturate(180%)`;

        if (tbTheme === 'glass-dark') {
          prevToolbar.style.background = `rgba(15, 23, 42, ${tbAlpha})`;
          prevToolbar.style.color = '#f8fafc';
          prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        } else if (tbTheme === 'cyber-blue') {
          prevToolbar.style.background = `rgba(2, 132, 199, ${tbAlpha})`;
          prevToolbar.style.color = '#ffffff';
          prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.35)';
        } else if (tbTheme === 'emerald') {
          prevToolbar.style.background = `rgba(5, 150, 105, ${tbAlpha})`;
          prevToolbar.style.color = '#ffffff';
          prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.35)';
        } else if (tbTheme === 'purple') {
          prevToolbar.style.background = `rgba(124, 58, 237, ${tbAlpha})`;
          prevToolbar.style.color = '#ffffff';
          prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.35)';
        } else {
          // glass-light
          prevToolbar.style.background = `rgba(255, 255, 255, ${tbAlpha})`;
          prevToolbar.style.color = '#1e293b';
          prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }
      }

      // 3. Popup
      if (prevPopup && rangePopupOpacity && rangePopupBlur) {
        const popAlpha = (parseInt(rangePopupOpacity.value, 10) / 100).toFixed(2);
        const popBlurVal = parseInt(rangePopupBlur.value, 10);
        prevPopup.style.background = `rgba(255, 255, 255, ${popAlpha})`;
        prevPopup.style.backdropFilter = `blur(${popBlurVal}px) saturate(180%)`;
        prevPopup.style.webkitBackdropFilter = `blur(${popBlurVal}px) saturate(180%)`;
      }
    };

    updatePreview();

    // Event Listeners
    overlayThemeSelect?.addEventListener('change', () => {
      Storage.set({ overlayTheme: overlayThemeSelect.value });
    });

    checkFab.addEventListener('change', () => {
      Storage.set({ enableFloatingButton: checkFab.checked });
      updatePreview();
    });

    fabSizeSelect?.addEventListener('change', () => {
      Storage.set({ fabSize: fabSizeSelect.value });
      updatePreview();
    });

    rangeFabOpacity?.addEventListener('input', () => {
      if (valFabOpacity) valFabOpacity.textContent = `${rangeFabOpacity.value}%`;
      Storage.set({ fabOpacity: parseInt(rangeFabOpacity.value, 10) });
      updatePreview();
    });

    checkToolbarText?.addEventListener('change', () => {
      Storage.set({ toolbarShowText: checkToolbarText.checked });
      updatePreview();
    });

    toolbarSizeSelect?.addEventListener('change', () => {
      Storage.set({ toolbarSize: toolbarSizeSelect.value });
      updatePreview();
    });

    toolbarThemeSelect?.addEventListener('change', () => {
      Storage.set({ toolbarTheme: toolbarThemeSelect.value });
      updatePreview();
    });

    rangeToolbarOpacity?.addEventListener('input', () => {
      if (valToolbarOpacity) valToolbarOpacity.textContent = `${rangeToolbarOpacity.value}%`;
      Storage.set({ toolbarOpacity: parseInt(rangeToolbarOpacity.value, 10) });
      updatePreview();
    });

    rangeToolbarBlur?.addEventListener('input', () => {
      if (valToolbarBlur) valToolbarBlur.textContent = `${rangeToolbarBlur.value}px`;
      Storage.set({ toolbarBlur: parseInt(rangeToolbarBlur.value, 10) });
      updatePreview();
    });

    rangePopupOpacity?.addEventListener('input', () => {
      if (valPopupOpacity) valPopupOpacity.textContent = `${rangePopupOpacity.value}%`;
      Storage.set({ popupOpacity: parseInt(rangePopupOpacity.value, 10) });
      updatePreview();
    });

    rangePopupBlur?.addEventListener('input', () => {
      if (valPopupBlur) valPopupBlur.textContent = `${rangePopupBlur.value}px`;
      Storage.set({ popupBlur: parseInt(rangePopupBlur.value, 10) });
      updatePreview();
    });
  }
}
