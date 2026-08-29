/**
 * Ghi phím tắt bằng cách BẤM PHÍM THẬT, không bắt người dùng gõ chuỗi
 * "Command+Shift+S" đúng cú pháp Electron.
 *
 * Cũng cảnh báo khi hai phím tắt trùng nhau — Electron sẽ im lặng từ chối đăng
 * ký cái thứ hai, và người dùng sẽ tưởng app hỏng.
 */

import { useEffect, useRef, useState } from 'react';
import type { I18nKey } from '@shared/i18n';

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

type Props = {
  bindings: Record<string, string>;
  labels: { id: string; i18n: I18nKey }[];
  t: (key: I18nKey) => string;
  onChange: (bindings: Record<string, string>) => void;
};

export function HotkeyControl({ bindings, labels, t, onChange }: Props) {
  const [recording, setRecording] = useState<string | null>(null);

  const duplicates = findDuplicates(bindings);

  return (
    <div className="hotkeys">
      {labels.map(({ id, i18n }) => (
        <div className="hotkeys__row" key={id}>
          <span className="hotkeys__label">{t(i18n)}</span>
          <HotkeyField
            value={bindings[id] ?? ''}
            recording={recording === id}
            duplicate={duplicates.has(bindings[id] ?? '')}
            onStart={() => setRecording(id)}
            onCapture={(accelerator) => {
              setRecording(null);
              onChange({ ...bindings, [id]: accelerator });
            }}
            onCancel={() => setRecording(null)}
          />
        </div>
      ))}
    </div>
  );
}

type FieldProps = {
  value: string;
  recording: boolean;
  duplicate: boolean;
  onStart: () => void;
  onCapture: (accelerator: string) => void;
  onCancel: () => void;
};

function HotkeyField({ value, recording, duplicate, onStart, onCapture, onCancel }: FieldProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (recording) ref.current?.focus();
  }, [recording]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();

    if (e.key === 'Escape') return onCancel();
    // Backspace xoá phím tắt — chuỗi rỗng nghĩa là tắt.
    if (e.key === 'Backspace') return onCapture('');
    // Bỏ qua khi mới chỉ giữ phím bổ trợ, chưa bấm phím chính.
    if (MODIFIER_KEYS.has(e.key)) return;

    onCapture(toAccelerator(e));
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`hotkeys__field${recording ? ' is-recording' : ''}${duplicate ? ' is-duplicate' : ''}`}
      onClick={onStart}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
    >
      {recording ? '…' : value || '—'}
    </button>
  );
}

/** Chuyển sự kiện bàn phím sang cú pháp accelerator của Electron. */
function toAccelerator(e: React.KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) parts.push('Command');
  if (e.ctrlKey) parts.push('Control');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(key);
  return parts.join('+');
}

function findDuplicates(bindings: Record<string, string>): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const accelerator of Object.values(bindings)) {
    if (!accelerator) continue;
    if (seen.has(accelerator)) dupes.add(accelerator);
    seen.add(accelerator);
  }
  return dupes;
}
