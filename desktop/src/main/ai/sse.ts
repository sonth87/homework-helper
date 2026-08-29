/**
 * Đọc luồng SSE từ một provider.
 *
 * Ba điều dễ sai và đều đã xử lý ở đây:
 *
 *   1. Chunk KHÔNG trùng ranh giới dòng. Một dòng SSE có thể bị cắt làm đôi
 *      giữa hai chunk mạng. Phải giữ phần dư và ghép với chunk sau, nếu không
 *      JSON.parse sẽ hỏng ngẫu nhiên tuỳ tốc độ mạng.
 *
 *   2. Timeout phải tính từ BYTE ĐẦU TIÊN, không phải từ lúc gửi. Model suy
 *      luận im lặng vài chục giây trước khi trả chữ đầu là bình thường; đặt
 *      timeout tổng ngắn sẽ cắt ngang những câu trả lời hợp lệ.
 *
 *   3. Huỷ phải giải phóng reader. Bỏ qua thì kết nối treo cho tới khi
 *      tiến trình thoát.
 */

import { LIMITS } from '@config/limits.config';
import type { ProviderError } from '@shared/types/ai';
import type { ProviderRequest } from './providers/types';

export type StreamOptions = {
  request: ProviderRequest;
  signal: AbortSignal;
  timeoutMs: number;
  onLine: (line: string) => void;
  onHttpError: (status: number, body: string) => ProviderError;
};

export async function streamSse(options: StreamOptions): Promise<ProviderError | null> {
  const { request, signal, timeoutMs, onLine, onHttpError } = options;

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });

  // Đồng hồ chờ byte đầu tiên. Nhận được byte đầu là huỷ đồng hồ này và
  // chuyển sang giới hạn tổng.
  let firstByteTimer: NodeJS.Timeout | null = setTimeout(
    () => controller.abort(),
    LIMITS.llmLane.firstByteTimeoutMs,
  );
  const totalTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request.url, { ...request.init, signal: controller.signal });

    if (!response.ok) {
      return onHttpError(response.status, await response.text().catch(() => ''));
    }
    if (!response.body) {
      return { message: 'Máy chủ không trả về nội dung.', retryable: true, cooldownMs: LIMITS.cooldown.serverErrorMs };
    }

    await readLines(response.body, onLine, () => {
      if (!firstByteTimer) return;
      clearTimeout(firstByteTimer);
      firstByteTimer = null;
    });
    return null;
  } catch (error) {
    // Người dùng chủ động huỷ không phải lỗi — đừng báo và đừng tạm ngưng key.
    if (signal.aborted) return null;

    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      message: aborted ? 'Hết thời gian chờ phản hồi.' : String(error instanceof Error ? error.message : error),
      retryable: true,
      cooldownMs: aborted ? 0 : LIMITS.cooldown.serverErrorMs,
    };
  } finally {
    if (firstByteTimer) clearTimeout(firstByteTimer);
    clearTimeout(totalTimer);
    signal.removeEventListener('abort', onAbort);
  }
}

/**
 * Đọc body thành từng dòng, ghép đúng các dòng bị cắt qua ranh giới chunk.
 *
 * Tách riêng khỏi streamSse() vì gộp lại thì độ phức tạp chu trình vượt ngưỡng
 * 15 mà ESLint đặt ra — và tách ra thì cũng dễ đọc hơn thật.
 */
async function readLines(
  body: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
  onFirstByte: () => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      onFirstByte();
      buffer += decoder.decode(value, { stream: true });

      // Giữ lại phần sau dấu xuống dòng cuối — đó có thể là một dòng chưa đủ.
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) onLine(line.trim());
    }

    if (buffer.trim()) onLine(buffer.trim());
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
