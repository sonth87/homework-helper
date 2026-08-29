type Level = 'error' | 'warn' | 'info' | 'debug' | 'trace';

const ORDER: Record<Level, number> = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 };

let threshold = ORDER.info;

function emit(level: Level, message: string, data?: unknown): void {
  if (ORDER[level] > threshold) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  if (level === 'error') console.error(line, data ?? '');
  else if (level === 'warn') console.warn(line, data ?? '');
  else console.warn(line, data ?? '');
}

export const logger = {
  configure(level: Level) { threshold = ORDER[level]; },
  error: (m: string, d?: unknown) => emit('error', m, d),
  warn: (m: string, d?: unknown) => emit('warn', m, d),
  info: (m: string, d?: unknown) => emit('info', m, d),
  debug: (m: string, d?: unknown) => emit('debug', m, d),
};
