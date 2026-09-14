/**
 * Searchable Language Combobox (ES Module)
 *
 * A modern, accessible searchable combobox for selecting translation
 * and AI response languages across the extension.
 *
 * Features:
 * - Displays language in its native endonym ("Tiếng Việt", "English", "Français", "Deutsch", etc.).
 * - Pinned on top: English and Tiếng Việt (plus "Auto / Tự động nhận diện" when enabled).
 * - Real-time smart search filtering by native name, English name, ISO code, and unaccented Vietnamese aliases.
 * - Keyboard navigation (Arrow keys, Enter, Esc).
 * - Portalled to root / Shadow DOM to prevent overflow clipping.
 * - Liquid Glass aesthetic compatible with Light & Dark themes.
 */

import { TRANSLATE_LANGUAGES } from './storage.js';

const CARET_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="hw-lcb-caret" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
const SEARCH_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="hw-lcb-search-icon" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
const CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="hw-lcb-check-icon" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';

const VI_COMMON_ALIASES = {
  en: 'anh tieng anh',
  vi: 'viet tieng viet',
  fr: 'phap tieng phap',
  de: 'duc tieng duc',
  es: 'tay ban nha',
  ja: 'nhat tieng nhat nhat ban',
  ko: 'han tieng han han quoc',
  'zh-CN': 'trung gian the tieng trung trung quoc',
  'zh-TW': 'trung phon the dai loan',
  ru: 'nga tieng nga',
  it: 'y tieng y italia',
  nl: 'ha lan tieng ha lan',
  pl: 'ba lan tieng ba lan',
  ar: 'a rap tieng a rap',
  th: 'thai tieng thai thai lan',
  id: 'indo indonesia',
  pt: 'bo dao nha',
  tr: 'tho nhi ky',
  el: 'hy lap',
  hi: 'an do hindi',
  cs: 'sec tiep khac',
  sv: 'thuy dien',
  no: 'na uy',
  da: 'dan mach',
  fi: 'phan lan',
  uk: 'ucraina ukraina',
};

