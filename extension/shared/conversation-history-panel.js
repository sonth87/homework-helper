/**
 * Shared conversation-history list rendering — search, "load more"
 * pagination, and hover-revealed rename/delete (with confirm) — used by all
 * three surfaces that browse saved conversations: the side panel's history
 * modal, the in-page drawer's history panel, and the floating card's
 * history panel. Each surface previously carried its own near-identical
 * copy of this render loop; one shared implementation means a change here
 * (like adding rename/search/pagination) touches one file instead of three.
 */
import { Icons } from './icons.js';
import { Storage } from './storage.js';

const PAGE_SIZE = 20;

export class ConversationHistoryPanel {
  /**
   * @param {object} opts
   * @param {Document|ShadowRoot} opts.root - queried with getElementById
   * @param {string} opts.listElId
   * @param {string} [opts.searchElId] - omit to skip the search box
   * @param {string} [opts.loadMoreElId] - omit to skip pagination (renders the full list)
   * @param {(dict: object) => object} opts.getDict - resolves the current i18n dict on demand (language can change between opens)
   * @param {(convId: string, conv: object) => void} opts.onSelect
   * @param {() => void} [opts.onMutate] - called after a delete/rename commits, in addition to this panel's own re-render
   * @param {string} [opts.itemClass]
   * @param {string} [opts.thumbClass]
   * @param {string} [opts.infoClass]
   * @param {string} [opts.titleClass]
   * @param {string} [opts.timeClass]
   * @param {string} [opts.iconBtnClass]
   */
  constructor(opts) {
    this.opts = {
      itemClass: 'hw-card-history-item',
      thumbClass: 'hw-card-history-thumb',
      infoClass: 'hw-card-history-info',
      titleClass: 'hw-card-history-title',
      timeClass: 'hw-card-history-time',
      iconBtnClass: 'hw-icon-btn',
      ...opts,
    };
    this._visibleCount = PAGE_SIZE;
    this._query = '';
    this._editingId = null;
    this._renderToken = 0;
  }

  /** Call each time the panel is opened — resets search/pagination state. */
  async open() {
    this._visibleCount = PAGE_SIZE;
    this._query = '';
    this._editingId = null;

    const searchEl = this.opts.searchElId ? this.opts.root.getElementById(this.opts.searchElId) : null;
    if (searchEl) {
      searchEl.value = '';
      searchEl.placeholder = this.opts.getDict().historySearchPlaceholder || 'Search conversations...';
      if (!searchEl._hwHistoryWired) {
        searchEl._hwHistoryWired = true;
        searchEl.addEventListener('input', () => {
          this._query = searchEl.value.trim().toLowerCase();
          this._visibleCount = PAGE_SIZE;
          this.refresh();
        });
      }
    }

    await this.refresh();
  }

