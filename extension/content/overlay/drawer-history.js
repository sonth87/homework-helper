/**
 * In-Page Drawer History Panel Subcomponent
 */

import { Storage } from '../../shared/storage.js';
import { getI18n } from '../../shared/i18n.js';
import { ConversationHistoryPanel } from '../../shared/conversation-history-panel.js';

export class OverlayDrawerHistory {
  constructor(overlay) {
    this.overlay = overlay;
    this.shadow = overlay.shadow;
    this._dict = {};
    this.panel = new ConversationHistoryPanel({
      root: this.shadow,
      listElId: 'hwDrawerHistoryList',
      searchElId: 'hwDrawerHistorySearch',
      loadMoreElId: 'hwDrawerHistoryLoadMore',
      getDict: () => this._dict,
      onSelect: async (convId) => {
        await Storage.switchConversation(convId);
        this.shadow.getElementById('hwDrawerHistoryPanel').style.display = 'none';
        this.overlay.drawer.loadInitialHistory();
      },
      onMutate: () => this.overlay.drawer.loadInitialHistory(),
    });
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
    const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
    this._dict = getI18n(uiLanguage);
    await this.panel.open();
  }
}
