/**
 * Đọc/ghi cấu hình trong SQLite, dạng khoá-giá trị.
 *
 * Mỗi setting một dòng, giá trị là JSON. Không dùng một cột cho mỗi setting —
 * nếu vậy thì thêm một tuỳ chọn lại phải viết migration, đúng thứ mà cơ chế
 * defineSettings sinh ra để tránh.
 */

import type { DatabaseSync } from 'node:sqlite';

export class SettingsRepo {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  readAll(): Record<string, unknown> {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const out: Record<string, unknown> = {};

    for (const { key, value } of rows) {
      try {
        out[key] = JSON.parse(value);
      } catch {
        // Một dòng hỏng không được phép làm mất toàn bộ cấu hình — bỏ qua nó,
        // migrate sẽ điền lại giá trị mặc định.
      }
    }
    return out;
  }

  writeAll(settings: Record<string, unknown>): void {
    const upsert = this.db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    );

    this.db.exec('BEGIN');
    try {
      for (const [key, value] of Object.entries(settings)) {
        upsert.run(key, JSON.stringify(value));
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /** Xoá khoá không còn trong schema — gọi sau khi migrate phát hiện `removed`. */
  deleteKeys(keys: readonly string[]): void {
    if (keys.length === 0) return;
    const stmt = this.db.prepare('DELETE FROM settings WHERE key = ?');
    for (const key of keys) stmt.run(key);
  }
}
