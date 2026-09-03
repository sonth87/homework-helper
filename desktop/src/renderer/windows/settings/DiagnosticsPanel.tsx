/**
 * Cài đặt → Chẩn đoán — thuần thông tin, không có gì để đổi (xem
 * diagnostics.settings.ts). Mục đích: người dùng tự biết vì sao một tính
 * năng không hoạt động (thiếu quyền? provider chưa sẵn sàng?) thay vì phải
 * hỏi/gửi log — đúng phạm vi roadmap gốc §92, KHÔNG phải "Debug Mode" (§91/
 * §151, vẽ bounding-box OCR + info kỹ thuật từng lần dịch — tính năng khác,
 * chưa làm).
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, ScrollText, Trash2, XCircle } from 'lucide-react';
import type { DiagnosticsInfo } from '@shared/types/diagnostics';
import type { LogEntry, LogLevel } from '@shared/types/log';
import type { I18nKey } from '@shared/i18n';

type Props = { t: (key: I18nKey) => string };

function StatusIcon({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 size={16} strokeWidth={2} className="diag__ok" aria-hidden="true" />
    : <XCircle size={16} strokeWidth={2} className="diag__bad" aria-hidden="true" />;
}

const LOG_LEVELS: LogLevel[] = ['error', 'warn', 'info', 'debug', 'trace'];
const LOG_LEVEL_KEY: Record<LogLevel, I18nKey> = {
  error: 'logLevelError', warn: 'logLevelWarn', info: 'logLevelInfo',
  debug: 'logLevelDebug', trace: 'logLevelTrace',
};

function formatLogLine(entry: LogEntry): string {
  const time = entry.time.slice(11, 19); // chỉ giờ:phút:giây, ngày không cần thiết khi xem log một phiên
  const data = entry.data !== undefined ? ` ${JSON.stringify(entry.data)}` : '';
  return `[${time}] ${entry.level.toUpperCase()} ${entry.message}${data}`;
}

/** Cụm "Công cụ debug" ở cuối trang — riêng, KHÔNG phải phần thông tin thuần phía trên. */
function DebugTools({ t }: Props) {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [logLevel, setLogLevel] = useState<LogLevel | null>(null);
  const [cleared, setCleared] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  useEffect(() => {
    window.api?.invoke('diagnostics:getLogLevel').then(setLogLevel).catch(() => undefined);
  }, []);

  const loadLogs = () => {
    window.api?.invoke('diagnostics:getLogs').then(setLogs).catch(() => undefined);
  };

  const changeLevel = (level: LogLevel) => {
    setLogLevel(level);
    window.api?.invoke('diagnostics:setLogLevel', { level }).catch(() => undefined);
  };

  const clearCaches = () => {
    window.api?.invoke('diagnostics:clearCaches').then(() => {
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }).catch(() => undefined);
  };

  const exportBundle = () => {
    setExportMsg(null);
    window.api?.invoke('diagnostics:exportDebugBundle').then((res) => {
      setExportMsg(res.canceled ? t('diagExportBundleCanceled') : `${t('diagExportBundleDone')} ${res.path}`);
    }).catch(() => undefined);
  };

  return (
    <div className="diag__debug">
      <h3 className="diag__debugTitle">{t('diagDebugTitle')}</h3>
      <p className="diag__debugDesc">{t('diagDebugDesc')}</p>

      <div className="diag__debugRow">
        <button type="button" onClick={loadLogs}>
          <ScrollText size={14} strokeWidth={2} aria-hidden="true" />
          {t('diagBtnLoadLogs')}
        </button>
        {logLevel && (
          <select value={logLevel} onChange={(e) => changeLevel(e.target.value as LogLevel)} aria-label={t('diagLogLevel')}>
            {LOG_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{t(LOG_LEVEL_KEY[lvl])}</option>)}
          </select>
        )}
      </div>
      <p className="diag__debugHint">{t('diagLogLevelHint')}</p>

      {logs !== null && (
        <pre className="diag__logbox">
          {logs.length === 0 ? t('diagLogsEmpty') : logs.map(formatLogLine).join('\n')}
        </pre>
      )}

      <div className="diag__debugRow">
        <button type="button" onClick={clearCaches}>
          <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
          {t('diagBtnClearCaches')}
        </button>
        {cleared && <span className="diag__debugConfirm">{t('diagClearCachesDone')}</span>}
      </div>
      <p className="diag__debugHint">{t('diagClearCachesHint')}</p>

      <div className="diag__debugRow">
        <button type="button" onClick={exportBundle}>
          <Download size={14} strokeWidth={2} aria-hidden="true" />
          {t('diagBtnExportBundle')}
        </button>
        {exportMsg && <span className="diag__debugConfirm">{exportMsg}</span>}
      </div>
      <p className="diag__debugHint">{t('diagExportBundleHint')}</p>
    </div>
  );
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
      <DebugTools t={t} />
    </div>
  );
}
