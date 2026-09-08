#!/usr/bin/env node
/**
 * Wrapper cho `electron-vite dev`.
 *
 * VÌ SAO CẦN FILE NÀY
 * -------------------
 * VS Code (và một số IDE dựa trên Electron) đặt `ELECTRON_RUN_AS_NODE=1` trong
 * terminal tích hợp. Biến này khiến Electron chạy như Node thuần: `require('electron')`
 * không trả về API, `app` là undefined, và lỗi hiện ra dưới dạng rất khó hiểu —
 * "Cannot read properties of undefined (reading 'whenReady')" hoặc một lỗi ESM
 * loader trông như thể phiên bản Electron bị hỏng.
 *
 * Xoá biến trước khi spawn là cách duy nhất chắc chắn. Dùng Node thay vì `env -u`
 * để chạy được cả trên Windows.
 */

import { spawn } from 'node:child_process';

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const args = process.argv.slice(2);
const child = spawn('electron-vite', args.length ? args : ['dev'], {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 0));
