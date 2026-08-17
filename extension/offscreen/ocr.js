/**
 * Direct WebAssembly OCR Engine (High performance, Zero Worker Overhead)
 * Runs TesseractCore directly inside the Offscreen Document with instant caching
 */

import { OcrEngine } from '../shared/ocr-engine.js';

console.log('[Offscreen Direct OCR] Initialized in extension origin.');

let coreInstance = null;
let apiInstance = null;
let initializedLang = null;

async function getCoreInstance() {
  if (coreInstance) return coreInstance;
  if (typeof window.TesseractCore !== 'function') {
    throw new Error('TesseractCore WASM chưa sẵn sàng.');
  }
  coreInstance = await window.TesseractCore();
  return coreInstance;
}

async function getTessBaseApi(compLang, sendProgress) {
  const instance = await getCoreInstance();

  if (apiInstance && initializedLang === compLang) {
    return { instance, api: apiInstance };
  }

  if (apiInstance) {
    try {
      apiInstance.End();
    } catch (e) {}
    apiInstance = null;
  }

  sendProgress('Đang nạp từ điển Tiếng Việt & Toán học...', 35);

  // Load language traineddata files into Virtual FS
  const langs = compLang.split('+');
  for (const lang of langs) {
    const filePath = `/${lang}.traineddata`;
    try {
      instance.FS.stat(filePath);
    } catch (e) {
      sendProgress(`Đang nạp bộ dữ liệu [${lang}.traineddata]...`, 50);
      const url = chrome.runtime.getURL(`assets/ocr/${lang}.traineddata`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Không thể nạp tệp ${lang}.traineddata (${res.status})`);
      const buffer = await res.arrayBuffer();
      instance.FS.writeFile(filePath, new Uint8Array(buffer));
    }
  }

  sendProgress('Khởi tạo bộ xử lý nhận diện chữ...', 65);
  apiInstance = new instance.TessBaseAPI();
  const initRes = apiInstance.Init(null, compLang, 1);
  if (initRes !== 0) {
    throw new Error(`Khởi tạo TessBaseAPI cho [${compLang}] thất bại (Mã: ${initRes})`);
  }

  initializedLang = compLang;
  return { instance, api: apiInstance };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OFFSCREEN_RUN_OCR') {
    const { imageBase64, targetLang = 'vi', requestId, tabId } = message.payload || {};

    (async () => {
      try {
        const compLang = OcrEngine.getCompositeLanguage(targetLang);

        const sendProgress = (stepText, percent) => {
          console.log(`[Offscreen Direct OCR] [${percent}%] ${stepText}`);
          // chrome.tabs is NOT available in Offscreen Documents.
          // Forward exclusively via runtime → service-worker will relay to the tab.
          chrome.runtime.sendMessage({
            action: 'OCR_PROGRESS_UPDATE',
            payload: {
              requestId,
              step: stepText,
              pct: percent,
              tabId,
              time: new Date().toLocaleTimeString(),
            },
          }).catch(() => {});
        };

        sendProgress('Bắt đầu khởi động nhân WebAssembly...', 15);

        const { instance, api } = await getTessBaseApi(compLang, sendProgress);

        sendProgress('Đang quét và trích xuất chữ từ ảnh...', 75);

        // Convert base64 Data URL to Uint8Array
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const binaryStr = atob(cleanBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        instance.FS.writeFile('/input', bytes);
        api.SetImageFile('/input', 0);
        api.Recognize(null);

        sendProgress('Định dạng văn bản & công thức...', 95);
        const rawText = api.GetUTF8Text() || '';
        console.log('[Offscreen Direct OCR] Raw text extracted:\n', rawText);

        const cleanedText = OcrEngine.postProcessMathText(rawText);
        sendProgress('Nhận diện hoàn tất!', 100);

        sendResponse({ success: true, text: cleanedText });
      } catch (err) {
        console.error('[Offscreen Direct OCR] Error:', err);
        sendResponse({ success: false, error: err.message || String(err) });
      }
    })();

    return true;
  }
});
