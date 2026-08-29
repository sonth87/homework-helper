/**
 * Quản lý key pool.
 *
 * Không sinh từ schema như các nhóm khác: đây là danh sách động, chứa bí mật,
 * và có thao tác riêng (kiểm tra kết nối). Đó là lý do `apiConfigs` được đánh
 * dấu `internal: true` trong schema.
 *
 * API key KHÔNG BAO GIỜ đi qua state của React hay kênh settings — nhập xong là
 * gửi thẳng vào keychain qua secrets:setApiKey, rồi xoá khỏi ô nhập.
 */

import { useEffect, useState } from 'react';
import { PROVIDERS, PROVIDER_LIST } from '@config/providers.config';
import type { ApiConfig } from '@config/settings';
import type { ProviderId } from '@shared/types/ai';
import type { I18nKey } from '@shared/i18n';

type Props = {
  configs: ApiConfig[];
  t: (key: I18nKey) => string;
  onChange: (configs: ApiConfig[]) => void;
};

export function ApiKeysPanel({ configs, t, onChange }: Props) {
  const add = () => {
    const provider = PROVIDER_LIST[0];
    if (!provider) return;
    onChange([
      ...configs,
      {
        id: `cfg_${Date.now().toString(36)}`,
        provider: provider.id,
        model: provider.models[0]?.id ?? '',
        label: '',
        baseUrl: '',
        isEnabled: true,
        priority: configs.length,
      },
    ]);
  };

  return (
    <div className="keys">
      {configs.length === 0 && <p className="keys__empty">{t('keysEmpty')}</p>}

      {configs.map((config) => (
        <ConfigCard
          key={config.id}
          config={config}
          t={t}
          onPatch={(patch) => onChange(configs.map((c) => (c.id === config.id ? { ...c, ...patch } : c)))}
          onRemove={() => {
            void window.api?.invoke('secrets:deleteApiKey', { configId: config.id });
            onChange(configs.filter((c) => c.id !== config.id));
          }}
        />
      ))}

      <button type="button" className="keys__add" onClick={add}>
        + {t('keysAdd')}
      </button>
    </div>
  );
}

type CardProps = {
  config: ApiConfig;
  t: (key: I18nKey) => string;
  onPatch: (patch: Partial<ApiConfig>) => void;
  onRemove: () => void;
};

function ConfigCard({ config, t, onPatch, onRemove }: CardProps) {
  const info = PROVIDERS[config.provider];
  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [test, setTest] = useState<'idle' | 'testing' | string>('idle');

  useEffect(() => {
    window.api?.invoke('secrets:hasApiKey', { configId: config.id }).then(setHasKey).catch(() => setHasKey(false));
  }, [config.id]);

  const saveKey = async () => {
    if (!keyInput.trim()) return;
    await window.api?.invoke('secrets:setApiKey', { configId: config.id, apiKey: keyInput.trim() });
    // Xoá khỏi state ngay — khoá không nên nằm trong bộ nhớ renderer lâu hơn cần thiết.
    setKeyInput('');
    setHasKey(true);
  };

  const runTest = async () => {
    setTest('testing');
    const result = await window.api?.invoke('ai:testProvider', {
      provider: config.provider,
      configId: config.id,
      ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
    });
    setTest(!result ? 'idle' : result.ok ? `${t('keysOk')} · ${result.latencyMs}ms` : result.error);
  };

  const changeProvider = (provider: ProviderId) => {
    onPatch({ provider, model: PROVIDERS[provider].models[0]?.id ?? '', baseUrl: '' });
  };

  return (
    <div className={`keys__card${config.isEnabled ? '' : ' is-off'}`}>
      <div className="keys__head">
        <select value={config.provider} onChange={(e) => changeProvider(e.target.value as ProviderId)}>
          {PROVIDER_LIST.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {info.capabilities.vision && <span className="keys__tag">{t('keysVision')}</span>}

        <label className="keys__toggle">
          <input
            type="checkbox"
            checked={config.isEnabled}
            onChange={(e) => onPatch({ isEnabled: e.target.checked })}
          />
          {t('keysEnabled')}
        </label>

        <button type="button" className="keys__remove" onClick={onRemove}>{t('keysRemove')}</button>
      </div>

      <label>
        <span>{t('keysModel')}</span>
        <select value={config.model} onChange={(e) => onPatch({ model: e.target.value })}>
          {info.models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </label>

      {info.requiresBaseUrl && (
        <label>
          <span>{t('keysBaseUrl')}</span>
          <input
            type="text"
            value={config.baseUrl}
            placeholder={info.defaultBaseUrl}
            onChange={(e) => onPatch({ baseUrl: e.target.value })}
          />
        </label>
      )}

      {info.requiresKey ? (
        <label>
          <span>API key</span>
          <span className="keys__keyrow">
            <input
              type="password"
              value={keyInput}
              placeholder={hasKey ? '••••••••••  ' + t('keysKeySaved') : t('keysKeyPlaceholder')}
              onChange={(e) => setKeyInput(e.target.value)}
              onBlur={() => void saveKey()}
            />
            {info.docsUrl && (
              <button type="button" onClick={() => void window.api?.invoke('shell:openExternal', { url: info.docsUrl as string })}>
                {t('keysGetKey')}
              </button>
            )}
          </span>
        </label>
      ) : (
        <p className="keys__local">{t('keysNoKeyNeeded')}</p>
      )}

      <div className="keys__foot">
        <button type="button" onClick={() => void runTest()} disabled={test === 'testing'}>
          {test === 'testing' ? t('keysTesting') : t('keysTest')}
        </button>
        {test !== 'idle' && test !== 'testing' && <span className="keys__result">{test}</span>}
      </div>
    </div>
  );
}
