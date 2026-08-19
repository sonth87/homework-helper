/**
 * Offscreen AI Streaming Bridge
 * Delegates cloud provider (Gemini / OpenAI-compatible / Claude) requests to
 * the offscreen document — see offscreen/ai-stream.js for why. This wraps
 * the fire-and-forget message exchange in a Promise so callers in ai-engine.js
 * can keep using a plain `await streamViaOffscreen(...)`, same as a direct
 * provider call.
 */

import { ensureOffscreenDocument } from './ocr-bridge.js';

let seq = 0;

/**
 * @param {string} provider - 'gemini' | 'claude' | any OpenAI-compatible provider id
 * @param {Object} config - the API config (key, model, baseUrl, etc.)
 * @param {Object} params - { prompt, imageBase64, studyMode, outputLanguage, systemPrompt }
 * @param {Function} onChunk - onChunk(text, meta)
 * @param {AbortSignal} [signal]
 */
export async function streamViaOffscreen(provider, config, params, onChunk, signal) {
  await ensureOffscreenDocument();

  const requestId = `offai_${Date.now()}_${(seq++).toString(36)}`;

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      chrome.runtime.sendMessage({ action: 'OFFSCREEN_ABORT_AI', payload: { requestId } }).catch(() => {});
    };

    const cleanup = () => {
      chrome.runtime.onMessage.removeListener(listener);
      signal?.removeEventListener('abort', onAbort);
    };

    const listener = (message) => {
      if (!message || message.requestId !== requestId) return;

      if (message.action === 'OFFSCREEN_AI_CHUNK') {
        onChunk(message.chunk, message.meta);
      } else if (message.action === 'OFFSCREEN_AI_DONE') {
        cleanup();
        if (message.success) {
          resolve();
        } else {
          const err = new Error(message.error || 'Offscreen AI request failed');
          if (message.status) err.status = message.status;
          if (message.aborted) err.name = 'AbortError';
          reject(err);
        }
      }
      // OFFSCREEN_AI_HEARTBEAT needs no handling here — simply receiving any
      // message from the offscreen document resets this service worker's
      // idle timer, which is the whole point of the heartbeat.
    };

    chrome.runtime.onMessage.addListener(listener);

    if (signal) {
      if (signal.aborted) {
        cleanup();
        onAbort();
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', onAbort);
    }

    chrome.runtime.sendMessage({
      action: 'OFFSCREEN_ASK_AI_PROVIDER',
      payload: { provider, config, requestId, ...params },
    }).catch((err) => {
      cleanup();
      reject(err);
    });
  });
}
