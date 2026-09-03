import type { LogEntry, LogLevel } from '@shared/types/log';

const ORDER: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 };

let threshold = ORDER.info;

// Chỉ giữ trong bộ nhớ tiến trình, không ghi file — trang Chẩn đoán → "Xem log
// gần đây" đọc thẳng bộ đệm này. Đủ cho debug một phiên đang chạy; log của
// phiên trước mất khi tắt app, chấp nhận được vì đây không phải audit log.
const MAX_ENTRIES = 500;
const buffer: LogEntry[] = [];

function emit(level: LogLevel, message: string, data?: unknown): void {
  if (ORDER[level] > threshold) return;
  const time = new Date().toISOString();
  buffer.push({ time, level, message, data });
  if (buffer.length > MAX_ENTRIES) buffer.shift();

  const line = `[${time}] ${level.toUpperCase()} ${message}`;
  if (level === 'error') console.error(line, data ?? '');
  else if (level === 'warn') console.warn(line, data ?? '');
  else console.warn(line, data ?? '');
}

export const logger = {
  configure(level: LogLevel) { threshold = ORDER[level]; },
  /** Mức log hiện tại — dùng cho toggle runtime ở trang Chẩn đoán. */
  getLevel(): LogLevel {
    return (Object.keys(ORDER) as LogLevel[]).find((k) => ORDER[k] === threshold) ?? 'info';
  },
  /** `limit` dòng gần nhất, mới nhất ở cuối mảng — chỉ những dòng đã qua ngưỡng lọc lúc ghi. */
  recent(limit = MAX_ENTRIES): LogEntry[] {
    return buffer.slice(-limit);
  },
  error: (m: string, d?: unknown) => emit('error', m, d),
  warn: (m: string, d?: unknown) => emit('warn', m, d),
  info: (m: string, d?: unknown) => emit('info', m, d),
  debug: (m: string, d?: unknown) => emit('debug', m, d),
};
