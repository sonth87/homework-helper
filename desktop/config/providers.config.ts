/**
 * PROVIDER CATALOG — nơi DUY NHẤT biết danh sách nhà cung cấp AI.
 *
 * `capabilities` được kiểm tra TRƯỚC khi gửi request, nên "gửi ảnh cho model
 * text-only" là lỗi lúc định tuyến chứ không phải lỗi mạng phát hiện muộn.
 *
 * Thêm provider = thêm một entry ở đây + một thư mục trong src/main/ai/providers/.
 * Không có `switch (provider)` ở bất kỳ nơi nào khác trong codebase.
 *
 * File này isomorphic (renderer cũng đọc để dựng UI) — không dùng process/node.
 */

import type { ProviderCapabilities, ProviderId } from '../src/shared/types/ai';

export type ModelInfo = { id: string; name: string; vision?: boolean };

export type ProviderInfo = {
  readonly id: ProviderId;
  readonly name: string;
  /** Họ giao thức — quyết định adapter nào xử lý. Nhiều provider dùng chung một họ. */
  readonly family: 'gemini' | 'openai-compatible' | 'claude';
  readonly requiresKey: boolean;
  readonly requiresBaseUrl: boolean;
  readonly defaultBaseUrl: string;
  readonly isLocal: boolean;
  readonly capabilities: ProviderCapabilities;
  readonly models: readonly ModelInfo[];
  readonly docsUrl?: string;
};

export const PROVIDERS: Readonly<Record<ProviderId, ProviderInfo>> = {
  gemini: {
    id: 'gemini', name: 'Google Gemini', family: 'gemini',
    requiresKey: true, requiresBaseUrl: false, isLocal: false,
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    capabilities: { vision: true, streaming: true, thinking: true, structuredOutput: true, maxImageBytes: 20_000_000 },
    models: [
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', vision: true },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', vision: true },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', vision: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', vision: true },
    ],
    docsUrl: 'https://aistudio.google.com/apikey',
  },
  openai: {
    id: 'openai', name: 'OpenAI', family: 'openai-compatible',
    requiresKey: true, requiresBaseUrl: false, isLocal: false,
    defaultBaseUrl: 'https://api.openai.com/v1',
    capabilities: { vision: true, streaming: true, thinking: true, structuredOutput: true, maxImageBytes: 20_000_000 },
    models: [
      { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', vision: true },
      { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', vision: true },
      { id: 'gpt-4o', name: 'GPT-4o', vision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', vision: true },
    ],
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  claude: {
    id: 'claude', name: 'Anthropic Claude', family: 'claude',
    requiresKey: true, requiresBaseUrl: false, isLocal: false,
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    capabilities: { vision: true, streaming: true, thinking: true, structuredOutput: true, maxImageBytes: 5_000_000 },
    models: [
      { id: 'claude-opus-5', name: 'Claude Opus 5', vision: true },
      { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', vision: true },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', vision: true },
    ],
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  deepseek: {
    id: 'deepseek', name: 'DeepSeek', family: 'openai-compatible',
    requiresKey: true, requiresBaseUrl: false, isLocal: false,
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    // DeepSeek chưa hỗ trợ ảnh — capabilities.vision=false khiến router loại nó
    // khỏi các intent cần ảnh thay vì để API trả lỗi.
    capabilities: { vision: false, streaming: true, thinking: true, structuredOutput: true },
    models: [
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
      { id: 'deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
    ],
    docsUrl: 'https://platform.deepseek.com/api_keys',
  },
  groq: {
    id: 'groq', name: 'Groq', family: 'openai-compatible',
    requiresKey: true, requiresBaseUrl: false, isLocal: false,
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    capabilities: { vision: false, streaming: true, thinking: false, structuredOutput: true },
    models: [
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
    ],
    docsUrl: 'https://console.groq.com/keys',
  },
  ollama: {
    id: 'ollama', name: 'Ollama', family: 'openai-compatible',
    requiresKey: false, requiresBaseUrl: true, isLocal: true,
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    capabilities: { vision: true, streaming: true, thinking: true, structuredOutput: true },
    models: [
      { id: 'llama3.3', name: 'Llama 3.3' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B' },
      { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B' },
      { id: 'gemma2:9b', name: 'Gemma 2 9B' },
    ],
    docsUrl: 'https://ollama.com/download',
  },
  lmstudio: {
    id: 'lmstudio', name: 'LM Studio', family: 'openai-compatible',
    requiresKey: false, requiresBaseUrl: true, isLocal: true,
    defaultBaseUrl: 'http://127.0.0.1:1234/v1',
    capabilities: { vision: true, streaming: true, thinking: true, structuredOutput: true },
    models: [{ id: 'loaded-model', name: 'Mô hình đang nạp' }],
    docsUrl: 'https://lmstudio.ai',
  },
  custom: {
    id: 'custom', name: 'Custom / OpenRouter', family: 'openai-compatible',
    requiresKey: true, requiresBaseUrl: true, isLocal: false,
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    capabilities: { vision: true, streaming: true, thinking: true, structuredOutput: true },
    models: [{ id: 'custom-model', name: 'Custom Model' }],
    docsUrl: 'https://openrouter.ai/keys',
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);

/** Provider dùng được cho intent cần ảnh. */
export function visionProviders(): ProviderInfo[] {
  return PROVIDER_LIST.filter((p) => p.capabilities.vision);
}
