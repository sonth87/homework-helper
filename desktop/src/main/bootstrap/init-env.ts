import { parseEnv } from '@shared/env';
import type { Env } from '@shared/env';

/** Đọc env một lần lúc khởi động, fail nhanh nếu sai. */
export function initEnv(): Env {
  return parseEnv(process.env);
}
