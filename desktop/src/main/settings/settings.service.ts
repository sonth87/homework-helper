/**
 * Đọc/ghi cấu hình, tự migrate theo schema hiện tại.
 *
 * Phase 0 dùng file JSON trong userData. Phase 1 chuyển sang SQLite — chỉ phải
 * đổi hai phương thức `read`/`write` bên dưới, phần còn lại không đổi.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { app } from 'electron';
import { DEFAULT_SETTINGS, migrateSettings } from '@config/settings';
import type { Settings } from '@config/settings';
import { logger } from '../logging/logger';

export class SettingsService {
  private settings: Settings = DEFAULT_SETTINGS;
  private readonly file = join(app.getPath('userData'), 'settings.json');
  private readonly listeners = new Set<(s: Settings) => void>();

  async load(): Promise<Settings> {
    const stored = await this.read();
    const { settings, added, removed, repaired } = migrateSettings(stored);

    if (added.length || removed.length || repaired.length) {
      logger.info('Đã migrate cấu hình', { added, removed, repaired });
      this.settings = settings as Settings;
      await this.write();
    } else {
      this.settings = settings as Settings;
    }
    return this.settings;
  }

  get(): Settings {
    return this.settings;
  }

  async patch(changes: Partial<Settings>): Promise<Settings> {
    this.settings = { ...this.settings, ...changes };
    await this.write();
    for (const listener of this.listeners) listener(this.settings);
    return this.settings;
  }

  async reset(): Promise<Settings> {
    this.settings = DEFAULT_SETTINGS;
    await this.write();
    for (const listener of this.listeners) listener(this.settings);
    return this.settings;
  }

  onChange(cb: (s: Settings) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Cấu hình hỏng không được phép chặn app khởi động — luôn rơi về mặc định. */
  private async read(): Promise<Record<string, unknown>> {
    try {
      return JSON.parse(await readFile(this.file, 'utf8')) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private async write(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(this.settings, null, 2), 'utf8');
  }
}
