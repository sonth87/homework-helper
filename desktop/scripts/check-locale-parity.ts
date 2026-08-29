/**
 * So bộ locale của desktop với bộ locale của extension.
 *
 * CHỈ CẢNH BÁO, KHÔNG ÉP ĐỒNG BỘ. Hai app cố ý tách biệt (ADR-0001) và hai bộ
 * locale ĐƯỢC PHÉP khác nhau về nội dung — desktop có ngữ cảnh màn hình,
 * extension có ngữ cảnh trang web.
 *
 * Mục đích: khi một khoá tồn tại ở extension mà desktop chưa có, đó có thể là
 * thiếu sót, cũng có thể là chủ ý. Script chỉ nêu để người viết code quyết định.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const DESKTOP = join(import.meta.dirname, '../src/shared/i18n/locales');
const EXTENSION = join(ROOT, 'extension/shared/i18n/locales');

const GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', OFF = '\x1b[0m';

if (!existsSync(EXTENSION)) {
  console.log(`${DIM}Không tìm thấy locale của extension — bỏ qua.${OFF}`);
  process.exit(0);
}

const localesOf = (dir: string, ext: string) =>
  readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length));

const desktop = localesOf(DESKTOP, '.ts');
const extension = localesOf(EXTENSION, '.js');

console.log(`${DIM}Desktop: ${desktop.length}/13 locale · Extension: ${extension.length}/13 locale${OFF}\n`);

const missing = extension.filter((l) => !desktop.includes(l));
if (missing.length) {
  console.log(`${YELLOW}Desktop chưa có ${missing.length} locale:${OFF} ${missing.join(', ')}`);
  console.log(`${DIM}Bình thường trong Phase 0 — bổ sung dần khi UI hoàn thiện.${OFF}\n`);
}

// Đếm khoá để thấy độ chênh về quy mô, không so từng khoá (hai bộ khác nhau về bản chất).
const countKeys = (file: string) =>
  new Set([...readFileSync(file, 'utf8').matchAll(/([a-zA-Z0-9_]+):\s*['"`]/g)].map((m) => m[1])).size;

if (desktop.includes('en') && extension.includes('en')) {
  const d = countKeys(join(DESKTOP, 'en.ts'));
  const e = countKeys(join(EXTENSION, 'en.js'));
  console.log(`Số khoá (en): desktop ${d} · extension ${e}`);
  console.log(`${DIM}Hai con số này KHÔNG cần bằng nhau. Desktop chỉ khai báo khoá cho`);
  console.log(`phần UI đã dựng; extension đã hoàn chỉnh nên nhiều hơn là đương nhiên.${OFF}`);
}

console.log(`\n${GREEN}✓ Kiểm tra xong (chỉ cảnh báo, không chặn build).${OFF}`);
