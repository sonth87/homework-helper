/**
 * Homework Helper - Main World Bridge for Chrome Built-in AI (Prompt API / Gemini Nano)
 * Runs in the webpage's MAIN world to access window.ai directly.
 */

(function () {
  if (window.__HOMEWORK_AI_MAIN_BRIDGE_LOADED__) return;
  window.__HOMEWORK_AI_MAIN_BRIDGE_LOADED__ = true;

  // This script runs in the page's MAIN world, which has NO chrome.* access
  // (that's the entire reason this CustomEvent bridge exists) — so it cannot
  // import extension modules via chrome.runtime.getURL(). The tiny status
  // normalization logic from shared/nano-status.js is duplicated inline here
  // instead, rather than shared, since it genuinely can't be loaded from this
  // context.
  async function checkNanoAvailability(aiModel) {
    if (!aiModel) return 'unavailable';
    try {
      if (typeof aiModel.availability === 'function') {
        const raw = await aiModel.availability();
        if (raw === 'available' || raw === 'readily') return 'available';
        if (raw === 'downloadable') return 'downloadable';
        if (raw === 'downloading' || raw === 'after-download') return 'downloading';
        return 'unavailable';
      }
      if (typeof aiModel.capabilities === 'function') {
        const caps = await aiModel.capabilities();
        const raw = caps?.availability || caps?.available;
        if (raw === 'readily') return 'available';
        if (raw === 'after-download') return 'downloading';
        return 'unavailable';
      }
      if (typeof aiModel.create === 'function') return 'available';
      return 'unavailable';
    } catch (err) {
      return 'unavailable';
    }
  }

  function getAiModel() {
    if (typeof ai !== 'undefined' && ai?.languageModel) {
      return ai.languageModel;
    }
    const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
    return g.ai?.languageModel || g.ai?.assistant || g.LanguageModel || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null);
  }

  // Handle Availability Check
  window.addEventListener('HOMEWORK_AI_NANO_CHECK', async (e) => {
    const aiModel = getAiModel();
    if (!aiModel) {
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_RESPONSE', {
        detail: { hasAi: false, status: 'unavailable' }
      }));
      return;
    }

    const status = await checkNanoAvailability(aiModel);
    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_RESPONSE', {
      detail: { hasAi: true, status }
    }));
  });

  // Handle Prompt Execution & Streaming
  window.addEventListener('HOMEWORK_AI_NANO_EXEC', async (e) => {
    const { prompt, requestId, systemPrompt, responseConstraint } = e.detail || {};
    const aiModel = getAiModel();

    if (!aiModel) {
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_ERROR', {
        detail: { requestId, error: 'Không tìm thấy Prompt API (window.ai) trên trang web. Vui lòng đảm bảo đã bật cờ "#prompt-api" trong chrome://flags.' }
      }));
      return;
    }

    const status = await checkNanoAvailability(aiModel);
    if (status === 'unavailable') {
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_ERROR', {
        detail: { requestId, error: 'CHROME_AI_UNAVAILABLE: Gemini Nano is not available on this device/Chrome build.' }
      }));
      return;
    }
    const needsDownload = status !== 'available';
    if (needsDownload) {
      window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_DOWNLOAD_START', { detail: { requestId, status } }));
    }

    try {
      const session = await aiModel.create({
        systemPrompt: systemPrompt || undefined,
        temperature: 0.1,
        topK: 1,
        monitor(m) {
          // Chrome fires a trivial 0%→100% downloadprogress pair on every single
          // create() call, even when the model is already fully available and
          // nothing is actually being downloaded — only surface progress when
          // availability() told us beforehand that a real download is expected.
          if (!needsDownload) return;
          m.addEventListener('downloadprogress', (ev) => {
            const percent = Math.round((ev.loaded || 0) * 100);
            window.dispatchEvent(new CustomEvent('HOMEWORK_AI_NANO_PROGRESS', { detail: { requestId, percent } }));
          });
        },
      });

      if (typeof session.promptStreaming === 'function') {
        // For a single-word dictionary lookup the caller passes a JSON schema
        // to constrain the output. responseConstraint is only available on
        // newer Chrome builds, so retry without it rather than failing.
        let stream;
        try {
          stream = responseConstraint
            ? session.promptStreaming(prompt, { responseConstraint })
            : session.promptStreaming(prompt);
        } catch (constraintErr) {
          if (!responseConstraint) throw constraintErr;
          stream = session.promptStreaming(prompt);
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
