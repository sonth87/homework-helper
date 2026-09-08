/**
 * Lưu API key của NGƯỜI DÙNG trong OS keychain qua Electron safeStorage.
 *
 * VÌ SAO KHÔNG ĐỂ TRONG SETTINGS HAY .ENV
 * ----------------------------------------
 * API key là DỮ LIỆU CỦA NGƯỜI DÙNG, không phải cấu hình build:
 *   - .env  → chỉ chứa bí mật của NHÀ PHÁT TRIỂN (CSC_LINK, APPLE_ID, GH_TOKEN)
 *   - settings.json → đọc được bằng mắt thường, đồng bộ đi nơi khác, lộ khi
 *                     người dùng gửi file cấu hình để nhờ hỗ trợ
 *   - keychain → mã hoá theo tài khoản hệ điều hành
 *
 * Key KHÔNG BAO GIỜ đi qua kênh settings. Renderer chỉ hỏi được "có key chưa"
 * (secrets:hasApiKey), không bao giờ đọc lại được giá trị.
 *
 * CẠM BẪY KHI VIẾT TEST TRÊN macOS
 * ---------------------------------
 * Quyền truy cập keychain gắn với TÊN ỨNG DỤNG (`name` trong package.json mà
 * Electron đang chạy). Nếu một harness test chạy dưới tên khác, macOS coi đó là
 * ứng dụng mới xin quyền và hiện hộp thoại hệ thống — trong môi trường không có
 * giao diện thì `safeStorage.encryptString()` TREO VÔ HẠN, không lỗi, không
 * timeout, không log.
 *
 * Triệu chứng: `secrets:setApiKey` không bao giờ resolve. Cách sửa: đặt `name`
 * của harness trùng với tên app thật.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { app, safeStorage } from 'electron';
import { logger } from '../logging/logger';

type Vault = Record<string, string>;

export class Keychain {
  private cache: Vault | null = null;
  private filePath: string | null = null;

  /**
   * Đường dẫn tính LAZY, không phải trong field initializer.
   *
   * `keychain` là singleton cấp module, nên field initializer sẽ chạy ngay khi
   * file được import — trước cả app.whenReady(). Gọi app.getPath() ở thời điểm
   * đó làm sập tiến trình chính ngay khi khởi động.
   */
  private get file(): string {
    this.filePath ??= join(app.getPath('userData'), 'secrets.bin');
    return this.filePath;
  }

  /**
   * Trên máy chưa cấu hình keyring (một số bản Linux tối giản), safeStorage
   * không khả dụng. Khi đó TỪ CHỐI lưu thay vì âm thầm ghi plaintext.
   */
  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }

  async set(configId: string, apiKey: string): Promise<void> {
    this.assertAvailable();
    const vault = await this.load();
    vault[configId] = apiKey;
    await this.save(vault);
  }

  async get(configId: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    const vault = await this.load();
    return vault[configId] ?? null;
  }

  async has(configId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    const vault = await this.load();
    return configId in vault;
  }

  async delete(configId: string): Promise<void> {
    const vault = await this.load();
    delete vault[configId];
    await this.save(vault);
  }

  private assertAvailable(): void {
    if (this.isAvailable()) return;
    throw new Error(
      'Hệ điều hành chưa sẵn sàng mã hoá (keyring chưa được cấu hình). ' +
        'Không lưu API key ở dạng không mã hoá.',
    );
  }

  private async load(): Promise<Vault> {
    if (this.cache) return this.cache;
    try {
      const encrypted = await readFile(this.file);
      this.cache = JSON.parse(safeStorage.decryptString(encrypted)) as Vault;
    } catch (error) {
      // Không có file là bình thường ở lần chạy đầu. Giải mã lỗi thì nghiêm
      // trọng hơn — thường do đổi tài khoản OS hoặc chuyển máy.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('Không giải mã được kho khoá — bắt đầu lại từ rỗng', error);
      }
      this.cache = {};
    }
    return this.cache;
  }

  private async save(vault: Vault): Promise<void> {
    this.cache = vault;
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, safeStorage.encryptString(JSON.stringify(vault)));
  }
}

export const keychain = new Keychain();
