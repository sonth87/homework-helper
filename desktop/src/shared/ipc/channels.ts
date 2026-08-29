/**
 * Contract IPC — khai báo MỘT LẦN, có type ở cả hai đầu.
 *
 * Vì sao quan trọng: main ↔ preload ↔ renderer truyền structured message qua ba
 * ranh giới process. Không có type, đổi tên một field sẽ KHÔNG lỗi lúc dev mà
 * chỉ lỗi ở bản đóng gói. Contract này khiến sai lệch bị bắt lúc biên dịch.
 *
 * `preload/api.ts` duyệt đúng object này để expose — không thể lỡ tay expose một
 * kênh chưa khai báo, và không rò rỉ `ipcRenderer` ra renderer.
 *
 * Thêm kênh mới = thêm một dòng ở đây, rồi implement handler ở src/main/ipc/.
 */

import type { Settings } from '@config/settings';
import type { Rect } from '../types/geometry';
import type { Intent, StudyMode } from '../types/intent';
import type { AiDelta, ProviderId } from '../types/ai';
import type { OcrResult } from '../types/content';

// ── Khai báo kiểu kênh ──────────────────────────────────────────────────────

/** Kênh request/response: gửi đi, chờ một kết quả. */
export type RequestChannel<Req, Res> = { kind: 'request'; __req?: Req; __res?: Res };

/** Kênh streaming: gửi đi, nhận nhiều mảnh dữ liệu cho tới khi xong hoặc bị huỷ. */
export type StreamChannel<Req, Chunk> = { kind: 'stream'; __req?: Req; __chunk?: Chunk };

const req = <Req = void, Res = void>(): RequestChannel<Req, Res> => ({ kind: 'request' });
const stream = <Req, Chunk>(): StreamChannel<Req, Chunk> => ({ kind: 'stream' });

// ── Payload ─────────────────────────────────────────────────────────────────

export type AskParams = {
  intent: Intent;
  prompt: string;
  imageBase64?: string;
  studyMode?: StudyMode;
  preferredConfigId?: string;
  conversationId?: string;
};

export type QuickTranslateParams = {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
};

export type TranslationResult = {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  fromCache: boolean;
};

export type CaptureResult = {
  imageBase64: string;
  area: Rect<'screen-physical'>;
  displayId: number;
  scaleFactor: number;
};

export type OcrParams = { imageBase64: string; languages: string[] };

export type ProviderTestResult =
  | { ok: true; latencyMs: number; model: string }
  | { ok: false; error: string };

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
};

// ── Danh mục kênh ───────────────────────────────────────────────────────────

export const IPC = {
  // Cấu hình
  'settings:get': req<void, Settings>(),
  'settings:patch': req<Partial<Settings>, void>(),
  'settings:reset': req<void, Settings>(),

  // Khoá bí mật — LƯU TRONG OS KEYCHAIN, không bao giờ đi qua kênh settings
  'secrets:setApiKey': req<{ configId: string; apiKey: string }, void>(),
  'secrets:hasApiKey': req<{ configId: string }, boolean>(),
  'secrets:deleteApiKey': req<{ configId: string }, void>(),

  // Lane A — dịch nhanh, miễn phí, không gọi LLM
  'translate:quick': req<QuickTranslateParams, TranslationResult>(),

  // Lane B — suy luận LLM, streaming
  'ai:ask': stream<AskParams, AiDelta>(),
  'ai:testProvider': req<{ provider: ProviderId; configId: string }, ProviderTestResult>(),
  'ai:detectLocalModels': req<{ baseUrl: string }, string[]>(),

  // Thu nhận nội dung từ màn hình
  'capture:region': req<void, CaptureResult | null>(),
  'capture:fullscreen': req<{ displayId?: number }, CaptureResult>(),
  'ocr:recognize': req<OcrParams, OcrResult>(),

  // Lịch sử
  'history:list': req<{ limit?: number; offset?: number }, Conversation[]>(),
  'history:delete': req<{ id: string }, void>(),
  'history:clear': req<void, void>(),

  // Vỏ ứng dụng
  'shell:openExternal': req<{ url: string }, void>(),
  'shell:openSettings': req<void, void>(),
  'permissions:check': req<void, { accessibility: boolean; screenRecording: boolean }>(),
} as const;

// ── Kiểu dẫn xuất — không viết tay ──────────────────────────────────────────

export type Channel = keyof typeof IPC;

export type RequestChannelName = {
  [K in Channel]: (typeof IPC)[K] extends RequestChannel<unknown, unknown> ? K : never;
}[Channel];

export type StreamChannelName = {
  [K in Channel]: (typeof IPC)[K] extends StreamChannel<unknown, unknown> ? K : never;
}[Channel];

export type ReqOf<K extends Channel> =
  (typeof IPC)[K] extends RequestChannel<infer R, unknown> ? R
  : (typeof IPC)[K] extends StreamChannel<infer R, unknown> ? R
  : never;

export type ResOf<K extends RequestChannelName> =
  (typeof IPC)[K] extends RequestChannel<unknown, infer R> ? R : never;

export type ChunkOf<K extends StreamChannelName> =
  (typeof IPC)[K] extends StreamChannel<unknown, infer C> ? C : never;

/** API mà preload expose ra `window.api`. Renderer chỉ thấy đúng bề mặt này. */
export type RendererApi = {
  invoke<K extends RequestChannelName>(
    channel: K,
    ...args: ReqOf<K> extends void ? [] : [ReqOf<K>]
  ): Promise<ResOf<K>>;

  stream<K extends StreamChannelName>(
    channel: K,
    payload: ReqOf<K>,
    onChunk: (chunk: ChunkOf<K>) => void,
  ): { done: Promise<void>; abort: () => void };

  onSettingsChanged(cb: (settings: Settings) => void): () => void;
};
