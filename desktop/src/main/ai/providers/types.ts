/**
 * Giao diện adapter cho một họ provider.
 *
 * Tách ba mối quan tâm — dựng request, đọc chunk, chuẩn hoá lỗi — thay vì gộp
 * thành một hàm stream lớn. Extension hiện có `offscreen/ai-stream.js` 469 dòng
 * chứa cả ba việc cho cả ba họ; ở đây mỗi họ khoảng 80–120 dòng trong thư mục riêng.
 *
 * KHÔNG có `switch (provider)` ở bất kỳ đâu ngoài bảng đăng ký trong index.ts.
 */

import type { AiDelta, ProviderError } from '@shared/types/ai';

export type HistoryTurn = { role: 'user' | 'assistant'; content: string };

export type RequestContext = {
  baseUrl: string;
  apiKey: string | null;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  thinkingEnabled: boolean;
  maxOutputTokens?: number;
  /**
   * Các lượt TRƯỚC lượt hiện tại, đã được cắt theo `LIMITS.llmLane.historyTurns*`
   * ở ai.service.ts (adapter không tự cắt — không biết provider đang chạy có
   * phải local hay không). Rỗng/vắng mặt = lượt đầu tiên của hội thoại, hoặc
   * intent không phải chat (Crop & Solve là one-shot, xem ADR-0004).
   *
   * CHỈ TEXT — không lượt nào trong đây mang ảnh, kể cả nếu lượt gốc có ảnh.
   * Gửi lại ảnh mỗi lượt vừa tốn `maxImageBytes`, vừa không thêm giá trị vì
   * nội dung ảnh không đổi giữa các lượt.
   */
  history?: HistoryTurn[];
};

export type ProviderRequest = {
  url: string;
  init: RequestInit;
};

/** Trạng thái mang theo giữa các chunk — mỗi họ tự định nghĩa nội dung. */
export type ParseState = Record<string, unknown>;

export type ProviderAdapter = {
  readonly family: 'gemini' | 'openai-compatible' | 'claude';
  /** Header xác thực — dùng chung cho cả request stream lẫn lệnh kiểm tra kết nối. */
  authHeaders(apiKey: string | null): Record<string, string>;
  buildRequest(ctx: RequestContext): ProviderRequest;
  /** Nhận một dòng SSE đã tách, trả về 0..n delta. */
  parseLine(line: string, state: ParseState): AiDelta[];
  normalizeError(status: number, body: string): ProviderError;
};

/** Bóc phần data của một dòng SSE. Trả về null nếu dòng không phải data. */
export function sseData(line: string): string | null {
  if (!line.startsWith('data:')) return null;
  const payload = line.slice(5).trim();
  return payload === '[DONE]' || payload === '' ? null : payload;
}

/** Bỏ tiền tố data URL nếu có — mọi provider đều chỉ nhận base64 thuần. */
export function stripDataUrl(base64: string): string {
  const comma = base64.indexOf(',');
  return base64.startsWith('data:') && comma > -1 ? base64.slice(comma + 1) : base64;
}
