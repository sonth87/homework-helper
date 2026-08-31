/**
 * Google Translate — endpoint miễn phí, không cần API key.
 *
 * Cùng endpoint extension đang dùng (background/service-worker.js
 * `QUICK_TRANSLATE`) — kế thừa tư tưởng, viết lại độc lập theo ADR-0001.
 */

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

export type GoogleTranslateResult = { translatedText: string; detectedSourceLanguage: string };

export async function googleTranslate(
  text: string,
  targetLang: string,
  signal: AbortSignal,
): Promise<GoogleTranslateResult> {
  const url = `${ENDPOINT}?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Google Translate trả lỗi HTTP ${res.status}`);

  const data = (await res.json()) as [[string, string, ...unknown[]][] | null, ...unknown[]];
  const segments = data[0] ?? [];
  const translatedText = segments.map((seg) => seg[0] ?? '').join('');
  // Vị trí thứ 3 của mảng phản hồi (index [2]) là mã ngôn ngữ nguồn Google tự
  // nhận diện — hình dạng phản hồi không có kiểu chính thức, đây là định dạng
  // đã quan sát được, giống hệt cách extension đọc (`data[2]`).
  const detectedSourceLanguage = typeof data[2] === 'string' ? data[2] : 'auto';

  if (!translatedText.trim()) throw new Error('Không nhận được bản dịch.');
  return { translatedText, detectedSourceLanguage };
}
