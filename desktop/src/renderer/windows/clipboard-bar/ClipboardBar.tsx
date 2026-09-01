/**
 * Ba nút hành động cho đoạn text vừa copy — Tóm tắt / Giải thích / Viết lại.
 *
 * KHÔNG có nút "Dịch": translate thuộc Lane A (quickTranslate() + HoverOverlay,
 * xem hover.window.ts), luồng UI khác hẳn ba intent còn lại (đều đi qua
 * showResult() của Lane B) — trộn hai luồng vào cùng một thanh sẽ cần state
 * hiển thị khác nhau tuỳ nút bấm, phức tạp hơn đáng kể cho một bản đầu tiên.
 * KHÔNG có nút "Giải" (solve): acquisition của intent đó là ['capture'] —
 * luôn mở lớp phủ khoanh vùng màn hình, bỏ qua hẳn text đã copy, nên bấm vào
 * đây sẽ gây khó hiểu (tưởng xử lý đoạn vừa copy, hoá ra lại đi chọn vùng).
 * Xem roadmap/desktop-app-implementation-plan.md mục Phase 4 cho lý do đầy đủ.
 */

import { useEffect, useState } from 'react';
import { createTranslator } from '@shared/i18n';
import type { I18nKey } from '@shared/i18n/keys';
import type { Intent } from '@shared/types/intent';

// Ánh xạ tường minh thay vì ghép chuỗi `intent${Capitalize<Intent>}` — ghép
// chuỗi cần ép kiểu (as I18nKey), phá đúng lưới an toàn "gõ sai key là lỗi
// biên dịch" mà keys.ts được thiết kế để đảm bảo (xem i18n/keys.ts).
const ACTIONS: { intent: Intent; label: I18nKey }[] = [
  { intent: 'summarize', label: 'intentSummarize' },
  { intent: 'explain', label: 'intentExplain' },
  { intent: 'rewrite', label: 'intentRewrite' },
];

export function ClipboardBar() {
  const [uiLanguage, setUiLanguage] = useState('vi');
  const t = createTranslator(uiLanguage);

  useEffect(() => {
    window.api?.invoke('settings:get').then((s) => setUiLanguage(s.uiLanguage)).catch(() => undefined);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.api?.send('clipboard-bar:dismiss', {});
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const run = (intent: Intent) => window.api?.send('clipboard-bar:action', { intent });

  return (
    <div className="cbar">
      {ACTIONS.map(({ intent, label }) => (
        <button key={intent} type="button" className="cbar__btn" onClick={() => run(intent)}>
          {t(label)}
        </button>
      ))}
    </div>
  );
}
