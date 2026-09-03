/**
 * Bing Translator — endpoint `edge.microsoft.com/translate/translatetext`,
 * đúng endpoint trình duyệt Edge dùng cho tính năng dịch tích hợp sẵn. Keyless,
 * không cần bootstrap token nào — khác hẳn bản cũ (xem cập nhật bên dưới).
 *
 * 2026-09-03: THAY hoàn toàn cách tiếp cận cũ (scrape `bing.com/translator` để
 * lấy token IG/IID/key/token rồi ký lệnh dịch qua `ttranslatev3`). Bản cũ đã
 * bị ghi nhận blocked (401 + `{"ShowCaptcha":false}`) từ lúc kiểm chứng ban
 * đầu (xem ADR-0009) — và endpoint đó thực ra được mô phỏng theo một extension
 * BÊN THỨ BA (ENVI) khác, không phải extension của chính dự án này.
 * `extension/background/translate-engines.js` (`translateBing`) của CHÍNH dự
 * án này lại dùng endpoint `edge.microsoft.com` — không cần token, được ghi
 * chú là "đáng tin cậy nhất" trong các engine dịch của extension. ĐÃ GỌI THẬT
 * trước khi đổi: trả 200, không escape HTML (khác Google, xem
 * google.provider.ts) — không cần giải mã entity.
 */

const ENDPOINT = 'https://edge.microsoft.com/translate/translatetext';

/** Bing dùng zh-Hans/zh-Hant, không phải zh-CN/zh-TW như Google và chính app này. */
const TO_BING_LANG: Record<string, string> = { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant' };
const FROM_BING_LANG: Record<string, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW' };

export type BingTranslateResult = { translatedText: string; detectedSourceLanguage: string };

export async function bingTranslate(text: string, targetLang: string, signal: AbortSignal): Promise<BingTranslateResult> {
  const to = TO_BING_LANG[targetLang] ?? targetLang;
  const url = new URL(ENDPOINT);
  url.searchParams.set('to', to);
  url.searchParams.set('isEnterpriseClient', 'false');

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: '*/*' },
    body: JSON.stringify([text]),
    signal,
  });
  if (!res.ok) throw new Error(`Bing Translate trả lỗi HTTP ${res.status}`);

  const data = (await res.json()) as [{ detectedLanguage?: { language: string }; translations: { text: string }[] }] | { statusCode?: number };
  const first = Array.isArray(data) ? data[0] : undefined;
  const translatedText = first?.translations[0]?.text;
  if (!translatedText?.trim()) throw new Error('Bing Translate không trả về bản dịch.');

  const detectedRaw = first?.detectedLanguage?.language;
  const detectedSourceLanguage = detectedRaw ? (FROM_BING_LANG[detectedRaw] ?? detectedRaw) : 'auto';
  return { translatedText, detectedSourceLanguage };
}
