/**
 * Offscreen Document Bridge
 * Tesseract's WebAssembly worker needs a DOM/Worker-capable context that a
 * bare MV3 service worker doesn't reliably provide, so recognition actually
 * runs in an offscreen document (offscreen/ocr.html). Cloud AI provider
 * streaming (offscreen-ai-bridge.js) piggybacks on the same document — only
 * one offscreen document is allowed per extension — since regular fetch()
 * calls there aren't subject to the service worker's 30s response timeout.
 * ensureOffscreenDocument() is shared infrastructure for both.
 */

let creatingOffscreenPromise = null;

export async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen/ocr.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) return;

  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return;
  }

  creatingOffscreenPromise = chrome.offscreen.createDocument({
    url: 'offscreen/ocr.html',
    reasons: ['WORKERS', 'BLOBS'],
    justification: 'Run WebAssembly Tesseract OCR offline and stream cloud AI provider responses outside the service worker\'s 30s fetch timeout',
  });

  await creatingOffscreenPromise;
  creatingOffscreenPromise = null;
}

/**
 * Run OCR on a base64 image via the offscreen document.
 * @param {string} imageBase64
 * @param {string} [targetLang]
 * @param {string} [requestId]
 * @returns {Promise<string>} recognized text
 */
export async function runOcrInOffscreen(imageBase64, targetLang = 'vi', requestId = `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`) {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    action: 'OFFSCREEN_RUN_OCR',
    payload: { imageBase64, targetLang, requestId },
  });
  if (!response || !response.success) {
    throw new Error(response?.error || 'OCR nhận diện thất bại.');
  }
  return response.text || '';
}
