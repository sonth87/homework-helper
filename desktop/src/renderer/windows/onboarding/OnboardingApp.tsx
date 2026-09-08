/**
 * Xin quyền hệ thống macOS — tự mở khi thiếu quyền (init-windows.ts), hoặc mở
 * lại thủ công từ Cài đặt.
 *
 * Quan trọng: chỉ nhắc khởi động lại khi phát hiện quyền CHUYỂN từ chưa cấp
 * sang đã cấp TRONG PHIÊN NÀY (`grantedDuringSession`). Nếu quyền đã đủ ngay
 * từ lúc mở cửa sổ (ví dụ người dùng tự mở lại để xem), tiến trình hiện tại
 * hẳn đã khởi động với quyền đó — không có gì cần khởi động lại. Nhắc khởi
 * động lại vô điều kiện mỗi lần mở sẽ gây phiền không cần thiết.
 */

import { useEffect, useRef, useState } from 'react';
import { createTranslator } from '@shared/i18n';
import type { PermissionKind, PermissionStatus } from '@shared/types/permissions';
import type { I18nKey } from '@shared/i18n';
import '@renderer/theme/theme.css';
import './onboarding.css';

export function OnboardingApp() {
  const [uiLanguage, setUiLanguage] = useState('vi');
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const grantedDuringSession = useRef(false);
  const sawIncomplete = useRef(false);

  const t = createTranslator(uiLanguage);

  useEffect(() => {
    window.api?.invoke('settings:get').then((s) => setUiLanguage(s.uiLanguage)).catch(() => {});

    const refresh = () => {
      window.api
        ?.invoke('permissions:check')
        .then((next) => {
          const complete = next.accessibility && next.screenRecording;
          if (!complete) sawIncomplete.current = true;
          if (complete && sawIncomplete.current) grantedDuringSession.current = true;
          setStatus(next);
        })
        .catch(() => {});
    };

    refresh();
    // Người dùng rời sang System Settings rồi quay lại cửa sổ này — kiểm tra
    // lại ngay lúc đó thay vì bắt họ tự bấm nút làm mới.
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  if (!status) return null;

  const allGranted = status.accessibility && status.screenRecording;
  const openPane = (kind: PermissionKind) => void window.api?.invoke('permissions:openPane', { kind });

  return (
    <div className="onboarding">
      <h1>{t('onboardingTitle')}</h1>
      <p className="onboarding__intro">{t('onboardingIntro')}</p>

      <PermissionRow
        granted={status.accessibility}
        title={t('onboardingAccessibilityTitle')}
        desc={t('onboardingAccessibilityDesc')}
        onOpen={() => openPane('accessibility')}
        t={t}
      />
      <PermissionRow
        granted={status.screenRecording}
        title={t('onboardingScreenTitle')}
        desc={t('onboardingScreenDesc')}
        onOpen={() => openPane('screenRecording')}
        t={t}
      />

      {allGranted && grantedDuringSession.current && (
        <div className="onboarding__restart">
          <p>{t('onboardingNeedsRestart')}</p>
          <button type="button" onClick={() => void window.api?.invoke('permissions:relaunch')}>
            {t('onboardingRelaunch')}
          </button>
        </div>
      )}

      {!allGranted && (
        <button type="button" className="onboarding__skip" onClick={() => window.close()}>
          {t('onboardingSkip')}
        </button>
      )}
    </div>
  );
}

type RowProps = {
  granted: boolean;
  title: string;
  desc: string;
  onOpen: () => void;
  t: (key: I18nKey) => string;
};

function PermissionRow({ granted, title, desc, onOpen, t }: RowProps) {
  return (
    <div className={`onboarding__row${granted ? ' is-granted' : ''}`}>
      <div className="onboarding__row-head">
        <span className="onboarding__row-title">{title}</span>
        <span className="onboarding__badge">{t(granted ? 'onboardingGranted' : 'onboardingNotGranted')}</span>
      </div>
      <p className="onboarding__row-desc">{desc}</p>
      {!granted && (
        <button type="button" onClick={onOpen}>
          {t('onboardingOpenPane')}
        </button>
      )}
    </div>
  );
}
