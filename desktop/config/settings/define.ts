/**
 * defineSettings — cơ chế khai báo cấu hình tập trung.
 *
 * MỘT khai báo sinh ra NĂM thứ:
 *   1. DEFAULT_SETTINGS   — object mặc định, không viết tay lần hai
 *   2. zod schema         — validate khi đọc từ DB và khi nhận qua IPC
 *   3. type Settings      — dùng chung main + renderer, suy ra từ khai báo
 *   4. UI Settings        — renderer duyệt schema, render control theo `type`
 *   5. Migration          — so khoá đã lưu với khoá schema, tự thêm/xoá
 *
 * Nhờ đó thêm một tuỳ chọn cho người dùng = thêm MỘT entry vào MỘT file, cộng
 * 13 chuỗi dịch. So với extension — nơi phải sửa storage.js + options.html +
 * tab tương ứng + options.js + 13 locale — đây là khác biệt lớn nhất về chi phí
 * mở rộng. Xem dev/where.md.
 */

import { z } from 'zod';
import type { I18nKey } from '../../src/shared/i18n/keys';

// ── Mô tả một tuỳ chọn ──────────────────────────────────────────────────────

type Base = {
  /** Khoá i18n cho nhãn. Bắt buộc — check:settings-i18n chặn build nếu thiếu bản dịch. */
  i18n: I18nKey;
  /** Khoá i18n cho phần mô tả dưới nhãn. */
  i18nDesc?: I18nKey;
  /** Ẩn khỏi UI Settings — dùng cho state nội bộ như vị trí cửa sổ đã kéo. */
  internal?: true;
  /** Chỉ hiện khi tuỳ chọn khác đang bật. */
  showWhen?: string;
};

export type SettingDef =
  | (Base & { type: 'boolean'; default: boolean })
  | (Base & { type: 'number'; default: number; min: number; max: number; step?: number; unit?: string })
  | (Base & { type: 'string'; default: string; multiline?: boolean; placeholder?: string })
  | (Base & { type: 'color'; default: string })
  | (Base & { type: 'enum'; default: string; options: readonly { value: string; i18n: I18nKey }[] })
  | (Base & { type: 'multi'; default: readonly string[]; options: readonly { value: string; i18n: I18nKey }[] })
  | (Base & { type: 'json'; default: unknown; schema: z.ZodTypeAny });

export type SettingsGroup = {
  readonly id: string;
  readonly i18n: I18nKey;
  readonly settings: Readonly<Record<string, SettingDef>>;
};

export function defineSettings<const T extends Readonly<Record<string, SettingDef>>>(
  id: string,
  i18n: I18nKey,
  settings: T,
): { id: string; i18n: I18nKey; settings: T } {
  return { id, i18n, settings };
}

// ── Dẫn xuất 1: kiểu TypeScript ─────────────────────────────────────────────

type ValueOf<D extends SettingDef> =
  D extends { type: 'boolean' } ? boolean
  : D extends { type: 'number' } ? number
  : D extends { type: 'string' | 'color' } ? string
  : D extends { type: 'enum'; options: readonly { value: infer V }[] } ? V
  : D extends { type: 'multi'; options: readonly { value: infer V }[] } ? V[]
  : D extends { type: 'json'; schema: infer S } ? (S extends z.ZodTypeAny ? z.infer<S> : never)
  : never;

/**
 * Gộp kiểu của mọi nhóm thành một object phẳng.
 *
 * Dùng UnionToIntersection thay vì merge đệ quy: đệ quy khiến TS không chứng minh
 * được ràng buộc `extends SettingDef` và sinh ra lỗi lồng vô hạn.
 */
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type AllDefs<G extends readonly { settings: Record<string, SettingDef> }[]> =
  UnionToIntersection<G[number]['settings']>;

export type SettingsOf<G extends readonly { settings: Record<string, SettingDef> }[]> = {
  -readonly [K in keyof AllDefs<G>]: AllDefs<G>[K] extends SettingDef
    ? ValueOf<AllDefs<G>[K]>
    : never;
};

// ── Dẫn xuất 2: giá trị mặc định ────────────────────────────────────────────

export function buildDefaults(groups: readonly SettingsGroup[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const group of groups) {
    for (const [key, def] of Object.entries(group.settings)) {
      out[key] = def.type === 'multi' ? [...def.default] : def.default;
    }
  }
  return out;
}

// ── Dẫn xuất 3: zod schema ──────────────────────────────────────────────────

function zodFor(def: SettingDef): z.ZodTypeAny {
  switch (def.type) {
    case 'boolean':
      return z.boolean();
    case 'number':
      return z.number().min(def.min).max(def.max);
    case 'string':
      return z.string();
    case 'color':
      return z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Phải là mã màu hex dạng #rrggbb');
    case 'enum':
      return z.enum(def.options.map((o) => o.value) as [string, ...string[]]);
    case 'multi':
      return z.array(z.enum(def.options.map((o) => o.value) as [string, ...string[]]));
    case 'json':
      return def.schema;
  }
}

export function buildZodSchema(groups: readonly SettingsGroup[]): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};
  for (const group of groups) {
    for (const [key, def] of Object.entries(group.settings)) {
      shape[key] = zodFor(def).default(def.type === 'multi' ? [...def.default] : def.default);
    }
  }
  return z.object(shape);
}

// ── Dẫn xuất 4: dữ liệu cho UI ──────────────────────────────────────────────

export type UiGroup = {
  id: string;
  i18n: I18nKey;
  items: { key: string; def: SettingDef }[];
};

/** Bỏ qua tuỳ chọn `internal` — chúng không xuất hiện trong trang Cài đặt. */
export function buildUiGroups(groups: readonly SettingsGroup[]): UiGroup[] {
  return groups.map((group) => ({
    id: group.id,
    i18n: group.i18n,
    items: Object.entries(group.settings)
      .filter(([, def]) => !def.internal)
      .map(([key, def]) => ({ key, def })),
  }));
}

// ── Dẫn xuất 5: migration ───────────────────────────────────────────────────

/**
 * Hoà giá trị đã lưu với schema hiện tại: bổ sung khoá mới, loại bỏ khoá đã xoá,
 * thay thế giá trị không hợp lệ bằng mặc định. Không bao giờ ném lỗi — cấu hình
 * hỏng không được phép chặn app khởi động.
 */
export function migrate(
  stored: Record<string, unknown>,
  groups: readonly SettingsGroup[],
): { settings: Record<string, unknown>; added: string[]; removed: string[]; repaired: string[] } {
  const defaults = buildDefaults(groups);
  const settings: Record<string, unknown> = {};
  const added: string[] = [];
  const repaired: string[] = [];

  const defs = new Map<string, SettingDef>();
  for (const group of groups) {
    for (const [key, def] of Object.entries(group.settings)) defs.set(key, def);
  }

  for (const [key, def] of defs) {
    if (!(key in stored)) {
      settings[key] = defaults[key];
      added.push(key);
      continue;
    }
    const parsed = zodFor(def).safeParse(stored[key]);
    if (parsed.success) {
      settings[key] = parsed.data;
    } else {
      settings[key] = defaults[key];
      repaired.push(key);
    }
  }

  const removed = Object.keys(stored).filter((k) => !defs.has(k));
  return { settings, added, removed, repaired };
}
