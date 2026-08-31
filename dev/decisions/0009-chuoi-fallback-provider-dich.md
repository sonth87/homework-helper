# ADR-0009: Lane A dịch qua chuỗi nhiều provider, người dùng sắp xếp thứ tự

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-31

## Bối cảnh

Lane A (dịch khi rê chuột) chỉ dùng MỘT provider từ Phase 3: endpoint miễn phí
`translate.googleapis.com/translate_a/single`, không key, không retry.

Trong lúc đo độ trễ E2E thật (xem ADR liên quan tới đo latency), máy kiểm thử
bị chính Google chặn:

```
HTTP 429 — "Sorry... your computer or network may be sending automated queries"
```

`google.provider.ts` không có gì để rơi xuống — một request lỗi ném thẳng lên
UI. Với tần suất gọi của hover tự động (mỗi lần debounce ổn định là một
request), nguy cơ người dùng bình thường tự đẩy IP của mình vào diện này là
thật, không phải giả thuyết — đã tự xảy ra khi test dồn dập trong một ngày.

## Khảo sát: extension "Từ điển Anh Việt ENVI" (Chrome Web Store) dùng gì

Đọc mã đã unpack của một extension dịch phổ biến để biết còn dịch vụ miễn phí
nào khác đã được người khác dùng trong thực tế:

| Dịch vụ | Endpoint | Xác thực |
|---|---|---|
| Google Translate | `translate.googleapis.com/translate_a/single` | không |
| Bing Translator | `www.bing.com/ttranslatev3` | bootstrap token có hạn từ trang `bing.com/translator` |
| Naver Papago | `papago.naver.com/apis/n2mt/translate` | HMAC ký bằng `HASHING_KEY` gắn theo bản build web của Naver |

Cả ba đều là dịch vụ web công khai bị khai thác ngược — kể cả Google đang dùng
cũng thuộc loại này, không phải ngoại lệ.

## Kiểm chứng thực nghiệm — đừng tin, gọi thử

Trước khi build, gọi thật cả ba (không chỉ đọc code):

- **MyMemory** (`api.mymemory.translated.net`, KHÔNG có trong ENVI — tìm thêm
  vì đây là API có tài liệu chính thức, không khai thác ngược) — **hoạt động
  bình thường**.
- **Papago** — cả `/apis/langs/dect` lẫn `/apis/n2mt/translate` trả **404**.
  Đường dẫn đã đổi so với bản extension kiểm tra (Jul 2025) — hỏng thật, không
  phải rủi ro giả định. Muốn sửa phải dò lại toàn bộ từ trang papago.naver.com
  hiện tại — công sức không tương xứng lợi ích với bộ 13 locale không thiên về
  tiếng Hàn.
- **Bing** — bootstrap token (IG/IID/key/token) vẫn lấy được bình thường từ
  trang thật, nhưng lệnh dịch bị hệ chống bot của Microsoft chặn: `401` kèm
  body `{"ShowCaptcha":false}`. Cùng lúc Google cũng chặn IP này — nhiều khả
  năng do mạng test bị đánh dấu từ việc gọi dồn dập trong ngày, KHÔNG xác nhận
  được đây là chặn hệ thống hay chặn tạm thời theo IP.

## Quyết định

**Ba provider: Google (mặc định), Bing, MyMemory — người dùng tự sắp xếp thứ
tự thử trong Cài đặt, tự động rơi xuống provider tiếp theo khi một provider
lỗi. Không thêm Papago** (endpoint hỏng thật tại thời điểm quyết định).

Vẫn build Bing dù bị chặn ngay lúc kiểm chứng: cơ chế token vẫn đúng, và chuỗi
fallback khiến chi phí của một provider bị chặn — vĩnh viễn hay tạm thời — chỉ
là MỘT lượt thử hụt + cooldown, không hỏng gì thêm. Nếu Bing thật sự chết hẳn
với mọi người dùng, nó chỉ là một hop vô hại trong chuỗi, không cần gỡ bỏ.

## Kiến trúc

```
src/shared/types/translate.ts       TRANSLATE_PROVIDER_IDS, TranslateProviderId
config/settings/language.settings.ts  translateProviderConfigSchema, mặc định 3 provider
src/main/translate/
  google.provider.ts                (giữ nguyên từ Phase 3)
  bing.provider.ts                  bootstrap token + cache, mất hiệu lực khi lỗi
  mymemory.provider.ts              autodetect|target, KHÔNG phải auto|target
  provider-registry.ts              Record<TranslateProviderId, TranslateFn>
  translate-rotator.ts              lọc + sắp theo priority + cooldown khi lỗi
  translate.service.ts              vòng lặp: cache -> candidates -> thử lần lượt
```

`translate-rotator.ts` **không dùng chung** `ai/key-rotator.ts` của Lane B dù
tương tự về hình dạng (ưu tiên + cooldown) — ADR-0003 cấm hai lane chia sẻ logic
retry/timeout, và `KeyRotator` mang theo ngữ nghĩa riêng của Lane B (cần
vision, chỉ dùng local, chiến lược round-robin/random) không áp dụng cho Lane A.

