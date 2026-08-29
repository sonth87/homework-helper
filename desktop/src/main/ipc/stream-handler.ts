/**
 * Hạ tầng streaming qua IPC.
 *
 * Đây là đường đi của MỌI phản hồi LLM và là rủi ro 🟠 đã ghi trong kế hoạch
 * ("streaming qua Electron IPC bị nghẽn/rò"). Ba vấn đề phải xử lý ngay từ đầu,
 * không để sau:
 *
 *   1. HUỶ — người dùng đóng cửa sổ hoặc bấm dừng giữa chừng. Không huỷ thì
 *      request vẫn chạy tới cùng và vẫn tính phí.
 *   2. RÒ — cửa sổ bị destroy trong lúc stream đang chạy. Gửi vào webContents
 *      đã chết sẽ ném lỗi, và listener không được gỡ sẽ giữ closure sống mãi.
 *   3. NGHẼN — model tuôn chunk nhanh hơn renderer vẽ. Gom chunk theo nhịp
 *      animation frame thay vì bắn từng cái một.
 */

import { ipcMain } from 'electron';
import type { IpcMainEvent, WebContents } from 'electron';
import type { ChunkOf, ReqOf, StreamChannelName } from '@shared/ipc/channels';
import { logger } from '../logging/logger';

/** Gom chunk trong khoảng này rồi gửi một lần. ~60fps. */
const FLUSH_INTERVAL_MS = 16;

type StreamRequest = { requestId: string; payload: unknown };

export type StreamContext<K extends StreamChannelName> = {
  payload: ReqOf<K>;
  emit: (chunk: ChunkOf<K>) => void;
  signal: AbortSignal;
};

type Handler<K extends StreamChannelName> = (ctx: StreamContext<K>) => Promise<void>;

const active = new Map<string, AbortController>();

export function registerStreamHandler<K extends StreamChannelName>(
  channel: K,
  handler: Handler<K>,
): void {
  ipcMain.on(channel, (event: IpcMainEvent, req: StreamRequest) => {
    void runStream(channel, handler, event.sender, req);
  });

  ipcMain.on(`${channel}:abort`, (_e, { requestId }: { requestId: string }) => {
    active.get(requestId)?.abort();
  });
}

async function runStream<K extends StreamChannelName>(
  channel: K,
  handler: Handler<K>,
  sender: WebContents,
  { requestId, payload }: StreamRequest,
): Promise<void> {
  const controller = new AbortController();
  active.set(requestId, controller);

  const flusher = createFlusher(sender, `${channel}:chunk:${requestId}`);
  // Cửa sổ đóng giữa chừng phải huỷ request — nếu không, LLM vẫn chạy tới cùng
  // và vẫn tính phí cho một câu trả lời không còn ai đọc.
  const onGone = () => controller.abort();
  sender.once('destroyed', onGone);

  try {
    await handler({
      payload: payload as ReqOf<K>,
      emit: flusher.push as (chunk: ChunkOf<K>) => void,
      signal: controller.signal,
    });
    flusher.flush();
    send(sender, `${channel}:end:${requestId}`);
  } catch (error) {
    flusher.flush();
    const message = error instanceof Error ? error.message : String(error);
    if (!controller.signal.aborted) logger.error(`Stream ${channel} lỗi`, message);
    send(sender, `${channel}:end:${requestId}`, controller.signal.aborted ? undefined : message);
  } finally {
    flusher.stop();
    sender.removeListener('destroyed', onGone);
    active.delete(requestId);
  }
}

/** Gửi an toàn: webContents có thể đã bị destroy giữa chừng. */
function send(sender: WebContents, channel: string, ...args: unknown[]): void {
  if (sender.isDestroyed()) return;
  sender.send(channel, ...args);
}

/**
 * Gom chunk theo nhịp thay vì bắn từng cái. Một model tuôn 200 token/giây sẽ
 * tạo 200 message IPC mỗi giây nếu không gom — renderer không vẽ kịp.
 */
function createFlusher(sender: WebContents, channel: string) {
  let queue: unknown[] = [];
  let timer: NodeJS.Timeout | null = null;

  const flush = () => {
    if (queue.length === 0) return;
    const batch = queue;
    queue = [];
    for (const chunk of batch) send(sender, channel, chunk);
  };

  return {
    push(chunk: unknown) {
      queue.push(chunk);
      timer ??= setInterval(flush, FLUSH_INTERVAL_MS);
    },
    flush,
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}

/** Huỷ mọi stream đang chạy — dùng khi thoát app. */
export function abortAllStreams(): void {
  for (const controller of active.values()) controller.abort();
  active.clear();
}
