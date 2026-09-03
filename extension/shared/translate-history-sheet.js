/**
 * Translate History — bottom sheet
 *
 * Shared by the two surfaces that translate outside the AI chat: the
 * in-page card (opened from the selection toolbar or the floating
 * tooltip's translate button, while in translate mode) and the toolbar
 * popup. Both write into the same `Storage.translateHistory` list — see
 * shared/storage.js — so a word looked up from either one shows up in
 * either one's history.
 *
 * Deliberately NOT portalled outside its host, unlike shared/engine-picker.js's
 * dropdown: it renders as a bottom sheet *inside* the popup it was opened
 * from, covering that popup's own content. `container` must already be a
 * positioned element (relative/fixed/absolute) so the sheet's own
 * `position: absolute; inset: 0` covers exactly its content area and is
 * clipped by whatever the container already clips.
 */

import { Icons } from './icons.js';
import { Storage } from './storage.js';
import { parseDictionaryEntry } from './dictionary.js';
import { renderAnswer, escapeHtml } from './markdown-katex.js';

const escapeAttr = (str) => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * What the collapsed row's two columns show. A single-word lookup carries a
 * dictionary-schema JSON reply (see shared/dictionary.js) — its headword and
 * short gloss/translation stand in for the raw source/target text a phrase
 * or sentence entry stores directly.
 */
function rowSummary(item) {
  const entry = parseDictionaryEntry(item.translatedRaw);
  if (entry) {
    return {
      source: entry.word || item.sourceText,
      target: entry.translation || entry.senses?.[0]?.gloss || '',
    };
  }
  return {
    source: item.sourceText,
    target: (item.translatedRaw || '').replace(/\s+/g, ' ').trim(),
  };
}

export class TranslateHistorySheet {
  /**
   * @param {HTMLElement} container mounted inside this element.
   * @param {object} options
   * @param {object} [options.labels] i18n strings: title, tabHistory,
   *   tabFavorite, close, favorite, emptyHistory, emptyFavorite, listen.
   * @param {() => string} [options.speakLabel] returns the current Listen
   *   button title — a function (not a plain string) so it stays correct
   *   across a UI-language change even while the sheet sits closed.
   * @param {(isOpen: boolean) => void} [options.onToggle] fired right after
   *   open()/close(). The sheet only ever clips to `container`'s own box —
   *   a caller whose page can grow taller than that (the toolbar popup,
   *   once a translation result is showing) needs this hook to lock its own
   *   outer document scroll too, or that content keeps scrolling underneath
   *   the sheet. Not every caller needs it (the in-page card is already a
   *   bounded floating element), so it's opt-in rather than baked in here —
   *   this module has no business reaching into a host page's <body>.
   */
  constructor(container, { labels = {}, speakLabel = () => '', onToggle = () => {} } = {}) {
    this.container = container;
    this.labels = labels;
    this.speakLabel = speakLabel;
    this.onToggle = onToggle;
    this.tab = 'history'; // 'history' | 'favorite'
    this.expandedId = null;
    this.isOpen = false;
    this.items = [];
    // Ids selected by clicking a row (anywhere but its expand chevron or
    // favorite star) — separate from expandedId, since a row can be
    // selected for bulk delete without ever being expanded.
    this.checkedIds = new Set();
    this.build();
  }

