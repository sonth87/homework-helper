/**
 * Cache dịch — CHỈ phạm vi Lane A (Google Translate), theo đúng thiết kế đã
 * chốt cho lane này trong roadmap/known-issues.md. Mở rộng khoá cache cho
 * Lane B (model/studyMode/provider) là việc CHỦ ĐỘNG HOÃN LẠI, bàn sau khi
 * xong toàn bộ desktop app — không tự ý mở rộng schema ở đây.
 *
 * Khoá: text đã chuẩn hoá + source_lang + target_lang. Đủ cho Google Translate
 * vì chỉ có một "provider" cố định, không có lựa chọn model.
 */

import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export type CacheHit = { translatedText: string; sourceLanguage: string };

export class CacheRepo {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  private hash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  /** `null` nếu miss hoặc đã hết hạn (TTL kiểm tra ở tầng gọi, xem translate.service.ts). */
  get(text: string, sourceLang: string, targetLang: string): (CacheHit & { createdAt: number }) | null {
    const row = this.db
      .prepare('SELECT translated, source_lang, created_at FROM translation_cache WHERE source_hash = ? AND source_lang = ? AND target_lang = ?')
      .get(this.hash(text), sourceLang, targetLang) as { translated: string; source_lang: string; created_at: number } | undefined;

    if (!row) return null;

    this.db
      .prepare('UPDATE translation_cache SET hit_count = hit_count + 1 WHERE source_hash = ? AND source_lang = ? AND target_lang = ?')
      .run(this.hash(text), sourceLang, targetLang);

    return { translatedText: row.translated, sourceLanguage: row.source_lang, createdAt: row.created_at };
  }

  set(text: string, sourceLang: string, targetLang: string, translated: string): void {
    this.db
      .prepare(
        `INSERT INTO translation_cache (source_hash, source_lang, target_lang, source_text, translated, created_at, hit_count)
         VALUES (?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT (source_hash, source_lang, target_lang)
         DO UPDATE SET translated = excluded.translated, created_at = excluded.created_at, hit_count = 0`,
      )
      .run(this.hash(text), sourceLang, targetLang, text, translated, Date.now());
  }

  /** Xoá bản ghi quá hạn hoặc vượt số lượng tối đa — gọi lúc khởi động, không sau mỗi lần ghi. */
  prune(ttlMs: number, maxEntries: number): number {
    let removed = 0;
    const cutoff = Date.now() - ttlMs;
    removed += Number(this.db.prepare('DELETE FROM translation_cache WHERE created_at < ?').run(cutoff).changes);

    const countRow = this.db.prepare('SELECT COUNT(*) AS c FROM translation_cache').get() as { c: number };
    if (countRow.c > maxEntries) {
      // Xoá bản ghi cũ nhất, ít dùng nhất trước — ưu tiên giữ lại cache còn giá trị.
      // Dùng `rowid` (SQLite tự có, kể cả với PRIMARY KEY dạng tổ hợp) thay vì
      // source_hash: hash một mình không duy nhất khi cùng text nhưng khác cặp
      // ngôn ngữ — lọc theo hash sẽ xoá nhầm nhiều dòng hơn dự tính.
      removed += Number(
        this.db
          .prepare(
            `DELETE FROM translation_cache WHERE rowid IN (
               SELECT rowid FROM translation_cache
               ORDER BY hit_count ASC, created_at ASC
               LIMIT ?
             )`,
          )
          .run(countRow.c - maxEntries).changes,
      );
    }
    return removed;
  }
}
