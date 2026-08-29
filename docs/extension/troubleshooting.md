# Khắc phục sự cố — Chrome Extension

Các lỗi thường gặp và cách xử lý, sắp theo tần suất.

> Không tìm thấy vấn đề của bạn? Xem [bảng cấu hình](configuration.md) hoặc
> [mở issue trên GitHub](https://github.com/sonth87/homework-helper/issues).

---

## Cài đặt & khởi động

### Extension không xuất hiện sau khi Load unpacked

Kiểm tra bạn đã chọn đúng thư mục **`extension/`** — không phải thư mục gốc của repo.
Thư mục đúng phải chứa `manifest.json` ngay bên trong.

### Nút và tính năng không hiện trên trang đang mở

Sau khi cài hoặc cập nhật extension, các **tab đang mở từ trước** chưa được nạp mã mới.
Tải lại trang (`F5`) là xong.

### Thông báo "Extension context invalidated"

Xảy ra khi bạn vừa tải lại extension trong `chrome://extensions` nhưng tab cũ vẫn còn
mở. Đây là hành vi bình thường của Chrome, không phải lỗi hỏng. Tải lại trang.

---

## AI không trả lời

### "Chưa có API Key nào được kích hoạt trong Cài đặt"

Bạn chưa thêm key, hoặc đã thêm nhưng **chưa bật** (công tắc bên cạnh key).

Không muốn dùng key? Ba lựa chọn miễn phí:
- **Gemini Nano** — có sẵn trong Chrome, xem mục dưới
- **Ollama** hoặc **LM Studio** — cài trên máy, xem [api-setup.md](../shared/api-setup.md)

### AI trả lời rất chậm hoặc dừng giữa chừng

| Nguyên nhân | Cách xử lý |
|---|---|
| Model đang "suy nghĩ" (o1, DeepSeek R1, Claude thinking) | Bình thường — các model này im lặng vài chục giây trước khi trả lời |
| Mạng chậm | Thử model nhẹ hơn: Gemini Flash, Llama 8B Instant |
| Key bị giới hạn tốc độ | Xem mục tiếp theo |

### Key bị giới hạn tốc độ (rate limit)

Khi nhà cung cấp trả lỗi `429`, extension **tự động tạm ngưng key đó 60 giây** và chuyển
sang key khác. Với lỗi máy chủ khác, thời gian tạm ngưng là 30 giây.

Nếu chỉ có một key, bạn sẽ phải chờ. Cách khắc phục lâu dài: **thêm nhiều key** cho cùng
một nhà cung cấp — extension sẽ luân phiên giữa chúng và tăng hạn mức thực tế.

### Lỗi xác thực (401 / 403)

Key sai, đã hết hạn, hoặc chưa bật thanh toán ở phía nhà cung cấp. Dùng nút **Kiểm tra
kết nối** ngay cạnh key trong Cài đặt để xác định chính xác.

---

## Gemini Nano

### "Gemini Nano is not available on this device"

Gemini Nano có yêu cầu phần cứng và phiên bản Chrome khá cụ thể. Kiểm tra theo thứ tự:

1. Chrome đủ mới (bản ổn định gần đây)
2. Máy có đủ dung lượng trống — model cần vài GB
3. Đã bật cờ tính năng tương ứng trong `chrome://flags`
4. Vào `chrome://components` xem *Optimization Guide On Device Model* đã tải xong chưa

→ Hướng dẫn từng bước: [api-setup.md](../shared/api-setup.md)

### Nano đang tải mãi không xong

Model vài GB, lần đầu tải lâu là bình thường. Trong lúc chờ, đổi **Chiến lược định tuyến**
sang *Ưu tiên cấu hình* để dùng key cloud.

### Nano không đọc được ảnh chụp bài tập

Đúng như thiết kế — Gemini Nano **chỉ xử lý văn bản**. Câu hỏi có ảnh cần model có thị
giác (Gemini, GPT-4o, Claude). Nếu để chiến lược *Ưu tiên Nano*, extension sẽ tự chuyển
sang cloud khi gặp ảnh.

---

## Mô hình chạy nội bộ (Ollama / LM Studio)

### Không kết nối được

| Kiểm tra | Ollama | LM Studio |
|---|---|---|
| Phần mềm đang chạy? | `ollama serve` | Bật tab **Local Server** |
| Địa chỉ đúng chưa? | `http://127.0.0.1:11434/v1` | `http://127.0.0.1:1234/v1` |
| Đã nạp model chưa? | `ollama pull llama3.3` | Chọn model rồi bấm **Start Server** |

Dùng nút **Kiểm tra kết nối** trong Cài đặt để xác nhận.

### Model nội bộ trả lời sai ngôn ngữ

Model nhỏ (7B trở xuống) thường quay về tiếng Anh dù đã yêu cầu ngôn ngữ khác. Thử model
lớn hơn, hoặc chọn model được huấn luyện tốt cho ngôn ngữ đó (ví dụ Qwen cho tiếng Trung).

---

## Giao diện

### Text hiện tiếng Anh dù đã chọn tiếng Việt

Một số chuỗi chưa được dịch đủ 13 ngôn ngữ — đây là thiếu sót đã biết, không phải lỗi
cấu hình của bạn. Phần lớn giao diện vẫn đúng ngôn ngữ đã chọn.

### Lời giải ra tiếng Anh dù giao diện tiếng Việt

Đây là **hai tuỳ chọn khác nhau**. Đổi **Ngôn ngữ trả lời** trong Cài đặt →
[mục Ngôn ngữ](configuration.md#1-ngôn-ngữ).

### Nút nổi che mất nội dung trang

Kéo nút tới vị trí khác — extension ghi nhớ. Hoặc giảm kích thước/độ mờ, hoặc tắt hẳn
trong Cài đặt → Giao diện.

### Công thức toán hiện thành mã lạ (`$x^2$`)

Công thức KaTeX chưa dựng xong. Thử tạo hội thoại mới. Nếu lặp lại thường xuyên với một
model cụ thể, đó là do model đó xuất công thức sai định dạng — thử model khác.

---

## Chụp ảnh & OCR

### Không khoanh vùng chụp được

- Chrome **không cho phép** chụp trên các trang nội bộ: `chrome://`, Chrome Web Store,
  và trang cài đặt của extension khác. Đây là giới hạn của trình duyệt.
- Trang vừa mở trước khi cài extension → tải lại trang.

### OCR nhận sai chữ

- Cài thêm model cho đúng ngôn ngữ của đề bài (Cài đặt → OCR)
- Với công thức toán, bảo đảm model **Toán & Ký hiệu** đang bật
- Khoanh vùng sát nội dung, tránh lấy dư nền và trang trí xung quanh
- Ảnh mờ hoặc nghiêng sẽ giảm độ chính xác đáng kể

---

## Google Forms

### Nút "AI Solve" không xuất hiện

1. Kiểm tra **Trợ lý Google Forms** đã bật trong Cài đặt
2. Tải lại trang form
3. Google thỉnh thoảng đổi cấu trúc giao diện Forms — nếu vẫn không thấy, hãy báo lỗi

### AI chọn sai đáp án

AI chỉ **gợi ý**. Luôn tự kiểm tra trước khi nộp bài — nhất là với câu hỏi có hình ảnh
hoặc phụ thuộc ngữ cảnh riêng của lớp học.

---

## Dữ liệu

### Mất lịch sử hội thoại

Extension giữ tối đa **50 hội thoại gần nhất** — cuộc cũ hơn bị tự động xoá. Xoá dữ liệu
duyệt web của Chrome cũng xoá luôn lịch sử này.

### Cài lại extension có mất cấu hình không?

Gỡ rồi cài lại sẽ **mất hết**: API key, cấu hình, lịch sử, model OCR đã tải. Cập nhật
(reload) thì giữ nguyên.
