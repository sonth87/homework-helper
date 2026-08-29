// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Luật chống god file được bật NGAY TỪ ĐẦU, trước khi có code để mà nhân nhượng.
 *
 * Lý do: extension hiện có floating-card.js 884 dòng, sidepanel.js 797, drawer.js 768.
 * Chúng phình dần vì mỗi lần chỉ thêm 30 dòng — không có ngưỡng nào bị vi phạm rõ ràng.
 * Ngưỡng đặt sau khi code đã lớn thì không bao giờ áp được.
 *
 * Xem roadmap/desktop-app-structure.md mục 7.
 */
export default tseslint.config(
  { ignores: ['out/**', 'dist/**', 'node_modules/**', '*.config.js'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      // ── Chống god file / god function ──────────────────────────────────
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'max-depth': ['error', 4],
      complexity: ['error', 15],

      // ── Chất lượng ─────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },

  // ── Luật phân tầng: shared/ phải isomorphic ──────────────────────────────
  // Chỉ cần một `import { app } from 'electron'` lọt vào shared/ là bundle
  // renderer vỡ ở BẢN ĐÓNG GÓI, không phải lúc dev. Đây là lỗi tốn thời gian
  // nhất trong ba luật phân tầng.
  {
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['electron', 'electron/*'], message: 'shared/ phải isomorphic — chuyển sang src/main/ hoặc src/renderer/' },
          { group: ['node:*', 'fs', 'path', 'os', 'child_process'], message: 'shared/ phải isomorphic — không dùng API Node' },
          { group: ['@main/*'], message: 'shared/ không được phụ thuộc main/' },
          { group: ['@renderer/*'], message: 'shared/ không được phụ thuộc renderer/' },
        ],
      }],
    },
  },

  // ── renderer/ không được chạm main/ ──────────────────────────────────────
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@main/*'], message: 'renderer không import từ main — dùng IPC contract ở @shared/ipc/channels' },
          { group: ['electron'], message: 'renderer chỉ dùng API được preload expose qua window.api' },
        ],
      }],
      'max-lines-per-function': ['error', { max: 180, skipBlankLines: true, skipComments: true }],
    },
  },

  // ── main/ không được import UI ───────────────────────────────────────────
  {
    files: ['src/main/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['react', 'react-dom', 'react/*', 'zustand'], message: 'main process không được import thư viện UI' },
          { group: ['@renderer/*'], message: 'main không import từ renderer' },
        ],
      }],
    },
  },

  // ── Script CLI: chạy bằng Node, console chính là đầu ra ──────────────────
  {
    files: ['scripts/**/*.{ts,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },

  // ── File dữ liệu thuần: nới ngưỡng dòng ──────────────────────────────────
  {
    files: ['src/shared/i18n/locales/*.ts', 'config/**/*.ts'],
    rules: { 'max-lines': 'off' },
  },
);
