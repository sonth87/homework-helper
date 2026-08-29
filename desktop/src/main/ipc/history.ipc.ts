import { ipcMain } from 'electron';
import { openDatabase } from '../db/connection';
import { ConversationRepo } from '../db/repositories/conversation.repo';
import type { Intent } from '@shared/types/intent';
import type { SettingsService } from '../settings/settings.service';
import { logger } from '../logging/logger';

let repo: ConversationRepo | null = null;
const store = () => (repo ??= new ConversationRepo(openDatabase()));

export function registerHistoryIpc(settings: SettingsService): void {
  ipcMain.handle('history:list', (_e, { limit, offset }: { limit?: number; offset?: number } = {}) =>
    store().list(limit ?? 50, offset ?? 0),
  );

  ipcMain.handle('history:messages', (_e, { id }: { id: string }) => store().messages(id));

  ipcMain.handle('history:create', (_e, { intent, title, thumbnail }: { intent: Intent; title: string; thumbnail?: string }) =>
    store().create(intent, title, thumbnail),
  );

  ipcMain.handle('history:addMessage', (_e, p: { id: string; role: 'user' | 'assistant'; content: string; image?: string }) => {
    // Người dùng tắt lưu lịch sử thì bỏ qua im lặng — không phải lỗi.
    if (!settings.get().saveHistory) return;
    store().addMessage(p.id, p.role, p.content, p.image);
  });

  ipcMain.handle('history:delete', (_e, { id }: { id: string }) => store().delete(id));
  ipcMain.handle('history:clear', () => store().clear());
}

/**
 * Dọn hội thoại cũ lúc khởi động, không phải sau mỗi lần ghi — dọn dẹp không
 * nên nằm trên đường đi của thao tác người dùng.
 */
export function pruneHistory(settings: SettingsService): void {
  const current = settings.get();
  try {
    const removed = store().prune(current.maxConversations, current.historyRetentionDays);
    if (removed > 0) logger.info('Đã dọn hội thoại cũ', { removed });
  } catch (error) {
    logger.warn('Không dọn được lịch sử', error);
  }
}
