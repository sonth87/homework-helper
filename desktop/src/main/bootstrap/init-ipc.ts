import { registerSettingsIpc } from '../ipc/settings.ipc';
import { registerSecretsIpc } from '../ipc/secrets.ipc';
import type { SettingsService } from '../settings/settings.service';

/**
 * Đăng ký toàn bộ handler IPC. Mỗi nhóm kênh một file trong ipc/ — handler chỉ
 * validate rồi gọi service, không chứa nghiệp vụ.
 */
export function initIpc(settings: SettingsService): void {
  registerSettingsIpc(settings);
  registerSecretsIpc();
}
