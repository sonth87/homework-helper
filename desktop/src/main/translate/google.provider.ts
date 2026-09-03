/**
 * Google Translate — endpoint `translate-pa` (API key extension Chrome/Edge tự
 * mang theo), ĐÚNG endpoint extension đang dùng làm engine chính
 * (`extension/background/translate-engines.js` → `translateGoogle`), khai
 * thác ngược nhưng khoan dung hơn hẳn `translate_a/single` (endpoint cũ app
 * này từng dùng) — vẫn trả 200 trên IP mà endpoint cũ đã bị 429.
 *
 * 2026-09-03: ĐỔI từ `translate_a/single`. Nguyên nhân: `google.provider.ts`
 * bản cũ ghi "kế thừa từ extension" nhưng thực ra mô phỏng theo một extension
 * BÊN THỨ BA khác (xem ADR-0009, phần khảo sát "Từ điển Anh Việt ENVI") —
 * không phải extension CỦA CHÍNH DỰ ÁN NÀY, vốn đã chuyển sang `translate-pa`
 * từ trước. Người dùng dính 429 thường xuyên trên desktop trong khi extension
 * chạy êm — đúng vì hai app gọi hai endpoint khác hẳn nhau dù tưởng là một.
 * ĐÃ GỌI THẬT endpoint mới trước khi đổi (không chỉ đọc code extension) —
 * xác nhận: trả 200, giữ nguyên hình dạng phản hồi mô tả bên dưới.
 */

const ENDPOINT = 'https://translate-pa.googleapis.com/v1/translateHtml';

// Cùng key extension dùng — key public gắn theo bản build web/extension của
// Google, không phải bí mật riêng của dự án này (thấy ngay trong request nếu
// bắt gói tin của bất kỳ trình duyệt Chrome/Edge nào dùng tính năng dịch tích
// hợp sẵn). Không phải credential cần bảo vệ.
const GOOGLE_PA_KEY = 'AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520';

export type GoogleTranslateResult = { translatedText: string; detectedSourceLanguage: string };

/**
 * `translateHtml` trả text đã ESCAPE THEO HTML (endpoint vốn để chèn thẳng
 * vào DOM) — ĐÃ GỌI THẬT kiểm chứng: `"` → `&quot;`, `'` → `&#39;`, `&` →
 * `&amp;`, `<`/`>` → `&lt;`/`&gt;`. Extension không cần tự giải mã vì gán
 * thẳng vào `textContent`... thật ra KHÔNG, extension cũng gán qua
 * `textContent` (`hover-translate.js`) nên có cùng lỗi tiềm ẩn — nhưng đó là
 * việc của extension (ADR-0001, không sửa app kia ở đây). Ở app này, kết quả
 * hiện qua JSX string (React, tương đương textContent) nên PHẢI tự giải mã ở
 * đây, nếu không câu có dấu nháy/dấu và (rất phổ biến) sẽ hiện `&quot;`,
 * `&#39;`... nguyên văn thay vì đúng ký tự.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export async function googleTranslate(
  text: string,
  targetLang: string,
  signal: AbortSignal,
): Promise<GoogleTranslateResult> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json+protobuf',
      'X-Goog-API-Key': GOOGLE_PA_KEY,
    },
    body: JSON.stringify([[[text], 'auto', targetLang], 'te']),
    signal,
  });
  if (!res.ok) throw new Error(`Google Translate trả lỗi HTTP ${res.status}`);

  const raw = await res.text();
  // Rơi vào trang chặn (CAPTCHA/HTML) thay vì JSON là dấu hiệu bị chặn — cùng
  // cách extension nhận diện (translate-engines.js `fetchJson`).
  if (raw.trimStart().startsWith('<')) throw new Error('Google Translate trả về trang chặn (không phải JSON).');

  const data = JSON.parse(raw) as [string[]?, string[]?];
  const translatedText = data[0]?.[0];
  if (typeof translatedText !== 'string' || !translatedText.trim()) {
    throw new Error('Không nhận được bản dịch.');
  }
  const detectedSourceLanguage = data[1]?.[0] ?? 'auto';

  return { translatedText: decodeHtmlEntities(translatedText), detectedSourceLanguage };
}
