/**
 * Offscreen OCR Bridge
 * Tesseract's WebAssembly worker needs a DOM/Worker-capable context that a
 * bare MV3 service worker doesn't reliably provide, so recognition actually
 * runs in an offscreen document (offscreen/ocr.html). This module ensures
 * that document exists and relays recognition requests to it. Shared by the
 * service worker's PERFORM_OCR message handler and AiEngine's OCR fallback
 * for text-only local models.
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
    justification: 'Run WebAssembly Tesseract OCR offline',
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
