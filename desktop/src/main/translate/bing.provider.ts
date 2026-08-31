/**
 * Bing Translator — endpoint nội bộ của trang bing.com/translator, khai thác
 * ngược (không phải API chính thức của Microsoft). Cùng bản chất với
 * google.provider.ts, nhưng cần thêm một bước mà Google không có: trang trả về
 * một TOKEN CÓ HẠN trước mỗi phiên, dùng để ký lệnh dịch — hết hạn phải lấy lại.
 *
 * ĐÃ KIỂM CHỨNG THỰC NGHIỆM 2026-08-31 (xem ADR-0009): bootstrap token
 * (IG/IID/key/token) vẫn lấy được bình thường từ trang thật, nhưng lệnh dịch
 * sau đó bị hệ chống bot của Microsoft chặn (401 + body `{"ShowCaptcha":false}`)
 * khi gọi từ mạng đang dùng để kiểm thử — rất có thể do IP đã bị đánh dấu từ
 * việc gọi dồn dập trong ngày (Google cũng chặn cùng lúc, cùng nguyên nhân khả
 * dĩ). CHƯA XÁC NHẬN đây là chặn theo IP tạm thời hay chặn có hệ thống với mọi
 * traffic dạng này. Nếu bị chặn ở người dùng thật, hàm này ném lỗi và
 * `translateRotator` tự chuyển sang provider tiếp theo — không có gì hỏng thêm
 * ngoài một lượt thử hụt.
 */

const TRANSLATOR_PAGE = 'https://www.bing.com/translator';
const TRANSLATE_ENDPOINT = 'https://www.bing.com/ttranslatev3?isVertical=1&&';

/** Bing dùng zh-Hans/zh-Hant, không phải zh-CN/zh-TW như Google và chính app này. */
const TO_BING_LANG: Record<string, string> = { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant' };
const FROM_BING_LANG: Record<string, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW' };

type BootstrapToken = {
  ig: string;
  iid: string;
  key: string;
  token: string;
  tokenTs: number;
  tokenExpiryInterval: number;
  count: number;
};

let cached: BootstrapToken | null = null;

/**
 * Regex khớp trực tiếp với cấu trúc HTML/JS inline của trang bing.com/translator
 * tại thời điểm kiểm chứng — vỡ nếu Microsoft đổi cấu trúc trang. Đây chính là
 * đánh đổi đã chấp nhận khi dùng endpoint khai thác ngược, giống hệt lý do
 * google.provider.ts phải tồn tại thay vì dùng API Cloud Translation chính thức.
 */
async function ensureToken(signal: AbortSignal): Promise<BootstrapToken> {
  if (cached && Date.now() - cached.tokenTs < cached.tokenExpiryInterval) return cached;

  const html = await fetch(TRANSLATOR_PAGE, { signal }).then((r) => r.text());

  const ig = html.match(/IG:"([^"]+)"/)?.[1];
  const iid = html.match(/data-iid="([^"]+)"/)?.[1];
  const paramsRaw = html.match(/params_AbusePreventionHelper\s?=\s?([^\]]+\])/)?.[1];
  if (!ig || !iid || !paramsRaw) throw new Error('Không lấy được token từ trang Bing Translator.');

  const [key, token, tokenExpiryInterval] = JSON.parse(paramsRaw) as [string, string, number];
  cached = { ig, iid, key, token, tokenTs: Date.now(), tokenExpiryInterval, count: 0 };
  return cached;
}

export type BingTranslateResult = { translatedText: string; detectedSourceLanguage: string };

export async function bingTranslate(text: string, targetLang: string, signal: AbortSignal): Promise<BingTranslateResult> {
  const t = await ensureToken(signal);
  const to = TO_BING_LANG[targetLang] ?? targetLang;

  const form = new URLSearchParams({
    text,
    fromLang: 'auto-detect',
    to,
    token: t.token,
    key: t.key,
    IG: t.ig,
    IID: `${t.iid}.${t.count++}`,
  });

  const res = await fetch(TRANSLATE_ENDPOINT, { method: 'POST', body: form, signal });
  if (!res.ok) {
    // Token có thể đã bị vô hiệu (không chỉ hết hạn) — bỏ cache, lần gọi sau
    // lấy token mới thay vì lặp lại cùng lỗi tới khi tokenExpiryInterval trôi qua.
    cached = null;
    throw new Error(`Bing Translate trả lỗi HTTP ${res.status}`);
  }

  const data = (await res.json()) as [{ detectedLanguage?: { language: string }; translations: { text: string }[] }] | { statusCode?: number };
  const first = Array.isArray(data) ? data[0] : undefined;
  const translatedText = first?.translations[0]?.text;
  if (!translatedText?.trim()) throw new Error('Bing Translate không trả về bản dịch.');

  const detectedRaw = first?.detectedLanguage?.language;
  const detectedSourceLanguage = detectedRaw ? (FROM_BING_LANG[detectedRaw] ?? detectedRaw) : 'auto';
  return { translatedText, detectedSourceLanguage };
}
