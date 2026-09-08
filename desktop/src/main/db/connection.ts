/**
 * Kết nối SQLite qua `node:sqlite` — module DỰNG SẴN trong Node 22.5+.
 *
 * VÌ SAO KHÔNG DÙNG better-sqlite3
 * --------------------------------
 * Kế hoạch ban đầu dự tính better-sqlite3 và đã ghi nhận rủi ro "native module
 * làm vỡ packaging & auto-update". Thực tế còn tệ hơn dự tính:
 *   - better-sqlite3@11 kéo theo node-gyp@9, vốn dùng `distutils` — đã bị xoá
 *     khỏi Python 3.12. Máy có Python 3.13 nên build thất bại ngay.
 *   - better-sqlite3@13 cài được nhưng đòi Node >= 22, còn Electron 33 chỉ có
 *     Node 20.18 → nạp vào Electron là crash im lặng vì lệch ABI.
 *
 * Nâng Electron lên 37 (Node 22.21) làm `node:sqlite` khả dụng, và nó xoá bỏ
 * toàn bộ lớp rủi ro đó: không native module, không electron-rebuild, không
 * node-gyp, không phụ thuộc Python. Xem dev/decisions/0005-dung-node-sqlite.md.
 */

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { app } from 'electron';
import { APP } from '@config/app.config';
import { runMigrations } from './migrations';
import { logger } from '../logging/logger';

let db: DatabaseSync | null = null;

export function openDatabase(): DatabaseSync {
  if (db) return db;

  const file = join(app.getPath('userData'), APP.dbFile);
  mkdirSync(dirname(file), { recursive: true });

  db = new DatabaseSync(file);

  // WAL cho phép đọc trong lúc ghi — cần thiết vì cache dịch ghi liên tục
  // trong khi UI vẫn đang đọc lịch sử.
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  // NORMAL đủ an toàn với WAL và nhanh hơn FULL đáng kể cho ghi nhỏ, nhiều.
  db.exec('PRAGMA synchronous = NORMAL');

  const applied = runMigrations(db);
  if (applied.length) logger.info('Đã chạy migration', { applied });

  return db;
}

export function closeDatabase(): void {
  db?.close();
  db = null;
}

/**
 * GHI CHÚ PHIÊN BẢN
 * -----------------
 * `node:sqlite` cần Node >= 22.5. Có hai phiên bản Node liên quan, đừng nhầm:
 *
 *   - Node CỦA ELECTRON (22.21 ở Electron 37): quyết định app chạy được không.
 *     Được đóng gói kèm, KHÔNG phụ thuộc Node cài trên máy.
 *   - Node HỆ THỐNG: chỉ dùng cho công cụ dev (vite, tsx, eslint) và các script
 *     kiểm tra. Muốn tự mở file .db bằng `node -e` thì máy cũng cần >= 22.5.
 *
 * Vì vậy `engines` trong package.json và .nvmrc yêu cầu >= 22.5 — không phải vì
 * app cần, mà để công cụ dev nhất quán với runtime.
 */
