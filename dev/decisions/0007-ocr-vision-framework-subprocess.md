# ADR-0007: OCR macOS qua Vision framework, subprocess riêng khỏi Accessibility

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-30

## Bối cảnh

Trong lúc kiểm chứng Lane A thật (ADR-0006), phát hiện Accessibility **không đọc
được** vùng soạn thảo của Monaco Editor (VS Code) — sidebar và terminal đọc
được, riêng editor thì không. Giả thuyết hợp lý nhất (chưa xác nhận trực tiếp
do khó đồng bộ thời điểm với chuột thật qua nhiều vòng thử) là Monaco áp dụng
đúng mẫu WAI-ARIA cho rich text editor ảo hoá cao: lớp glyph hiển thị bị đánh
dấu `aria-hidden`, nội dung thật nằm ở một lớp "gương" riêng cho accessibility.

Đây chính là trường hợp OCR fallback sinh ra để xử lý — theo đúng
`config/intents.config.ts` đã đặt từ Phase 0: `translate.acquisition:
['accessibility', 'ocr']`.

## Quyết định

**OCR trên macOS qua Vision framework (`VNRecognizeTextRequest`), đóng gói
thành một binary Swift subprocess RIÊNG (`native/ocr-macos/`), không gộp vào
`accessibility-helper` dù cùng mẫu kiến trúc (JSON theo dòng qua stdio, tiến
trình sống lâu dài — xem ADR-0006).**

## Vì sao tách binary dù cùng mẫu kiến trúc

Hai mối quan tâm khác bản chất: Accessibility đọc **cây UI**, OCR đọc **pixel**.
Accessibility cần trạng thái `activatedPids` (app nào đã kích hoạt
`AXManualAccessibility`) — OCR không có khái niệm tương đương. Gộp chung một
file sẽ trộn hai vòng đời khác nhau vào cùng một chỗ mà không giảm trùng lặp
thật (phần dùng chung chỉ là khung JSON-stdio ~30 dòng, không đáng để khớp nối
hai domain logic khác nhau).

## Hai phát hiện thực nghiệm quan trọng

### 1. Cold-start cực lớn, nhưng chỉ MỘT LẦN mỗi phiên

Request OCR **đầu tiên** trong một tiến trình mất **~20-27 giây** (đo trực
tiếp: 26827ms) — Vision framework nạp model nhận diện chữ lần đầu. Request thứ
hai trở đi chỉ **15-25ms** — dư sức đáp ứng `hoverDelayMs`.

Đây chính xác là lý do tiến trình phải **sống lâu dài** thay vì spawn mới mỗi
lần hover (đã quyết ở ADR-0006 cho Accessibility, giờ có thêm bằng chứng thực
nghiệm áp dụng y hệt cho OCR): chi phí nạp model chỉ trả một lần mỗi phiên làm
việc, không phải mỗi lần hover. `MacOcr` (native-darwin.ts) đặt timeout request
đầu tiên riêng (30s) khác timeout các request sau (5s) để phản ánh đúng thực tế
này thay vì một con số chung chung.

### 2. Toạ độ Vision khác hẳn — gốc DƯỚI-TRÁI, chuẩn hoá 0..1

Khác với phát hiện `AXManualAccessibility` (không có trong tài liệu Apple),
đây là hành vi **có tài liệu chính thức**, chỉ rất dễ quên khi lập trình:
`VNRecognizedTextObservation.boundingBox` trả về toạ độ **chuẩn hoá (0..1)**
với **gốc dưới-trái** (quy ước Quartz/Core Image) — khác gốc trên-trái mà toàn
bộ phần còn lại của codebase dùng cho `Rect<'image'>` (khớp
`NativeImage.crop()` ở `screen-capture.ts`, Phase 2).

