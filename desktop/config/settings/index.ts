/**
 * Gộp các nhóm setting. File này CHỈ gộp — không chứa định nghĩa nào.
 * Thêm nhóm mới: tạo file `<tên>.settings.ts`, import vào đây, thêm vào SETTINGS_GROUPS.
 */

import { aiSettings } from './ai.settings';
import { acquisitionSettings } from './acquisition.settings';
import { apiKeySettings } from './apikeys.settings';
import { hotkeySettings } from './hotkey.settings';
import { intentSettings } from './intent.settings';
import { languageSettings } from './language.settings';
import { privacySettings } from './privacy.settings';
import { storageSettings } from './storage.settings';
import { systemSettings } from './system.settings';
import { buildDefaults, buildZodSchema, buildUiGroups, migrate } from './define';
import type { SettingsGroup, SettingsOf } from './define';

export const SETTINGS_GROUPS = [
  languageSettings,
  aiSettings,
  apiKeySettings,
  acquisitionSettings,
  intentSettings,
  hotkeySettings,
  privacySettings,
  storageSettings,
  systemSettings,
] as const;

/** Kiểu suy ra từ khai báo — không viết tay. */
export type Settings = SettingsOf<typeof SETTINGS_GROUPS>;

const groups = SETTINGS_GROUPS as readonly SettingsGroup[];

export const DEFAULT_SETTINGS = buildDefaults(groups) as Settings;
export const settingsSchema = buildZodSchema(groups);
export const UI_GROUPS = buildUiGroups(groups);

export function migrateSettings(stored: Record<string, unknown>) {
  return migrate(stored, groups);
}

export { defineSettings } from './define';
export type { ApiConfig } from './apikeys.settings';
export type { TranslateProviderConfig } from './language.settings';
export type { SettingDef, SettingsGroup, UiGroup } from './define';
