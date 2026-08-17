/**
 * Homework Helper - Main World Bridge for Chrome Built-in AI (Prompt API / Gemini Nano)
 * Runs in the webpage's MAIN world to access window.ai directly.
 */

(function () {
  if (window.__HOMEWORK_AI_MAIN_BRIDGE_LOADED__) return;
  window.__HOMEWORK_AI_MAIN_BRIDGE_LOADED__ = true;

  function getAiModel() {
    if (typeof ai !== 'undefined' && ai?.languageModel) {
      return ai.languageModel;
    }
    const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
    return g.ai?.languageModel || g.ai?.assistant || g.LanguageModel || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null);
  }

  // Handle Availability / Capability Check
  window.addEventListener('HOMEWORK_AI_NANO_CHECK', async (e) => {
    const aiModel = getAiModel();
    if (!aiModel) {
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_RESPONSE', {
        detail: { hasAi: false, available: 'no' }
      }));
      return;
    }

    try {
      const caps = typeof aiModel.capabilities === 'function' ? await aiModel.capabilities() : {};
      const avail = caps.available || caps.availability || 'readily';
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_RESPONSE', {
        detail: { hasAi: true, available: avail, caps }
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_RESPONSE', {
        detail: { hasAi: true, available: 'readily', error: err.message }
      }));
    }
  });

  // Handle Prompt Execution & Streaming
  window.addEventListener('HOMEWORK_AI_NANO_EXEC', async (e) => {
    const { prompt, requestId, systemPrompt } = e.detail || {};
    const aiModel = getAiModel();

    if (!aiModel) {
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_ERROR', {
        detail: { requestId, error: 'Không tìm thấy Prompt API (window.ai) trên trang web. Vui lòng đảm bảo đã bật cờ "#prompt-api" trong chrome://flags.' }
      }));
      return;
    }

    try {
      const session = await aiModel.create({
        systemPrompt: systemPrompt || undefined,
        temperature: 0.1,
        topK: 1,
      });

      if (typeof session.promptStreaming === 'function') {
        const stream = session.promptStreaming(prompt);
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
            window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_CHUNK', {
              detail: { requestId, chunk: delta }
            }));
          }
        }
        window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_FINISH', {
          detail: { requestId, success: true }
        }));
      } else {
        const reply = await session.prompt(prompt);
        window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_CHUNK', {
          detail: { requestId, chunk: reply }
        }));
        window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_FINISH', {
          detail: { requestId, success: true }
        }));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_ERROR', {
        detail: { requestId, error: err.message || 'Lỗi khi xử lý với Gemini Nano' }
      }));
    }
  });
})();
