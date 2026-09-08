/**
 * Hội thoại và tin nhắn.
 *
 * Khác extension ở hai điểm đáng kể:
 *   - Extension giữ tối đa 50 hội thoại trong chrome.storage vì đó là giới hạn
 *     thực tế của nó. Ở đây SQLite không có ràng buộc đó, nên giới hạn là tuỳ
 *     chọn của người dùng (storage.settings) chứ không phải hằng số kỹ thuật.
 *   - Tin nhắn nằm ở bảng riêng, xoá theo CASCADE. Extension nhét cả mảng
 *     messages vào một bản ghi JSON, nên mỗi lần thêm một tin nhắn là ghi lại
 *     toàn bộ cuộc hội thoại.
 */

import type { DatabaseSync } from 'node:sqlite';
import type { Intent } from '@shared/types/intent';

export type ConversationRow = {
  id: string;
  title: string;
  intent: Intent;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
};

export type MessageRow = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  createdAt: number;
};

export class ConversationRepo {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  create(intent: Intent, title: string, thumbnail?: string): string {
    const id = `cv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    this.db
      .prepare('INSERT INTO conversations (id, title, intent, created_at, updated_at, thumbnail) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, title, intent, now, now, thumbnail ?? null);
    return id;
  }

  list(limit = 50, offset = 0): ConversationRow[] {
    const rows = this.db
      .prepare('SELECT id, title, intent, created_at, updated_at, thumbnail FROM conversations ORDER BY updated_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as Record<string, string | number | null>[];
    return rows.map(toConversation);
  }

  messages(conversationId: string): MessageRow[] {
    const rows = this.db
      .prepare('SELECT id, role, content, image, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at, id')
      .all(conversationId) as Record<string, string | number | null>[];

    return rows.map((r) => ({
      id: Number(r.id),
      role: r.role as 'user' | 'assistant',
      content: String(r.content),
      ...(r.image ? { image: String(r.image) } : {}),
      createdAt: Number(r.created_at),
    }));
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string, image?: string): void {
    const now = Date.now();
    this.db
      .prepare('INSERT INTO messages (conversation_id, role, content, image, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(conversationId, role, content, image ?? null, now);
    this.db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);
  }

  rename(id: string, title: string): void {
    this.db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, id);
  }

  delete(id: string): void {
    // Tin nhắn tự xoá theo ON DELETE CASCADE trong 001-init.
    this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  }

  clear(): void {
    this.db.exec('DELETE FROM conversations');
  }

  /**
   * Xoá hội thoại vượt quá giới hạn người dùng đặt, và hội thoại quá hạn lưu.
   * Gọi lúc khởi động, không gọi sau mỗi lần ghi — dọn dẹp không nên nằm trên
   * đường đi của thao tác người dùng.
   */
  prune(maxConversations: number, retentionDays: number): number {
    let removed = 0;

    if (retentionDays > 0) {
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      const result = this.db.prepare('DELETE FROM conversations WHERE updated_at < ?').run(cutoff);
      removed += Number(result.changes);
    }

    if (maxConversations > 0) {
      const result = this.db
        .prepare('DELETE FROM conversations WHERE id NOT IN (SELECT id FROM conversations ORDER BY updated_at DESC LIMIT ?)')
        .run(maxConversations);
      removed += Number(result.changes);
    }

    return removed;
  }
}

function toConversation(r: Record<string, string | number | null>): ConversationRow {
  return {
    id: String(r.id),
    title: String(r.title),
    intent: r.intent as Intent,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    ...(r.thumbnail ? { thumbnail: String(r.thumbnail) } : {}),
  };
}
