/**
 * Chat History Modal & Session Parser for SidePanel
 */

import { Storage } from '../shared/storage.js';
import { getI18n } from '../shared/i18n.js';
import { ConversationHistoryPanel } from '../shared/conversation-history-panel.js';

export class SidePanelHistory {
  constructor(controller) {
    this.controller = controller;
    this._dict = {};
    this.panel = new ConversationHistoryPanel({
      root: document,
      listElId: 'spHistoryModalBody',
      searchElId: 'spHistorySearch',
      loadMoreElId: 'spHistoryLoadMore',
      getDict: () => this._dict,
      itemClass: 'sp-history-item',
      thumbClass: 'sp-history-thumb',
      infoClass: 'sp-history-info',
      titleClass: 'sp-history-title',
      timeClass: 'sp-history-time',
      iconBtnClass: 'sp-icon-btn',
      onSelect: async (convId) => {
        await Storage.switchConversation(convId);
        document.getElementById('spHistoryModal').style.display = 'none';
        this.controller.loadChatHistory();
      },
      onMutate: () => this.controller.loadChatHistory(),
    });
  }

  async open() {
    const modal = document.getElementById('spHistoryModal');
    const body = document.getElementById('spHistoryModalBody');
    if (!modal || !body) return;

    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    this._dict = getI18n(uiLanguage);

    modal.style.display = 'flex';
    body.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted);">${this._dict.loadingHistory || 'Loading conversations...'}</div>`;

    await this.panel.open();
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
