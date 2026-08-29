/**
 * Một control cho mỗi `type` trong schema. Đây là toàn bộ lớp trình bày của
 * trang Cài đặt — không có control nào được viết riêng cho một setting cụ thể.
 */

import type { SettingDef } from '@config/settings';
import type { I18nKey } from '@shared/i18n';

type Props = {
  settingKey: string;
  def: SettingDef;
  value: unknown;
  t: (key: I18nKey) => string;
  onChange: (value: unknown) => void;
};

export function SettingControl({ settingKey, def, value, t, onChange }: Props) {
  return (
    <label className="setting" htmlFor={settingKey}>
      <span className="setting__label">{t(def.i18n)}</span>
      {def.i18nDesc && <span className="setting__desc">{t(def.i18nDesc)}</span>}
      <Input settingKey={settingKey} def={def} value={value} t={t} onChange={onChange} />
    </label>
  );
}

function Input({ settingKey, def, value, t, onChange }: Props) {
  switch (def.type) {
    case 'boolean':
      return (
        <input
          id={settingKey}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
      );

    case 'number':
      return (
        <span className="setting__range">
          <input
            id={settingKey}
            type="range"
            min={def.min}
            max={def.max}
            step={def.step ?? 1}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <output>
            {String(value)}
            {def.unit ?? ''}
          </output>
        </span>
      );

    case 'string':
      return def.multiline ? (
        <textarea
          id={settingKey}
          value={String(value)}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={settingKey}
          type="text"
          value={String(value)}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'color':
      return (
        <input
          id={settingKey}
          type="color"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'enum':
      return (
        <select id={settingKey} value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {def.options.map((o) => (
            <option key={o.value} value={o.value}>
              {t(o.i18n)}
            </option>
          ))}
        </select>
      );

    case 'multi': {
      const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
      return (
        <span className="setting__multi">
          {def.options.map((o) => (
            <label key={o.value}>
              <input
                type="checkbox"
                checked={selected.has(o.value)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(o.value);
                  else next.delete(o.value);
                  onChange([...next]);
                }}
              />
              {t(o.i18n)}
            </label>
          ))}
        </span>
      );
    }

    case 'json':
      // Kiểu dữ liệu phức tạp (danh sách app loại trừ, bố cục thanh công cụ)
      // có màn hình riêng, không dùng control chung.
      return <span className="setting__custom">—</span>;
  }
}
