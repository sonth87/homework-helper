import { Icons } from '../../shared/icons.js';
import { Storage, DEFAULT_SETTINGS } from '../../shared/storage.js';
import { getSelectionTooltipI18n } from '../../shared/i18n.js';
import { TOOLBAR_ITEM_ICONS, DEFAULT_TOOLBAR_LAYOUT, normalizeToolbarLayout } from '../../shared/toolbar-items.js';

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
      popupCardSize = 'normal',
      toolbarShowText = true,
      toolbarSize = 'normal',
      toolbarTheme = 'glass-light',
      toolbarPosition = 'above',
      toolbarOpacity = 90,
      toolbarBlur = 14,
      toolbarLayout,
      enableHoverTranslate = false,
      hoverTranslateModifiers = ['alt'],
      hoverTranslateGranularity = 'word',
      hoverTranslateDelay = 350,
      hoverTranslateTheme = 'glass-light',
      hoverTranslateHighlight = true,
      hoverTranslateAnimation = 'none',
      hoverTranslateOpacity = 96,
      hoverTranslateBlur = 18,
      hoverTranslateFontSize = 13,
      hoverTranslateMaxWidth = 300,
      uiLanguage = 'vi',
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
    const toolbarPositionSelect = document.getElementById('optToolbarPositionSelect');

    const rangeToolbarOpacity = document.getElementById('optRangeToolbarOpacity');
    const valToolbarOpacity = document.getElementById('valToolbarOpacity');
    const rangeToolbarBlur = document.getElementById('optRangeToolbarBlur');
    const valToolbarBlur = document.getElementById('valToolbarBlur');

    const checkHoverTranslateInline = document.getElementById('optCheckHoverTranslateInline');
    const checkHoverMods = {
      ctrl: document.getElementById('optHoverModCtrl'),
      shift: document.getElementById('optHoverModShift'),
      alt: document.getElementById('optHoverModAlt'),
      meta: document.getElementById('optHoverModMeta'),
    };
    const hoverGranularitySelect = document.getElementById('optHoverGranularitySelect');
    const rangeHoverDelay = document.getElementById('optRangeHoverDelay');
    const valHoverDelay = document.getElementById('valHoverDelay');
    const checkHoverHighlight = document.getElementById('optCheckHoverHighlight');
    const hoverAnimationSelect = document.getElementById('optHoverAnimationSelect');
    const hoverThemeSelect = document.getElementById('optHoverThemeSelect');
    const rangeHoverOpacity = document.getElementById('optRangeHoverOpacity');
    const valHoverOpacity = document.getElementById('valHoverOpacity');
    const rangeHoverBlur = document.getElementById('optRangeHoverBlur');
    const valHoverBlur = document.getElementById('valHoverBlur');
    const rangeHoverFontSize = document.getElementById('optRangeHoverFontSize');
    const valHoverFontSize = document.getElementById('valHoverFontSize');
    const rangeHoverMaxWidth = document.getElementById('optRangeHoverMaxWidth');
    const valHoverMaxWidth = document.getElementById('valHoverMaxWidth');
    const btnResetHover = document.getElementById('optBtnResetHover');
    const prevHoverTip = document.getElementById('prevHoverTip');

    const popupCardSizeSelect = document.getElementById('optPopupCardSizeSelect');
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
    if (toolbarPositionSelect) toolbarPositionSelect.value = toolbarPosition;

    if (rangeToolbarOpacity) {
      rangeToolbarOpacity.value = toolbarOpacity;
      if (valToolbarOpacity) valToolbarOpacity.textContent = `${toolbarOpacity}%`;
    }
    if (rangeToolbarBlur) {
      rangeToolbarBlur.value = toolbarBlur;
      if (valToolbarBlur) valToolbarBlur.textContent = `${toolbarBlur}px`;
    }

    if (checkHoverTranslateInline) checkHoverTranslateInline.checked = enableHoverTranslate;
    Object.entries(checkHoverMods).forEach(([mod, el]) => {
      if (el) el.checked = hoverTranslateModifiers.includes(mod);
    });
    if (hoverGranularitySelect) hoverGranularitySelect.value = hoverTranslateGranularity;
    if (rangeHoverDelay) {
      rangeHoverDelay.value = hoverTranslateDelay;
      if (valHoverDelay) valHoverDelay.textContent = `${hoverTranslateDelay}ms`;
    }
    if (checkHoverHighlight) checkHoverHighlight.checked = hoverTranslateHighlight;
    if (hoverAnimationSelect) hoverAnimationSelect.value = hoverTranslateAnimation;
    if (hoverThemeSelect) hoverThemeSelect.value = hoverTranslateTheme;
    if (rangeHoverOpacity) {
      rangeHoverOpacity.value = hoverTranslateOpacity;
      if (valHoverOpacity) valHoverOpacity.textContent = `${hoverTranslateOpacity}%`;
    }
    if (rangeHoverBlur) {
      rangeHoverBlur.value = hoverTranslateBlur;
      if (valHoverBlur) valHoverBlur.textContent = `${hoverTranslateBlur}px`;
    }
    if (rangeHoverFontSize) {
      rangeHoverFontSize.value = hoverTranslateFontSize;
      if (valHoverFontSize) valHoverFontSize.textContent = `${hoverTranslateFontSize}px`;
    }
    if (rangeHoverMaxWidth) {
      rangeHoverMaxWidth.value = hoverTranslateMaxWidth;
      if (valHoverMaxWidth) valHoverMaxWidth.textContent = `${hoverTranslateMaxWidth}px`;
    }

    if (popupCardSizeSelect) popupCardSizeSelect.value = popupCardSize;
    if (rangePopupOpacity) {
      rangePopupOpacity.value = popupOpacity;
      if (valPopupOpacity) valPopupOpacity.textContent = `${popupOpacity}%`;
    }
    if (rangePopupBlur) {
      rangePopupBlur.value = popupBlur;
      if (valPopupBlur) valPopupBlur.textContent = `${popupBlur}px`;
    }

    this.initToolbarLayoutEditor(normalizeToolbarLayout(toolbarLayout), getSelectionTooltipI18n(uiLanguage));

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
        const tbSize = toolbarSizeSelect?.value || 'normal';
        const showText = checkToolbarText ? checkToolbarText.checked : true;

        prevToolbar.classList.remove('size-compact', 'size-large');
        if (tbSize === 'compact' || tbSize === 'large') prevToolbar.classList.add(`size-${tbSize}`);

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

      // 2.5a Hover-translate highlight/animation preview — reuses the existing
      // .highlight-text demo paragraph as a stand-in for "text on the page",
      // since applyTextEffects() in hover-translate.js styles real page text
      // directly rather than a tooltip; there's nothing else in this mock to
      // point it at.
      const prevDemoHighlight = document.getElementById('prevDemoHighlight');
      if (prevDemoHighlight) {
        prevDemoHighlight.classList.remove('opt-preview-hl-on', 'opt-preview-anim-pulse', 'opt-preview-anim-glow', 'opt-preview-anim-sweep', 'opt-preview-anim-draw');
        if (checkHoverHighlight?.checked) prevDemoHighlight.classList.add('opt-preview-hl-on');
        const animVal = hoverAnimationSelect?.value || 'none';
        if (animVal !== 'none') prevDemoHighlight.classList.add(`opt-preview-anim-${animVal}`);
      }

      // 2.5 Quick Hover Translate tooltip
      if (prevHoverTip && rangeHoverOpacity && rangeHoverBlur && hoverThemeSelect) {
        const htAlpha = (parseInt(rangeHoverOpacity.value, 10) / 100).toFixed(2);
        const htBlurVal = parseInt(rangeHoverBlur.value, 10);
        const htFontSize = rangeHoverFontSize ? parseInt(rangeHoverFontSize.value, 10) : 13;
        const htMaxWidth = rangeHoverMaxWidth ? parseInt(rangeHoverMaxWidth.value, 10) : 300;
        const htTheme = hoverThemeSelect.value;

        prevHoverTip.style.setProperty('--ht-max-width', `${htMaxWidth}px`);
        prevHoverTip.style.fontSize = `${htFontSize}px`;
        prevHoverTip.style.backdropFilter = `blur(${htBlurVal}px) saturate(180%)`;
        prevHoverTip.style.webkitBackdropFilter = `blur(${htBlurVal}px) saturate(180%)`;

        if (htTheme === 'glass-dark') {
          prevHoverTip.style.background = `rgba(15, 23, 42, ${htAlpha})`;
          prevHoverTip.style.color = '#f8fafc';
        } else if (htTheme === 'cyber-blue') {
          prevHoverTip.style.background = `rgba(2, 132, 199, ${htAlpha})`;
          prevHoverTip.style.color = '#ffffff';
        } else if (htTheme === 'emerald') {
          prevHoverTip.style.background = `rgba(5, 150, 105, ${htAlpha})`;
          prevHoverTip.style.color = '#ffffff';
        } else if (htTheme === 'purple') {
          prevHoverTip.style.background = `rgba(124, 58, 237, ${htAlpha})`;
          prevHoverTip.style.color = '#ffffff';
        } else {
          prevHoverTip.style.background = `rgba(255, 255, 255, ${htAlpha})`;
          prevHoverTip.style.color = '#1e293b';
        }
      }

      // 3. Popup
      if (prevPopup && rangePopupOpacity && rangePopupBlur) {
        const popAlpha = (parseInt(rangePopupOpacity.value, 10) / 100).toFixed(2);
        const popBlurVal = parseInt(rangePopupBlur.value, 10);
        prevPopup.style.background = `rgba(255, 255, 255, ${popAlpha})`;
        prevPopup.style.backdropFilter = `blur(${popBlurVal}px) saturate(180%)`;
        prevPopup.style.webkitBackdropFilter = `blur(${popBlurVal}px) saturate(180%)`;
        prevPopup.classList.toggle('compact', (popupCardSizeSelect?.value || 'normal') === 'compact');
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

    toolbarPositionSelect?.addEventListener('change', () => {
      Storage.set({ toolbarPosition: toolbarPositionSelect.value });
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

    checkHoverTranslateInline?.addEventListener('change', () => {
      Storage.set({ enableHoverTranslate: checkHoverTranslateInline.checked });
      const generalCheck = document.getElementById('optCheckHoverTranslate');
      if (generalCheck) generalCheck.checked = checkHoverTranslateInline.checked;
    });

    Object.entries(checkHoverMods).forEach(([mod, el]) => {
      el?.addEventListener('change', () => {
        const active = Object.entries(checkHoverMods)
          .filter(([, m]) => m?.checked)
          .map(([key]) => key);
        Storage.set({ hoverTranslateModifiers: active });
      });
    });

    hoverGranularitySelect?.addEventListener('change', () => {
      Storage.set({ hoverTranslateGranularity: hoverGranularitySelect.value });
    });

    rangeHoverDelay?.addEventListener('input', () => {
      if (valHoverDelay) valHoverDelay.textContent = `${rangeHoverDelay.value}ms`;
      Storage.set({ hoverTranslateDelay: parseInt(rangeHoverDelay.value, 10) });
    });

    checkHoverHighlight?.addEventListener('change', () => {
      Storage.set({ hoverTranslateHighlight: checkHoverHighlight.checked });
      updatePreview();
    });

    hoverAnimationSelect?.addEventListener('change', () => {
      Storage.set({ hoverTranslateAnimation: hoverAnimationSelect.value });
      updatePreview();
    });

    hoverThemeSelect?.addEventListener('change', () => {
      Storage.set({ hoverTranslateTheme: hoverThemeSelect.value });
      updatePreview();
    });

    rangeHoverOpacity?.addEventListener('input', () => {
      if (valHoverOpacity) valHoverOpacity.textContent = `${rangeHoverOpacity.value}%`;
      Storage.set({ hoverTranslateOpacity: parseInt(rangeHoverOpacity.value, 10) });
      updatePreview();
    });

    rangeHoverBlur?.addEventListener('input', () => {
      if (valHoverBlur) valHoverBlur.textContent = `${rangeHoverBlur.value}px`;
      Storage.set({ hoverTranslateBlur: parseInt(rangeHoverBlur.value, 10) });
      updatePreview();
    });

    rangeHoverFontSize?.addEventListener('input', () => {
      if (valHoverFontSize) valHoverFontSize.textContent = `${rangeHoverFontSize.value}px`;
      Storage.set({ hoverTranslateFontSize: parseInt(rangeHoverFontSize.value, 10) });
      updatePreview();
    });

    rangeHoverMaxWidth?.addEventListener('input', () => {
      if (valHoverMaxWidth) valHoverMaxWidth.textContent = `${rangeHoverMaxWidth.value}px`;
      Storage.set({ hoverTranslateMaxWidth: parseInt(rangeHoverMaxWidth.value, 10) });
      updatePreview();
    });

    // Resets every control in this card back to DEFAULT_SETTINGS — deliberately
    // leaves enableHoverTranslate untouched, since on/off is a separate decision
    // from "what should the default behavior/appearance be".
    btnResetHover?.addEventListener('click', () => {
      const d = DEFAULT_SETTINGS;

      Object.entries(checkHoverMods).forEach(([mod, el]) => {
        if (el) el.checked = d.hoverTranslateModifiers.includes(mod);
      });
      if (hoverGranularitySelect) hoverGranularitySelect.value = d.hoverTranslateGranularity;
      if (rangeHoverDelay) {
        rangeHoverDelay.value = d.hoverTranslateDelay;
        if (valHoverDelay) valHoverDelay.textContent = `${d.hoverTranslateDelay}ms`;
      }
      if (checkHoverHighlight) checkHoverHighlight.checked = d.hoverTranslateHighlight;
      if (hoverAnimationSelect) hoverAnimationSelect.value = d.hoverTranslateAnimation;
      if (hoverThemeSelect) hoverThemeSelect.value = d.hoverTranslateTheme;
      if (rangeHoverOpacity) {
        rangeHoverOpacity.value = d.hoverTranslateOpacity;
        if (valHoverOpacity) valHoverOpacity.textContent = `${d.hoverTranslateOpacity}%`;
      }
      if (rangeHoverBlur) {
        rangeHoverBlur.value = d.hoverTranslateBlur;
        if (valHoverBlur) valHoverBlur.textContent = `${d.hoverTranslateBlur}px`;
      }
      if (rangeHoverFontSize) {
        rangeHoverFontSize.value = d.hoverTranslateFontSize;
        if (valHoverFontSize) valHoverFontSize.textContent = `${d.hoverTranslateFontSize}px`;
      }
      if (rangeHoverMaxWidth) {
        rangeHoverMaxWidth.value = d.hoverTranslateMaxWidth;
        if (valHoverMaxWidth) valHoverMaxWidth.textContent = `${d.hoverTranslateMaxWidth}px`;
      }

      Storage.set({
        hoverTranslateModifiers: [...d.hoverTranslateModifiers],
        hoverTranslateGranularity: d.hoverTranslateGranularity,
        hoverTranslateDelay: d.hoverTranslateDelay,
        hoverTranslateHighlight: d.hoverTranslateHighlight,
        hoverTranslateAnimation: d.hoverTranslateAnimation,
        hoverTranslateTheme: d.hoverTranslateTheme,
        hoverTranslateOpacity: d.hoverTranslateOpacity,
        hoverTranslateBlur: d.hoverTranslateBlur,
        hoverTranslateFontSize: d.hoverTranslateFontSize,
        hoverTranslateMaxWidth: d.hoverTranslateMaxWidth,
      });
      updatePreview();
    });

    popupCardSizeSelect?.addEventListener('change', () => {
      Storage.set({ popupCardSize: popupCardSizeSelect.value });
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

  // Drag-and-drop editor for which selection-toolbar tools sit directly on
  // the toolbar vs. inside its "..." dropdown, and their order within each.
  // Plain HTML5 drag-and-drop (no library): dragging a row over a lane
  // relocates it live via insertBefore/appendChild, and every drop persists
  // the two <ul>s' current DOM order straight to storage as the new layout.
  initToolbarLayoutEditor(layout, dict) {
    const mainList = document.getElementById('optLayoutMainList');
    const dropdownList = document.getElementById('optLayoutDropdownList');
    const resetBtn = document.getElementById('optBtnResetToolbarLayout');
    if (!mainList || !dropdownList) return;

    const lists = [mainList, dropdownList];

    const buildItem = (id) => {
      const li = document.createElement('li');
      li.className = 'opt-tb-layout-item';
      li.draggable = true;
      li.dataset.id = id;
      const iconFn = Icons[TOOLBAR_ITEM_ICONS[id]];
      li.innerHTML = `
        <span class="opt-tb-layout-drag-handle">${Icons.gripHorizontal(14)}</span>
        <span class="opt-tb-layout-item-icon">${iconFn ? iconFn(15) : ''}</span>
        <span class="opt-tb-layout-item-label">${dict[id] || id}</span>
      `;
      li.addEventListener('dragstart', onDragStart);
      li.addEventListener('dragend', onDragEnd);
      return li;
    };

    const render = (layoutToRender) => {
      mainList.innerHTML = '';
      dropdownList.innerHTML = '';
      layoutToRender.forEach(({ id, area }) => {
        (area === 'main' ? mainList : dropdownList).appendChild(buildItem(id));
      });
    };

    // Mirrors the editor's current state into the "Live Preview" toolbar on
    // the right (#prevTbItems — logo and the "..." button stay static, only
    // this wrapper's contents change) so dragging a tool between lanes shows
    // up there immediately, not just after leaving the page and coming back.
    const updateLivePreview = (currentLayout) => {
      const prevItems = document.getElementById('prevTbItems');
      if (!prevItems) return;
      prevItems.innerHTML = currentLayout
        .filter((item) => item.area === 'main')
        .map(({ id }) => {
          const iconFn = Icons[TOOLBAR_ITEM_ICONS[id]];
          return `<div class="prev-tb-btn">${iconFn ? iconFn(13) : ''}<span class="prev-tb-label">${dict[id] || id}</span></div>`;
        })
        .join('');
      // A fresh set of buttons needs the current "show text" toggle applied —
      // the toggle's own change handler only updates labels that already
      // existed when it last ran.
      const showText = document.getElementById('optCheckToolbarText')?.checked ?? true;
      prevItems.querySelectorAll('.prev-tb-label').forEach((lbl) => {
        lbl.style.display = showText ? 'inline' : 'none';
      });
    };

    const persist = () => {
      const result = [];
      lists.forEach((list) => {
        list.querySelectorAll('.opt-tb-layout-item').forEach((li) => {
          result.push({ id: li.dataset.id, area: list.dataset.area });
        });
      });
      Storage.set({ toolbarLayout: result });
      updateLivePreview(result);
    };

    const getDragAfterElement = (list, y) => {
      const items = [...list.querySelectorAll('.opt-tb-layout-item:not(.dragging)')];
      return items.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
        },
        { offset: Number.NEGATIVE_INFINITY, element: null }
      ).element;
    };

    let draggedEl = null;

    function onDragStart(e) {
      draggedEl = e.currentTarget;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedEl.dataset.id); // required by Firefox to start a drag
      requestAnimationFrame(() => draggedEl?.classList.add('dragging'));
    }

    function onDragEnd() {
      draggedEl?.classList.remove('dragging');
      draggedEl = null;
      lists.forEach((l) => l.classList.remove('drag-over'));
    }

    lists.forEach((list) => {
      list.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedEl) return;
        list.classList.add('drag-over');
        const afterEl = getDragAfterElement(list, e.clientY);
        if (afterEl == null) list.appendChild(draggedEl);
        else list.insertBefore(draggedEl, afterEl);
      });
      list.addEventListener('dragleave', (e) => {
        if (e.target === list) list.classList.remove('drag-over');
      });
      list.addEventListener('drop', (e) => {
        e.preventDefault();
        list.classList.remove('drag-over');
        persist();
      });
    });

    render(layout);
    updateLivePreview(layout);

    resetBtn?.addEventListener('click', () => {
      render(DEFAULT_TOOLBAR_LAYOUT.map((entry) => ({ ...entry })));
      persist();
    });
  }
}
