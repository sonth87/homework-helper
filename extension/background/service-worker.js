/**
 * Background Service Worker (Manifest V3)
 * Manages extension lifecycle, commands, context menus, tab capture, and AI stream routing.
 */

import { AiEngine } from './ai-engine.js';
import { keyRotator } from './key-rotator.js';
import { Storage } from '../shared/storage.js';
import { runOcrInOffscreen } from './ocr-bridge.js';
import { detectLocalModels } from '../shared/local-model-detect.js';
import { translateText, lookupWord } from './translate-engines.js';
import { isSingleWord } from '../shared/dictionary.js';
import { getCachedTranslation, setCachedTranslation } from './translate-cache.js';

// State & active streams
const activeStreams = new Map(); // requestId -> AbortController
const pendingOcrTabs = new Map(); // requestId -> tabId (for OCR progress forwarding)

// 1. Extension Installation & Setup
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed/updated:', details.reason);

  // Setup context menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'homework_ai_ask',
      title: 'Ask AI Homework Assistant',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'homework_ai_capture',
      title: 'Crop & Solve Formula (Alt+C)',
      contexts: ['page', 'image'],
    });
  });

  // The toolbar icon opens the action popup (the quick translator), NOT the
  // side panel: openPanelOnActionClick would override manifest.action's
  // default_popup entirely. The chat panel keeps its own entry points —
  // Alt+K / Cmd+K, the in-page floating button, and a button in that popup.
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((err) => {
      console.log('SidePanel behavior note:', err);
    });
  }

  // First-run onboarding: land directly on the Nano setup card so a fresh
  // install doesn't silently fall back to on-device AI with zero guidance.
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html#builtin-nano') });
  }
});

// 2. Context Menu Click Listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'homework_ai_ask' && info.selectionText) {
    // Open side panel and ask question
    if (chrome.sidePanel) {
      await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
    }
    chrome.tabs.sendMessage(tab.id, {
      action: 'QUICK_ASK_TEXT',
      text: info.selectionText,
    }).catch(() => {});
  } else if (info.menuItemId === 'homework_ai_capture') {
    chrome.tabs.sendMessage(tab.id, { action: 'START_CROP' }).catch(() => {});
  }
});

// 3. Command Keybinding Listener (Alt+K, Alt+C, etc.)
//
// Deliberately NOT an async listener, and deliberately uses the `tab` this
// callback is already handed instead of re-querying it. chrome.sidePanel.open()
// only works while Chrome still considers this call part of the user's
// keypress ("transient user activation") — awaiting anything (even a cheap
// chrome.tabs.query) before calling it spends that activation on the await
// instead, so open() silently rejects and .catch(() => {}) swallowed it.
// That's why Cmd+E (screenshot — plain tabs.sendMessage, no gesture
// requirement) kept working while Cmd+K (chat) quietly did nothing: this used
// to `await chrome.tabs.query(...)` before ever reaching sidePanel.open().
chrome.commands.onCommand.addListener((command, tab) => {
  console.log('[Background] Received command:', command);
  if (!tab || !tab.id) return;

  if (command === 'screenshot' || command === 'capture') {
    chrome.tabs.sendMessage(tab.id, { action: 'START_CROP' }).catch(() => {});
  } else if (command === 'chat' || command === 'open_sidepanel') {
    if (chrome.sidePanel) {
      chrome.sidePanel.open({ windowId: tab.windowId }).catch((err) => {
        console.warn('[Background] sidePanel.open() failed:', err);
      });
    } else {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_OVERLAY' }).catch(() => {});
    }
  }
});

