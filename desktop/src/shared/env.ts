/**
 * Đọc và validate biến môi trường MỘT LẦN lúc khởi động.
 *
 * Không có `process.env.X` rải rác trong code — chỉ một nơi đọc, fail nhanh với
 * thông báo rõ ràng nếu cấu hình sai.
 *
 * Lưu ý: file này nằm trong shared/ nên KHÔNG được import 'node:process'.
 * Giá trị được main process nạp vào rồi truyền xuống (xem bootstrap/init-env.ts).
 */

import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  UPDATE_FEED_URL: z.string().url().or(z.literal('')).default(''),
  SENTRY_DSN: z.string().url().or(z.literal('')).default(''),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Biến môi trường không hợp lệ:\n${issues}`);
  }
  return result.data;
}

export const isDev = (env: Env) => env.NODE_ENV === 'development';
