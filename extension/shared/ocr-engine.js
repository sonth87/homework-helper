/**
 * Homework Helper - Offline WebAssembly OCR Engine
 * Powered by Tesseract.js & fast quantized LSTM models.
 * Manages model downloads, IndexedDB caching, versioning, and equation extraction.
 */

import { Storage } from './storage.js';

export const OCR_MODEL_CATALOG = [
  // Core Package (Bundled / Fast Local)
  {
    lang: 'vie',
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    size: '1.9 MB',
    sizeBytes: 1980000,
    version: '1.0.0',
    isBundled: true,
    category: 'core',
    description: 'Nhận diện đề bài, trắc nghiệm, bài tập tiếng Việt (Toán, Văn, Sử, Địa, Sinh...).',
  },
  {
    lang: 'eng',
    name: 'Tiếng Anh',
    nativeName: 'English',
    size: '4.1 MB',
    sizeBytes: 4200000,
    version: '1.0.0',
    isBundled: true,
    category: 'core',
    description: 'Nhận diện bài tập tiếng Anh, thuật ngữ quốc tế, ký hiệu Latin.',
  },
  {
    lang: 'equ',
    name: 'Toán học & Ký hiệu',
    nativeName: 'Math & Equations',
    size: '2.3 MB',
    sizeBytes: 2400000,
    version: '1.0.0',
    isBundled: true,
    category: 'core',
    description: 'Ký hiệu Hy Lạp (alpha, beta, pi, delta), căn bậc hai, tích phân, phân số, chỉ số.',
  },

  // International Languages
  {
    lang: 'chi_sim',
    name: 'Tiếng Trung Giản thể',
    nativeName: '简体中文',
    size: '4.2 MB',
    sizeBytes: 4350000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện chữ Hán giản thể trong đề bài tiếng Trung.',
  },
  {
    lang: 'chi_tra',
    name: 'Tiếng Trung Phồn thể',
    nativeName: '繁體中文',
    size: '4.8 MB',
    sizeBytes: 4950000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện chữ Hán phồn thể.',
  },
  {
    lang: 'jpn',
    name: 'Tiếng Nhật',
    nativeName: '日本語',
    size: '4.6 MB',
    sizeBytes: 4700000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện hệ chữ Kanji, Hiragana, Katakana.',
  },
  {
    lang: 'kor',
    name: 'Tiếng Hàn',
    nativeName: '한국어',
    size: '3.9 MB',
    sizeBytes: 4050000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện chữ Hangul Hàn Quốc.',
  },
  {
    lang: 'spa',
    name: 'Tiếng Tây Ban Nha',
    nativeName: 'Español',
    size: '3.2 MB',
    sizeBytes: 3300000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện tiếng Tây Ban Nha với các ký tự đặc biệt.',
  },
  {
    lang: 'fra',
    name: 'Tiếng Pháp',
    nativeName: 'Français',
    size: '3.8 MB',
    sizeBytes: 3900000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện tiếng Pháp với các dấu trọng âm.',
  },
  {
    lang: 'deu',
    name: 'Tiếng Đức',
    nativeName: 'Deutsch',
    size: '3.7 MB',
    sizeBytes: 3800000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện tiếng Đức với các ký tự Umlaut.',
  },
  {
    lang: 'por',
    name: 'Tiếng Bồ Đào Nha',
    nativeName: 'Português',
    size: '3.3 MB',
    sizeBytes: 3400000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện tiếng Bồ Đào Nha.',
  },
  {
    lang: 'ind',
    name: 'Tiếng Indonesia',
    nativeName: 'Bahasa Indonesia',
    size: '2.8 MB',
    sizeBytes: 2900000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện đề bài tiếng Indonesia / Mã Lai.',
  },
  {
    lang: 'rus',
    name: 'Tiếng Nga',
    nativeName: 'Русский',
    size: '4.0 MB',
    sizeBytes: 4150000,
    version: '1.0.0',
    isBundled: false,
    category: 'international',
    description: 'Nhận diện hệ chữ cái Kirin (Cyrillic).',
  },
];

// Map app language settings to Tesseract codes
const LANG_MAP = {
  vi: 'vie',
  en: 'eng',
  'zh-CN': 'chi_sim',
  'zh-TW': 'chi_tra',
  ja: 'jpn',
  ko: 'kor',
  es: 'spa',
  fr: 'fra',
  de: 'deu',
  pt: 'por',
  id: 'ind',
  ru: 'rus',
};