Không quy đổi trục Y sẽ cho bounding box "trông đúng" nếu ảnh chỉ có một dòng
ở giữa (sai số nhỏ, khó nhận ra), nhưng sai hẳn với ảnh nhiều dòng — đúng lớp
lỗi mà branded type `Rect<Space>` dựng ra để cảnh báo, dù ở đây là comment
trong Swift chứ không phải type system TypeScript (Vision framework không có
tương đương branded type, phải cẩn thận bằng tay).

## Quyền hệ thống — tách biệt với Accessibility, cần xin RIÊNG

`captureDisplay()` (Phase 2, dùng chung cho cả Crop & Solve và vùng chụp của
OCR fallback) cần quyền **Screen Recording** — một mục **hoàn toàn tách biệt**
với Accessibility trong System Settings. Thiếu quyền này, `desktopCapturer.getSources()`
ném lỗi `"Failed to get sources."` — không phải lỗi code, là hành vi bảo mật
chuẩn của macOS.

Cùng bài học đã ghi ở ADR-0006: cấp quyền cho **tiến trình đang chạy sẵn**
không có tác dụng ngay, phải khởi động lại. Onboarding thật (chưa xây) cần xin
**cả hai quyền** (Accessibility + Screen Recording) và hướng dẫn khởi động lại
sau khi cấp — không chỉ một quyền như tài liệu ADR-0006 đã ghi trước đó.

## Kiểm chứng E2E thật

Sau khi cấp quyền Screen Recording: OCR đọc đúng text thật từ System Settings
("Allow", "Zalo", "Time"...) với thời gian 29-244ms; đồng thời quan sát được
hệ thống **tự chọn đúng chiến lược** — Accessibility thử trước
("Privacy & Security", "Motion & Fitness, 0" đọc được qua Accessibility), OCR
chỉ chạy khi Accessibility trả `null`. Đúng thứ tự ưu tiên đã cấu hình trong
`intents.config.ts`, không cần thêm logic điều phối nào trong `acquire.ts`.

## Đánh đổi đã chấp nhận

- Chụp vùng NHỎ quanh con trỏ (`hoverCaptureWidth/Height` = 500×80 logical px)
  bằng cách chụp TOÀN màn hình rồi crop (`captureDisplay()` + `cropToBase64()`),
  không phải capture-vùng-nhỏ native. Với tần suất gọi bị giới hạn bởi debounce
  (tối đa mỗi `hoverDelayMs`), chấp nhận được cho v1 — tối ưu capture-vùng-nhỏ
  thật là việc để sau nếu đo được đây là nút thắt hiệu năng thực tế.
- `recognitionLevel = .accurate` (không phải `.fast`) — đo thực nghiệm cho thấy
  vẫn đủ nhanh (<250ms) sau khi model đã nạp, nên ưu tiên độ chính xác.
- Không giữ Tesseract cho `equ` (công thức toán) ở macOS như kế hoạch gốc từng
  đề cập cho ảnh chụp nói chung — Vision đã đủ tốt cho text thường; công thức
  toán trong OCR fallback của Lane A (dịch nhanh) ít gặp hơn nhiều so với Lane B
  (giải bài, đã dùng ảnh trực tiếp qua vision model, không qua OCR).

## Xem lại khi

- Đo được capture-toàn-màn-hình-rồi-crop là nút thắt hiệu năng thật (ví dụ máy
  yếu, màn hình độ phân giải rất cao) — khi đó cân nhắc capture-vùng-nhỏ native.
- Xây nhánh Windows OCR (Phase 4) — kiểm tra Windows OCR API có cùng vấn đề
  cold-start không, và hệ toạ độ có cùng quy ước gốc trên-trái như Windows
  Graphics API thường dùng hay không (khác Vision).
- Xây onboarding thật — cần màn hình xin quyền gộp cả Accessibility lẫn Screen
  Recording, giải thích rõ vì sao cần từng quyền, và nhắc khởi động lại sau khi
  cấp (xem thêm khuyến nghị tương tự ở ADR-0006).
