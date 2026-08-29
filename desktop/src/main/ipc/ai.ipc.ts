import { ipcMain } from 'electron';
import { PROVIDERS } from '@config/providers.config';
import type { ProviderId } from '@shared/types/ai';
import { LIMITS } from '@config/limits.config';
import { keychain } from '../secrets/keychain';

type TestParams = { provider: ProviderId; configId: string; baseUrl?: string };
type TestResult = { ok: true; latencyMs: number; model: string } | { ok: false; error: string };

/**
 * Kiểm tra kết nối tới nhà cung cấp.
 *
 * Gọi endpoint liệt kê model thay vì sinh văn bản: nhanh hơn, không tốn token,
 * và vẫn xác nhận đủ ba thứ — địa chỉ đúng, khoá hợp lệ, mạng thông.
 */
export function registerAiIpc(): void {
  ipcMain.handle('ai:testProvider', async (_e, { provider, configId, baseUrl }: TestParams): Promise<TestResult> => {
    const info = PROVIDERS[provider];
    const url = (baseUrl || info.defaultBaseUrl).replace(/\/$/, '');
    const started = Date.now();

    try {
      const apiKey = info.requiresKey ? await keychain.get(configId) : null;
      if (info.requiresKey && !apiKey) return { ok: false, error: 'Chưa có API key cho cấu hình này.' };

      const res = await fetch(`${url}/models`, {
        headers: authHeaders(provider, apiKey),
        signal: AbortSignal.timeout(LIMITS.fastLane.timeoutMs * 2),
      });

      if (!res.ok) return { ok: false, error: describeStatus(res.status) };

      const body = (await res.json()) as { data?: { id: string }[]; models?: { name: string }[] };
      const first = body.data?.[0]?.id ?? body.models?.[0]?.name ?? '';
      return { ok: true, latencyMs: Date.now() - started, model: first };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        error: info.isLocal
          ? `Không kết nối được tới ${url}. Kiểm tra phần mềm đã chạy và địa chỉ đúng chưa.`
          : message,
      };
    }
  });
}

function authHeaders(provider: ProviderId, apiKey: string | null): Record<string, string> {
  if (!apiKey) return {};
  if (provider === 'gemini') return { 'x-goog-api-key': apiKey };
  if (provider === 'claude') return { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
  return { Authorization: `Bearer ${apiKey}` };
}

/** Thông báo theo mã lỗi — "401" một mình không cho người dùng biết phải làm gì. */
function describeStatus(status: number): string {
  if (status === 401 || status === 403) return 'Khoá không hợp lệ hoặc đã hết hạn.';
  if (status === 429) return 'Đã chạm giới hạn tốc độ. Thử lại sau ít phút.';
  if (status >= 500) return `Máy chủ nhà cung cấp đang lỗi (${status}).`;
  return `Yêu cầu thất bại (${status}).`;
}
