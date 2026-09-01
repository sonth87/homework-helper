/**
 * Multi-Provider AI Streaming Client
 * Connects directly to Google Gemini, OpenAI, Claude, DeepSeek, Groq, and Custom endpoints.
 * Handles multimodal vision (images) and text streaming with automatic failover.
 */

import { keyRotator } from './key-rotator.js';
import { Storage, DEFAULT_NANO_SYSTEM_PROMPT } from '../shared/storage.js';
import { formatStudyPrompt } from '../shared/study-prompt.js';
import { streamViaOffscreen } from './offscreen-ai-bridge.js';
import { isSingleWord, DICTIONARY_SCHEMA } from '../shared/dictionary.js';
import { checkNanoAvailability, NANO_STATUS } from '../shared/nano-status.js';

// Cắt nông lịch sử hội thoại trước khi gửi cho model — không tóm tắt (tóm tắt
// tốn thêm 1 lần gọi model, có thể phản tác dụng vì local model vốn đã chậm).
// Local model giữ ít lượt hơn vì ngữ cảnh cộng thẳng vào thời gian chờ prefill
// mà người dùng cảm nhận được. Hai con số này CHƯA đo thực tế (máy dev không
// cài Ollama) — là ước lượng có lý do, không phải số đo — xem
// roadmap/known-issues.md mục 1. Desktop áp cùng logic, cùng ước lượng, ở
// desktop/config/limits.config.ts (LIMITS.llmLane.historyTurnsLocal/Cloud).
const HISTORY_TURNS_LOCAL = 6;
const HISTORY_TURNS_CLOUD = 20;

/**
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {boolean} isLocal
 */
function truncateHistory(history, isLocal) {
  if (!history || !history.length) return [];
  const max = isLocal ? HISTORY_TURNS_LOCAL : HISTORY_TURNS_CLOUD;
  return history.slice(-max);
}

