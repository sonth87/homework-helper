/**
 * Thứ tự thử + bật/tắt provider dịch nhanh (Lane A). Không sinh từ schema như
 * các control khác — cần thao tác sắp xếp thứ tự (nút lên/xuống), không phải
 * một input đơn — cùng lý do ApiKeysPanel có màn hình riêng.
 */

import { ChevronUp, ChevronDown } from 'lucide-react';
import type { TranslateProviderConfig } from '@config/settings';
import type { TranslateProviderId } from '@shared/types/translate';
import type { I18nKey } from '@shared/i18n';

const NAME_KEY: Record<TranslateProviderId, I18nKey> = {
  google: 'translateProviderGoogle',
  bing: 'translateProviderBing',
  mymemory: 'translateProviderMymemory',
};

type Props = {
  configs: TranslateProviderConfig[];
  t: (key: I18nKey) => string;
  onChange: (configs: TranslateProviderConfig[]) => void;
};

export function TranslateProvidersPanel({ configs, t, onChange }: Props) {
  const ordered = [...configs].sort((a, b) => a.priority - b.priority);

  const move = (id: TranslateProviderId, dir: -1 | 1) => {
    const from = ordered.findIndex((c) => c.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= ordered.length) return;

    const next = [...ordered];
    [next[from], next[to]] = [next[to] as TranslateProviderConfig, next[from] as TranslateProviderConfig];
    onChange(next.map((c, i) => ({ ...c, priority: i })));
  };

  const toggle = (id: TranslateProviderId, isEnabled: boolean) => {
    onChange(configs.map((c) => (c.id === id ? { ...c, isEnabled } : c)));
  };

  return (
    <div className="setting">
      <span className="setting__label">{t('setTranslateProviders')}</span>
      <span className="setting__desc">{t('setTranslateProvidersDesc')}</span>

      <div className="providers">
        {ordered.map((c, i) => (
          <div key={c.id} className={`providers__row${c.isEnabled ? '' : ' is-off'}`}>
            <span className="providers__order">
              <button type="button" disabled={i === 0} onClick={() => move(c.id, -1)} aria-label="up">
                <ChevronUp size={14} strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={i === ordered.length - 1}
                onClick={() => move(c.id, 1)}
                aria-label="down"
              >
                <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
              </button>
            </span>
            <label className="providers__toggle">
              <input type="checkbox" checked={c.isEnabled} onChange={(e) => toggle(c.id, e.target.checked)} />
              {t(NAME_KEY[c.id])}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
