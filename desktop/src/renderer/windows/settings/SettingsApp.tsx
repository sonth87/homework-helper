/**
 * Trang Cài đặt render TỪ SCHEMA, không hardcode control nào.
 *
 * Hệ quả: thêm một tuỳ chọn vào config/settings/ là nó tự xuất hiện ở đây, tự
 * được validate, tự có type, tự được migrate — không cần sửa file này.
 */

import { useEffect, useState } from 'react';
import { UI_GROUPS, DEFAULT_SETTINGS } from '@config/settings';
import type { Settings } from '@config/settings';
import { createTranslator } from '@shared/i18n';
import { SettingControl } from './controls/SettingControl';
import { HotkeyControl } from './controls/HotkeyControl';
import { ApiKeysPanel } from './ApiKeysPanel';
import { INTENTS } from '@config/intents.config';
import type { Intent } from '@shared/types/intent';
import './settings.css';

/** Nhãn cho từng phím tắt, dựng từ intent registry — không hardcode. */
const HOTKEY_LABELS = [
  ...(Object.keys(INTENTS) as Intent[]).map((id) => ({ id: `intent.${id}`, i18n: INTENTS[id].i18n })),
  { id: 'app.openSettings', i18n: 'groupSystem' as const },
];

export function SettingsApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activeGroup, setActiveGroup] = useState(UI_GROUPS[0]?.id ?? '');

  useEffect(() => {
    window.api?.invoke('settings:get').then(setSettings).catch(console.error);
    // Cửa sổ khác đổi cấu hình thì cửa sổ này phải theo — nếu không hai nơi lệch nhau.
    return window.api?.onSettingsChanged(setSettings);
  }, []);

  const t = createTranslator(settings.uiLanguage);

  const patch = (key: string, value: unknown) => {
    const next = { ...settings, [key]: value } as Settings;
    setSettings(next);
    window.api?.invoke('settings:patch', { [key]: value } as Partial<Settings>).catch(console.error);
  };

  const group = UI_GROUPS.find((g) => g.id === activeGroup);

  return (
    <div className="settings">
      <nav className="settings__nav">
        {UI_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={g.id === activeGroup ? 'is-active' : ''}
            onClick={() => setActiveGroup(g.id)}
          >
            {t(g.i18n)}
          </button>
        ))}
      </nav>

      <main className="settings__panel">
        <h1>{group ? t(group.i18n) : ''}</h1>
        {activeGroup === 'apiKeys' && (
          <ApiKeysPanel configs={settings.apiConfigs} t={t} onChange={(v) => patch('apiConfigs', v)} />
        )}

        {group?.items.map(({ key, def }) =>
          key === 'hotkeys' ? (
            <div className="setting" key={key}>
              <span className="setting__label">{t(def.i18n)}</span>
              {def.i18nDesc && <span className="setting__desc">{t(def.i18nDesc)}</span>}
              <HotkeyControl
                bindings={settings.hotkeys}
                labels={HOTKEY_LABELS}
                t={t}
                onChange={(v) => patch('hotkeys', v)}
              />
            </div>
          ) : (
            <SettingControl
              key={key}
              settingKey={key}
              def={def}
              value={settings[key as keyof Settings]}
              t={t}
              onChange={(v) => patch(key, v)}
            />
          ),
        )}
      </main>
    </div>
  );
}
