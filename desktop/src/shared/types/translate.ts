/**
 * Provider dịch nhanh (Lane A) — xem ADR-0009 cho lý do chọn/loại từng cái.
 *
 * Chỉ ba: 'google' (mặc định, chất lượng tốt nhất khi hoạt động), 'bing' (dự
 * phòng cùng chất lượng, khai thác ngược trang bing.com/translator), 'mymemory'
 * (API công khai thật, chất lượng thấp hơn nhưng ổn định nhất — lưới an toàn
 * cuối). Đã cân nhắc thêm Naver Papago nhưng endpoint đã đổi so với lần kiểm
 * chứng (404), không đáng công dò lại cho lợi ích hẹp với bộ 13 locale hiện tại.
 */
export const TRANSLATE_PROVIDER_IDS = ['google', 'bing', 'mymemory'] as const;
export type TranslateProviderId = (typeof TRANSLATE_PROVIDER_IDS)[number];
