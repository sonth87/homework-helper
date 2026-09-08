/**
 * Migration runner.
 *
 * Migration đánh số tăng dần, chạy đúng một lần, trong một transaction. Số
 * migration đã chạy lưu bằng `PRAGMA user_version` — không cần bảng riêng.
 */

import type { DatabaseSync } from 'node:sqlite';
import { migration001 } from './001-init';

export type Migration = { version: number; name: string; up: string };

const MIGRATIONS: readonly Migration[] = [migration001];

export function runMigrations(db: DatabaseSync): string[] {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number } | undefined;
  const current = row?.user_version ?? 0;
  const applied: string[] = [];

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;

    // Mỗi migration là một transaction: hỏng giữa chừng thì không để lại
    // schema nửa vời.
    db.exec('BEGIN');
    try {
      db.exec(migration.up);
      db.exec(`PRAGMA user_version = ${migration.version}`);
      db.exec('COMMIT');
      applied.push(migration.name);
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${migration.name} thất bại: ${String(error)}`);
    }
  }

  return applied;
}
