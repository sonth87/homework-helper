#!/usr/bin/env node
/**
 * Kiểm tra mọi link markdown nội bộ trong repo còn trỏ tới file tồn tại.
 *
 * Bắt lỗi link chết sau khi di chuyển/đổi tên tài liệu — loại lỗi im lặng,
 * không ai phát hiện cho tới khi có người bấm vào.
 *
 * Bỏ qua: link http(s), mailto, anchor thuần (#...), và node_modules.
 *
 * Dùng:
 *   node scripts/check-doc-links.mjs
 *   node scripts/check-doc-links.mjs --strict   # thoát mã 1 khi có link chết (cho CI)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const SKIP = new Set(['node_modules', '.git', 'assets']);

const RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

const LINK = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const files = walk(ROOT);
let broken = 0;
let checked = 0;

for (const file of files) {
  const body = readFileSync(file, 'utf8');
  const bad = [];

  for (const [, text, href] of body.matchAll(LINK)) {
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    const target = href.split('#')[0];
    if (!target) continue;
    checked++;
    if (!existsSync(resolve(dirname(file), target))) {
      bad.push({ text, href });
    }
  }

  if (bad.length) {
    console.log(`${relative(ROOT, file)}`);
    for (const { text, href } of bad) {
      console.log(`  ${RED}✗${OFF} ${href} ${DIM}— [${text}]${OFF}`);
      broken++;
    }
    console.log();
  }
}

console.log(`${DIM}Đã kiểm tra ${checked} link nội bộ trong ${files.length} file.${OFF}`);
if (broken === 0) {
  console.log(`${GREEN}✓ Không có link chết.${OFF}`);
  process.exit(0);
}
console.log(`${RED}${broken} link chết.${OFF}`);
process.exit(strict ? 1 : 0);
