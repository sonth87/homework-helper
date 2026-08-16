/**
 * Background Service Worker (Manifest V3)
 * Manages extension lifecycle, commands, context menus, tab capture, and AI stream routing.
 */

import { AiEngine } from './ai-engine.js';
import { keyRotator } from './key-rotator.js';
import { Storage } from '../shared/storage.js';

// State & active streams
const activeStreams = new Map(); // requestId -> AbortController

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

  // Enable SidePanel on action click if supported
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.log('SidePanel behavior note:', err);
    });
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
chrome.commands.onCommand.addListener(async (command, tab) => {
  console.log('[Background] Received command:', command);

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || !activeTab.id) return;

  if (command === 'screenshot' || command === 'capture') {
    chrome.tabs.sendMessage(activeTab.id, { action: 'START_CROP' }).catch(() => {});
  } else if (command === 'chat' || command === 'open_sidepanel') {
    if (chrome.sidePanel) {
      await chrome.sidePanel.open({ windowId: activeTab.windowId }).catch(() => {});
    } else {
      chrome.tabs.sendMessage(activeTab.id, { action: 'TOGGLE_OVERLAY' }).catch(() => {});
    }
  }
});

// 4. Runtime Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, payload } = message || {};

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
    const { prompt, imageBase64, studyMode, preferredConfigId, requestId = `req_${Date.now()}` } = payload || {};
    const abortController = new AbortController();
    activeStreams.set(requestId, abortController);

    (async () => {
      const { systemPrompt, outputLanguage = 'en' } = await Storage.get(['systemPrompt', 'outputLanguage']);
      try {
        await AiEngine.ask(
          { prompt, imageBase64, studyMode, preferredConfigId, systemPrompt, outputLanguage },
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
});