export class AiEngine {
  /**
   * Main entrypoint to ask AI with text and optional image
   * @param {Object} params
   * @param {string} params.prompt - Text question / instructions
   * @param {string} [params.imageBase64] - Optional base64 image (with or without data URL prefix)
   * @param {string} [params.studyMode] - 'step-by-step' | 'direct' | 'hint' | 'explain' | 'translate'
   * @param {string} [params.preferredConfigId] - Specific config ID or null for auto-rotation
   * @param {Array<{role: 'user'|'assistant', content: string}>} [params.history] - Prior turns in the current conversation, oldest first
   * @param {Function} onChunk - Callback for incremental text chunks: onChunk(text, metadata)
   * @param {AbortSignal} [signal] - Abort signal
   */
  static async ask({ prompt, imageBase64, studyMode, preferredConfigId, systemPrompt, outputLanguage = 'en', history = [] }, onChunk, signal) {
    const { routingStrategy = 'prefer_nano', apiConfigs = [], nanoSystemPrompt, thinkingEnabled = true } = await Storage.get(['routingStrategy', 'apiConfigs', 'nanoSystemPrompt', 'thinkingEnabled']);
    const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin'));

    const langNames = {
      en: 'English',
      vi: 'Vietnamese',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      'zh-CN': 'Simplified Chinese',
      'zh-TW': 'Traditional Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      pt: 'Portuguese',
      id: 'Indonesian',
      ru: 'Russian',
    };
    const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'Vietnamese';
    let directSysInstruction = '';
    if (studyMode === 'direct') {
      directSysInstruction = `\n\n[STRICT DIRECT-ANSWER INSTRUCTION]: You MUST output ONLY the direct final answer. DO NOT write steps, reasoning, breakdown, analysis, or explanations. For multiple-choice questions, output ONLY the correct option letter and/or answer text (e.g. "Answer: 2" or "D. 2"). Keep the response under 1-2 lines.`;
    }

    // The language requirement is placed FIRST, ahead of the (often long,
    // English) base system prompt — weaker/local models (Ollama, LM Studio,
    // small quantized checkpoints) frequently default back to English when
    // a language directive is buried after several paragraphs of other
    // instructions, since it competes with the dominant English signal.
    const languageDirective = `[STRICT LANGUAGE REQUIREMENT — HIGHEST PRIORITY]: You MUST provide your entire response — solution, explanations, step-by-step reasoning, and final answer — in ${targetLangName}. Do NOT use any other language unless explicitly requested. This instruction overrides all other stylistic guidance below.`;
    const finalSystemPrompt = `${languageDirective}\n\n${systemPrompt || ''}${directSysInstruction}`.trim();

    const nanoPromptBase = nanoSystemPrompt || DEFAULT_NANO_SYSTEM_PROMPT;
    const nanoLanguageDirective = `[STRICT LANGUAGE — HIGHEST PRIORITY]: You MUST reply in ${targetLangName}, overriding all other instructions below.`;
    const nanoFinalSystemPrompt = `${nanoLanguageDirective}\n\n${nanoPromptBase}${directSysInstruction}`.trim();

    // 1. nano_only Strategy: 100% On-Device execution
    if (routingStrategy === 'nano_only') {
      onChunk('', { status: 'connecting', model: 'Gemini Nano (On-Device)', provider: 'chrome-builtin' });
      await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: nanoFinalSystemPrompt, history: truncateHistory(history, true) }, onChunk, signal);
      return;
    }

    // 2. prefer_nano Strategy (When text-only and no preferred external config, run Gemini Nano directly)
    if (routingStrategy === 'prefer_nano' && !imageBase64 && !preferredConfigId) {
      try {
        onChunk('', { status: 'connecting', model: 'Gemini Nano (On-Device)', provider: 'chrome-builtin' });
        await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: nanoFinalSystemPrompt, history: truncateHistory(history, true) }, onChunk, signal);
        return;
      } catch (nanoErr) {
        if (enabledKeys.length === 0) throw nanoErr;
        onChunk('', {
          status: 'switching',
          notice: 'Gemini Nano không khả dụng, tự động chuyển sang mô hình Cloud Vision API...',
          error: nanoErr.message,
        });
      }
    }

    // 3. API Config Pool Execution (used for prefer_config, config_only, or prefer_nano fallback/multimodal)
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const { config, strategy, totalAvailable } = await keyRotator.getHealthyConfigs(preferredConfigId);

      if (!config) {
        // Fallback to Gemini Nano if prefer_config is set
        if (routingStrategy === 'prefer_config' || routingStrategy === 'prefer_nano') {
          onChunk('', {
            status: 'switching',
            notice: 'Không có API Key khả dụng, tự động chuyển về Gemini Nano On-Device...',
          });
          await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: nanoFinalSystemPrompt, history: truncateHistory(history, true) }, onChunk, signal);
          return;
        }
        throw new Error('Chưa có API Key nào được kích hoạt trong Cài đặt.');
      }

      try {
        onChunk('', { status: 'connecting', model: config.model, provider: config.provider, attempt: attempts });

        if (config.provider === 'chrome-builtin') {
          await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: nanoFinalSystemPrompt, history: truncateHistory(history, true) }, onChunk, signal);
        } else {
          // Gemini / Claude / OpenAI-compatible (OpenAI, DeepSeek, Groq, OpenRouter, Custom).
          // The actual fetch() runs in the offscreen document, not here — MV3 kills the
          // service worker if a fetch() response takes over 30s to arrive, and "thinking"
          // models routinely take longer than that just to send their first byte.
          // Ollama/LM Studio are local even though they go through this same
          // OpenAI-compatible offscreen path — cắt lịch sử ngắn hơn cho chúng,
          // giống hệt cách streamChromeBuiltin được xử lý ở nhánh kia.
          const isLocalConfig = config.provider === 'ollama' || config.provider === 'lmstudio';
          await streamViaOffscreen(config.provider, config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt, thinkingEnabled, history: truncateHistory(history, isLocalConfig) }, onChunk, signal);
        }

        // Successfully completed
        await keyRotator.reportSuccess(config.id);
        return;
      } catch (err) {
        if (signal?.aborted) {
          throw err;
        }

        console.warn(`[AiEngine] Attempt ${attempts} failed on model ${config.model}:`, err);
        const statusCode = err.status || 500;
        await keyRotator.reportFailure(config.id, statusCode);

        if (attempts >= maxAttempts || totalAvailable <= 1) {
          // Last resort fallback to Gemini Nano if prefer_config
          if (routingStrategy === 'prefer_config' || routingStrategy === 'prefer_nano') {
            onChunk('', {
              status: 'switching',
              notice: 'Tất cả API Key đều bận hoặc không kết nối được, tự động chuyển về Gemini Nano On-Device...',
            });
            await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt, history: truncateHistory(history, true) }, onChunk, signal);
            return;
          }
          throw err;
        }

        // Notify UI about failover
        onChunk('', {
          status: 'switching',
          notice: `Key ${config.model} gặp giới hạn, tự động xoay sang key dự phòng...`,
          error: err.message,
        });
      }
    }
  }

  /**
   * Chrome Built-in AI (Gemini Nano On-Device Prompt API)
   */
  static async streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt, history = [] }, onChunk, signal) {
    if (imageBase64) {
      onChunk('', {
        status: 'switching',
        model: 'gemini-nano',
        isBuiltin: true,
        notice: 'Chrome Gemini Nano On-Device hiện tại chuyên về xử lý văn bản. Để phân tích hình ảnh và đồ thị, bạn có thể thêm API Key Google Gemini (Miễn phí) trong Cài đặt.',
      });
    }

    const fullPrompt = formatStudyPrompt(studyMode, prompt, outputLanguage);
    const getAi = () => {
      if (typeof chrome !== 'undefined' && chrome.aiOriginTrial?.languageModel) {
        return chrome.aiOriginTrial.languageModel;
      }
      if (typeof ai !== 'undefined' && ai?.languageModel) {
        return ai.languageModel;
      }
      const g = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {});
      return g.ai?.languageModel || g.ai?.assistant || g.LanguageModel || null;
    };
    const aiModel = getAi();

    if (aiModel && typeof aiModel.create === 'function') {
      const status = await checkNanoAvailability(aiModel);
      if (status === NANO_STATUS.UNAVAILABLE) {
        throw new Error('CHROME_AI_UNAVAILABLE: Gemini Nano is not available on this device (unsupported hardware/OS, or required Chrome flags are disabled).');
      }

      const isDownloading = status !== NANO_STATUS.AVAILABLE;
      if (isDownloading) {
        const initialPercent = status === NANO_STATUS.DOWNLOADING ? null : 0;
        await chrome.storage.local.set({ nanoDownloadState: { inProgress: true, percent: initialPercent, updatedAt: Date.now() } });
        onChunk('', { status: 'downloading', percent: initialPercent, model: 'Gemini Nano (On-Device)', isBuiltin: true });
      }

      let session;
      try {
        session = await aiModel.create({
          systemPrompt: systemPrompt || undefined,
          temperature: 0.4,
          topK: 3,
          // initialPrompts seeds prior turns into the session — role names match
          // our internal 'user'/'assistant' convention already (Prompt API spec).
          ...(history.length ? { initialPrompts: history.map((h) => ({ role: h.role, content: h.content })) } : {}),
          monitor(m) {
            // Chrome fires a trivial 0%→100% downloadprogress pair on every single
            // create() call, even when the model is already fully available and
            // nothing is actually being downloaded — only surface progress when
            // checkNanoAvailability() told us beforehand that a real download is expected.
            if (!isDownloading) return;
            m.addEventListener('downloadprogress', (ev) => {
              const percent = Math.round((ev.loaded || 0) * 100);
              chrome.storage.local.set({ nanoDownloadState: { inProgress: true, percent, updatedAt: Date.now() } });
              onChunk('', { status: 'downloading', percent, model: 'Gemini Nano (On-Device)', isBuiltin: true });
            });
          },
        });
      } finally {
        if (isDownloading) {
          await chrome.storage.local.set({ nanoDownloadState: { inProgress: false, percent: null, updatedAt: Date.now() } });
        }
      }

      if (typeof session.promptStreaming === 'function') {
        // A single-word lookup asks the Prompt API to constrain output to the
        // dictionary schema. responseConstraint only exists on newer Chrome
        // builds, and this codebase still supports the older ai.languageModel
        // shape — so fall back to an unconstrained call rather than failing
        // the lookup outright when the option isn't understood.
        const wantsSchema = studyMode === 'translate' && isSingleWord(prompt);
        let stream;
        try {
          stream = session.promptStreaming(
            fullPrompt,
            wantsSchema ? { signal, responseConstraint: DICTIONARY_SCHEMA } : { signal }
          );
        } catch (constraintErr) {
          if (!wantsSchema) throw constraintErr;
          console.warn('[AiEngine] Nano rejected responseConstraint, retrying unconstrained:', constraintErr);
          stream = session.promptStreaming(fullPrompt, { signal });
        }
        let accumulated = '';
        for await (const chunk of stream) {
          let delta = '';
          if (typeof chunk === 'string') {
            if (chunk.startsWith(accumulated)) {
              delta = chunk.slice(accumulated.length);
              accumulated = chunk;
            } else {
              delta = chunk;
              accumulated += chunk;
            }
          }
          if (delta) {
            onChunk(delta, { status: 'streaming', model: 'Gemini Nano (On-Device)', isBuiltin: true });
          }
        }
        chrome.storage?.local?.set?.({ isNanoReady: true });
        return;
      } else {
        const reply = await session.prompt(fullPrompt);
        onChunk(reply, { status: 'streaming', model: 'Gemini Nano (On-Device)', isBuiltin: true });
        chrome.storage?.local?.set?.({ isNanoReady: true });
        return;
      }
    }

    // Fallback: Run via active web tab where window.ai is directly exposed by Chrome
    let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    let targetTab = tabs && tabs[0]?.url && tabs[0].url.startsWith('http') ? tabs[0] : null;

    if (!targetTab) {
      const allWebTabs = await chrome.tabs.query({ url: ['https://*/*', 'http://*/*'] });
      targetTab = allWebTabs && allWebTabs.length > 0 ? allWebTabs[0] : null;
    }

    if (!targetTab?.id) {
      throw new Error(
        'Chrome Built-in AI cần ít nhất 1 tab web thông thường (https://) đang mở để kết nối. Bạn hãy mở một tab web (như https://google.com) rồi thử lại nhé.'
      );
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      world: 'MAIN',
      func: async (promptText, sysPrompt) => {
        const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
        const m = g.ai?.languageModel || g.ai?.assistant || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null);
        if (!m) throw new Error('Trình duyệt chưa sẵn sàng window.ai trên tab web.');
        const session = await m.create({ systemPrompt: sysPrompt || undefined });
        return await session.prompt(promptText);
      },
      args: [fullPrompt, systemPrompt || ''],
    });

    const reply = results?.[0]?.result;
    if (reply) {
      onChunk(reply, { status: 'streaming', model: 'Gemini Nano (On-Device)', isBuiltin: true });
      chrome.storage?.local?.set?.({ isNanoReady: true });
    } else {
      throw new Error('Không nhận được phản hồi từ Gemini Nano.');
    }
  }
}

