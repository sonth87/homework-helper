/**
 * Text Selection Floating Toolbar (Content Script)
 * Liquid Glass Aesthetic with Answer, Copy, Search, Translate, and flyout submenus.
 */

import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';
import { getSelectionTooltipI18n } from '../shared/i18n.js';
import { TOOLBAR_ITEM_ICONS, normalizeToolbarLayout } from '../shared/toolbar-items.js';

class SelectionTooltip {
  constructor() {
    this.toolbar = null;
    this.dropdown = null;
    this.submenu = null;
    this.selectedText = '';
    this.epoch = 0;
    this.init();
  }

  async init() {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('HOMEWORK_AI_HIDE_ALL_UI', () => this.removeToolbar());
  }

  handleMouseDown(e) {
    if (this.toolbar && !this.toolbar.contains(e.target) && (!this.dropdown || !this.dropdown.contains(e.target))) {
      this.removeToolbar();
    }
  }

  async handleMouseUp(e) {
    // If clicking inside existing toolbar or dropdown, don't re-trigger or dismiss
    if (this.toolbar && (this.toolbar.contains(e.target) || (this.dropdown && this.dropdown.contains(e.target)))) {
      return;
    }

    // Check if disabled for this page, site, session or globally
    const currentHost = window.location.hostname;
    const { enableTextTooltip = true, disabledSites = [] } = await Storage.get(['enableTextTooltip', 'disabledSites']);

    if (!enableTextTooltip || disabledSites.includes(currentHost) || this.isDisabledForSession()) {
      this.removeToolbar();
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 2) {
        this.removeToolbar();
        return;
      }

      if (e.target.closest('input, textarea') && !text) {
        return;
      }

      this.selectedText = text;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) return;

