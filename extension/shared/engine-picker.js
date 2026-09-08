/**
 * Translation-source dropdown
 *
 * A native <select> cannot show a provider's mark next to its name, and the
 * mark is what makes this list scannable — "the blue-and-orange one" is how
 * people actually remember which service they picked. So this is a small
 * button-plus-menu built from ordinary elements.
 *
 * Shared by the toolbar popup (popup/popup.js) and the in-page card
 * (content/overlay/floating-card.js), which is why it takes its labels as
 * arguments instead of reaching for a dictionary: those two surfaces read
 * from different i18n blocks.
 *
 * The menu is portalled out of the trigger's container on purpose. The
 * in-page card sets `overflow: hidden` (rounded corners + native resize) and
 * `backdrop-filter`, which together clip even a position:fixed descendant —
 * a menu rendered inside the card would be cut off at its edge. Appending it
 * to the shadow root instead, and positioning it against the trigger's
 * viewport rect, sidesteps both.
 */

import {
  FREE_PROVIDERS,
  AI_PROVIDER_ID,
  PICKABLE_PROVIDER_IDS,
  providerLogo,
  providerName,
} from './translate-providers.js';

const CARET_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="hw-ep-caret" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
const CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';

const escapeAttr = (str) => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export class EnginePicker {
  /**
   * @param {HTMLElement} container element the trigger button is rendered into
   * @param {object} options
   * @param {string} options.value currently selected engine id
   * @param {{groupFree?: string, groupAi?: string, ai?: string}} options.labels
   * @param {(id: string) => void} options.onChange fired only on a real change
   */
  constructor(container, { value = 'bing', labels = {}, onChange = () => {} } = {}) {
    this.container = container;
    this.labels = labels;
    this.onChange = onChange;
    this.value = PICKABLE_PROVIDER_IDS.includes(value) ? value : FREE_PROVIDERS[0].id;
    this.isOpen = false;

    // The menu is appended here, not inside `container` — see the portal note
    // above. In a plain document that means <body>; inside the in-page card it
    // means the shared shadow root, a sibling of the card rather than a child.
    const root = container.getRootNode();
    this.portal = (!root || root === document) ? document.body : root;

    this.build();
  }

  build() {
    this.container.classList.add('hw-ep');
    this.container.innerHTML = `
      <button class="hw-ep-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
        <span class="hw-ep-mark"></span>
        <span class="hw-ep-label"></span>
        ${CARET_SVG}
      </button>
    `;
    this.trigger = this.container.querySelector('.hw-ep-trigger');

    this.menu = document.createElement('div');
    this.menu.className = 'hw-ep-menu';
    this.menu.setAttribute('role', 'listbox');
    this.menu.hidden = true;
    this.portal.appendChild(this.menu);

    this.trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    this.menu.addEventListener('click', (e) => {
      const item = e.target.closest?.('.hw-ep-item');
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();
      this.select(item.dataset.id);
    });

    // Bound once and kept: the popup and the in-page card both live as long
    // as their document does, so there is nothing to tear down.
    //
    // Listening on `document` rather than on the picker's own root is what
    // makes a click on the surrounding web page close an in-page menu: mouse
    // events are composed, so one raised inside the shadow tree still reaches
    // document, while one raised on the page never reaches the shadow root.
    const outside = (e) => {
      // Only the primary button counts as "dismiss". A right-click to open
      // a context menu (e.g. DevTools' Inspect, used to debug this very
      // picker) is a mousedown too, and firing close() on it closed the
      // menu out from under anyone trying to inspect it.
      if (!this.isOpen || e.button !== 0) return;
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (path.includes(this.menu) || path.includes(this.container)) return;
      this.close();
    };
    document.addEventListener('mousedown', outside, true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
    // Repositioning a portalled menu on every scroll frame is more machinery
    // than a five-row list is worth; closing it is what the user expects from
    // a dropdown whose anchor just moved anyway — but scrolling inside the
    // menu itself must not count as the anchor moving.
    window.addEventListener('scroll', (e) => {
      if (!this.isOpen) return;
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (path.includes(this.menu)) return;
      this.close();
    }, true);
    // Reposition rather than dismiss: an extension popup resizes itself to
    // fit its content shortly after opening, and opening DevTools to inspect
    // the page fires a resize too — closing the menu on either made it look
    // like clicking the trigger "did nothing" when it had briefly opened and
    // then immediately closed itself.
    window.addEventListener('resize', () => { if (this.isOpen) this.position(); });

    this.renderTrigger();
  }

  /** Free services first, the user's own models last — cheapest option first. */
  entries() {
    return [
      { group: this.labels.groupFree || 'Free services', items: FREE_PROVIDERS },
      { group: this.labels.groupAi || 'Your AI', items: [{ id: AI_PROVIDER_ID, name: this.labels.ai || 'AI models' }] },
    ];
  }

  labelFor(id) {
    return id === AI_PROVIDER_ID ? (this.labels.ai || 'AI models') : providerName(id);
  }

  renderTrigger() {
    this.trigger.querySelector('.hw-ep-mark').innerHTML = providerLogo(this.value, 15);
    this.trigger.querySelector('.hw-ep-label').textContent = this.labelFor(this.value);
    this.trigger.title = this.labelFor(this.value);
  }

  renderMenu() {
    this.menu.innerHTML = this.entries().map(({ group, items }) => `
      <div class="hw-ep-group">${escapeAttr(group)}</div>
      ${items.map(({ id }) => `
        <button class="hw-ep-item${id === this.value ? ' is-selected' : ''}" type="button" role="option"
                aria-selected="${id === this.value}" data-id="${escapeAttr(id)}">
          <span class="hw-ep-mark">${providerLogo(id, 16)}</span>
          <span class="hw-ep-label">${escapeAttr(this.labelFor(id))}</span>
          <span class="hw-ep-check">${CHECK_SVG}</span>
        </button>
      `).join('')}
    `).join('');
  }

  /** Anchored to the trigger's viewport rect, flipped above when it would fall off. */
  position() {
    const r = this.trigger.getBoundingClientRect();
    this.menu.style.visibility = 'hidden';
    this.menu.hidden = false;
    this.menu.style.minWidth = `${Math.max(r.width, 190)}px`;

    const h = this.menu.offsetHeight;
    const w = this.menu.offsetWidth;
    const below = window.innerHeight - r.bottom;
    const top = (below < h + 12 && r.top > h + 12) ? r.top - h - 6 : r.bottom + 6;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));

    this.menu.style.top = `${Math.max(8, top)}px`;
    this.menu.style.left = `${left}px`;
    this.menu.style.visibility = 'visible';
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.renderMenu();
    this.position();
    this.menu.classList.add('is-open');
    this.isOpen = true;
    this.trigger.setAttribute('aria-expanded', 'true');
  }

  close() {
    if (!this.isOpen) return;
    this.menu.hidden = true;
    this.menu.classList.remove('is-open');
    this.isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');
  }

  select(id) {
    this.close();
    if (!id || id === this.value || !PICKABLE_PROVIDER_IDS.includes(id)) return;
    this.value = id;
    this.renderTrigger();
    this.onChange(id);
  }

  /** Set the value without firing onChange — for restoring a stored choice. */
  setValue(id, { silent = true } = {}) {
    if (!PICKABLE_PROVIDER_IDS.includes(id) || id === this.value) return;
    this.value = id;
    this.renderTrigger();
    if (!silent) this.onChange(id);
  }

  /** Re-apply labels after a UI-language change. */
  setLabels(labels) {
    this.labels = { ...this.labels, ...labels };
    this.renderTrigger();
    if (this.isOpen) this.renderMenu();
  }
}
