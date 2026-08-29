/**
 * BẢNG ĐĂNG KÝ — nơi DUY NHẤT ánh xạ họ provider sang adapter.
 *
 * Thêm một họ giao thức mới = thêm một thư mục + một dòng ở đây.
 * Thêm một provider dùng họ có sẵn (ví dụ một dịch vụ tương thích OpenAI) =
 * chỉ cần một entry trong config/providers.config.ts, không đụng vào đây.
 */

import { PROVIDERS } from '@config/providers.config';
import type { ProviderId } from '@shared/types/ai';
import { geminiAdapter } from './gemini';
import { openAiCompatibleAdapter } from './openai-compatible';
import { claudeAdapter } from './claude';
import type { ProviderAdapter } from './types';

const ADAPTERS = {
  gemini: geminiAdapter,
  'openai-compatible': openAiCompatibleAdapter,
  claude: claudeAdapter,
} as const satisfies Record<ProviderAdapter['family'], ProviderAdapter>;

export function adapterFor(provider: ProviderId): ProviderAdapter {
  return ADAPTERS[PROVIDERS[provider].family];
}

export type { ProviderAdapter, RequestContext } from './types';
