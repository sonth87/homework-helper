/**
 * Offscreen AI Provider Streaming
 * Cloud provider fetch() calls (Gemini / OpenAI-compatible / Claude) run here
 * instead of in the service worker. MV3 kills the service worker if a
 * fetch() response takes more than ~30s to arrive — and "thinking" models
 * routinely blow past that before sending a single byte. Offscreen documents
 * are regular page contexts and aren't subject to that limit, so the request
 * survives regardless of how long the model takes.
 *
 * While a request is in flight, a periodic heartbeat message is sent back to
 * the service worker. Chrome resets a service worker's idle timer whenever
 * it receives a message from an offscreen document, which keeps the worker
 * alive for the (possibly silent, pre-first-byte) duration of the request.
 */

import { formatStudyPrompt } from '../shared/study-prompt.js';
import { runOcrInOffscreen } from '../background/ocr-bridge.js';

console.log('[Offscreen AI Stream] Initialized in extension origin.');

const HEARTBEAT_INTERVAL_MS = 15000;
const activeControllers = new Map(); // requestId -> AbortController

/**
 * Google Gemini SSE Stream
 */
async function streamGemini(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt }, onChunk, signal) {
  const baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  const model = config.model || 'gemini-2.5-flash';
  const url = `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

  const parts = [];
  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const mimeType = imageBase64.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/jpeg';
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64,
      },
    });
  }

  const fullPrompt = formatStudyPrompt(studyMode, prompt, outputLanguage);
  parts.push({ text: fullPrompt });

  const payload = {
    contents: [{ role: 'user', parts }],
    system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    const err = new Error(`Gemini API Error (${response.status}): ${errText}`);
    err.status = response.status;
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr) {
          try {
            const data = JSON.parse(jsonStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              onChunk(text, { status: 'streaming', model });
            }
          } catch (e) {
            // ignore partial chunk
          }
        }
      }
    }
  }
}

/**
 * OpenAI / DeepSeek / Groq / OpenRouter / Custom Streaming
 */
async function streamOpenAiCompatible(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt }, onChunk, signal) {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = config.model || 'gpt-4o';
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  let effectiveImage = imageBase64;
  let effectivePrompt = prompt;

  // Text-only local models (Ollama/LM Studio) can't read the image at all —
  // OCR it into text first instead of silently sending an image the model
  // will ignore or choke on.
  const isLocalTextOnly = (config.provider === 'ollama' || config.provider === 'lmstudio') && config.isVision === false;
  if (isLocalTextOnly && imageBase64 && config.ocrFallback !== false) {
    onChunk('', { status: 'switching', notice: `Model "${model}" không đọc được ảnh trực tiếp, đang OCR trích xuất chữ từ ảnh trước khi gửi...` });
    try {
      const ocrText = await runOcrInOffscreen(imageBase64, outputLanguage);
      effectivePrompt = ocrText.trim()
        ? `${prompt}\n\n[Nội dung câu hỏi & các phương án từ ảnh]:\n${ocrText.trim()}`
        : prompt;
    } catch (ocrErr) {
      console.warn('[Offscreen AI Stream] OCR fallback failed, sending text-only prompt:', ocrErr);
      onChunk('', { status: 'switching', notice: `OCR ảnh thất bại (${ocrErr.message}), tiếp tục với câu hỏi dạng văn bản...` });
    }
    effectiveImage = null;
  }

  const userContent = [];
  if (effectiveImage) {
    const formattedUrl = effectiveImage.startsWith('data:') ? effectiveImage : `data:image/jpeg;base64,${effectiveImage}`;
    userContent.push({
      type: 'image_url',
      image_url: { url: formattedUrl },
    });
  }

  const fullPrompt = formatStudyPrompt(studyMode, effectivePrompt, outputLanguage);
  userContent.push({ type: 'text', text: fullPrompt });

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userContent.length === 1 ? fullPrompt : userContent });

  const payload = {
    model,
    messages,
    stream: true,
    temperature: 0.4,
    max_tokens: 4096,
  };

  const headers = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // Local servers (Ollama/LM Studio) that are turned off or unreachable
  // don't always fail fast — a plain fetch can hang well past what a user
  // will wait for, blocking the fallback-to-Nano logic in ask(). Bound the
  // connection attempt so a dead local server surfaces as a normal error
  // instead of a silent hang.
  const isLocalProvider = config.provider === 'ollama' || config.provider === 'lmstudio';
  const connectTimeoutMs = isLocalProvider ? 15000 : 30000;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), connectTimeoutMs);
  const fetchSignal = signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: fetchSignal,
    });
  } catch (fetchErr) {
    if (timeoutController.signal.aborted && !signal?.aborted) {
      const timeoutErr = new Error(
        isLocalProvider
          ? `Không thể kết nối tới server local (${baseUrl}) sau ${connectTimeoutMs / 1000}s. Kiểm tra Ollama/LM Studio có đang chạy không.`
          : `Kết nối tới ${config.provider.toUpperCase()} quá thời gian chờ (${connectTimeoutMs / 1000}s).`
      );
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw fetchErr;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text();
    const err = new Error(`${config.provider.toUpperCase()} API Error (${response.status}): ${errText}`);
    err.status = response.status;
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const data = JSON.parse(jsonStr);
          const text = data.choices?.[0]?.delta?.content;
          if (text) {
            onChunk(text, { status: 'streaming', model });
          }
        } catch (e) {
          // ignore partial JSON
        }
      }
    }
  }
}

/**
 * Anthropic Claude Streaming
 */
async function streamClaude(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt }, onChunk, signal) {
  const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  const model = config.model || 'claude-3-5-sonnet-20241022';
  const url = `${baseUrl.replace(/\/+$/, '')}/messages`;

  const content = [];
  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const mediaType = imageBase64.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/jpeg';
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: cleanBase64,
      },
    });
  }

  const fullPrompt = formatStudyPrompt(studyMode, prompt, outputLanguage);
  content.push({ type: 'text', text: fullPrompt });

  const payload = {
    model,
    max_tokens: 4096,
    system: systemPrompt || undefined,
    messages: [{ role: 'user', content }],
    stream: true,
    temperature: 0.4,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    const err = new Error(`Claude API Error (${response.status}): ${errText}`);
    err.status = response.status;
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6).trim();
        try {
          const data = JSON.parse(jsonStr);
          if (data.type === 'content_block_delta' && data.delta?.text) {
            onChunk(data.delta.text, { status: 'streaming', model });
          }
        } catch (e) {
          // ignore partial JSON
        }
      }
    }
  }
}

const PROVIDER_STREAMERS = {
  gemini: streamGemini,
  claude: streamClaude,
};

function pickStreamer(provider) {
  return PROVIDER_STREAMERS[provider] || streamOpenAiCompatible;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'OFFSCREEN_ASK_AI_PROVIDER') {
    const { provider, config, requestId, ...params } = message.payload || {};
    const controller = new AbortController();
    activeControllers.set(requestId, controller);

    const heartbeat = setInterval(() => {
      chrome.runtime.sendMessage({ action: 'OFFSCREEN_AI_HEARTBEAT', requestId }).catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    const onChunk = (chunk, meta) => {
      chrome.runtime.sendMessage({ action: 'OFFSCREEN_AI_CHUNK', requestId, chunk, meta }).catch(() => {});
    };

    (async () => {
      try {
        const streamer = pickStreamer(provider);
        await streamer(config, params, onChunk, controller.signal);
        chrome.runtime.sendMessage({ action: 'OFFSCREEN_AI_DONE', requestId, success: true }).catch(() => {});
      } catch (err) {
        chrome.runtime.sendMessage({
          action: 'OFFSCREEN_AI_DONE',
          requestId,
          success: false,
          error: err.message || String(err),
          status: err.status,
          aborted: controller.signal.aborted,
        }).catch(() => {});
      } finally {
        clearInterval(heartbeat);
        activeControllers.delete(requestId);
      }
    })();

    // One-way fire-and-forget: completion/chunks are relayed via separate
    // OFFSCREEN_AI_* messages above, not via sendResponse.
    return false;
  }

  if (message.action === 'OFFSCREEN_ABORT_AI') {
    const { requestId } = message.payload || {};
    activeControllers.get(requestId)?.abort();
    activeControllers.delete(requestId);
    return false;
  }
});