const DB_NAME = 'HomeworkAi_Ocr_DB';
const DB_VERSION = 1;
const STORE_NAME = 'traineddata_models';

class OcrIndexedDb {
  static async getDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'lang' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getModel(lang) {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(lang);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  static async saveModel(lang, buffer, version = '1.0.0') {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({ lang, buffer, version, updatedAt: Date.now() });
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[OcrIndexedDb] Save error:', err);
      return false;
    }
  }

  static async deleteModel(lang) {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(lang);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }
}

export class OcrEngine {
  /**
   * Get model binary buffer (from IndexedDB first, or from bundled assets/ocr/)
   */
  static async getModelBuffer(lang) {
    // 1. Check IndexedDB (for updated versions)
    const dbRecord = await OcrIndexedDb.getModel(lang);
    if (dbRecord?.buffer) {
      return dbRecord.buffer;
    }

    // 2. If bundled, load from extension assets
    const modelInfo = OCR_MODEL_CATALOG.find((m) => m.lang === lang);
    if (modelInfo?.isBundled && typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      try {
        const localUrl = chrome.runtime.getURL(`assets/ocr/${lang}.traineddata`);
        const res = await fetch(localUrl);
        if (res.ok) {
          return await res.arrayBuffer();
        }
      } catch (e) {
        console.warn(`[OcrEngine] Local asset load failed for ${lang}:`, e);
      }
    }
    return null;
  }

  /**
   * Resolve composite language string with math and english
   */
  static getCompositeLanguage(targetLang = 'vi') {
    const mainCode = LANG_MAP[targetLang] || targetLang || 'vie';
    if (mainCode === 'vie') return 'vie+eng';
    if (mainCode === 'eng') return 'eng';
    return `${mainCode}+eng`;
  }

  /**
   * Check if a specific model is ready in local IndexedDB or bundled
   */
  static async isModelInstalled(lang) {
    const installed = await Storage.getInstalledOcrModels();
    if (installed[lang]?.isInstalled) return true;
    const dbRecord = await OcrIndexedDb.getModel(lang);
    return !!dbRecord;
  }

  /**
   * Download a model from CDN into IndexedDB
   */
  static async downloadModel(lang, onProgress = null) {
    const modelInfo = OCR_MODEL_CATALOG.find((m) => m.lang === lang);
    if (!modelInfo) throw new Error(`Model ${lang} not found in catalog.`);

    const cdnUrl = `https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0_fast/${lang}.traineddata.gz`;

    if (onProgress) onProgress(10, 'Bắt đầu kết nối CDN...');

    const response = await fetch(cdnUrl);
    if (!response.ok) {
      throw new Error(`Tải model ${modelInfo.name} thất bại (HTTP ${response.status})`);
    }

    const contentLength = +(response.headers.get('Content-Length') || modelInfo.sizeBytes);
    const reader = response.body.getReader();
    let received = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (onProgress && contentLength) {
        const pct = Math.min(95, Math.round((received / contentLength) * 100));
        onProgress(pct, `Đang tải ${modelInfo.name} (${pct}%)...`);
      }
    }

    // Combine chunks into single ArrayBuffer
    const totalBuffer = new Uint8Array(received);
    let position = 0;
    for (const chunk of chunks) {
      totalBuffer.set(chunk, position);
      position += chunk.length;
    }

    if (onProgress) onProgress(98, 'Đang lưu vào bộ nhớ đệm Offline...');

    // Save to IndexedDB
    await OcrIndexedDb.saveModel(lang, totalBuffer.buffer, modelInfo.version);

    // Save metadata to Chrome Storage
    await Storage.saveOcrModel({
      lang,
      name: modelInfo.name,
      size: modelInfo.size,
      version: modelInfo.version,
      isBundled: modelInfo.isBundled,
      isInstalled: true,
    });

