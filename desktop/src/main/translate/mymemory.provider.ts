/**
 * MyMemory — API dịch có tài liệu chính thức
 * (https://mymemory.translated.net/doc/spec.php), KHÔNG khai thác ngược như
 * google.provider.ts/bing.provider.ts. Không cần key cho hạn mức cơ bản
 * (~5000 từ/ngày/IP ẩn danh). Chất lượng dịch thấp hơn Google/Bing rõ rệt —
 * đây là lý do nó đứng SAU trong thứ tự ưu tiên mặc định, không phải vì kém
 * tin cậy hơn: ngược lại, đây là provider có khả năng cao nhất còn hoạt động
 * khi hai cái kia lỗi, đúng vai trò lưới an toàn cuối cùng.
 *
 * ĐÃ KIỂM CHỨNG THỰC NGHIỆM 2026-08-31: `langpair=auto|vi` bị từ chối tường
 * minh — "'AUTO' IS AN INVALID SOURCE LANGUAGE". Cú pháp đúng là `autodetect`,
 * khác quy ước "auto" của Google/Bing — dễ nhầm nếu chỉ suy luận từ tên tham
 * số mà không gọi thử thật.
 *
 * ĐÃ KIỂM CHỨNG THỰC NGHIỆM 2026-09-01: giới hạn CỨNG 500 ký tự — vượt là lỗi
 * tường minh `QUERY LENGTH LIMIT EXCEEDED`. `MAX_LENGTH` export ra để
 * `translate.service.ts` LOẠI provider này khỏi danh sách thử ngay từ đầu khi
 * text dài hơn — không gọi rồi nhận lỗi đoán trước được, và quan trọng hơn:
 * không được CẮT BỚT text cho vừa 500 ký tự. Cắt bớt sẽ dịch một câu cụt mà
 * người dùng không biết là cụt — đúng loại lỗi "trông hợp lý nhưng sai" đã sửa
 * ở đường OCR (ADR-0011), không được lặp lại ở đây.
 */
export const MYMEMORY_MAX_LENGTH = 500;

const ENDPOINT = 'https://api.mymemory.translated.net/get';

type MyMemoryResponse = {
  responseStatus: number | string;
  responseDetails?: string;
  responseData?: { translatedText?: string; detectedLanguage?: string };
};

export type MyMemoryTranslateResult = { translatedText: string; detectedSourceLanguage: string };

export async function myMemoryTranslate(text: string, targetLang: string, signal: AbortSignal): Promise<MyMemoryTranslateResult> {
  const url = `${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=autodetect|${encodeURIComponent(targetLang)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`MyMemory trả lỗi HTTP ${res.status}`);

  const data = (await res.json()) as MyMemoryResponse;
  // responseStatus có lúc là number (200 khi thành công), có lúc là string
  // ("403" khi từ chối) tuỳ loại lỗi — đã kiểm chứng thực nghiệm, không phải
  // giả định từ tài liệu, nên so sánh qua String() thay vì === 200.
  if (String(data.responseStatus) !== '200') {
    throw new Error(`MyMemory từ chối: ${data.responseDetails ?? data.responseStatus}`);
  }

  const translatedText = data.responseData?.translatedText;
  if (!translatedText?.trim()) throw new Error('MyMemory không trả về bản dịch.');

  return { translatedText, detectedSourceLanguage: data.responseData?.detectedLanguage ?? 'auto' };
}
