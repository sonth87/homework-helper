/**
 * Bảo đảm MỌI khoá i18n dùng trong config/settings/ đều có bản dịch ở CẢ 13 locale.
 *
 * Đây là bản cưỡng chế tự động cho quy tắc §1 của CLAUDE.md — biến checklist thủ
 * công thành lệnh có kết quả đúng/sai rõ ràng. Chặn build khi thiếu.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const LOCALE_DIR = join(process.cwd(), 'src/shared/i18n/locales');
const SETTINGS_DIR = join(process.cwd(), 'config/settings');
const EXPECTED_LOCALES = [
  'en', 'vi', 'th', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'id', 'ru',
];

const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';

/** Đọc khoá bằng regex thay vì import — script chạy được cả khi TS đang lỗi. */
function keysOf(file: string): Set<string> {
  const body = readFileSync(file, 'utf8');
  return new Set([...body.matchAll(/([a-zA-Z0-9_]+):\s*['"`]/g)].map((m) => m[1] as string));
}

const required = new Set<string>();
for (const file of readdirSync(SETTINGS_DIR)) {
  if (!file.endsWith('.settings.ts')) continue;
  const body = readFileSync(join(SETTINGS_DIR, file), 'utf8');
  for (const m of body.matchAll(/i18n(?:Desc)?:\s*'([a-zA-Z0-9_]+)'/g)) required.add(m[1] as string);
}

const present = new Set(
  readdirSync(LOCALE_DIR).filter((f) => f.endsWith('.ts')).map((f) => f.replace(/\.ts$/, '')),
);

let failed = false;
console.log(`${DIM}${required.size} khoá i18n dùng trong config/settings/${OFF}\n`);

for (const locale of EXPECTED_LOCALES) {
  if (!present.has(locale)) {
    console.log(`${RED}✗${OFF} ${locale} ${DIM}— chưa có file locale${OFF}`);
    failed = true;
    continue;
  }
  const have = keysOf(join(LOCALE_DIR, `${locale}.ts`));
  const missing = [...required].filter((k) => !have.has(k));
  if (missing.length === 0) {
    console.log(`${GREEN}✓${OFF} ${locale}`);
  } else {
    console.log(`${RED}✗${OFF} ${locale} ${DIM}— thiếu ${missing.length}:${OFF} ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''}`);
    failed = true;
  }
}

console.log();
if (failed) {
  console.log(`${RED}Có locale thiếu khoá.${OFF}`);
  process.exit(1);
}
console.log(`${GREEN}Đủ 13 locale, không thiếu khoá nào.${OFF}`);
