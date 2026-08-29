/**
 * Đọc/ghi cấu hình, tự migrate theo schema hiện tại.
 *
 * Phase 0 dùng file JSON trong userData. Phase 1 chuyển sang SQLite — chỉ phải
 * đổi hai phương thức `read`/`write` bên dưới, phần còn lại không đổi.
 */

import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { app } from 'electron';
import { DEFAULT_SETTINGS, migrateSettings } from '@config/settings';
import { openDatabase } from '../db/connection';
import { SettingsRepo } from '../db/repositories/settings.repo';
import { allDefaultHotkeys } from '@config/hotkeys.config';
import type { Platform } from '@config/hotkeys.config';
import type { Settings } from '@config/settings';
import { logger } from '../logging/logger';

export class SettingsService {
  private settings: Settings = DEFAULT_SETTINGS;
  private readonly listeners = new Set<(s: Settings) => void>();
  private repo: SettingsRepo | null = null;

  /** Lazy: openDatabase() cần app.getPath(), chỉ có sau whenReady. */
  private get store(): SettingsRepo {
    this.repo ??= new SettingsRepo(openDatabase());
    return this.repo;
  }

  async load(): Promise<Settings> {
    const stored = await this.read();
    const { settings, added, removed, repaired } = migrateSettings(stored);

    const next = settings as Settings;
    const filled = this.fillPlatformHotkeys(next);

    if (added.length || removed.length || repaired.length || filled.length) {
      logger.info('Đã migrate cấu hình', { added, removed, repaired, hotkeys: filled });
      this.settings = next;
      await this.write();
    } else {
      this.settings = next;
    }
    return this.settings;
  }

  /**
   * Điền phím tắt mặc định theo nền tảng cho những khoá CHƯA TỒN TẠI.
   *
   * Chỉ main process biết `process.platform` — config/ phải isomorphic vì
   * renderer cũng import nó. Không ghi đè khoá đã có, kể cả khi giá trị là
   * chuỗi rỗng: đó là người dùng chủ động tắt phím tắt.
   */
  private fillPlatformHotkeys(settings: Settings): string[] {
    const defaults = allDefaultHotkeys(process.platform as Platform);
    const filled: string[] = [];

    for (const [id, accelerator] of Object.entries(defaults)) {
      if (id in settings.hotkeys) continue;
      settings.hotkeys[id] = accelerator;
      filled.push(id);
    }
    return filled;
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
    const fromDb = this.store.readAll();
    if (Object.keys(fromDb).length > 0) return fromDb;

    // Lần đầu sau khi chuyển sang SQLite: nhặt cấu hình từ settings.json cũ
    // rồi xoá file, để người dùng không mất thiết lập đã có.
    return this.importLegacyJson();
  }

  private async importLegacyJson(): Promise<Record<string, unknown>> {
    const legacy = join(app.getPath('userData'), 'settings.json');
    try {
      const parsed = JSON.parse(await readFile(legacy, 'utf8')) as Record<string, unknown>;
      logger.info('Đã nhập cấu hình từ settings.json cũ', { keys: Object.keys(parsed).length });
      await unlink(legacy).catch(() => undefined);
      return parsed;
    } catch {
      return {};
    }
  }

  private async write(): Promise<void> {
    this.store.writeAll(this.settings as unknown as Record<string, unknown>);
  }
}
