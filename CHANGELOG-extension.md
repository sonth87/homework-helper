# Changelog — Chrome Extension

Lịch sử phát hành của **Chrome Extension** (`extension/`).

> Desktop App có changelog riêng: [CHANGELOG-desktop.md](./CHANGELOG-desktop.md).
> Version của hai app **độc lập hoàn toàn**, không đồng bộ với nhau — xem
> [CLAUDE.md](./CLAUDE.md) mục 0 và 2.

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/),
đánh version theo [Semantic Versioning](https://semver.org/lang/vi/).

---

## [Unreleased]

_Chưa có thay đổi nào chờ phát hành._

---

## [1.7.1] — 2026-09-01

### Sửa lỗi
- **Chat nhiều lượt nay nhớ được ngữ cảnh hội thoại trước đó** — trước đây mỗi câu hỏi
  gửi lên AI chỉ có mỗi tin nhắn hiện tại, khiến các câu hỏi nối tiếp kiểu "còn câu 2 thì
  sao?" bị model trả lời sai vì không biết "câu 2" là gì. Áp dụng cho cả khung chat
  (Sidepanel), thẻ nổi trên trang, và ô hỏi nhanh khi bôi đen văn bản. Model chạy trên máy
  (Ollama/LM Studio) giữ ít lượt hội thoại gần nhất hơn model trên mây, vì ngữ cảnh dài
  cộng thẳng vào thời gian chờ trả lời mà model local vốn đã chậm hơn.

---

## [1.7.0] — 2026-09-01

### Thêm mới
- **Bấm vào icon extension trên thanh công cụ nay mở ô dịch nhanh**, thay vì mở thẳng
  khung chat AI. Ô dịch có cặp ngôn ngữ (tự động nhận diện → ngôn ngữ đích), nút đảo
  chiều, ô nhập và ô kết quả kèm nút sao chép. `Ctrl/Cmd + Enter` để dịch mà không rời
  ô nhập.
- **Tự dịch nội dung vừa copy.** Nếu bạn copy một đoạn text rồi bấm vào icon extension,
  nội dung đó được điền sẵn và dịch luôn, kèm dòng ghi chú và nút *Hoàn tác*. Đoạn quá
  dài chỉ được điền sẵn chứ không tự dịch. Bật/tắt ngay trong ô dịch — mặc định **bật**.
  Cùng một nội dung sẽ không bị dịch lại ở những lần mở sau.
- **Chọn nguồn dịch.** Bốn dịch vụ miễn phí không cần API key — Microsoft Translator
  (mặc định), Google Translate, Volcano Translate, MyMemory — hoặc **Mô hình AI**, dùng
  chính kho API key / mô hình cục bộ (Ollama, LM Studio, Gemini Nano) mà bạn đã cấu hình.
  Tra một từ đơn bằng mô hình AI vẫn cho ra thẻ từ điển đầy đủ như thanh công cụ bôi đen.
- Hàng nút chức năng nhanh dưới ô dịch: **Chat AI · Chụp & Giải · Rê chuột dịch · Cài đặt**.
  Nút *Rê chuột dịch* bật/tắt tính năng ngay tại chỗ và sáng lên khi đang bật.
- **Tra từ điển khi dịch một từ.** Gõ đúng một từ vào ô dịch nhanh sẽ ra thẻ từ điển đầy
  đủ: phiên âm, các nghĩa gom theo từ loại (danh từ, động từ…), và câu ví dụ — không cần
  API key, kể cả khi đang chọn nguồn dịch miễn phí. Cả câu vẫn dịch như thường. Nhãn từ
  loại hiển thị theo **Ngôn ngữ giao diện** bạn đã chọn trong Cài đặt, không phụ thuộc
  ngôn ngữ đang dịch sang.
- **Nút nghe phát âm** ở cả ô dịch nhanh (nghe từ gốc và nghe bản dịch) lẫn thẻ kết quả
  nổi trong trang. Dùng giọng đọc sẵn có của hệ điều hành — không cần API key, không tốn
  hạn mức, không gửi gì lên mạng. Với chữ Hán, ngôn ngữ của trang web được dùng để chọn
  đúng giọng Nhật hay Trung.

### Thay đổi
- Khung chat AI nay mở bằng `Alt+K` / `Cmd+K`, nút nổi trên trang, hoặc nút **Chat AI**
  trong ô dịch — icon trên thanh công cụ đã nhường chỗ cho ô dịch.

### Sửa lỗi
- **Dịch khi rê chuột hay báo "Không thể dịch".** Trước đây tính năng này chỉ gọi một
  endpoint Google miễn phí duy nhất; endpoint đó chặn theo địa chỉ IP, nên trong mạng
  công ty hay trường học — nơi nhiều người cùng dùng một IP — nó trả lỗi *429* và mọi
  yêu cầu dịch đều hỏng. Nay khi một dịch vụ từ chối, extension tự chuyển sang dịch vụ
  kế tiếp trong danh sách bốn nguồn miễn phí.

---

## [1.6.2] — 2026-08-31

### Thay đổi
- Icon thu gọn của thẻ giải bài (khi kéo thẻ để ẩn thành nút tròn) nay đổi kích thước
  **và độ mờ** theo đúng cài đặt **Kích thước** / **Độ mờ nút nổi FAB**, thay vì luôn
  cố định một cỡ và độ mờ 85%.
- Thẻ giải bài (popup) có thể thu nhỏ hơn khi kéo cạnh để resize.
- Ở chế độ Compact, nút hành động chính dưới đáy thẻ (ví dụ *Tiếp tục trong chat*,
  *Chụp câu tiếp theo*) nay chỉ hiện icon, ẩn chữ — đồng bộ với nút Sao chép/Thử lại
  vốn đã làm vậy.
- Thanh công cụ khi cắt ảnh (Huỷ / Sao chép / Dịch / Hỏi AI) nay dùng **chung một giao
  diện** với thanh công cụ khi bôi đen văn bản — cùng kiểu viên thuốc kính mờ, cùng
  chịu ảnh hưởng của mọi cài đặt **Chủ đề / Kích thước / Độ mờ / Độ nhoè / Hiện chữ trên
  toolbar** — thay vì mỗi nơi một kiểu (trước đây thanh cắt ảnh nền tối, nút "Hỏi AI"
  tô nổi bật riêng). Chức năng của từng nút giữ nguyên.

### Sửa lỗi
- **Nhận diện chữ từ ảnh (OCR) không hoạt động trong bản cài từ Chrome Web Store.**
  Bước nén gói phát hành làm hỏng bộ máy OCR ngoại tuyến, khiến chức năng "Cắt ảnh &
  Giải bài" luôn báo lỗi *"Không trích xuất được văn bản từ ảnh"* với người dùng chưa
  cấu hình API key — dù bản chạy trực tiếp từ mã nguồn vẫn bình thường. Gói phát hành
  nay giữ nguyên vẹn các thư viện OCR và tự kiểm tra trước khi đóng gói.
- **Model cục bộ chỉ đọc được chữ (Ollama / LM Studio) không nhận được nội dung ảnh.**
  Bước OCR đệm trước khi gửi cho model luôn thất bại, nên câu hỏi được gửi đi mà
  không kèm cả ảnh lẫn chữ trích xuất — model trả lời lạc đề hoặc hỏi lại đề bài.

## [1.6.1] — 2026-08-29

### Thay đổi
- Tái cấu trúc mã nguồn nội bộ để dễ đọc và dễ bảo trì hơn. Không đổi hành vi.

## [1.6.0] — 2026-08-28

### Thêm mới
- **Dịch nhanh khi rê chuột** trên mọi trang web: chỉ cần đưa chuột lên văn bản là
  hiện tooltip dịch, không cần bôi đen trước.
- Tuỳ chỉnh đầy đủ cho tính năng này: phím bổ trợ (Ctrl/Shift/Alt/Cmd), mức chi tiết
  (từ / câu / đoạn), độ trễ, độ mờ, độ nhoè nền, cỡ chữ, chiều rộng tối đa, chủ đề màu,
  làm nổi vùng văn bản và hiệu ứng.
- Bản địa hoá đầy đủ 13 ngôn ngữ cho toàn bộ tuỳ chọn mới.

## [1.5.0] — 2026-08-28

### Thêm mới
- Hỗ trợ **Gemini Nano** — mô hình AI chạy hoàn toàn trên thiết bị, không cần API key
  và không gửi dữ liệu ra ngoài.
- Trang hướng dẫn nhanh giúp bật và kiểm tra trạng thái Gemini Nano.

## [1.4.0] — 2026-08-27

### Thêm mới
- **Trình sắp xếp thanh công cụ bằng kéo–thả**: tự chọn nút nào hiện ngoài thanh chính,
  nút nào nằm trong menu phụ.
- Bản địa hoá cho toàn bộ giao diện sắp xếp.

## [1.3.1] — 2026-08-27

### Thay đổi
- Cải thiện hiển thị trạng thái đang tải của overlay lời giải.

### Sửa lỗi
- Khắc phục một số trường hợp thanh công cụ bôi đen hoạt động không ổn định.

## [1.3.0] — 2026-08-27

### Thêm mới
- **Tra từ điển cho từ đơn**: khi dịch một từ duy nhất, kết quả hiển thị theo dạng từ
  điển (loại từ, nghĩa, ví dụ) thay vì một dòng dịch thô.

## [1.2.8] — 2026-08-26

### Thêm mới
- Tuỳ chọn **vị trí thanh công cụ** khi bôi đen văn bản.

## [1.2.7] — 2026-08-25

### Thay đổi
- Tối ưu tốc độ vẽ và tinh chỉnh giao diện thanh công cụ bôi đen.

## [1.2.5] — 2026-08-25

### Thay đổi
- Chuẩn hoá tên các ngôn ngữ hiển thị trong Cài đặt cho nhất quán.

## [1.2.3] — 2026-08-25

### Thêm mới
- Hướng dẫn cài đặt Ollama và LM Studio bằng đủ 13 ngôn ngữ, kèm liên kết tải trực tiếp.

### Sửa lỗi
- Đưa version về đúng nhánh phát hành sau một lần đánh số nhầm (xem ghi chú cuối file).

## [1.2.2] — 2026-08-24

### Thêm mới
- **Kiểm tra kết nối** tới nhà cung cấp AI ngay trong Cài đặt.
- Cải thiện màn hình quản lý API key.

### Thay đổi
- Nâng cấp xử lý dịch thuật.

## [1.2.1] — 2026-08-24

### Thêm mới
- Hỗ trợ dịch thuật trong luồng khoanh vùng ảnh.

### Thay đổi
- Cải thiện thao tác khoanh vùng chụp ảnh.

## [1.1.5] — 2026-08-20

### Sửa lỗi
- Xử lý công thức LaTeX chính xác hơn trong bộ dựng markdown.

## [1.1.4] — 2026-08-20

### Thay đổi
- Cải thiện hành vi của thẻ lời giải nổi.

## [1.1.3] — 2026-08-20

### Thay đổi
- Làm rõ phần tiêu đề trong prompt gửi kèm ảnh, giúp AI hiểu đúng đề bài hơn.

## [1.1.1] — 2026-08-20

### Thay đổi
- Bổ sung nhãn trợ năng cho các nút trên thanh công cụ.
- Tinh chỉnh độ mờ mặc định.

## [1.1.0] — 2026-08-20

### Thêm mới
- **Hỗ trợ mô hình AI chạy nội bộ** qua Ollama và LM Studio — dùng được hoàn toàn
  offline, không cần API key.
- Giao diện kết nối và quản lý máy chủ AI nội bộ.

---

## Trước 1.1.0

Các phiên bản trước `1.1.0` đứng yên ở `1.0.0` trong khi nhiều tính năng lớn đã được
phát hành mà không bump version, gồm:

- Bộ máy **OCR offline** bằng Tesseract.js chạy trong offscreen document (2026-08-17)
- **Đa ngôn ngữ giao diện** và tách nhỏ mã nguồn sidepanel/content script (2026-08-17)
- Hỗ trợ mô hình nội bộ trong Side Panel (2026-08-18)
- Hiển thị các bước xử lý khi AI đang trả lời (2026-08-19)

---

## Ghi chú về tính chính xác của lịch sử

File này được **dựng lại từ lịch sử git** ngày 2026-08-29, vì repo không có changelog
trong suốt ~18 lần phát hành đầu tiên. Nội dung suy ra từ commit message nên mô tả có
thể thiếu chi tiết so với thực tế thay đổi.

Hai điểm bất thường trong lịch sử version:

1. **Nhảy version nhầm**: commit `834c9c0` (2026-08-25) đặt version thành `1.4.0`, sau đó
   commit `4dbcaad` cùng ngày đưa về `1.2.3`. Bản `1.4.0` thật sự được phát hành ngày
   2026-08-27 tại commit `9b33266`.
2. **Version bị bỏ qua**: `1.1.2`, `1.2.0`, `1.2.4`, `1.2.6` không tồn tại.

Từ `1.6.1` trở đi, mọi lần bump **bắt buộc** kèm một mục trong file này — xem
[CLAUDE.md](./CLAUDE.md) mục 3.
