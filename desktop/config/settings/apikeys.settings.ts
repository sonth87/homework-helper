import { z } from 'zod';
import { defineSettings } from './define';
import { PROVIDER_IDS } from '../../src/shared/types/ai';

/**
 * Danh sách cấu hình AI. KHÔNG chứa API key.
 *
 * Key nằm trong OS keychain, tra theo `id` của config. Cấu hình này thì đọc
 * được bằng mắt (settings.json) — nên tuyệt đối không để key vào đây.
 *
 * `internal: true` vì màn hình quản lý key là giao diện riêng có nút thêm/xoá/
 * kiểm tra kết nối, không phải một control sinh từ schema.
 */
export const apiConfigSchema = z.object({
  id: z.string(),
  provider: z.enum(PROVIDER_IDS),
  model: z.string(),
  label: z.string().default(''),
  baseUrl: z.string().default(''),
  isEnabled: z.boolean().default(true),
  /** Số nhỏ hơn được thử trước. */
  priority: z.number().int().default(0),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

export const apiKeySettings = defineSettings('apiKeys', 'groupApiKeys', {
  apiConfigs: {
    type: 'json',
    default: [] as ApiConfig[],
    schema: z.array(apiConfigSchema),
    i18n: 'setApiConfigs',
    internal: true,
  },
} as const);
