/**
 * Cài đặt → Chẩn đoán — thuần thông tin, không có gì để đổi (xem
 * diagnostics.settings.ts). Mục đích: người dùng tự biết vì sao một tính
 * năng không hoạt động (thiếu quyền? provider chưa sẵn sàng?) thay vì phải
 * hỏi/gửi log — đúng phạm vi roadmap gốc §92, KHÔNG phải "Debug Mode" (§91/
 * §151, vẽ bounding-box OCR + info kỹ thuật từng lần dịch — tính năng khác,
 * chưa làm).
 */

import { useEffect, useMemo, useState } from 'react';
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
  const data = entry.data !== undefined ? ` ${JSON.stringify(entry.data)}` : '';
  return `${entry.message}${data}`;
}

function LogLine({ entry }: { entry: LogEntry }) {
  const time = entry.time.slice(11, 19);
  return (
    <div className={`diag__logline diag__logline--${entry.level}`}>
      <span className="diag__loglineTime">{time}</span>
      <span className="diag__loglineLevel">{entry.level.toUpperCase()}</span>
      <span className="diag__loglineMsg">{formatLogLine(entry)}</span>
    </div>
  );
}

/** Toolbar kiểu Chrome DevTools — mỗi mức là một chip bật/tắt riêng, có đếm số dòng. */
function LevelFilterToolbar({
  t, counts, total, visible, onToggle, onShowAll,
}: {
  t: Props['t'];
  counts: Record<LogLevel, number>;
  total: number;
  visible: Set<LogLevel>;
  onToggle: (level: LogLevel) => void;
  onShowAll: () => void;
}) {
  const allVisible = visible.size === LOG_LEVELS.length;
  return (
    <div className="diag__logToolbar" role="group" aria-label={t('diagLogLevel')}>
      <button
        type="button"
        className={`diag__logChip${allVisible ? ' is-active' : ''}`}
        onClick={onShowAll}
      >
        {t('diagLogFilterAll')} ({total})
      </button>
      {LOG_LEVELS.map((lvl) => (
        <button
          key={lvl}
          type="button"
          className={`diag__logChip diag__logChip--${lvl}${visible.has(lvl) ? ' is-active' : ''}`}
          aria-pressed={visible.has(lvl)}
          onClick={() => onToggle(lvl)}
        >
          <span className="diag__logChipDot" aria-hidden="true" />
          {t(LOG_LEVEL_KEY[lvl])} ({counts[lvl]})
        </button>
      ))}
    </div>
  );
}

/** Cụm "Công cụ debug" ở cuối trang — riêng, KHÔNG phải phần thông tin thuần phía trên. */
function DebugTools({ t }: Props) {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [visibleLevels, setVisibleLevels] = useState<Set<LogLevel>>(() => new Set(LOG_LEVELS));
  const [logLevel, setLogLevel] = useState<LogLevel | null>(null);
  const [cleared, setCleared] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  useEffect(() => {
    window.api?.invoke('diagnostics:getLogLevel').then(setLogLevel).catch(() => undefined);
  }, []);

  // Đăng ký MỘT LẦN lúc mount (Panel nay được giữ sống khi chuyển tab, xem
  // SettingsApp.tsx) — dùng functional update nên không cần `logs` trong deps,
  // và dòng log mới vẫn được thêm đúng dù panel đang ẩn (`hidden`) ở tab khác.
  // Trước khi bấm "Xem log gần đây" lần đầu (`logs === null`), bỏ qua — chưa
  // ai cần xem thì chưa tích luỹ làm gì.
  useEffect(() => {
    return window.api?.onLogEntry((entry) => {
      setLogs((prev) => (prev === null ? prev : [...prev, entry].slice(-500)));
    });
  }, []);

  const loadLogs = () => {
    window.api?.invoke('diagnostics:getLogs').then(setLogs).catch(() => undefined);
  };

  const changeLevel = (level: LogLevel) => {
    setLogLevel(level);
    window.api?.invoke('diagnostics:setLogLevel', { level }).catch(() => undefined);
  };

  const toggleVisibleLevel = (level: LogLevel) => {
    setVisibleLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
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

  const counts = useMemo(() => {
    const c: Record<LogLevel, number> = { error: 0, warn: 0, info: 0, debug: 0, trace: 0 };
    for (const entry of logs ?? []) c[entry.level]++;
    return c;
  }, [logs]);

  const filteredLogs = useMemo(
    () => (logs ?? []).filter((entry) => visibleLevels.has(entry.level)),
    [logs, visibleLevels],
  );

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
        <div className="diag__logPanel">
          <LevelFilterToolbar
            t={t}
            counts={counts}
            total={logs.length}
            visible={visibleLevels}
            onToggle={toggleVisibleLevel}
            onShowAll={() => setVisibleLevels(new Set(LOG_LEVELS))}
          />
          <div className="diag__logbox">
            {filteredLogs.length === 0
              ? <p className="diag__logEmpty">{t('diagLogsEmpty')}</p>
              : filteredLogs.map((entry, i) => <LogLine key={i} entry={entry} />)}
          </div>
        </div>
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
