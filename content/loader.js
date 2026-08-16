/**
 * Content Script ES Module Loader
 * Dynamically imports modular content script entrypoint from web_accessible_resources
 */

(async () => {
  try {
    // Inject Main World Bridge to access window.ai directly in the page context
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/main-world-bridge.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);

    const src = chrome.runtime.getURL('content/index.js');
    await import(src);
  } catch (err) {
    console.error('[HomeworkAI] Failed to load content scripts:', err);
  }
})();
