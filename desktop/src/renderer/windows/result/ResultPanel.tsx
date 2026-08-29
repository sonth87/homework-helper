/**
 * Cửa sổ kết quả của Lane B — nơi lời giải streaming hiện ra.
 *
 * Khác HoverOverlay ở mọi điểm quan trọng (ADR-0003): có focus, cuộn được, chọn
 * và sao chép được, và sống cho tới khi người dùng đóng. Đó là lý do nó phải là
 * một loại cửa sổ riêng chứ không phải HoverOverlay cấu hình khác.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Markdown } from '@renderer/components/markdown/Markdown';
import { createTranslator } from '@shared/i18n';
import type { AiDelta } from '@shared/types/ai';
import type { Intent, StudyMode } from '@shared/types/intent';

type Task = { intent: Intent; imageBase64?: string; prompt: string; studyMode?: StudyMode };

type Status =
  | { phase: 'idle' }
  | { phase: 'connecting'; model: string }
  | { phase: 'streaming'; model: string }
  | { phase: 'done'; model: string }
  | { phase: 'error'; message: string };

export function ResultPanel() {
  const [task, setTask] = useState<Task | null>(null);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState('');
  const [status, setStatus] = useState<Status>({ phase: 'idle' });
  const [uiLanguage, setUiLanguage] = useState('vi');
  const abortRef = useRef<(() => void) | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const t = createTranslator(uiLanguage);

  useEffect(() => {
    window.api?.invoke('settings:get').then((s) => setUiLanguage(s.uiLanguage)).catch(() => undefined);
    const onTask = (e: Event) => setTask((e as CustomEvent<Task>).detail);
    window.addEventListener('result:task', onTask);
    return () => window.removeEventListener('result:task', onTask);
  }, []);

  const run = useCallback((current: Task) => {
    setText('');
    setThinking('');
    setStatus({ phase: 'connecting', model: '' });

    const stream = window.api?.stream('ai:ask', {
      intent: current.intent,
      prompt: current.prompt,
      ...(current.imageBase64 ? { imageBase64: current.imageBase64 } : {}),
      ...(current.studyMode ? { studyMode: current.studyMode } : {}),
    }, (delta: AiDelta) => {
      if (delta.type === 'status') setStatus({ phase: 'connecting', model: delta.model });
      else if (delta.type === 'thinking') setThinking((prev) => prev + delta.text);
      else if (delta.type === 'text') {
        setText((prev) => prev + delta.text);
        setStatus((prev) => ({ phase: 'streaming', model: 'model' in prev ? prev.model : '' }));
      } else if (delta.type === 'error') setStatus({ phase: 'error', message: delta.message });
      else if (delta.type === 'done') {
        setStatus((prev) => ({ phase: 'done', model: 'model' in prev ? prev.model : '' }));
      }
    });

    abortRef.current = stream?.abort ?? null;
    stream?.done.catch((e: unknown) => setStatus({ phase: 'error', message: String(e) }));
  }, []);

  useEffect(() => {
    if (task) run(task);
  }, [task, run]);

  // Bám đáy khi đang stream, nhưng KHÔNG kéo ngược nếu người dùng đã cuộn lên
  // để đọc lại — cướp vị trí cuộn giữa chừng là thứ gây khó chịu nhất.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [text]);

  const busy = status.phase === 'connecting' || status.phase === 'streaming';

  return (
    <div className="result">
      <header className="result__head">
        <span className="result__status">
          {status.phase === 'connecting' && t('keysTesting')}
          {status.phase === 'streaming' && ('model' in status ? status.model : '')}
          {status.phase === 'done' && ('model' in status ? status.model : '')}
        </span>
        {busy && (
          <button type="button" onClick={() => abortRef.current?.()}>
            {t('keysRemove')}
          </button>
        )}
        <button type="button" onClick={() => void navigator.clipboard.writeText(text)} disabled={!text}>
          {t('keysOk')}
        </button>
      </header>

      <div className="result__body" ref={bodyRef}>
        {status.phase === 'error' && <p className="result__error">{status.message}</p>}

        {thinking && (
          <details className="result__thinking">
            <summary>{t('setThinkingEnabled')}</summary>
            <pre>{thinking}</pre>
          </details>
        )}

        {text ? <Markdown source={text} /> : busy && <div className="result__skeleton" />}
      </div>
    </div>
  );
}
