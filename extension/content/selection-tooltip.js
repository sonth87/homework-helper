/**
 * Text Selection Floating Toolbar (Content Script)
 * Liquid Glass Aesthetic with Answer, Copy, Search, Translate, and flyout submenus.
 */

import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';
import { getSelectionTooltipI18n } from '../shared/i18n.js';

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

    // Check if disabled for this site or globally
    const currentHost = window.location.hostname;
    const { enableTextTooltip = true, disabledSites = [] } = await Storage.get(['enableTextTooltip', 'disabledSites']);

    if (!enableTextTooltip || disabledSites.includes(currentHost) || sessionStorage.getItem('hw_disabled_session')) {
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
      uiLanguage = 'en',
    } = await Storage.get();

    // A newer render/removal happened while we were waiting on storage — abort so we
    // don't append a stale toolbar the current state has no reference to (orphaned node).
    if (epoch !== this.epoch) return;

    const dict = getSelectionTooltipI18n(uiLanguage);

    this.toolbar = document.createElement('div');
    this.toolbar.className = `hw-selection-toolbar size-${toolbarSize} theme-${toolbarTheme}`;

    // Liquid Glass CSS Variables (avoids CSS opacity bug on backdrop-filter)
    this.toolbar.style.setProperty('--tb-alpha', `${(toolbarOpacity / 100).toFixed(2)}`);
    this.toolbar.style.setProperty('--tb-blur', `${toolbarBlur}px`);

    const top = window.scrollY + rect.top - 46;
    const left = window.scrollX + rect.left + rect.width / 2;

    this.toolbar.style.top = `${Math.max(10, top)}px`;
    this.toolbar.style.left = `${Math.max(10, Math.min(window.innerWidth - 360, left - 140))}px`;

    // Stop mousedown inside toolbar from propagating to document
    this.toolbar.addEventListener('mousedown', (e) => e.stopPropagation());

    const iconOnlyCls = toolbarShowText ? '' : 'icon-only';

    this.toolbar.innerHTML = `
      <div class="hw-tb-logo">${Icons.appLogo(18)}</div>
      
      <button class="hw-tb-btn ${iconOnlyCls}" data-action="answer" title="${dict.answer}">
        ${Icons.messageCircle(14)} <span class="hw-tb-label">${dict.answer}</span>
      </button>

      <button class="hw-tb-btn ${iconOnlyCls}" data-action="copy" title="${dict.copy}">
        ${Icons.copy(14)} <span class="hw-tb-label">${dict.copy}</span>
      </button>

      <button class="hw-tb-btn ${iconOnlyCls}" data-action="search" title="${dict.search}">
        ${Icons.globe(14)} <span class="hw-tb-label">${dict.search}</span>
      </button>

      <button class="hw-tb-btn ${iconOnlyCls}" data-action="translate" title="${dict.translate}">
        ${Icons.languages(14)} <span class="hw-tb-label">${dict.translate}</span>
      </button>

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
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);

    // Toolbar may have been removed (or replaced by a newer render) while we waited —
    // bail out instead of touching a null/stale this.toolbar.
    if (epoch !== this.epoch || !this.toolbar || this.dropdown) return;

    const dict = getSelectionTooltipI18n(uiLanguage);

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'hw-tb-dropdown';
    this.dropdown.addEventListener('mousedown', (e) => e.stopPropagation());

    this.dropdown.innerHTML = `
      <button class="hw-tb-menu-item" data-action="explain">
        <div class="hw-tb-menu-item-left">${Icons.helpCircle(15)} ${dict.explain}</div>
      </button>
      <button class="hw-tb-menu-item" data-action="summarize">
        <div class="hw-tb-menu-item-left">${Icons.bookOpen(15)} ${dict.summarize}</div>
      </button>
      <button class="hw-tb-menu-item" data-action="grammar">
        <div class="hw-tb-menu-item-left">${Icons.edit(15)} ${dict.grammar}</div>
      </button>
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

    // Submenu hover logic
    const disableItem = this.dropdown.querySelector('#hwTbDisableItem');
    const submenu = this.dropdown.querySelector('#hwTbSubmenu');

    disableItem.addEventListener('mouseenter', () => {
      submenu.style.display = 'flex';
    });
    disableItem.addEventListener('mouseleave', (e) => {
      if (!submenu.contains(e.relatedTarget)) {
        submenu.style.display = 'none';
      }
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

  async handleDisable(type) {
    if (type === 'session') {
      sessionStorage.setItem('hw_disabled_session', 'true');
    } else if (type === 'page') {
      sessionStorage.setItem(`hw_disabled_${window.location.pathname}`, 'true');
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