      this.renderToolbar(rect);
    }, 20);
  }

  async renderToolbar(rect) {
    this.removeToolbar();
    const epoch = ++this.epoch;

    const {
      toolbarOpacity = 90,
      toolbarBlur = 14,
      toolbarShowText = true,
      toolbarSize = 'normal',
      toolbarTheme = 'glass-light',
      toolbarPosition = 'above',
      toolbarLayout,
      uiLanguage = 'en',
    } = await Storage.get();

    // A newer render/removal happened while we were waiting on storage — abort so we
    // don't append a stale toolbar the current state has no reference to (orphaned node).
    if (epoch !== this.epoch) return;

    const dict = getSelectionTooltipI18n(uiLanguage);
    const layout = normalizeToolbarLayout(toolbarLayout);

    this.toolbar = document.createElement('div');
    this.toolbar.className = `hw-selection-toolbar size-${toolbarSize} theme-${toolbarTheme}`;

    // Liquid Glass CSS Variables (avoids CSS opacity bug on backdrop-filter)
    this.toolbar.style.setProperty('--tb-alpha', `${(toolbarOpacity / 100).toFixed(2)}`);
    this.toolbar.style.setProperty('--tb-blur', `${toolbarBlur}px`);

    const top = toolbarPosition === 'below'
      ? window.scrollY + rect.bottom + 10
      : window.scrollY + rect.top - 46;
    const left = window.scrollX + rect.left + rect.width / 2;

    this.toolbar.style.top = `${Math.max(10, top)}px`;
    this.toolbar.style.left = `${Math.max(10, Math.min(window.innerWidth - 360, left - 140))}px`;

    // Stop mousedown inside toolbar from propagating to document
    this.toolbar.addEventListener('mousedown', (e) => e.stopPropagation());

    const iconOnlyCls = toolbarShowText ? '' : 'icon-only';

    const mainButtonsHtml = layout
      .filter((item) => item.area === 'main')
      .map(({ id }) => `
        <button class="hw-tb-btn ${iconOnlyCls}" data-action="${id}" title="${dict[id]}">
          ${Icons[TOOLBAR_ITEM_ICONS[id]](14)} <span class="hw-tb-label">${dict[id]}</span>
        </button>
      `)
      .join('');

    this.toolbar.innerHTML = `
      <div class="hw-tb-logo">${Icons.appLogo(18)}</div>
      ${mainButtonsHtml}
      <button class="hw-tb-btn hw-tb-more-btn" id="hwTbMoreBtn" title="${dict.more}">
        ${Icons.chevronUp(14)}
      </button>
    `;

    // Action button listeners
    this.toolbar.querySelectorAll('.hw-tb-btn[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        this.triggerAction(action, rect);
      });
    });

    // Expand More Menu
    const moreBtn = this.toolbar.querySelector('#hwTbMoreBtn');
    moreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown(rect);
    });

    document.body.appendChild(this.toolbar);
  }

  async toggleDropdown(rect) {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
      return;
    }

    const epoch = this.epoch;
    const { uiLanguage = 'en', toolbarLayout } = await Storage.get(['uiLanguage', 'toolbarLayout']);

    // Toolbar may have been removed (or replaced by a newer render) while we waited —
    // bail out instead of touching a null/stale this.toolbar.
    if (epoch !== this.epoch || !this.toolbar || this.dropdown) return;

    const dict = getSelectionTooltipI18n(uiLanguage);
    const layout = normalizeToolbarLayout(toolbarLayout);

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'hw-tb-dropdown';
    this.dropdown.addEventListener('mousedown', (e) => e.stopPropagation());

    const dropdownItemsHtml = layout
      .filter((item) => item.area === 'dropdown')
      .map(({ id }) => `
        <button class="hw-tb-menu-item" data-action="${id}">
          <div class="hw-tb-menu-item-left">${Icons[TOOLBAR_ITEM_ICONS[id]](15)} ${dict[id]}</div>
        </button>
      `)
      .join('');

    this.dropdown.innerHTML = `
      ${dropdownItemsHtml}
      <div class="hw-tb-menu-item" id="hwTbDisableItem">
        <div class="hw-tb-menu-item-left">${Icons.slash(15)} ${dict.disable}</div>
        ${Icons.chevronRight(13)}
        
        <!-- Submenu -->
        <div class="hw-tb-submenu" id="hwTbSubmenu" style="display: none;">
          <button class="hw-tb-sub-item" data-disable="session">${dict.disableSession}</button>
          <button class="hw-tb-sub-item" data-disable="page">${dict.disablePage}</button>
          <button class="hw-tb-sub-item" data-disable="site">${dict.disableSite}</button>
          <button class="hw-tb-sub-item" data-disable="global">${dict.disableGlobal}</button>
          <div class="hw-tb-sub-footer">${dict.disableFooter}</div>
        </div>
      </div>
    `;

    // Submenu open/close.
    //
    // The submenu sits 6px to the right of the row that opens it, and that gap
    // belongs to neither element: a pointer heading for the submenu left the
    // row first, so a bare mouseleave closed the menu before it could ever be
    // reached — the whole "disable" branch was unclickable. Three things fix
    // it: a transparent bridge across the gap (.hw-tb-submenu::before), a short
    // grace period before closing, and click-to-toggle so the row works
    // without hovering at all (touch, trackpad taps, keyboard).
    const disableItem = this.dropdown.querySelector('#hwTbDisableItem');
    const submenu = this.dropdown.querySelector('#hwTbSubmenu');
    let submenuCloseTimer = null;

    const openSubmenu = () => {
      clearTimeout(submenuCloseTimer);
      submenu.classList.remove('flip-left');
      submenu.style.display = 'flex';
      // Flip to the left when the toolbar sits close enough to the right edge
      // that the submenu would open off-screen.
      if (submenu.getBoundingClientRect().right > window.innerWidth - 8) {
        submenu.classList.add('flip-left');
      }
    };
    const hideSubmenu = () => {
      clearTimeout(submenuCloseTimer);
      submenu.style.display = 'none';
    };
    const hideSubmenuSoon = () => {
      clearTimeout(submenuCloseTimer);
      submenuCloseTimer = setTimeout(hideSubmenu, 200);
    };

    disableItem.addEventListener('mouseenter', openSubmenu);
    disableItem.addEventListener('mouseleave', hideSubmenuSoon);
    submenu.addEventListener('mouseenter', openSubmenu);
    submenu.addEventListener('mouseleave', hideSubmenuSoon);

    // Opens only, never toggles: a mouse click is always preceded by the
    // hover that already opened the submenu, so toggling here would close it
    // the instant it was clicked. Closing is mouseleave's job (or picking one
    // of the items).
    disableItem.addEventListener('click', (e) => {
      if (submenu.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      openSubmenu();
    });

    // Disable actions
    submenu.querySelectorAll('.hw-tb-sub-item').forEach((subBtn) => {
      subBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const type = subBtn.getAttribute('data-disable');
        await this.handleDisable(type);
        this.removeToolbar();
      });
    });

    // Menu actions
    this.dropdown.querySelectorAll('.hw-tb-menu-item[data-action]').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = item.getAttribute('data-action');
        this.triggerAction(action, rect);
      });
    });

    this.toolbar.appendChild(this.dropdown);
  }

  // 'session' and 'page' both live in sessionStorage; the page key was being
  // written by handleDisable but never read back, so "disable for this page"
  // silently did nothing.
  isDisabledForSession() {
    try {
      return !!(
        sessionStorage.getItem('hw_disabled_session') ||
        sessionStorage.getItem(`hw_disabled_${window.location.pathname}`)
      );
    } catch (e) {
      // sessionStorage throws on pages with storage blocked (sandboxed iframes,
      // strict privacy settings) — treat that as "not disabled".
      return false;
    }
  }

  async handleDisable(type) {
    if (type === 'session') {
      try { sessionStorage.setItem('hw_disabled_session', 'true'); } catch (e) { /* storage blocked */ }
    } else if (type === 'page') {
      try { sessionStorage.setItem(`hw_disabled_${window.location.pathname}`, 'true'); } catch (e) { /* storage blocked */ }
    } else if (type === 'site') {
      const { disabledSites = [] } = await Storage.get(['disabledSites']);
      const currentHost = window.location.hostname;
      if (!disabledSites.includes(currentHost)) {
        await Storage.set({ disabledSites: [...disabledSites, currentHost] });
      }
    } else if (type === 'global') {
      await Storage.set({ enableTextTooltip: false });
    }
  }

  triggerAction(action, rect) {
    const text = this.selectedText;
    this.removeToolbar();

    if (action === 'copy') {
      navigator.clipboard.writeText(text);
      return;
    }

    // Open compact Floating Homework Helper Solution Card Popup
    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_OPEN_POPUP', {
      detail: {
        type: action,
        text,
        rect: {
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        },
      }
    }));
  }

  removeToolbar() {
    this.epoch++;
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
    }
    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }
  }
}

export const selectionTooltip = new SelectionTooltip();