  build() {
    this.container.insertAdjacentHTML('beforeend', `
      <div class="hw-th-sheet">
        <div class="hw-th-backdrop"></div>
        <div class="hw-th-panel" role="dialog">
          <div class="hw-th-grip"></div>
          <div class="hw-th-header">
            <div class="hw-th-header-left">
              <div class="hw-th-tabs" role="tablist">
                <button class="hw-th-tab is-active" type="button" data-tab="history" role="tab" aria-selected="true">${Icons.history(15)}</button>
                <button class="hw-th-tab" type="button" data-tab="favorite" role="tab" aria-selected="false">${Icons.star(15)}</button>
              </div>
            </div>
            <div class="hw-th-header-right">
              <span class="hw-th-selected-count" hidden></span>
              <div class="hw-th-delete-group" hidden>
                <button class="hw-th-delete-btn" type="button">${Icons.trash(14)}</button>
                <button class="hw-th-delete-toggle" type="button" aria-haspopup="true" aria-expanded="false">${Icons.chevronDown(10)}</button>
                <div class="hw-th-delete-menu" hidden>
                  <button class="hw-th-delete-all-btn" type="button"></button>
                </div>
              </div>
              <button class="hw-th-close" type="button">${Icons.x(15)}</button>
            </div>
          </div>
          <div class="hw-th-list"></div>
        </div>
      </div>
    `);
    this.sheet = this.container.querySelector('.hw-th-sheet');
    this.panel = this.sheet.querySelector('.hw-th-panel');
    this.tabHistoryBtn = this.sheet.querySelector('.hw-th-tab[data-tab="history"]');
    this.tabFavoriteBtn = this.sheet.querySelector('.hw-th-tab[data-tab="favorite"]');
    this.selectedCountEl = this.sheet.querySelector('.hw-th-selected-count');
    this.deleteGroupEl = this.sheet.querySelector('.hw-th-delete-group');
    this.deleteBtn = this.sheet.querySelector('.hw-th-delete-btn');
    this.deleteToggleBtn = this.sheet.querySelector('.hw-th-delete-toggle');
    this.deleteMenuEl = this.sheet.querySelector('.hw-th-delete-menu');
    this.deleteAllBtn = this.sheet.querySelector('.hw-th-delete-all-btn');
    this.closeBtn = this.sheet.querySelector('.hw-th-close');
    this.listEl = this.sheet.querySelector('.hw-th-list');
    this.backdropEl = this.sheet.querySelector('.hw-th-backdrop');

    this.sheet.querySelector('.hw-th-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.hw-th-tab');
      if (!btn || btn.classList.contains('is-active')) return;
      this.tab = btn.dataset.tab;
      this.sheet.querySelectorAll('.hw-th-tab').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      this.expandedId = null;
      // A check mark on a row that's about to scroll out of view (the other
      // tab's own filter) would be invisible and easy to forget about —
      // switching tabs starts selection fresh instead.
      this.checkedIds.clear();
      this.renderList();
    });

    this.closeBtn.addEventListener('click', () => this.close());
    this.backdropEl.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // The backdrop and header have nothing of their own to scroll, so a
    // wheel event there was falling straight through to whatever the sheet
    // sits on top of — the toolbar popup's own body — letting it scroll
    // right along with the sheet still open. Block it everywhere except
    // inside the list itself, which needs it for its own scrolling
    // (overscroll-behavior: contain, in the stylesheet, keeps that from
    // chaining onward once the list itself runs out of room).
    this.sheet.addEventListener('wheel', (e) => {
      if (!this.listEl.contains(e.target)) e.preventDefault();
    }, { passive: false });

    // Left segment: delete whatever's currently selected. Disabled (see
    // syncSelectionUi()) rather than hidden when nothing is — the group as a
    // whole stays reachable so "Delete all" is always one click away.
    this.deleteBtn.addEventListener('click', async () => {
      if (!this.checkedIds.size) return;
      const count = this.checkedIds.size;
      const message = (this.labels.confirmClear || '').replace('{count}', String(count));
      if (!confirm(message)) return;
      await Storage.removeTranslateHistory([...this.checkedIds]);
      this.checkedIds.clear();
      this.items = await Storage.getTranslateHistory();
      this.renderList();
    });

    // Right segment: opens a one-item menu for "Delete all" — a destructive
    // action independent of the current selection, so it doesn't belong on
    // the primary (selection-only) delete button itself.
    this.deleteToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = this.deleteMenuEl.hidden;
      this.deleteMenuEl.hidden = !willOpen;
      this.deleteToggleBtn.setAttribute('aria-expanded', String(willOpen));
    });

    // Closes the menu on any click outside the delete-group itself —
    // including the backdrop, which also closes the whole sheet, harmlessly.
    this.sheet.addEventListener('click', (e) => {
      if (!this.deleteMenuEl.hidden && !e.target.closest('.hw-th-delete-group')) {
        this.deleteMenuEl.hidden = true;
        this.deleteToggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    this.deleteAllBtn.addEventListener('click', async () => {
      this.deleteMenuEl.hidden = true;
      this.deleteToggleBtn.setAttribute('aria-expanded', 'false');
      const items = this.filteredItems();
      if (!items.length) return;
      const count = items.length;
      const message = (this.labels.confirmClearAll || '').replace('{count}', String(count));
      if (!confirm(message)) return;
      await Storage.removeTranslateHistory(items.map((i) => i.id));
      this.checkedIds.clear();
      this.items = await Storage.getTranslateHistory();
      this.renderList();
    });

    this.listEl.addEventListener('click', async (e) => {
      const favBtn = e.target.closest('.hw-th-fav');
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = favBtn.dataset.id;
        const updated = await Storage.toggleTranslateFavorite(id);
        const idx = this.items.findIndex((i) => i.id === id);
        if (idx >= 0 && updated) this.items[idx] = updated;
        this.renderList();
        return;
      }
      const chevronBtn = e.target.closest('.hw-th-chevron-btn');
      if (chevronBtn) {
        e.stopPropagation();
        const id = chevronBtn.dataset.id;
        this.expandedId = this.expandedId === id ? null : id;
        this.renderList();
        return;
      }
      const row = e.target.closest('.hw-th-row');
      if (!row) return;
      // The row itself now toggles selection (for bulk delete) — expanding
      // is the chevron button's job alone, handled above.
      const id = row.dataset.id;
      if (this.checkedIds.has(id)) this.checkedIds.delete(id);
      else this.checkedIds.add(id);
      this.renderList();
    });

    this.applyLabels();
  }

  applyLabels() {
    this.panel.setAttribute('aria-label', this.labels.title || '');
    this.tabHistoryBtn.title = this.labels.tabHistory || '';
    this.tabFavoriteBtn.title = this.labels.tabFavorite || '';
    this.deleteBtn.title = this.labels.clear || '';
    this.deleteToggleBtn.title = this.labels.moreDeleteOptions || '';
    this.deleteAllBtn.textContent = this.labels.deleteAll || '';
    this.closeBtn.title = this.labels.close || '';
  }

  /** Re-apply labels after a UI-language change. */
  setLabels(labels) {
    this.labels = { ...this.labels, ...labels };
    this.applyLabels();
    if (this.isOpen) this.renderList();
  }

  filteredItems() {
    const sorted = [...this.items].sort((a, b) => b.updatedAt - a.updatedAt);
    return this.tab === 'favorite' ? sorted.filter((i) => i.isFavorite) : sorted;
  }

  renderList() {
    const items = this.filteredItems();
    // Dropped items (deleted, or filtered out by a tab switch) shouldn't
    // linger as phantom selections the user can no longer see or unselect.
    const visibleIds = new Set(items.map((i) => i.id));
    for (const id of this.checkedIds) {
      if (!visibleIds.has(id)) this.checkedIds.delete(id);
    }
    // A stale open menu surviving a re-render (new translation recorded
    // while the sheet is open, a delete, a tab switch...) would point at
    // whatever counts are now wrong — simplest to just always close it here.
    this.deleteMenuEl.hidden = true;
    this.deleteToggleBtn.setAttribute('aria-expanded', 'false');

    if (!items.length) {
      const msg = this.tab === 'favorite' ? this.labels.emptyFavorite : this.labels.emptyHistory;
      this.listEl.innerHTML = `<div class="hw-th-empty">${escapeHtml(msg || '')}</div>`;
    } else {
      this.listEl.innerHTML = items.map((item) => this.renderRow(item)).join('');
    }
    this.syncSelectionUi(items);
  }

  /** The delete-group's visibility/enabled state and the "Đã chọn N" label
   * — both follow checkedIds against whatever the current tab is showing.
   * The group itself only hides when there's nothing at all to delete; the
   * primary (selection-only) segment disables on top of that once nothing
   * is selected, since "Delete all" inside the menu stays usable either way. */
  syncSelectionUi(items) {
    const checkedCount = items.filter((i) => this.checkedIds.has(i.id)).length;
    this.deleteGroupEl.hidden = items.length === 0;
    this.deleteBtn.disabled = checkedCount === 0;
    this.selectedCountEl.hidden = checkedCount === 0;
    this.selectedCountEl.textContent = checkedCount > 0
      ? (this.labels.selectedCount || '').replace('{count}', String(checkedCount))
      : '';
  }

  renderRow(item) {
    const { source, target } = rowSummary(item);
    const isExpanded = this.expandedId === item.id;
    const isSelected = this.checkedIds.has(item.id);
    return `
      <div class="hw-th-item${isExpanded ? ' is-expanded' : ''}">
        <div class="hw-th-row${isSelected ? ' is-selected' : ''}" data-id="${escapeAttr(item.id)}" role="button" tabindex="0" aria-pressed="${isSelected}">
          <span class="hw-th-col hw-th-source" title="${escapeAttr(source)}">${escapeHtml(source)}</span>
          <span class="hw-th-col hw-th-target" title="${escapeAttr(target)}">${escapeHtml(target)}</span>
          <button class="hw-th-fav${item.isFavorite ? ' is-active' : ''}" type="button" data-id="${escapeAttr(item.id)}" title="${escapeAttr(this.labels.favorite || '')}">${Icons.star(13)}</button>
          <button class="hw-th-chevron-btn" type="button" data-id="${escapeAttr(item.id)}" aria-expanded="${isExpanded}">${Icons.chevronDown(12)}</button>
        </div>
        <div class="hw-th-detail">${isExpanded ? this.renderDetail(item) : ''}</div>
      </div>
    `;
  }

  /**
   * Mirrors what the popup itself shows right after translating: a word
   * lookup renders as the full dictionary card (phonetic, senses, examples,
   * listen buttons); anything else shows the source sentence/paragraph next
   * to its translation — renderAnswer() alone would only draw the latter
   * half, so the source line is added here explicitly.
   */
  renderDetail(item) {
    const entry = parseDictionaryEntry(item.translatedRaw);
    const answerHtml = renderAnswer(item.translatedRaw, {
      allowMarkdownDict: true,
      speakLabel: this.speakLabel(),
      targetLang: item.targetLang,
    });
    if (entry) return `<div class="hw-th-detail-body hw-dict-mode">${answerHtml}</div>`;
    return `
      <div class="hw-th-detail-body">
        <div class="hw-th-detail-source">${escapeHtml(item.sourceText)}</div>
        <div class="hw-th-detail-answer">${answerHtml}</div>
      </div>
    `;
  }

  async open() {
    this.items = await Storage.getTranslateHistory();
    this.expandedId = null;
    this.checkedIds.clear();
    this.renderList();
    this.sheet.classList.add('is-open');
    this.isOpen = true;
    this.onToggle(true);
  }

  close() {
    this.sheet.classList.remove('is-open');
    this.isOpen = false;
    this.onToggle(false);
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  /** Called by the caller right after a fresh translation is recorded, so a
   * currently-open sheet picks it up without the user having to reopen it. */
  async refresh() {
    if (!this.isOpen) return;
    this.items = await Storage.getTranslateHistory();
    this.renderList();
  }
}