  async refresh() {
    const myToken = ++this._renderToken;
    const { root, listElId, loadMoreElId } = this.opts;
    const listEl = root.getElementById(listElId);
    if (!listEl) return;

    const [conversations, { activeConversationId }] = await Promise.all([
      Storage.getConversations(),
      Storage.get(['activeConversationId']),
    ]);
    if (myToken !== this._renderToken) return;

    const dict = this.opts.getDict();
    const sorted = [...conversations].reverse(); // most recent first
    const filtered = this._query
      ? sorted.filter((c) => (c.title || '').toLowerCase().includes(this._query))
      : sorted;

    listEl.innerHTML = '';

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:32px 10px; color:var(--hw-text-muted,#94a3b8); font-size:13px;">
          ${this._query
            ? (dict.historyNoResults || 'No matching conversations.')
            : (dict.emptyHistory || 'No conversations saved yet.<br>Start a new chat to begin!')}
        </div>
      `;
      const loadMoreEl = loadMoreElId ? root.getElementById(loadMoreElId) : null;
      if (loadMoreEl) loadMoreEl.style.display = 'none';
      return;
    }

    const page = this.opts.loadMoreElId ? filtered.slice(0, this._visibleCount) : filtered;
    page.forEach((conv) => this._renderRow(listEl, conv, activeConversationId, dict));

    const loadMoreEl = this.opts.loadMoreElId ? root.getElementById(this.opts.loadMoreElId) : null;
    if (loadMoreEl) {
      const remaining = filtered.length - this._visibleCount;
      if (remaining > 0) {
        loadMoreEl.style.display = 'block';
        loadMoreEl.textContent = `${dict.historyLoadMore || 'Load more'} (${remaining})`;
        if (!loadMoreEl._hwHistoryWired) {
          loadMoreEl._hwHistoryWired = true;
          loadMoreEl.addEventListener('click', () => {
            this._visibleCount += PAGE_SIZE;
            this.refresh();
          });
        }
      } else {
        loadMoreEl.style.display = 'none';
      }
    }
  }

  _renderRow(listEl, conv, activeConversationId, dict) {
    const { itemClass, thumbClass, infoClass, titleClass, timeClass, iconBtnClass, onSelect, onMutate } = this.opts;

    const el = document.createElement('div');
    el.className = `${itemClass} ${conv.id === activeConversationId ? 'active' : ''}`;
    el.style.position = 'relative';

    const thumbHtml = conv.thumbnail
      ? `<img src="${conv.thumbnail}" class="${thumbClass}" alt="thumb">`
      : `<div class="${thumbClass}" style="display:flex;align-items:center;justify-content:center;color:var(--hw-accent,#0284c7);background:var(--hw-accent-tint,#e0f2fe);">${Icons.fileText(18)}</div>`;

    const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const msgCount = conv.messages?.length || 0;
    const isEditing = this._editingId === conv.id;

    const titleHtml = isEditing
      ? `<input type="text" class="hw-history-rename-input" value="${(conv.title || '').replace(/"/g, '&quot;')}"
           style="width:100%; box-sizing:border-box; font-size:12.5px; font-weight:600; border:1px solid var(--hw-accent,#0284c7); border-radius:4px; padding:2px 5px; background:transparent; color:inherit; font-family:inherit;">`
      : `<div class="${titleClass}">${conv.title || dict.newChat || 'Untitled Chat'}</div>`;

    el.innerHTML = `
      ${thumbHtml}
      <div class="${infoClass}" style="min-width:0; flex:1;">
        ${titleHtml}
        <div class="${timeClass}">${Icons.clock(11)} ${dateStr} &bull; ${msgCount} ${dict.historyMsgsLabel || 'msgs'}</div>
      </div>
      <div class="hw-history-row-actions" style="display:flex; gap:2px; flex-shrink:0;">
        <button class="${iconBtnClass} hw-btn-rename-conv" title="${dict.historyRenameTooltip || 'Rename'}" style="width:24px;height:24px;color:var(--hw-text-muted,#94a3b8);">
          ${Icons.edit(13)}
        </button>
        <button class="${iconBtnClass} hw-btn-del-conv" title="${dict.historyDeleteTooltip || 'Delete'}" style="width:24px;height:24px;color:var(--hw-text-muted,#94a3b8);">
          ${Icons.trash(13)}
        </button>
      </div>
    `;

    if (isEditing) {
      const input = el.querySelector('.hw-history-rename-input');
      // refresh() (called by Escape below) removes this input from the DOM,
      // which itself fires a native blur — without this flag that blur
      // would run commit() and save the rename right after Escape asked to
      // cancel it.
      let cancelled = false;
      const commit = async () => {
        if (cancelled) return;
        this._editingId = null;
        const val = input.value;
        await Storage.renameConversation(conv.id, val);
        await this.refresh();
        onMutate?.();
      };
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          input.blur();
        } else if (e.key === 'Escape') {
          cancelled = true;
          this._editingId = null;
          this.refresh();
        }
      });
      input.addEventListener('blur', commit, { once: true });
      setTimeout(() => { input.focus(); input.select(); }, 0);
    } else {
      el.querySelector('.hw-btn-rename-conv').addEventListener('click', (e) => {
        e.stopPropagation();
        this._editingId = conv.id;
        this.refresh();
      });
    }

    el.querySelector('.hw-btn-del-conv').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!window.confirm(dict.historyDeleteConfirm || "Delete this conversation? This can't be undone.")) return;
      await Storage.deleteConversation(conv.id);
      await this.refresh();
      onMutate?.();
    });

    el.addEventListener('click', () => {
      if (this._editingId === conv.id) return;
      onSelect(conv.id, conv);
    });

    listEl.appendChild(el);
  }
}
