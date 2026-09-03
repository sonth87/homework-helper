/**
 * Text Selection Floating Toolbar (Content Script)
 * Liquid Glass Aesthetic with Answer, Copy, Search, Translate, and flyout submenus.
 */

import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';
import { getSelectionTooltipI18n } from '../shared/i18n.js';
import { TOOLBAR_ITEM_ICONS, normalizeToolbarLayout } from '../shared/toolbar-items.js';
import { NANO_STATUS } from '../shared/nano-status.js';
import { getSharedShadowRoot, ensureStylesheet } from './shadow-root.js';

class SelectionTooltip {
  constructor() {
    this.toolbar = null;
    this.dropdown = null;
    this.submenu = null;
    this.selectedText = '';
    this.epoch = 0;
    this.isAiBlocked = false;
    this.nanoStatus = null;
    this.nanoDownloadState = null;
    this._lastRect = null;
    this.init();
  }

  async init() {
    // Loaded eagerly (not on first renderToolbar()) so the sheet has landed
    // well before the user ever selects text — see shadow-root.js.
    ensureStylesheet('content/styles/tooltip.css');

    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('HOMEWORK_AI_HIDE_ALL_UI', () => this.removeToolbar());

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && (changes.apiConfigs || changes.nanoDownloadState || changes.isNanoReady)) {
          // apiConfigs in particular can rewrite itself several times in quick
          // succession while an unrelated generation is in flight elsewhere on
          // the page (key-rotator.js stamping a cooldown per failed key). A
          // toolbar already open for a *different* selection has nothing to do
          // with that generation, but used to remove and rebuild itself on
          // every single one of those writes — flickering for as long as the
          // other request kept rotating keys. Only re-render when the gating
          // state this toolbar actually reflects (blocked/nano status/download
          // progress) has genuinely changed.
          const prevBlocked = this.isAiBlocked;
          const prevStatus = this.nanoStatus;
          const prevDownload = JSON.stringify(this.nanoDownloadState);
          this.refreshGatingState().then(() => {
            const stateChanged = this.isAiBlocked !== prevBlocked
              || this.nanoStatus !== prevStatus
              || JSON.stringify(this.nanoDownloadState) !== prevDownload;
            if (stateChanged && this.toolbar && this._lastRect) this.renderToolbar(this._lastRect);
          });
        }
      });
    }
  }

  // A standalone singleton (no reference to OverlayDrawer), so this small
  // CustomEvent round-trip intentionally mirrors drawer.js's checkNanoAvailability()
  // rather than reaching across modules for it.
  async probeNanoStatus() {
    return new Promise((resolve) => {
      let resolved = false;
      const handler = (e) => {
        window.removeEventListener('HOMEWORK_AI_NANO_RESPONSE', handler);
        resolved = true;
        resolve(e.detail?.hasAi ? (e.detail?.status || NANO_STATUS.UNAVAILABLE) : NANO_STATUS.UNAVAILABLE);
      };
      window.addEventListener('HOMEWORK_AI_NANO_RESPONSE', handler);
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_CHECK'));
      setTimeout(() => {
        if (!resolved) {
          window.removeEventListener('HOMEWORK_AI_NANO_RESPONSE', handler);
          resolve(null);
        }
      }, 300);
    });
  }

  async refreshGatingState() {
    const { apiConfigs = [], nanoDownloadState } = await Storage.get(['apiConfigs', 'nanoDownloadState']);
    const enabledCount = apiConfigs.filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin')).length;
    this.nanoDownloadState = nanoDownloadState;

    if (nanoDownloadState?.inProgress) {
      this.isAiBlocked = false;
      this.nanoStatus = NANO_STATUS.DOWNLOADING;
      return;
    }
    if (enabledCount > 0) {
      this.isAiBlocked = false;
      this.nanoStatus = null;
      return;
    }

    const status = await this.probeNanoStatus();
    this.nanoStatus = status;
    this.isAiBlocked = status === NANO_STATUS.UNAVAILABLE;
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
    this._lastRect = rect;
    await this.refreshGatingState();

    const {
      toolbarOpacity = 90,
      toolbarBlur = 14,
      toolbarShowText = true,
      toolbarSize = 'normal',
      toolbarTheme = 'auto',
      toolbarPosition = 'above',
      toolbarLayout,
      uiLanguage = 'en',
    } = await Storage.get();

    // A newer render/removal happened while we were waiting on storage — abort so we
    // don't append a stale toolbar the current state has no reference to (orphaned node).
    if (epoch !== this.epoch) return;

    const dict = getSelectionTooltipI18n(uiLanguage);
    const layout = normalizeToolbarLayout(toolbarLayout);

    // 'auto' isn't a skin of its own — tooltip.css only ever styled
    // glass-light (the default look) and a .theme-glass-dark override, so
    // resolve to whichever of those two matches the OS's current preference
    // rather than adding a third, parallel @media-driven variant.
    const resolvedTheme = toolbarTheme === 'auto'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'glass-dark' : 'glass-light')
      : toolbarTheme;

    this.toolbar = document.createElement('div');
    this.toolbar.className = `hw-selection-toolbar size-${toolbarSize} theme-${resolvedTheme}`;

    // Liquid Glass CSS Variables (avoids CSS opacity bug on backdrop-filter)
    this.toolbar.style.setProperty('--tb-alpha', `${(toolbarOpacity / 100).toFixed(2)}`);
    this.toolbar.style.setProperty('--tb-blur', `${toolbarBlur}px`);

    const top = toolbarPosition === 'below'
      ? window.scrollY + rect.bottom + 10
      : window.scrollY + rect.top - 46;
    const left = window.scrollX + rect.left + rect.width / 2;

    this.toolbar.style.top = `${Math.max(10, top)}px`;
    this.toolbar.style.left = `${Math.max(10, Math.min(window.innerWidth - 360, left - 140))}px`;

    // Stop mousedown/mouseup inside the toolbar from propagating to
    // document. Beyond the original "don't dismiss on our own click" intent,
    // this now also matters because the toolbar lives inside the shared
    // Shadow DOM (shadow-root.js): a mousedown/mouseup that reaches all the
    // way out to a document-level listener gets retargeted to the shadow
    // host element, so document's handleMouseUp() would see e.target as the
    // host — never a descendant of this.toolbar — and wrongly treat every
    // click inside the toolbar as an outside click.
    this.toolbar.addEventListener('mousedown', (e) => e.stopPropagation());
    this.toolbar.addEventListener('mouseup', (e) => e.stopPropagation());

    const iconOnlyCls = toolbarShowText ? '' : 'icon-only';
    const hasMainItems = layout.some((item) => item.area === 'main');

    const mainButtonsHtml = layout
      .filter((item) => item.area === 'main')
      .map(({ id }) => {
        const disabled = id !== 'copy' && this.isAiBlocked;
        const title = disabled ? (dict.aiUnavailableTooltip || dict[id]) : dict[id];
        return `
        <button class="hw-tb-btn ${iconOnlyCls} ${disabled ? 'hw-tb-disabled' : ''}" data-action="${id}" ${disabled ? 'disabled' : ''} title="${title}">
          ${Icons[TOOLBAR_ITEM_ICONS[id]](14)} <span class="hw-tb-label">${dict[id]}</span>
        </button>
      `;
      })
      .join('');

    const statusPillHtml = this.nanoStatus === NANO_STATUS.DOWNLOADING
      ? `<span class="hw-tb-status-pill" title="${dict.nanoDownloadingTooltip || ''}">${Icons.download(11)}${this.nanoDownloadState?.percent != null ? ` ${this.nanoDownloadState.percent}%` : ''}</span>`
      : '';

    // With every tool moved into the dropdown (drag-and-drop layout editor,
    // Options > Appearance), the main bar has nothing to show but the logo
    // and a "..." button that would just duplicate what the logo itself can
    // trigger — so the chevron button is dropped and the logo becomes the
    // hover-to-open trigger instead (see the mouseenter wiring below).
    this.toolbar.innerHTML = `
      <div class="hw-tb-logo${hasMainItems ? '' : ' hw-tb-logo-hoverable'}" id="hwTbLogo">${Icons.appLogo(18)}</div>
      ${statusPillHtml}
      ${mainButtonsHtml}
      ${hasMainItems ? `
      <button class="hw-tb-btn hw-tb-more-btn" id="hwTbMoreBtn" title="${dict.more}">
        ${Icons.chevronUp(14)}
      </button>` : ''}
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

    if (hasMainItems) {
      // Expand More Menu
      const moreBtn = this.toolbar.querySelector('#hwTbMoreBtn');
      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown(rect);
      });
    } else {
      // Hover the smiley logo itself to open the dropdown. Same "grace
      // period before closing" idea as the disable submenu below: the
      // dropdown is appended as a child of this.toolbar, so as long as the
      // pointer is anywhere inside the toolbar+dropdown, this.toolbar still
      // matches :hover and the close is skipped.
      const logo = this.toolbar.querySelector('#hwTbLogo');
      let closeTimer = null;
      const scheduleClose = () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          if (this.dropdown && !this.toolbar?.matches(':hover')) {
            this.dropdown.remove();
            this.dropdown = null;
          }
        }, 200);
      };
      logo.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        if (!this.dropdown) this.toggleDropdown(rect);
      });
      logo.addEventListener('mouseleave', scheduleClose);
      this.toolbar.addEventListener('mouseleave', scheduleClose);
    }

    getSharedShadowRoot().appendChild(this.toolbar);
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
    // Same reasoning as this.toolbar's guard above.
    this.dropdown.addEventListener('mousedown', (e) => e.stopPropagation());
    this.dropdown.addEventListener('mouseup', (e) => e.stopPropagation());

    const dropdownItemsHtml = layout
      .filter((item) => item.area === 'dropdown')
      .map(({ id }) => {
        const disabled = id !== 'copy' && this.isAiBlocked;
        const title = disabled ? (dict.aiUnavailableTooltip || '') : '';
        return `
        <button class="hw-tb-menu-item ${disabled ? 'hw-tb-disabled' : ''}" data-action="${id}" ${disabled ? 'disabled' : ''} title="${title}">
          <div class="hw-tb-menu-item-left">${Icons[TOOLBAR_ITEM_ICONS[id]](15)} ${dict[id]}</div>
        </button>
      `;
      })
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
    if (action !== 'copy' && this.isAiBlocked) return;

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
