#!/usr/bin/env node
/**
 * Kiểm tra tính đồng bộ của 13 file locale trong extension.
 *
 * Bắt hai lỗi mà `grep -c` thủ công dễ bỏ sót:
 *   1. Key có ở locale này nhưng thiếu ở locale khác.
 *   2. Key tồn tại nhưng giá trị vẫn y hệt tiếng Anh (dịch sót).
 *
 * `en.js` là locale tham chiếu — mọi locale khác phải có đúng bộ key của nó.
 *
 * Dùng:
 *   node scripts/check-i18n-parity.mjs            # báo cáo đầy đủ
 *   node scripts/check-i18n-parity.mjs --key=abc  # chỉ kiểm tra một key
 *   node scripts/check-i18n-parity.mjs --strict   # thoát mã 1 khi thiếu key (cho CI)
 */

import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_DIR = join(ROOT, 'extension/shared/i18n/locales');
const REFERENCE = 'en';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const onlyKey = args.find((a) => a.startsWith('--key='))?.slice(6) ?? null;

const RED = '\x1b[31m', YELLOW = '\x1b[33m', GREEN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';

async function loadLocales() {
  const files = readdirSync(LOCALE_DIR).filter((f) => f.endsWith('.js'));
  const out = {};
  for (const file of files) {
    const url = pathToFileURL(join(LOCALE_DIR, file)).href;
    out[file.replace(/\.js$/, '')] = (await import(url)).default;
  }
  return out;
}

const locales = await loadLocales();
const names = Object.keys(locales).sort();

if (!locales[REFERENCE]) {
  console.error(`${RED}Không tìm thấy locale tham chiếu "${REFERENCE}".${OFF}`);
  process.exit(1);
}

const blocks = Object.keys(locales[REFERENCE]);
let missingCount = 0;
let untranslatedCount = 0;

console.log(`${DIM}Locale: ${names.length} · Khối: ${blocks.join(', ')} · Tham chiếu: ${REFERENCE}${OFF}\n`);

for (const block of blocks) {
  const refKeys = Object.keys(locales[REFERENCE][block] ?? {});
  const keys = onlyKey ? refKeys.filter((k) => k === onlyKey) : refKeys;
  if (keys.length === 0) continue;

  const problems = [];

  for (const name of names) {
    if (name === REFERENCE) continue;
    const dict = locales[name][block];

    if (!dict) {
      problems.push({ kind: 'block', locale: name });
      continue;
    }
    for (const key of keys) {
      if (!(key in dict)) {
        problems.push({ kind: 'missing', locale: name, key });
      } else if (
        typeof dict[key] === 'string' &&
        dict[key] === locales[REFERENCE][block][key] &&
        dict[key].trim().length > 2
      ) {
        problems.push({ kind: 'untranslated', locale: name, key });
      }
    }
  }

  if (problems.length === 0) continue;

  console.log(`${block}`);

  const byKey = new Map();
  for (const p of problems) {
    if (p.kind === 'block') {
      console.log(`  ${RED}✗${OFF} locale ${p.locale} thiếu hẳn khối này`);
      missingCount++;
      continue;
    }
    const entry = byKey.get(p.key) ?? { missing: [], untranslated: [] };
    entry[p.kind === 'missing' ? 'missing' : 'untranslated'].push(p.locale);
    byKey.set(p.key, entry);
  }

  for (const [key, { missing, untranslated }] of byKey) {
    if (missing.length) {
      console.log(`  ${RED}✗${OFF} ${key} ${DIM}— thiếu ở${OFF} ${missing.join(', ')}`);
      missingCount += missing.length;
    }
    if (untranslated.length) {
      console.log(`  ${YELLOW}!${OFF} ${key} ${DIM}— giống hệt tiếng Anh ở${OFF} ${untranslated.join(', ')}`);
      untranslatedCount += untranslated.length;
    }
  }
  console.log();
}

if (onlyKey && missingCount === 0 && untranslatedCount === 0) {
  const found = blocks.filter((b) => onlyKey in (locales[REFERENCE][b] ?? {}));
  if (found.length === 0) {
    console.log(`${RED}✗ Key "${onlyKey}" không tồn tại trong ${REFERENCE}.js ở bất kỳ khối nào.${OFF}`);
    process.exit(1);
  }
  console.log(`${GREEN}✓ Key "${onlyKey}" có đủ ở ${names.length} locale, khối: ${found.join(', ')}${OFF}`);
  process.exit(0);
}

if (missingCount === 0 && untranslatedCount === 0) {
  console.log(`${GREEN}✓ 13 locale đồng bộ hoàn toàn.${OFF}`);
  process.exit(0);
}

console.log(`${DIM}────────${OFF}`);
if (missingCount) console.log(`${RED}${missingCount} key thiếu${OFF}`);
if (untranslatedCount) console.log(`${YELLOW}${untranslatedCount} key chưa dịch (còn nguyên tiếng Anh)${OFF}`);
console.log(`${DIM}Chỉ key thiếu mới làm CI fail. Key chưa dịch chỉ là cảnh báo.${OFF}`);

process.exit(strict && missingCount > 0 ? 1 : 0);
