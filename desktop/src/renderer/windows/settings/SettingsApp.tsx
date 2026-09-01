/**
 * Trang Cài đặt render TỪ SCHEMA, không hardcode control nào.
 *
 * Hệ quả: thêm một tuỳ chọn vào config/settings/ là nó tự xuất hiện ở đây, tự
 * được validate, tự có type, tự được migrate — không cần sửa file này.
 */

import { useEffect, useState } from 'react';
import {
  Languages, Palette, Brain, KeyRound, MousePointerClick,
  Sparkles, Keyboard, ShieldCheck, Database, Settings2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UI_GROUPS, DEFAULT_SETTINGS } from '@config/settings';
import type { Settings } from '@config/settings';
import { createTranslator } from '@shared/i18n';
import { SettingControl } from './controls/SettingControl';
import { HotkeyControl } from './controls/HotkeyControl';
import { ApiKeysPanel } from './ApiKeysPanel';
import { TranslateProvidersPanel } from './TranslateProvidersPanel';
import { INTENTS } from '@config/intents.config';
import type { Intent } from '@shared/types/intent';
import '@renderer/theme/theme.css';
import './settings.css';

/** Icon riêng cho renderer (React) — KHÔNG đặt trong config/settings/ (dùng
 *  chung với main process, không nên kéo theo React/lucide vào đó). */
const GROUP_ICONS: Record<string, LucideIcon> = {
  language: Languages,
  appearance: Palette,
  ai: Brain,
  apiKeys: KeyRound,
  acquisition: MousePointerClick,
  intent: Sparkles,
  hotkeys: Keyboard,
  privacy: ShieldCheck,
  storage: Database,
  system: Settings2,
};

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
        {UI_GROUPS.map((g) => {
          const Icon = GROUP_ICONS[g.id];
          return (
            <button
              key={g.id}
              type="button"
              className={g.id === activeGroup ? 'is-active' : ''}
              onClick={() => setActiveGroup(g.id)}
            >
              {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" />}
              {t(g.i18n)}
            </button>
          );
        })}
      </nav>

      <main className="settings__panel">
        <h1>{group ? t(group.i18n) : ''}</h1>
        {activeGroup === 'apiKeys' && (
          <ApiKeysPanel configs={settings.apiConfigs} t={t} onChange={(v) => patch('apiConfigs', v)} />
        )}

        {group?.items
          .filter(({ def }) => !def.showWhen || settings[def.showWhen as keyof Settings])
          .map(({ key, def }) =>
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

        {activeGroup === 'language' && (
          <TranslateProvidersPanel
            configs={settings.translateProviders}
            t={t}
            onChange={(v) => patch('translateProviders', v)}
          />
        )}

        {activeGroup === 'system' && (
          <div className="setting">
            <span className="setting__label">{t('onboardingReopenLabel')}</span>
            <span className="setting__desc">{t('onboardingReopenDesc')}</span>
            <button
              type="button"
              className="settings__reopen-onboarding"
              onClick={() => void window.api?.invoke('windows:openOnboarding')}
            >
              {t('onboardingReopenButton')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
