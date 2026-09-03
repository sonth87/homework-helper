/**
 * Danh sách app không bao giờ bị đọc màn hình — `excludedApps` (kiểu 'json'
 * trong schema, `internal: true`) không sinh control tự động được vì là danh
 * sách động, cần thao tác thêm/xoá riêng — cùng lý do ApiKeysPanel/
 * TranslateProvidersPanel có màn hình riêng thay vì SettingControl chung.
 *
 * So khớp CHỨA CHUỖI, không phân biệt hoa/thường (xem
 * privacy/app-exclusion.ts) — "1password" khớp cả "1Password 8", không cần
 * gõ đúng tuyệt đối tên hiển thị của app.
 */

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { I18nKey } from '@shared/i18n';

type Props = {
  apps: string[];
  t: (key: I18nKey) => string;
  onChange: (apps: string[]) => void;
};

export function ExcludedAppsPanel({ apps, t, onChange }: Props) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value || apps.includes(value)) return;
    onChange([...apps, value]);
    setDraft('');
  };

  const remove = (app: string) => onChange(apps.filter((a) => a !== app));

  return (
    <div className="setting">
      <span className="setting__label">{t('setExcludedApps')}</span>
      <span className="setting__desc">{t('setExcludedAppsDesc')}</span>

      <div className="excluded-apps">
        <div className="excluded-apps__add">
          <input
            type="text"
            value={draft}
            placeholder={t('excludedAppsPlaceholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button type="button" onClick={add} disabled={!draft.trim()}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {t('excludedAppsAdd')}
          </button>
        </div>

        {apps.length === 0 ? (
          <p className="excluded-apps__empty">{t('excludedAppsEmpty')}</p>
        ) : (
          <ul className="excluded-apps__list">
            {apps.map((app) => (
              <li key={app}>
                <span>{app}</span>
                <button type="button" onClick={() => remove(app)} aria-label={t('keysRemove')}>
                  <X size={13} strokeWidth={2} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
