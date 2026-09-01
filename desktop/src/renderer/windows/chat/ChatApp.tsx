/**
 * Cửa sổ chat đa hội thoại.
 *
 * Lưu vào SQLite qua kênh history, không giữ trong state: đóng cửa sổ rồi mở
 * lại vẫn còn nguyên, và cửa sổ kết quả cũng ghi vào cùng một nơi.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Markdown } from '@renderer/components/markdown/Markdown';
import { createTranslator } from '@shared/i18n';
import type { ChatMessage, Conversation } from '@shared/ipc/channels';
import type { AiDelta } from '@shared/types/ai';
import { HistoryList } from './HistoryList';

export function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState('');
  const [busy, setBusy] = useState(false);
  const [uiLanguage, setUiLanguage] = useState('vi');
  const abortRef = useRef<(() => void) | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const t = createTranslator(uiLanguage);

  const refreshList = useCallback(async () => {
    const list = await window.api?.invoke('history:list', { limit: 100 });
    setConversations(list ?? []);
  }, []);

  useEffect(() => {
    window.api?.invoke('settings:get').then((s) => setUiLanguage(s.uiLanguage)).catch(() => undefined);
    void refreshList();
  }, [refreshList]);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setStreaming('');
    const rows = await window.api?.invoke('history:messages', { id });
    setMessages(rows ?? []);
  }, []);

  // Bám đáy khi có tin nhắn mới, nhưng không kéo ngược nếu người dùng đã cuộn lên.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;

    setDraft('');
    setBusy(true);
    setStreaming('');

    // Hội thoại mới lấy 60 ký tự đầu của câu hỏi làm tiêu đề — đủ để nhận ra
    // trong danh sách mà không cần gọi thêm AI chỉ để đặt tên.
    let id = activeId;
    if (!id) {
      id = (await window.api?.invoke('history:create', { intent: 'chat', title: text.slice(0, 60) })) ?? null;
      setActiveId(id);
      await refreshList();
    }
    if (!id) return;

    // Chụp lại TRƯỚC khi thêm tin nhắn mới vào state — đây đúng là các lượt
    // "trước" lượt sắp gửi. Chỉ text, không kèm ảnh dù lượt gốc từng có (xem
    // ghi chú ở AskParams.history) — cắt theo local/cloud là việc của
    // ai.service.ts, ChatApp chỉ gửi toàn bộ lịch sử đang có.
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    const now = Date.now();
    setMessages((prev) => [...prev, { id: now, role: 'user', content: text, createdAt: now }]);
    await window.api?.invoke('history:addMessage', { id, role: 'user', content: text });

    let answer = '';
    const stream = window.api?.stream(
      'ai:ask',
      { intent: 'chat', prompt: text, ...(history.length ? { history } : {}) },
      (d: AiDelta) => {
        if (d.type === 'text') {
          answer += d.text;
          setStreaming(answer);
        } else if (d.type === 'error') {
          // Không dùng emoji — nội dung này chảy thẳng vào `content` của tin
          // nhắn (chuỗi text/markdown thuần), không phải vị trí render React
          // component để chèn icon Lucide được. Để nguyên text lỗi, không
          // thêm ký hiệu gì trước nó.
          answer = answer || d.message;
          setStreaming(answer);
        }
      },
    );
    abortRef.current = stream?.abort ?? null;

    try {
      await stream?.done;
    } finally {
      if (answer) {
        await window.api?.invoke('history:addMessage', { id, role: 'assistant', content: answer });
        setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: answer, createdAt: Date.now() }]);
      }
      setStreaming('');
      setBusy(false);
      abortRef.current = null;
      void refreshList();
    }
  };

  return (
    <div className="chat">
      <HistoryList
        conversations={conversations}
        activeId={activeId}
        t={t}
        onOpen={(id) => void openConversation(id)}
        onNew={() => {
          setActiveId(null);
          setMessages([]);
          setStreaming('');
        }}
        onDelete={async (id) => {
          await window.api?.invoke('history:delete', { id });
          if (id === activeId) {
            setActiveId(null);
            setMessages([]);
          }
          await refreshList();
        }}
      />

      <main className="chat__main">
        <div className="chat__body" ref={bodyRef}>
          {messages.length === 0 && !streaming && <p className="chat__empty">{t('intentChat')}</p>}

          {messages.map((m) => (
            <div key={m.id} className={`bubble bubble--${m.role}`}>
              {m.role === 'assistant' ? <Markdown source={m.content} /> : m.content}
            </div>
          ))}

          {streaming && (
            <div className="bubble bubble--assistant">
              <Markdown source={streaming} />
            </div>
          )}
        </div>

        <form
          className="chat__composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            value={draft}
            rows={2}
            placeholder={t('intentChat')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter gửi, Shift+Enter xuống dòng — quy ước quen thuộc của mọi
              // ứng dụng chat.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button type={busy ? 'button' : 'submit'} onClick={busy ? () => abortRef.current?.() : undefined}>
            {busy ? t('keysRemove') : t('intentChat')}
          </button>
        </form>
      </main>
    </div>
  );
}