UI: `TranslateProvidersPanel.tsx` — màn hình riêng như `ApiKeysPanel.tsx`, vì
`translateProviders` cần thao tác sắp xếp (nút lên/xuống), không phải input
đơn mà `SettingControl` sinh từ schema xử lý được. Đặt trong tab `language`
(không mở tab mới) vì cùng nhóm với `translateTargetLanguage`.

## Chi tiết dễ sai đã kiểm chứng thực nghiệm

- **Mã ngôn ngữ Trung Quốc của Bing khác Google/app này**: `zh-CN`→`zh-Hans`,
  `zh-TW`→`zh-Hant`. Lấy nguyên từ bảng mapping trong code của ENVI, không tự
  suy luận — sai chỗ này sẽ dịch nhầm biến thể chữ Hán mà không báo lỗi.
- **MyMemory không nhận `auto`** làm ngôn ngữ nguồn — trả lỗi tường minh
  `'AUTO' IS AN INVALID SOURCE LANGUAGE`. Cú pháp đúng là `autodetect`. Đã gọi
  thử cả hai trước khi viết code, không suy luận từ tên tham số.
- **`responseStatus` của MyMemory kiểu không nhất quán** — `200` (number) khi
  thành công, `"403"` (string) khi từ chối. So sánh qua `String(...)`.
- **Token Bing mất hiệu lực không chỉ do hết hạn** — một lệnh dịch trả lỗi
  (401 do chặn bot, hoặc bất kỳ lỗi nào) thì bỏ cache token ngay, không đợi
  `tokenExpiryInterval` trôi qua, để lần gọi sau thử lấy token mới thay vì lặp
  lại đúng lỗi cũ nhiều lần.

## Kiểm chứng E2E thật

Gọi `quickTranslate()` thật (không mock) trong điều kiện mạng đang bị chặn:

```
Google  -> 429  -> tạm ngưng 60s
Bing    -> 401  -> tạm ngưng 30s
MyMemory -> OK  -> "Hello world..." dịch đúng nghĩa, 2136ms
```

Đúng kịch bản tính năng này sinh ra để xử lý: một provider chết không làm
người dùng thấy lỗi, chỉ chậm hơn một chút.

## Phương án đã cân nhắc và loại bỏ

- **Thêm Papago** — endpoint đã đổi, cần reverse-engineer lại từ đầu trên
  trang papago.naver.com hiện tại. Hoãn tới khi có lý do cụ thể (ví dụ nhu cầu
  chất lượng cao hơn cho cặp ngôn ngữ có tiếng Hàn).
- **Cache theo provider** (biết bản dịch nào của Google, bản nào của Bing) —
  không cần: cache lưu theo (text, targetLang) vì người dùng muốn CÙNG một kết
  quả dịch cho cùng input, không quan tâm backend nào tạo ra nó.
- **Dùng chung `KeyRotator` của Lane B** — vi phạm ADR-0003, và mang theo ngữ
  nghĩa thừa (vision/local-only) không áp dụng cho dịch văn bản thuần.

## Đánh đổi đã chấp nhận

- Bing dựa vào cấu trúc HTML/JS nội bộ của `bing.com/translator` — vỡ nếu
  Microsoft đổi cấu trúc trang, đúng bản chất mọi endpoint khai thác ngược
  (Google hiện tại cũng vậy).
- Không phân biệt chính xác mã lỗi HTTP có cấu trúc cho cả ba provider khi
  quyết định thời gian cooldown — chỉ so khớp chuỗi "429" trong message. Hậu
  quả của đoán sai chỉ là tạm ngưng hơi lâu/ngắn hơn lý tưởng, không phải sai
  kết quả dịch.
- MyMemory đứng cuối thứ tự mặc định vì chất lượng dịch thấp hơn rõ rệt — dù
  đây lại là provider ổn định nhất trong ba (API thật, không khai thác ngược).

## Cập nhật 2026-08-31 (vài giờ sau) — Google đã hết bị chặn, Bing thì chưa

Gọi lại thật: `translate.googleapis.com` trả `200` bình thường trở lại. Gọi lại
`bingTranslate()` thật (không phải chỉ trang `bing.com/translator`, mà đúng
lệnh dịch `ttranslatev3`) — **vẫn `401`**. Cùng một mạng, cùng khung giờ, hai
kết quả khác nhau: nghiêng về khả năng chặn của Bing **bền hơn** chặn của
Google, không cùng một nguyên nhân tạm thời như đã nghi ngờ lúc quyết định ban
đầu. Chưa đủ dữ liệu để kết luận chắc (chỉ một điểm mẫu), nhưng đủ để hạ độ tin
cậy vào giả thuyết "chỉ là IP bị đánh dấu tạm, sẽ tự hết" — xem mục "Xem lại
khi" bên dưới đã cập nhật theo phát hiện này.

## Xem lại khi

- Bing bị chặn kéo dài với người dùng thật (không chỉ mạng test hôm nay — **đã
  có tín hiệu đầu tiên theo hướng này**, xem cập nhật ngay trên) — cân nhắc hạ
  độ ưu tiên mặc định hoặc gỡ hẳn.
- Có nhu cầu chất lượng cao hơn cho cặp ngôn ngữ có tiếng Hàn — quay lại dò
  endpoint Papago hiện tại.
- Google tiếp tục bị chặn thường xuyên với người dùng thật — cân nhắc đổi thứ
  tự mặc định, không còn ưu tiên Google tuyệt đối.
