import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

const alias = {
  '@shared': resolve('src/shared'),
  '@main': resolve('src/main'),
  '@renderer': resolve('src/renderer'),
  '@config': resolve('config'),
};

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: { rollupOptions: { input: { index: resolve('src/main/index.ts') } } },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: { rollupOptions: { input: { index: resolve('src/preload/index.ts') } } },
  },
  renderer: {
    plugins: [react()],
    resolve: { alias },
    root: resolve('src/renderer'),
    build: {
      rollupOptions: {
        // Mỗi BrowserWindow là một entry riêng — cửa sổ overlay không nên tải
        // bundle của trang Cài đặt.
        input: {
          settings: resolve('src/renderer/windows/settings/index.html'),
        },
      },
    },
  },
});
