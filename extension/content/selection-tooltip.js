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
    if (this.toolbar && !this.toolbar.contains(e.target)
        && (!this.dropdown || !this.dropdown.contains(e.target))
        && (!this.submenu || !this.submenu.contains(e.target))) {
      this.removeToolbar();
    }
  }

  async handleMouseUp(e) {
    // If clicking inside existing toolbar, dropdown, or its submenu, don't
    // re-trigger or dismiss. The submenu is checked separately from the
    // dropdown — see toggleDropdown()'s portal note — since it's no longer
    // one of the dropdown's own descendants.
    if (this.toolbar && (this.toolbar.contains(e.target)
        || (this.dropdown && this.dropdown.contains(e.target))
        || (this.submenu && this.submenu.contains(e.target)))) {
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
    // toggleDropdown() needs this too, to theme the portalled dropdown/
    // submenu the same way — they're no longer nested inside this.toolbar
    // (see its portal note), so a plain `.hw-selection-toolbar.theme-X
    // .hw-tb-dropdown` descendant selector can't reach them anymore.
    this.resolvedTheme = resolvedTheme;

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
    // toggleDropdown() needs this to know whether it should wire up the
    // hover-to-keep-open behaviour on the dropdown/submenu it creates — that
    // behaviour only belongs to this (no main items) hover-triggered flow,
    // never the "..." click-to-toggle one below, which stays open regardless
    // of where the pointer wanders until explicitly dismissed.
    this.hoverTriggeredDropdown = !hasMainItems;

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
      // period before closing" idea as the disable submenu below. The
      // dropdown is portalled out of this.toolbar now (see toggleDropdown()),
      // so the close check also has to ask the dropdown itself whether the
      // pointer is over it — it used to be enough to ask just the toolbar,
      // back when the dropdown was one of its own descendants and :hover
      // matched through the whole subtree.
      const logo = this.toolbar.querySelector('#hwTbLogo');
      logo.addEventListener('mouseenter', () => {
        this.clearDropdownCloseTimer();
        if (!this.dropdown) this.toggleDropdown(rect);
      });
      logo.addEventListener('mouseleave', () => this.scheduleDropdownClose());
      this.toolbar.addEventListener('mouseleave', () => this.scheduleDropdownClose());
    }

    getSharedShadowRoot().appendChild(this.toolbar);
  }

  /** Cancels a pending scheduleDropdownClose(). */
  clearDropdownCloseTimer() {
    clearTimeout(this._dropdownCloseTimer);
  }

  /** Used only by the hover-to-open (no main items) path in renderToolbar() —
   * the click-to-toggle "..." button closes explicitly instead. Checks all
   * three of toolbar/dropdown/submenu: they're independent portalled
   * elements now (see toggleDropdown()'s portal note), so hovering the
   * submenu no longer keeps :hover matching on the dropdown the way it did
   * back when the submenu was nested inside it — each one has to be asked
   * separately whether the pointer is currently over it. */
  scheduleDropdownClose() {
    this.clearDropdownCloseTimer();
    this._dropdownCloseTimer = setTimeout(() => {
      const stillHovering = this.toolbar?.matches(':hover')
        || this.dropdown?.matches(':hover')
        || this.submenu?.matches(':hover');
      if (this.dropdown && !stillHovering) {
        this.closeDropdown();
      }
    }, 200);
  }

  closeDropdown() {
    if (this.submenu) {
      this.submenu.remove();
      this.submenu = null;
    }
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
    }
  }

  async toggleDropdown(rect) {
    if (this.dropdown) {
      this.closeDropdown();
      return;
    }

    const epoch = this.epoch;
    const { uiLanguage = 'en', toolbarLayout } = await Storage.get(['uiLanguage', 'toolbarLayout']);

    // Toolbar may have been removed (or replaced by a newer render) while we waited —
    // bail out instead of touching a null/stale this.toolbar.
    if (epoch !== this.epoch || !this.toolbar || this.dropdown) return;

    const dict = getSelectionTooltipI18n(uiLanguage);
    const layout = normalizeToolbarLayout(toolbarLayout);

    // Portalled onto the shared shadow root instead of appended into
    // this.toolbar: this.toolbar has its own backdrop-filter, and a nested
    // descendant's backdrop-filter only ever sees what its filtered ancestor
    // itself painted — not the real page behind it — so it rendered as
    // essentially unblurred. Confirmed by an isolated before/after render
    // comparison (identical CSS, only the nesting differed). Same problem,
    // same fix shared/engine-picker.js already uses for its own dropdown —
    // see its file-level portal note. --tb-alpha/--tb-blur and the theme
    // class are copied across by hand since they no longer inherit down
    // from this.toolbar once they're siblings rather than parent/child.
    this.dropdown = document.createElement('div');
    this.dropdown.className = `hw-tb-dropdown theme-${this.resolvedTheme}`;
    this.dropdown.style.setProperty('--tb-alpha', this.toolbar.style.getPropertyValue('--tb-alpha'));
    this.dropdown.style.setProperty('--tb-blur', this.toolbar.style.getPropertyValue('--tb-blur'));
    // Same reasoning as this.toolbar's guard above.
    this.dropdown.addEventListener('mousedown', (e) => e.stopPropagation());
    this.dropdown.addEventListener('mouseup', (e) => e.stopPropagation());
    // Only the hover-triggered (no main items) flow auto-closes on
    // mouseleave at all — see renderToolbar()'s hoverTriggeredDropdown
    // comment. Wiring this unconditionally made the click-to-toggle "..."
    // dropdown close itself just from the pointer wandering off it, which
    // it never used to do (that one only closes on an explicit outside
    // click or clicking "..." again).
    if (this.hoverTriggeredDropdown) {
      this.dropdown.addEventListener('mouseenter', () => this.clearDropdownCloseTimer());
      this.dropdown.addEventListener('mouseleave', () => this.scheduleDropdownClose());
    }

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
      </div>
    `;

    // Positioned against the toolbar's own box, in the same document-relative
    // coordinate space this.toolbar itself uses (position:absolute off the
    // shared shadow host, not the viewport — see renderToolbar()'s own
    // top/left math) now that it's no longer laid out by the CSS cascade as
    // this.toolbar's own child.
    const toolbarRect = this.toolbar.getBoundingClientRect();
    this.dropdown.style.top = `${window.scrollY + toolbarRect.bottom + 6}px`;
    this.dropdown.style.left = `${window.scrollX + toolbarRect.left}px`;
    getSharedShadowRoot().appendChild(this.dropdown);

    // The submenu is its own portalled element too, for the exact same
    // backdrop-filter reason as the dropdown above (it would otherwise be
    // nested inside the now-already-filtered dropdown, tripping the same
    // trap one level deeper).
    this.submenu = document.createElement('div');
    this.submenu.className = `hw-tb-submenu theme-${this.resolvedTheme}`;
    this.submenu.style.setProperty('--tb-alpha', this.toolbar.style.getPropertyValue('--tb-alpha'));
    this.submenu.style.setProperty('--tb-blur', this.toolbar.style.getPropertyValue('--tb-blur'));
    this.submenu.style.display = 'none';
    this.submenu.innerHTML = `
      <button class="hw-tb-sub-item" data-disable="session">${dict.disableSession}</button>
      <button class="hw-tb-sub-item" data-disable="page">${dict.disablePage}</button>
      <button class="hw-tb-sub-item" data-disable="site">${dict.disableSite}</button>
      <button class="hw-tb-sub-item" data-disable="global">${dict.disableGlobal}</button>
      <div class="hw-tb-sub-footer">${dict.disableFooter}</div>
    `;
    this.submenu.addEventListener('mousedown', (e) => e.stopPropagation());
    this.submenu.addEventListener('mouseup', (e) => e.stopPropagation());
    getSharedShadowRoot().appendChild(this.submenu);

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
    const submenu = this.submenu;
    let submenuCloseTimer = null;

    const positionSubmenu = () => {
      const r = disableItem.getBoundingClientRect();
      // Measure at full opacity/display first — an offsetWidth read while
      // still display:none would come back 0, and the flip decision below
      // needs the real box size.
      submenu.style.visibility = 'hidden';
      submenu.style.display = 'flex';
      const w = submenu.offsetWidth;
      // Flip to the left when the toolbar sits close enough to the right edge
      // that the submenu would open off-screen.
      const overflowsRight = r.right + 6 + w > window.innerWidth - 8;
      submenu.classList.toggle('flip-left', overflowsRight);
      const left = overflowsRight ? r.left - 6 - w : r.right + 6;
      submenu.style.left = `${window.scrollX + Math.max(8, left)}px`;
      submenu.style.top = `${window.scrollY + r.top}px`;
      submenu.style.visibility = 'visible';
    };
    const openSubmenu = () => {
      clearTimeout(submenuCloseTimer);
      // The submenu is a portalled sibling of this.dropdown now, positioned
      // outside its box — so moving the pointer from disableItem onto the
      // submenu fires this.dropdown's own mouseleave along the way (see
      // toggleDropdown()'s guard on that listener). In hover-triggered mode
      // that would otherwise schedule the whole thing closing out from under
      // a pointer that's still very much within the dropdown+submenu group,
      // just not over the dropdown element itself anymore.
      if (this.hoverTriggeredDropdown) this.clearDropdownCloseTimer();
      positionSubmenu();
    };
    const hideSubmenu = () => {
      clearTimeout(submenuCloseTimer);
      submenu.style.display = 'none';
    };
    const hideSubmenuSoon = () => {
      clearTimeout(submenuCloseTimer);
      submenuCloseTimer = setTimeout(hideSubmenu, 200);
      if (this.hoverTriggeredDropdown) this.scheduleDropdownClose();
    };

    disableItem.addEventListener('mouseenter', openSubmenu);
    disableItem.addEventListener('mouseleave', hideSubmenuSoon);
    submenu.addEventListener('mouseenter', openSubmenu);
    submenu.addEventListener('mouseleave', hideSubmenuSoon);

    // Opens only, never toggles: a mouse click is always preceded by the
    // hover that already opened the submenu, so toggling here would close it
    // the instant it was clicked. Closing is mouseleave's job (or picking one
    // of the items). No longer needs to check whether the click landed
    // inside the submenu itself — it's a portalled sibling now, not a
    // descendant of disableItem, so a click there never reaches this
    // listener in the first place.
    disableItem.addEventListener('click', (e) => {
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
    this.clearDropdownCloseTimer();
    this.closeDropdown();
    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }
  }
}

export const selectionTooltip = new SelectionTooltip();
