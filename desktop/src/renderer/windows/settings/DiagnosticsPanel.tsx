/**
 * Cài đặt → Chẩn đoán — thuần thông tin, không có gì để đổi (xem
 * diagnostics.settings.ts). Mục đích: người dùng tự biết vì sao một tính
 * năng không hoạt động (thiếu quyền? provider chưa sẵn sàng?) thay vì phải
 * hỏi/gửi log — đúng phạm vi roadmap gốc §92, KHÔNG phải "Debug Mode" (§91/
 * §151, vẽ bounding-box OCR + info kỹ thuật từng lần dịch — tính năng khác,
 * chưa làm).
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { DiagnosticsInfo } from '@shared/types/diagnostics';
import type { I18nKey } from '@shared/i18n';

type Props = { t: (key: I18nKey) => string };

function StatusIcon({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 size={16} strokeWidth={2} className="diag__ok" aria-hidden="true" />
    : <XCircle size={16} strokeWidth={2} className="diag__bad" aria-hidden="true" />;
}

export function DiagnosticsPanel({ t }: Props) {
  const [info, setInfo] = useState<DiagnosticsInfo | null>(null);

  useEffect(() => {
    window.api?.invoke('diagnostics:get').then(setInfo).catch(() => undefined);
  }, []);

  if (!info) return null;

  const rows: { label: string; node: React.ReactNode }[] = [
    { label: t('diagPlatform'), node: <span>{info.platform === 'darwin' ? 'macOS' : info.platform === 'win32' ? 'Windows' : info.platform} ({info.arch})</span> },
    { label: t('diagVersion'), node: <span>{info.appVersion}</span> },
    { label: t('diagAccessibility'), node: <StatusIcon ok={info.accessibilityGranted} /> },
    { label: t('diagScreenRecording'), node: <StatusIcon ok={info.screenRecordingGranted} /> },
    { label: t('diagAccessibilityProvider'), node: <StatusIcon ok={info.accessibilityProviderAvailable} /> },
    { label: t('diagOcrProvider'), node: <StatusIcon ok={info.ocrProviderAvailable} /> },
    { label: t('diagHoverTranslate'), node: <StatusIcon ok={info.hoverEnabled} /> },
    { label: t('diagClipboardWatcher'), node: <StatusIcon ok={info.clipboardWatcherEnabled} /> },
    { label: t('diagAiProviders'), node: <span>{info.configuredAiProviders}</span> },
    { label: t('diagTranslateProviders'), node: <span>{info.configuredTranslateProviders}</span> },
  ];

  return (
    <div className="diag">
      {rows.map((row) => (
        <div className="diag__row" key={row.label}>
          <span className="diag__label">{row.label}</span>
          <span className="diag__value">{row.node}</span>
        </div>
      ))}
    </div>
  );
}
