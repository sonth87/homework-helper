/**
 * Chat History Modal & Session Parser for SidePanel
 */

import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';
import { getI18n } from '../shared/i18n.js';

export class SidePanelHistory {
  constructor(controller) {
    this.controller = controller;
  }

  async open() {
    const modal = document.getElementById('spHistoryModal');
    const body = document.getElementById('spHistoryModalBody');
    if (!modal || !body) return;

    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    const dict = getI18n(uiLanguage);

    modal.style.display = 'flex';
    body.innerHTML = `<div style="text-align:center; padding:16px; color:#94a3b8;">${dict.loadingHistory || 'Loading conversations...'}</div>`;

    const conversations = await Storage.getConversations();
    const { activeConversationId } = await Storage.get(['activeConversationId']);

    if (conversations.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; padding:32px 10px; color:#94a3b8; font-size:13px;">
          ${dict.emptyHistory || 'No conversations saved yet.<br>Start a new chat to begin!'}
        </div>
      `;
      return;
    }

    body.innerHTML = '';
    [...conversations].reverse().forEach((conv) => {
      const el = document.createElement('div');
      el.className = `sp-history-item ${conv.id === activeConversationId ? 'active' : ''}`;

      let thumbHtml = conv.thumbnail
        ? `<img src="${conv.thumbnail}" class="sp-history-thumb" alt="thumb">`
        : `<div class="sp-history-thumb" style="display:flex;align-items:center;justify-content:center;color:#0284c7;background:#e0f2fe;">${Icons.fileText(20)}</div>`;

      const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const msgCount = conv.messages?.length || 0;

      el.innerHTML = `
        ${thumbHtml}
        <div class="sp-history-info">
          <div class="sp-history-title">${conv.title || dict.newChat || 'Untitled Chat'}</div>
          <div class="sp-history-time">${Icons.clock(12)} ${dateStr} &bull; ${msgCount} msgs</div>
        </div>
        <button class="sp-icon-btn sp-btn-del-conv" title="Delete" style="width:26px;height:26px;color:#94a3b8;flex-shrink:0;">
          ${Icons.trash(13)}
        </button>
      `;

      el.querySelector('.sp-btn-del-conv').addEventListener('click', async (e) => {
        e.stopPropagation();
        await Storage.deleteConversation(conv.id);
        this.open();
        this.controller.loadChatHistory();
      });

      el.addEventListener('click', async () => {
        await Storage.switchConversation(conv.id);
        modal.style.display = 'none';
        this.controller.loadChatHistory();
      });

      body.appendChild(el);
    });
  }

  parseHistorySessions(history) {
    const sessions = [];
    let current = null;

    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      if (msg.role === 'user') {
        current = {
          user: msg,
          assistant: null,
          timestamp: msg.timestamp || Date.now(),
        };
        sessions.push(current);
      } else if (msg.role === 'assistant') {
        if (current && !current.assistant) {
          current.assistant = msg;
        } else {
          sessions.push({
            user: { role: 'user', content: msg.content ? msg.content.slice(0, 60) : 'Solved Question' },
            assistant: msg,
            timestamp: msg.timestamp || Date.now(),
          });
        }
      }
    }
    return sessions;
  }
}
