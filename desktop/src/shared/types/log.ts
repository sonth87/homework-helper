/**
 * Dùng chung giữa `logging/logger.ts` (main) và trang Chẩn đoán (renderer) —
 * đặt ở shared/ vì channels.ts (cũng shared/) cần khai kiểu cho hai kênh IPC
 * `diagnostics:getLogs`/`diagnostics:setLogLevel` mà không được phép import
 * ngược từ main/.
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type LogEntry = {
  time: string;
  level: LogLevel;
  message: string;
  data?: unknown;
};
