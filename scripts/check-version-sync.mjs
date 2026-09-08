#!/usr/bin/env node
/**
 * Kiểm tra version của hai app trong repo.
 *
 * Extension: `package.json` và `extension/manifest.json` phải GIỐNG HỆT nhau
 *            (Chrome Web Store đọc manifest; package.json là bản ghi của repo).
 * Desktop:   `desktop/package.json` — độc lập hoàn toàn, KHÔNG so với extension.
 *
 * Cũng cảnh báo nếu version hiện tại chưa có mục trong CHANGELOG tương ứng.
 *
 * Dùng:
 *   node scripts/check-version-sync.mjs
 *   node scripts/check-version-sync.mjs --strict   # thoát mã 1 khi lệch (cho CI)
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const RED = '\x1b[31m', YELLOW = '\x1b[33m', GREEN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';

const readJson = (rel) => {
  const p = join(ROOT, rel);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
};

let failed = false;

// ── Extension ────────────────────────────────────────────────────────────────
const pkg = readJson('package.json');
const manifest = readJson('extension/manifest.json');

console.log('Extension');
if (!pkg || !manifest) {
  console.log(`  ${RED}✗${OFF} Không đọc được package.json hoặc extension/manifest.json`);
  failed = true;
} else if (pkg.version !== manifest.version) {
  console.log(`  ${RED}✗${OFF} LỆCH — package.json: ${pkg.version} · manifest.json: ${manifest.version}`);
  console.log(`  ${DIM}Hai file phải có giá trị giống hệt nhau. Chrome Web Store sẽ reject.${OFF}`);
  failed = true;
} else {
  console.log(`  ${GREEN}✓${OFF} ${pkg.version} ${DIM}(package.json == manifest.json)${OFF}`);
  checkChangelog('CHANGELOG-extension.md', pkg.version, 'Extension');
}

// ── Desktop ──────────────────────────────────────────────────────────────────
console.log('\nDesktop');
const desktopPkg = readJson('desktop/package.json');
if (!desktopPkg) {
  console.log(`  ${DIM}— chưa khởi tạo${OFF}`);
} else {
  console.log(`  ${GREEN}✓${OFF} ${desktopPkg.version} ${DIM}(độc lập với extension)${OFF}`);
  checkChangelog('CHANGELOG-desktop.md', desktopPkg.version, 'Desktop');
}

function checkChangelog(file, version, label) {
  const p = join(ROOT, file);
  if (!existsSync(p)) {
    console.log(`  ${YELLOW}!${OFF} Không tìm thấy ${file}`);
    return;
  }
  const body = readFileSync(p, 'utf8');
  if (body.includes(`## [${version}]`)) {
    console.log(`  ${GREEN}✓${OFF} ${file} có mục [${version}]`);
  } else {
    console.log(`  ${YELLOW}!${OFF} ${file} CHƯA có mục [${version}]`);
    console.log(`  ${DIM}Bump version phải luôn kèm một mục CHANGELOG — CLAUDE.md mục 3.${OFF}`);
  }
}

console.log();
if (failed) {
  console.log(`${RED}Version lệch.${OFF}`);
  process.exit(strict ? 1 : 0);
}
console.log(`${GREEN}Version hợp lệ.${OFF}`);
