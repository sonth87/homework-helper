/**
 * Phát hiện mô hình đang chạy trên máy (Ollama / LM Studio).
 *
 * Thay thế vai trò của Gemini Nano ở extension: đường "dùng được ngay, miễn
 * phí, không cần key". Nano không có trên desktop (ADR-0001), nên đây là cách
 * duy nhất để người dùng chạy thử mà không phải đăng ký dịch vụ nào.
 *
 * Dò song song và timeout ngắn: đây là thao tác nền chạy lúc mở Cài đặt, không
 * được để người dùng phải chờ.
 */

import { PROVIDERS } from '@config/providers.config';
import type { ProviderId } from '@shared/types/ai';
import { logger } from '../logging/logger';

const PROBE_TIMEOUT_MS = 1500;

export type LocalProviderStatus = {
  provider: ProviderId;
  running: boolean;
  baseUrl: string;
  models: string[];
};

export async function detectLocalProviders(overrides: Partial<Record<ProviderId, string>> = {}): Promise<LocalProviderStatus[]> {
  const locals = Object.values(PROVIDERS).filter((p) => p.isLocal);
  return Promise.all(locals.map((p) => probe(p.id, overrides[p.id] || p.defaultBaseUrl)));
}

async function probe(provider: ProviderId, baseUrl: string): Promise<LocalProviderStatus> {
  const url = baseUrl.replace(/\/$/, '');

  try {
    const res = await fetch(`${url}/models`, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    if (!res.ok) return { provider, running: false, baseUrl: url, models: [] };

    const body = (await res.json()) as { data?: { id: string }[] };
    return {
      provider,
      running: true,
      baseUrl: url,
      models: (body.data ?? []).map((m) => m.id).filter(Boolean),
    };
  } catch {
    // Không chạy là trạng thái bình thường, không phải lỗi — đa số người dùng
    // không cài Ollama. Chỉ ghi ở mức debug.
    logger.debug('Không thấy mô hình nội bộ', { provider, url });
    return { provider, running: false, baseUrl: url, models: [] };
  }
}
