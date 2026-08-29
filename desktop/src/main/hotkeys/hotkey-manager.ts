/**
 * Đăng ký phím tắt toàn cục.
 *
 * Hai điều dễ bỏ sót:
 *   1. globalShortcut.register() trả về false khi phím đã bị ứng dụng khác chiếm.
 *      Im lặng bỏ qua sẽ khiến người dùng tưởng app hỏng. Phải ghi lại và báo.
 *   2. Phải gỡ đăng ký trước khi đăng ký lại, nếu không lần đổi phím tắt thứ hai
 *      sẽ thất bại vì phím cũ vẫn đang giữ.
 */

import { globalShortcut } from 'electron';
import { logger } from '../logging/logger';

export type HotkeyBinding = { id: string; accelerator: string; run: () => void };

export type RegisterResult = { registered: string[]; conflicted: string[] };

export class HotkeyManager {
  private registered = new Set<string>();

  apply(bindings: readonly HotkeyBinding[]): RegisterResult {
    this.unregisterAll();

    const result: RegisterResult = { registered: [], conflicted: [] };

    for (const { id, accelerator, run } of bindings) {
      if (!accelerator) continue;
      try {
        if (globalShortcut.register(accelerator, run)) {
          this.registered.add(accelerator);
          result.registered.push(id);
        } else {
          // Phím đã bị hệ điều hành hoặc ứng dụng khác chiếm.
          result.conflicted.push(id);
          logger.warn('Không đăng ký được phím tắt', { id, accelerator });
        }
      } catch (error) {
        result.conflicted.push(id);
        logger.warn('Phím tắt không hợp lệ', { id, accelerator, error });
      }
    }

    return result;
  }

  unregisterAll(): void {
    for (const accelerator of this.registered) globalShortcut.unregister(accelerator);
    this.registered.clear();
  }
}

export const hotkeyManager = new HotkeyManager();