// 4. Runtime Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, payload } = message || {};

  // content scripts can't call chrome.commands directly (that API isn't
  // exposed to their isolated world), so overlay.js asks here instead — it
  // needs the real per-OS bound accelerator to show next to the in-page FAB
  // buttons (e.g. "⌘K" on macOS) instead of a hardcoded Windows/Linux hint.
  if (action === 'GET_COMMAND_SHORTCUTS') {
    chrome.commands.getAll((cmds) => {
      sendResponse(Object.fromEntries((cmds || []).map((c) => [c.name, c.shortcut])));
    });
    return true; // Keep channel open (async sendResponse)
  }

  // Capture current tab viewport screenshot
  if (action === 'CAPTURE_VISIBLE_TAB') {
    (async () => {
      try {
        const windowId = sender.tab ? sender.tab.windowId : (await chrome.windows.getLastFocused()).id;
        chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
          if (chrome.runtime.lastError || !dataUrl) {
            sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Capture failed' });
          } else {
            sendResponse({ success: true, dataUrl });
          }
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open
  }

  // Open Side Panel
  if (action === 'OPEN_SIDEPANEL') {
    (async () => {
      try {
        const windowId = sender.tab ? sender.tab.windowId : (await chrome.windows.getLastFocused()).id;
        if (chrome.sidePanel) {
          await chrome.sidePanel.open({ windowId });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'SidePanel API not supported' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Open Options Page
  if (action === 'OPEN_OPTIONS') {
    const hash = message.hash ? `#${message.hash}` : '';
    const url = `options/options.html${hash}`;
    chrome.tabs.create({ url: chrome.runtime.getURL(url) });
    sendResponse({ success: true });
    return false;
  }

  // Open Chrome Flags Tab
  if (action === 'OPEN_CHROME_FLAGS') {
    const targetUrl = message.url || payload?.url || 'chrome://flags/#prompt-api-for-gemini-nano';
    chrome.tabs.create({ url: targetUrl });
    sendResponse({ success: true });
    return false;
  }

  // Probe a local Ollama/LM Studio server for its loaded models. Always run
  // from here (not the caller's own context) — this is the background
  // service worker, so the fetch is covered by host_permissions and isn't
  // subject to the CORS check a content-script-origin fetch would hit.
  if (action === 'DETECT_LOCAL_MODELS') {
    const { type, rawBaseUrl } = payload || {};
    (async () => {
      try {
        const result = await detectLocalModels(type, rawBaseUrl);
        sendResponse(result);
      } catch (err) {
        sendResponse({ ok: false, models: [], error: err.message });
      }
    })();
    return true;
  }

  // Quick Hover Translate (content/hover-translate.js) — plain machine
  // translation through the keyless engine chain, not the AI Key Pool: firing
  // on every hovered word needs to be instant and free, not an LLM call per
  // lookup. Same host_permissions/CORS reasoning as DETECT_LOCAL_MODELS above
  // — must run from the background, not the content script's origin.
  if (action === 'QUICK_TRANSLATE') {
    const { text, targetLang } = payload || {};
    (async () => {
      const from = 'auto';
      const to = (targetLang && targetLang !== 'auto') ? targetLang : 'en';
      try {
        const cached = await getCachedTranslation(text, from, to);
        if (cached) {
          sendResponse({ success: true, translation: cached.translation, detectedLang: cached.detectedLang });
          return;
        }

        const { popupTranslateEngine } = await Storage.get(['popupTranslateEngine']);
        const result = await translateText({ text, from, to, engine: popupTranslateEngine });
        setCachedTranslation(text, from, to, result).catch(() => {});
        sendResponse({ success: true, translation: result.translation, detectedLang: result.detectedLang });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Popup quick translator. Two routes behind one message: a keyless engine,
  // or the AI Key Pool when engine === 'ai'. The AI route is collected into a
  // single reply instead of streamed — the popup can be dismissed mid-stream
  // and would leave an orphaned AI_STREAM_CHUNK broadcast with no listener.
  if (action === 'TRANSLATE_TEXT') {
    const { text, from = 'auto', to = 'en', engine, preferredConfigId } = payload || {};
    (async () => {
      try {
        if (engine === 'ai') {
          const { systemPrompt } = await Storage.get(['systemPrompt']);
          let collected = '';
          let modelUsed = null;
          const abortController = new AbortController();
          await AiEngine.ask(
            { prompt: text, studyMode: 'translate', preferredConfigId, systemPrompt, outputLanguage: to },
            (chunk, meta) => {
              if (chunk) collected += chunk;
              if (meta?.model) modelUsed = meta.model;
            },
            abortController.signal
          );
          if (!collected.trim()) throw new Error('AI returned an empty translation.');
          sendResponse({ success: true, translation: collected.trim(), engine: 'ai', model: modelUsed, isAi: true });
          return;
        }

        // A single word gets a dictionary lookup first — phonetics, meanings by
        // part of speech, example sentences — so the free engines reach parity
        // with what the AI path already returns for a word. It answers null for
        // anything it does not recognise as a word, which falls through to a
        // plain translation below.
        if (isSingleWord(text)) {
          try {
            const { uiLanguage = 'en' } = await Storage.get(['uiLanguage']);
            const entry = await lookupWord({ word: text, from, to, displayLang: uiLanguage });
            if (entry) {
              sendResponse({
                success: true,
                translation: JSON.stringify(entry),
                detectedLang: entry.detectedLang,
                engine: 'google-dict',
                isDictionary: true,
                spoken: { source: entry.word, target: entry.translation },
                isAi: false,
              });
              return;
            }
          } catch {
            // Lookup is an enrichment, never a reason to fail the translation.
          }
        }

        const cached = await getCachedTranslation(text, from, to);
        if (cached) {
          // engine/fellBack không lưu trong cache (khoá cache gộp mọi engine
          // dịch máy làm một, xem translate-cache.js) — trả lại engine đang
          // được chọn hiện tại để UI (popup.js:247-248) không hiển thị
          // "undefined", và fellBack: false vì lần này không có chuyện rơi
          // provider nào cả, trả thẳng từ cache.
          sendResponse({ success: true, translation: cached.translation, detectedLang: cached.detectedLang, engine, fellBack: false, isAi: false });
          return;
        }

        const result = await translateText({ text, from, to, engine });
        setCachedTranslation(text, from, to, result).catch(() => {});
        sendResponse({
          success: true,
          translation: result.translation,
          detectedLang: result.detectedLang,
          engine: result.engine,
          fellBack: result.fellBack,
          isAi: false,
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Abort ongoing stream
  if (action === 'ABORT_STREAM') {
    const { requestId } = payload || {};
    if (requestId && activeStreams.has(requestId)) {
      activeStreams.get(requestId).abort();
      activeStreams.delete(requestId);
    }
    sendResponse({ success: true });
    return false;
  }

  // Ask AI via Port / Message
  if (action === 'ASK_AI') {
    const { prompt, imageBase64, studyMode, preferredConfigId, outputLanguage: reqLang, history, requestId = `req_${Date.now()}` } = payload || {};
    const abortController = new AbortController();
    activeStreams.set(requestId, abortController);

    (async () => {
      const { systemPrompt, outputLanguage: storedLang = 'en' } = await Storage.get(['systemPrompt', 'outputLanguage']);
      const outputLanguage = reqLang || storedLang;
      try {
        await AiEngine.ask(
          { prompt, imageBase64, studyMode, preferredConfigId, systemPrompt, outputLanguage, history },
          (chunk, meta) => {
            // Send chunk back to sender
            if (sender.tab && sender.tab.id) {
              chrome.tabs.sendMessage(sender.tab.id, {
                action: 'AI_STREAM_CHUNK',
                requestId,
                chunk,
                meta,
              }).catch(() => {});
            }
            // Also broadcast to any open sidepanel / extension pages
            chrome.runtime.sendMessage({
              action: 'AI_STREAM_CHUNK',
              requestId,
              chunk,
              meta,
            }).catch(() => {});
          },
          abortController.signal
        );

        // Notify stream complete
        const finishMsg = { action: 'AI_STREAM_COMPLETE', requestId, success: true };
        if (sender.tab && sender.tab.id) {
          chrome.tabs.sendMessage(sender.tab.id, finishMsg).catch(() => {});
        }
        chrome.runtime.sendMessage(finishMsg).catch(() => {});
      } catch (err) {
        if (!abortController.signal.aborted) {
          const errorMsg = { action: 'AI_STREAM_ERROR', requestId, error: err.message };
          if (sender.tab && sender.tab.id) {
            chrome.tabs.sendMessage(sender.tab.id, errorMsg).catch(() => {});
          }
          chrome.runtime.sendMessage(errorMsg).catch(() => {});
        }
      } finally {
        activeStreams.delete(requestId);
      }
    })();

    sendResponse({ success: true, requestId });
    return true;
  }

// OCR Recognition and Model Management Handlers
if (action === 'PERFORM_OCR') {
  const { imageBase64, targetLang = 'vi', requestId } = payload || {};
  const tabId = sender.tab?.id;
  // Store tabId so OCR_PROGRESS_UPDATE can forward to the right tab
  if (requestId && tabId) {
    pendingOcrTabs.set(requestId, tabId);
  }
  (async () => {
    try {
      const text = await runOcrInOffscreen(imageBase64, targetLang, requestId);
      sendResponse({ success: true, text });
    } catch (err) {
      console.error('[ServiceWorker] OCR dispatch error:', err);
      sendResponse({ success: false, error: err.message || String(err) });
    } finally {
      pendingOcrTabs.delete(requestId);
    }
  })();
  return true;
}

  if (action === 'OCR_PROGRESS_UPDATE') {
    // Look up the tabId from the stored map (offscreen docs don't carry sender.tab)
    const reqId = payload?.requestId;
    const tabId = pendingOcrTabs.get(reqId);
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { action: 'OCR_PROGRESS_UPDATE', payload }).catch(() => {});
    }
    return false;
  }

  if (action === 'DOWNLOAD_OCR_MODEL') {
    const { lang } = payload || {};
    (async () => {
      try {
        const { OcrEngine } = await import('../shared/ocr-engine.js');
        await OcrEngine.downloadModel(lang);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (action === 'DELETE_OCR_MODEL') {
    const { lang } = payload || {};
    (async () => {
      try {
        const { OcrEngine } = await import('../shared/ocr-engine.js');
        await OcrEngine.deleteModel(lang);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (action === 'CHECK_OCR_UPDATES') {
    (async () => {
      try {
        const { OcrEngine } = await import('../shared/ocr-engine.js');
        const updates = await OcrEngine.checkForUpdates();
        sendResponse({ success: true, updates });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});