    if (onProgress) onProgress(100, `Model ${modelInfo.name} đã sẵn sàng!`);
    return true;
  }

  /**
   * Delete a downloaded model from IndexedDB
   */
  static async deleteModel(lang) {
    await OcrIndexedDb.deleteModel(lang);
    await Storage.removeOcrModel(lang);
    return true;
  }

  /**
   * Check for remote updates
   */
  static async checkForUpdates() {
    const installed = await Storage.getInstalledOcrModels();
    const updatesAvailable = [];

    for (const [lang, info] of Object.entries(installed)) {
      const catalog = OCR_MODEL_CATALOG.find((m) => m.lang === lang);
      if (catalog && catalog.version > (info.version || '1.0.0')) {
        updatesAvailable.push({
          lang,
          name: catalog.name,
          currentVersion: info.version,
          newVersion: catalog.version,
        });
      }
    }
    return updatesAvailable;
  }

  /**
   * Perform OCR Recognition on an image Base64
   * @param {string} imageBase64 - Base64 Data URL
   * @param {string} targetLang - Language code (e.g. 'vi', 'en')
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<string>} Recognized text with LaTeX formulas
   */
  static async recognize(imageBase64, targetLang = 'vi', onProgress = null) {
    if (!imageBase64) return '';

    if (onProgress) onProgress(15, 'Đang tiền xử lý ảnh...');

    // Check if Tesseract is available or load via Web Worker
    const compLang = this.getCompositeLanguage(targetLang);

    // Clean base64 URL
    const imgUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

    try {
      if (onProgress) onProgress(35, 'Đang quét ký tự và công thức toán học...');

      // Dynamic import or worker bridge for Tesseract
      const text = await this.executeTesseract(imgUrl, compLang, onProgress);

      if (onProgress) onProgress(90, 'Đang định dạng công thức LaTeX...');
      const cleaned = this.postProcessMathText(text);

      if (onProgress) onProgress(100, 'Nhận diện hoàn tất!');
      return cleaned;
    } catch (err) {
      console.error('[OcrEngine] Recognition failed:', err);
      throw new Error(`Nhận diện OCR thất bại: ${err.message}`);
    }
  }

  /**
   * Dynamically load Tesseract.js library from bundled assets
   */
  static async loadTesseractLibrary() {
    if (typeof globalThis !== 'undefined' && globalThis.Tesseract) {
      return globalThis.Tesseract;
    }
    if (typeof window !== 'undefined' && window.Tesseract) {
      return window.Tesseract;
    }
    if (typeof self !== 'undefined' && self.Tesseract) {
      return self.Tesseract;
    }

    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      try {
        const tesseractUrl = chrome.runtime.getURL('assets/ocr/tesseract.min.js');
        const res = await fetch(tesseractUrl);
        if (res.ok) {
          const code = await res.text();
          const fn = new Function(code);
          fn.call(globalThis || self || window);
          return (typeof globalThis !== 'undefined' && globalThis.Tesseract)
            || (typeof window !== 'undefined' && window.Tesseract)
            || (typeof self !== 'undefined' && self.Tesseract)
            || null;
        }
      } catch (e) {
        console.warn('[OcrEngine] Failed to load tesseract.min.js:', e);
      }
    }
    return null;
  }

  /**
   * Execute Tesseract OCR processing with 100% offline WebAssembly assets
   */
  static async executeTesseract(imageUrl, langCode, onProgress = null) {
    const Tesseract = await this.loadTesseractLibrary();
    if (!Tesseract || typeof Tesseract.createWorker !== 'function') {
      throw new Error('Thư viện Tesseract.js chưa được khởi tạo.');
    }

    const workerPath = typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('assets/ocr/worker.min.js')
      : undefined;
    const corePath = typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('assets/ocr/tesseract-core-lstm.wasm.js')
      : undefined;
    const langPath = typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('assets/ocr')
      : undefined;

    const worker = await Tesseract.createWorker(langCode, 1, {
      workerPath,
      corePath,
      langPath,
      workerBlobURL: false,
      gzip: false,
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(35 + (m.progress || 0) * 55);
          onProgress(pct, `Đang nhận diện văn bản (${Math.round(m.progress * 100)}%)...`);
        }
      },
    });

    try {
      const ret = await worker.recognize(imageUrl);
      return ret.data?.text || '';
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Post-process OCR text into clear LaTeX and structured lines
   */
  static postProcessMathText(rawText) {
    if (!rawText) return '';

    let text = rawText
      // Fix common OCR misinterpretations
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      // Fix sqrt formulas: V(x) -> \sqrt{x}
      .replace(/[Vv]\(([0-9a-zA-Z\s\+\-\*\/]+)\)/g, '$\\sqrt{$1}$')
      // Fix powers: x2 -> x^2 when following math variables
      .replace(/([a-zA-Z])(\^?)(2|3|4|n|k|x|y)\b/g, '$1^{$3}')
      // Fix common Greek letters
      .replace(/\b(alpha|Alpha)\b/g, '$\\alpha$')
      .replace(/\b(beta|Beta)\b/g, '$\\beta$')
      .replace(/\b(pi|Pi)\b/g, '$\\pi$')
      .replace(/\b(delta|Delta)\b/g, '$\\Delta$')
      .trim();

    return text;
  }
}