function stripDiacritics(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

let activeCombobox = null;

export class LanguageCombobox {
  /**
   * @param {HTMLElement} container Container element for the trigger button
   * @param {object} options
   * @param {string} [options.value='vi'] Currently selected language code
   * @param {boolean} [options.includeAuto=false] Whether to include Auto-detect
   * @param {string} [options.autoLabel='Tự động nhận diện'] Label for Auto
   * @param {string} [options.placeholder='Tìm ngôn ngữ...'] Search input placeholder
   * @param {Array} [options.languages] Custom language list
   * @param {string} [options.pinnedGroupLabel='Phổ biến'] Group title for pinned items
   * @param {string} [options.allGroupLabel='Tất cả ngôn ngữ'] Group title for other items
   * @param {(id: string, item: object) => void} [options.onChange] Callback on selection change
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign({
      value: 'vi',
      includeAuto: false,
      autoLabel: 'Tự động nhận diện',
      placeholder: 'Tìm ngôn ngữ...',
      pinnedGroupLabel: 'Phổ biến',
      allGroupLabel: 'Tất cả ngôn ngữ',
      onChange: () => {},
    }, options);

    this.includeAuto = Boolean(this.options.includeAuto);
    this.onChange = this.options.onChange;
    this.isOpen = false;
    this.highlightIndex = 0;

    // Prepare full language list
    const baseLangs = this.options.languages || TRANSLATE_LANGUAGES;
    this.languages = [];

    if (this.includeAuto) {
      this.languages.push({
        id: 'auto',
        name: 'Auto Detect',
        native: this.options.autoLabel || 'Tự động nhận diện',
        pinned: true,
      });
    }

    baseLangs.forEach((l) => {
      this.languages.push({
        id: l.id,
        name: l.name,
        native: l.native || l.name,
        pinned: Boolean(l.pinned),
      });
    });

    this.value = this.languages.some((l) => l.id === this.options.value)
      ? this.options.value
      : (this.includeAuto ? 'auto' : 'vi');

    // Portal setup (document.body or shadow root)
    const root = container.getRootNode();
    this.portal = (!root || root === document) ? document.body : root;

    this.build();
    this.bindEvents();
  }

  build() {
    this.container.classList.add('hw-lcb-wrap');
    this.container.innerHTML = `
      <button class="hw-lcb-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
        <span class="hw-lcb-trigger-text"></span>
        ${CARET_SVG}
      </button>
    `;
    this.trigger = this.container.querySelector('.hw-lcb-trigger');
    this.triggerText = this.container.querySelector('.hw-lcb-trigger-text');

    // Floating Menu Panel
    this.menu = document.createElement('div');
    this.menu.className = 'hw-lcb-menu';
    this.menu.setAttribute('role', 'listbox');
    this.menu.hidden = true;

    this.menu.innerHTML = `
      <div class="hw-lcb-search-box">
        ${SEARCH_SVG}
        <input type="text" class="hw-lcb-search-input" placeholder="${this.options.placeholder}" autocomplete="off" spellcheck="false">
        <button type="button" class="hw-lcb-clear-btn" hidden aria-label="Clear">&times;</button>
      </div>
      <div class="hw-lcb-list"></div>
      <div class="hw-lcb-empty" hidden>Không tìm thấy ngôn ngữ</div>
    `;

    this.searchInput = this.menu.querySelector('.hw-lcb-search-input');
    this.clearBtn = this.menu.querySelector('.hw-lcb-clear-btn');
    this.listContainer = this.menu.querySelector('.hw-lcb-list');
    this.emptyMessage = this.menu.querySelector('.hw-lcb-empty');

    this.portal.appendChild(this.menu);
    this.updateTriggerText();
  }

  bindEvents() {
    this.trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    this.searchInput.addEventListener('input', () => {
      const q = this.searchInput.value;
      this.clearBtn.hidden = !q;
      this.renderList(q);
    });

    this.clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.searchInput.value = '';
      this.clearBtn.hidden = true;
      this.renderList('');
      this.searchInput.focus();
    });

    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // Close on outside click or tap (capture phase so stopPropagation elsewhere cannot block dismissal)
    this.onOutside = (e) => {
      if (!this.isOpen || (e.button !== undefined && e.button !== 0)) return;
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (path.includes(this.container) || path.includes(this.menu)) return;
      this.close();
    };
    document.addEventListener('mousedown', this.onOutside, true);
    document.addEventListener('touchstart', this.onOutside, true);

    // Escape closes globally
    this.onDocKeydown = (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        this.trigger.focus();
      }
    };
    document.addEventListener('keydown', this.onDocKeydown, true);

    // Reposition on window resize
    this.onReposition = () => {
      if (this.isOpen) this.positionMenu();
    };
    window.addEventListener('resize', this.onReposition, { passive: true });

    // Close on outside scroll
    this.onScroll = (e) => {
      if (!this.isOpen) return;
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (path.includes(this.menu)) return;
      this.close();
    };
    window.addEventListener('scroll', this.onScroll, true);
  }

  handleKeyDown(e) {
    const items = Array.from(this.listContainer.querySelectorAll('.hw-lcb-item'));
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightIndex = (this.highlightIndex + 1) % items.length;
      this.updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightIndex = (this.highlightIndex - 1 + items.length) % items.length;
      this.updateHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = items[this.highlightIndex];
      if (current) {
        this.selectItem(current.dataset.id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      this.trigger.focus();
    }
  }

  updateHighlight(items) {
    items.forEach((it, idx) => {
      it.classList.toggle('highlighted', idx === this.highlightIndex);
      if (idx === this.highlightIndex) {
        it.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  renderList(filterText = '') {
    const q = stripDiacritics(filterText);
    this.listContainer.innerHTML = '';

    let visibleLanguages = this.languages;
    if (q) {
      visibleLanguages = this.languages.filter((l) => {
        const nativeClean = stripDiacritics(l.native);
        const nameClean = stripDiacritics(l.name);
        const idClean = l.id.toLowerCase();
        const viAlias = VI_COMMON_ALIASES[l.id] || '';
        return (
          nativeClean.includes(q) ||
          nameClean.includes(q) ||
          idClean.startsWith(q) ||
          viAlias.includes(q)
        );
      });
    }

    if (!visibleLanguages.length) {
      this.emptyMessage.hidden = false;
      return;
    }
    this.emptyMessage.hidden = true;

    // If not searching, show pinned items with section headers
    if (!q) {
      const pinned = visibleLanguages.filter((l) => l.pinned);
      const others = visibleLanguages.filter((l) => !l.pinned);

      if (pinned.length) {
        const pinHeader = document.createElement('div');
        pinHeader.className = 'hw-lcb-section-title';
        pinHeader.textContent = this.options.pinnedGroupLabel;
        this.listContainer.appendChild(pinHeader);

        pinned.forEach((l) => this.createItemElement(l));
      }

      if (others.length) {
        const otherHeader = document.createElement('div');
        otherHeader.className = 'hw-lcb-section-title';
        otherHeader.textContent = this.options.allGroupLabel;
        this.listContainer.appendChild(otherHeader);

        others.forEach((l) => this.createItemElement(l));
      }
    } else {
      visibleLanguages.forEach((l) => this.createItemElement(l));
    }

    const items = Array.from(this.listContainer.querySelectorAll('.hw-lcb-item'));
    const selectedIdx = items.findIndex((it) => it.dataset.id === this.value);
    this.highlightIndex = selectedIdx >= 0 ? selectedIdx : 0;
    this.updateHighlight(items);
  }

  createItemElement(lang) {
    const isSelected = lang.id === this.value;
    const itemEl = document.createElement('div');
    itemEl.className = `hw-lcb-item${isSelected ? ' selected' : ''}`;
    itemEl.dataset.id = lang.id;
    itemEl.setAttribute('role', 'option');
    itemEl.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    // Autonym format: primary text is native name, secondary is English name if different
    const isDifferent = lang.name && lang.native && lang.name.toLowerCase() !== lang.native.toLowerCase();
    const secondaryHtml = isDifferent ? `<span class="hw-lcb-subname">${lang.name}</span>` : '';

    itemEl.innerHTML = `
      <span class="hw-lcb-item-label">
        <span class="hw-lcb-mainname">${lang.native}</span>
        ${secondaryHtml}
      </span>
      ${isSelected ? CHECK_SVG : ''}
    `;

    itemEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectItem(lang.id);
    });

    itemEl.addEventListener('mouseenter', () => {
      const items = Array.from(this.listContainer.querySelectorAll('.hw-lcb-item'));
      this.highlightIndex = items.indexOf(itemEl);
      this.updateHighlight(items);
    });

    this.listContainer.appendChild(itemEl);
  }

  selectItem(id) {
    const changed = this.value !== id;
    this.value = id;
    this.updateTriggerText();
    this.close();
    this.trigger.focus();

    if (changed) {
      const item = this.languages.find((l) => l.id === id) || null;
      this.onChange(id, item);
    }
  }

  updateTriggerText() {
    const lang = this.languages.find((l) => l.id === this.value);
    this.triggerText.textContent = lang ? lang.native : this.value;
    this.trigger.title = lang ? `${lang.native} (${lang.name || lang.id})` : this.value;
  }

  positionMenu() {
    this.menu.style.visibility = 'hidden';
    this.menu.classList.add('is-open');
    this.menu.hidden = false;

    const rect = this.trigger.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 210);
    this.menu.style.minWidth = `${Math.round(minWidth)}px`;
    this.menu.style.maxWidth = `${Math.min(window.innerWidth - 16, 320)}px`;

    const menuH = this.menu.offsetHeight || 300;
    const menuW = this.menu.offsetWidth || minWidth;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = (spaceBelow < menuH + 8 && rect.top > menuH + 8);

    let top = openUp ? rect.top - menuH - 4 : rect.bottom + 4;
    let left = rect.left;

    // Viewport bounds safety
    if (left + menuW > window.innerWidth - 8) {
      left = window.innerWidth - menuW - 8;
    }
    if (left < 8) left = 8;
    if (top < 8) top = 8;

    this.menu.style.position = 'fixed';
    this.menu.style.top = `${Math.round(top)}px`;
    this.menu.style.left = `${Math.round(left)}px`;
    this.menu.style.zIndex = '2147483647';
    this.menu.style.visibility = 'visible';
  }

  open() {
    if (this.isOpen) return;
    if (activeCombobox && activeCombobox !== this) {
      activeCombobox.close();
    }
    activeCombobox = this;

    this.isOpen = true;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.container.classList.add('is-open');

    this.searchInput.value = '';
    this.clearBtn.hidden = true;
    this.renderList('');
    this.positionMenu();

    setTimeout(() => {
      if (this.isOpen) {
        this.searchInput.focus();
      }
    }, 10);
  }

  close() {
    if (!this.isOpen) return;
    if (activeCombobox === this) {
      activeCombobox = null;
    }
    this.isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.container.classList.remove('is-open');
    this.menu.classList.remove('is-open');
    this.menu.hidden = true;
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  getValue() {
    return this.value;
  }

  setValue(newVal, triggerChange = false) {
    if (!this.languages.some((l) => l.id === newVal)) return;
    const changed = this.value !== newVal;
    this.value = newVal;
    this.updateTriggerText();
    if (changed && triggerChange) {
      const item = this.languages.find((l) => l.id === newVal) || null;
      this.onChange(newVal, item);
    }
  }

  destroy() {
    document.removeEventListener('mousedown', this.onOutside, true);
    document.removeEventListener('touchstart', this.onOutside, true);
    document.removeEventListener('keydown', this.onDocKeydown, true);
    window.removeEventListener('resize', this.onReposition);
    window.removeEventListener('scroll', this.onScroll, true);
    if (activeCombobox === this) {
      activeCombobox = null;
    }
    this.menu.remove();
    this.container.innerHTML = '';
  }
}
