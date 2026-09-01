import { Plus, Trash2 } from 'lucide-react';
import { INTENTS } from '@config/intents.config';
import type { Conversation } from '@shared/ipc/channels';
import type { I18nKey } from '@shared/i18n';

type Props = {
  conversations: Conversation[];
  activeId: string | null;
  t: (key: I18nKey) => string;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function HistoryList({ conversations, activeId, t, onOpen, onNew, onDelete }: Props) {
  return (
    <aside className="history">
      <button type="button" className="history__new" onClick={onNew}>
        <Plus size={14} strokeWidth={2} aria-hidden="true" />
        {t('intentChat')}
      </button>

      <div className="history__list">
        {conversations.map((c) => (
          <div key={c.id} className={`history__item${c.id === activeId ? ' is-active' : ''}`}>
            <button type="button" className="history__open" onClick={() => onOpen(c.id)}>
              <span className="history__title">{c.title || t('intentChat')}</span>
              <span className="history__meta">
                {t(INTENTS[c.intent]?.i18n ?? 'intentChat')} · {formatDate(c.updatedAt)}
              </span>
            </button>
            <button
              type="button"
              className="history__delete"
              aria-label={t('keysRemove')}
              onClick={() => onDelete(c.id)}
            >
              <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

/**
 * Hôm nay hiện giờ, cũ hơn hiện ngày. Người dùng cần phân biệt "sáng nay" với
 * "tuần trước", không cần biết giây.
 */
function formatDate(ts: number): string {
  const date = new Date(ts);
  const sameDay = new Date().toDateString() === date.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
}
