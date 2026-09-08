import { LIMITS } from '@config/limits.config';
import type { ProviderError } from '@shared/types/ai';

/**
 * Chuẩn hoá lỗi HTTP thành quyết định "có nên thử key khác không".
 *
 * Phân biệt này là thứ quyết định hành vi của KeyRotator:
 *   - retryable  → lỗi tạm thời hoặc riêng của key này (429, 5xx) → thử key khác
 *   - !retryable → lỗi cấu hình (401, 403, 400) → thử key khác cũng vô ích,
 *                  dừng lại và báo cho người dùng biết phải sửa gì
 */
export function httpError(status: number, body: string): ProviderError {
  const message = extractMessage(body) ?? `Yêu cầu thất bại (${status}).`;

  if (status === 429) {
    return { message, statusCode: status, retryable: true, cooldownMs: LIMITS.cooldown.rateLimitMs };
  }
  if (status >= 500) {
    return { message, statusCode: status, retryable: true, cooldownMs: LIMITS.cooldown.serverErrorMs };
  }
  if (status === 401 || status === 403) {
    return { message: `Khoá không hợp lệ hoặc không đủ quyền. ${message}`, statusCode: status, retryable: false, cooldownMs: 0 };
  }
  return { message, statusCode: status, retryable: false, cooldownMs: 0 };
}

/** Ba họ provider lồng thông báo lỗi ở ba chỗ khác nhau. */
function extractMessage(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === 'string') return parsed.error;
    return parsed.error?.message ?? parsed.message ?? null;
  } catch {
    return body.slice(0, 200) || null;
  }
}
