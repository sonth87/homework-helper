/**
 * In-Page Drawer History Panel Subcomponent
 */

import { Icons } from '../../shared/icons.js';
import { Storage } from '../../shared/storage.js';
import { getI18n } from '../../shared/i18n.js';

export class OverlayDrawerHistory {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this.init();
  }

  init() {
    const s = this.shadow;

    s.getElementById('hwBtnDrawerNewChat')?.addEventListener('click', async () => {
      const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
      const dict = getI18n(uiLanguage);
      await Storage.createNewConversation(dict.newChat || 'Đoạn chat mới');
      s.getElementById('hwDrawerHistoryPanel').style.display = 'none';
      s.getElementById('hwTextarea').value = '';
      this.overlay.drawer.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      await this.overlay.drawer.loadInitialHistory();
      this.overlay.showToast(dict.toastNewChat || 'Đã bắt đầu đoạn chat mới');
      setTimeout(() => s.getElementById('hwTextarea').focus(), 100);
    });

    s.getElementById('hwBtnDrawerAddConv')?.addEventListener('click', async () => {
      const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
      const dict = getI18n(uiLanguage);
      await Storage.createNewConversation(dict.newChat || 'Đoạn chat mới');
      s.getElementById('hwDrawerHistoryPanel').style.display = 'none';
      s.getElementById('hwTextarea').value = '';
      this.overlay.drawer.attachedImageBase64 = null;
      s.getElementById('hwImgPreviewRow').style.display = 'none';
      await this.overlay.drawer.loadInitialHistory();
      this.overlay.showToast(dict.toastNewChat || 'Đã bắt đầu đoạn chat mới');
      setTimeout(() => s.getElementById('hwTextarea').focus(), 100);
    });

    s.getElementById('hwBtnDrawerHistory')?.addEventListener('click', () => {
      const panel = s.getElementById('hwDrawerHistoryPanel');
      const isVisible = panel.style.display === 'flex';
      if (isVisible) {
        panel.style.display = 'none';
      } else {
        panel.style.display = 'flex';
        this.render();
      }
    });

    s.getElementById('hwBtnCloseDrawerHistory')?.addEventListener('click', () => {
      s.getElementById('hwDrawerHistoryPanel').style.display = 'none';
    });
  }

  async render() {
    const conversations = await Storage.getConversations();
    const { activeConversationId, uiLanguage = 'en' } = await Storage.get(['activeConversationId', 'uiLanguage']);
    const dict = getI18n(uiLanguage);
    const listEl = this.shadow.getElementById('hwDrawerHistoryList');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (conversations.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:32px 10px; color:var(--hw-text-muted); font-size:13px;">
          ${dict.emptyHistory || 'No conversations saved yet.<br>Start a new chat to begin!'}
        </div>
      `;
      return;
    }

    [...conversations].reverse().forEach((conv) => {
      const el = document.createElement('div');
      el.className = `hw-card-history-item ${conv.id === activeConversationId ? 'active' : ''}`;

      let thumbHtml = conv.thumbnail
        ? `<img src="${conv.thumbnail}" class="hw-card-history-thumb" alt="thumb">`
        : `<div class="hw-card-history-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--hw-accent);background:var(--hw-accent-tint);">${Icons.fileText(18)}</div>`;

      const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const msgCount = conv.messages?.length || 0;

      el.innerHTML = `
        ${thumbHtml}
        <div class="hw-card-history-info">
          <div class="hw-card-history-title">${conv.title || dict.newChat || 'Untitled Chat'}</div>
          <div class="hw-card-history-time">${Icons.clock(11)} ${dateStr} &bull; ${msgCount} msgs</div>
        </div>
        <button class="hw-icon-btn hw-btn-del-conv" title="Delete" style="width:24px;height:24px;color:var(--hw-text-muted);flex-shrink:0;">
          ${Icons.trash(13)}
        </button>
      `;

      el.querySelector('.hw-btn-del-conv').addEventListener('click', async (e) => {
        e.stopPropagation();
        await Storage.deleteConversation(conv.id);
        this.render();
        this.overlay.drawer.loadInitialHistory();
      });

      el.addEventListener('click', async () => {
        await Storage.switchConversation(conv.id);
        this.shadow.getElementById('hwDrawerHistoryPanel').style.display = 'none';
        this.overlay.drawer.loadInitialHistory();
      });

      listEl.appendChild(el);
    });
  }
}
