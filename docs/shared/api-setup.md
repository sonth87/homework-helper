# Hướng dẫn Cấu hình API & Bật Chrome Gemini Nano (API Setup & Configuration)

Tài liệu này cung cấp hướng dẫn chi tiết từng bước để cấu hình cả **Mô hình Cục bộ Miễn phí (Chrome Gemini Nano On-Device)** và các **API Key Đám mây Đa Nhà Cung Cấp**.

---

## 1. Hướng dẫn Kích hoạt Chrome Gemini Nano (100% Cục bộ & Miễn phí)

Mô hình **Gemini Nano** chạy trực tiếp trên card đồ họa (GPU) hoặc CPU của máy tính bạn thông qua API tích hợp sẵn của trình duyệt Chrome.

### 📋 5 Bước Kích hoạt Chi tiết:

1. **Bước 1: Bật cờ Prompt API**
   - Mở tab mới trên Chrome và dán đường dẫn:
     ```
     chrome://flags/#prompt-api-for-gemini-nano
     ```
   - Chuyển trạng thái từ *Default* sang **Enabled** (hoặc **Enabled Multilingual**).

2. **Bước 2: Bỏ qua giới hạn phần cứng (Bắt buộc)**
   - Dán đường dẫn sau vào thanh địa chỉ:
     ```
     chrome://flags/#optimization-guide-on-device-model
     ```
   - Chuyển trạng thái sang **Enabled BypassPerfRequirement** *(Cờ này giúp Chrome tải model ngay cả khi laptop đang dùng pin hoặc máy có cấu hình tầm trung)*.

3. **Bước 3: Khởi động lại Chrome**
   - Nhấn nút **Relaunch** màu xanh xuất hiện ở góc dưới bên phải màn hình để Chrome áp dụng các cờ mới.

4. **Bước 4: Tải tệp mô hình về máy**
   - Mở tab mới và truy cập:
     ```
     chrome://components
     ```
   - Tìm mục có tên **Optimization Guide On Device Model**.
   - Nhấn nút **Check for update**.
   - Chờ trong giây lát cho đến khi trạng thái hiển thị: `Status - Up-to-date` *(Chrome sẽ tải khoảng 1.5GB mô hình Gemini Nano về máy một lần duy nhất)*.

5. **Bước 5: Kiểm tra hoàn tất**
   - Mở trang Cài đặt của Homework Helper ➔ Nhấn nút **"Kiểm tra Model Nội bộ"**. Badge xanh lá cây **"Đã sẵn sàng"** sẽ xuất hiện!

---

## 2. Hướng dẫn Lấy API Key Đám mây Miễn phí (Cloud API Keys)

Nếu bạn muốn giải các bài toán có hình vẽ hình học phức tạp, sơ đồ mạch điện, hoặc cấu trúc hóa học, bạn nên thêm ít nhất 1 API Key đám mây (hoàn toàn miễn phí):

### 🌟 A. Google Gemini 2.5 Flash / Flash Lite (Khuyên dùng số 1 - Miễn phí)
- **Nhà cung cấp**: Google DeepMind
- **Hạn ngạch miễn phí**: **15 yêu cầu/phút, 1.500 yêu cầu/ngày** (Rất dư dả cho nhu cầu sử dụng cá nhân hoàn toàn miễn phí).
- **Khả năng**: Đọc hiểu hình ảnh, biểu đồ, nhận diện chữ viết tay và công thức toán học tốt nhất thế giới hiện nay.
- **Cách lấy Key**:
  1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Đăng nhập bằng tài khoản Google bất kỳ.
  3. Nhấn **Create API Key** ➔ Chọn một Google Cloud Project (hoặc tạo mới nhanh trong 3 giây) ➔ Copy chuỗi Key.
  4. Mở trang Cài đặt của tiện ích ➔ Nhấn **"Thêm Model & Key"** ➔ Chọn nhà cung cấp **Google Gemini** ➔ Dán Key và Lưu.

---

### ⚡ B. Groq Cloud (Tốc độ Suy luận Siêu Tốc - Miễn phí)
- **Nhà cung cấp**: Groq Inc.
- **Mô hình hỗ trợ**: `llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b`.
- **Đặc điểm**: Tốc độ phản hồi cực nhanh (trên 300 tokens/giây).
- **Cách lấy Key**:
  1. Truy cập [Groq Console](https://console.groq.com/keys).
  2. Đăng ký tài khoản miễn phí ➔ Nhấn **Create API Key**.
  3. Dán Key vào tiện ích và chọn model `llama-3.3-70b-versatile`.

---

### 🧠 C. DeepSeek Platform (Mô hình Suy luận Toán học R1)
- **Nhà cung cấp**: DeepSeek AI
- **Mô hình hỗ trợ**: `deepseek-chat` (V3), `deepseek-reasoner` (R1).
- **Đặc điểm**: Khả năng suy luận từng bước cho các bài toán đại số, Olympic và giải tích cực kỳ mạnh mẽ.
- **Cách lấy Key**:
  1. Truy cập [DeepSeek Open Platform](https://platform.deepseek.com/api_keys).
  2. Tạo API Key và dán vào tiện ích dưới provider **DeepSeek**.

---

### 🛡️ D. OpenAI & Anthropic Claude
- **OpenAI**: [OpenAI Platform](https://platform.openai.com/api-keys) (`gpt-4o`, `gpt-4o-mini`).
- **Anthropic Claude**: [Anthropic Console](https://console.anthropic.com/settings/keys) (`claude-3-5-sonnet-20241022`).

---

## 3. Quản lý Nhiều Key & Cân bằng Tải Tự động

Tiện ích cho phép bạn thêm **nhiều API Key cùng lúc** (Ví dụ: 3 key Gemini miễn phí từ 3 tài khoản Google khác nhau):
1. **Cân bằng tải Round-Robin**: Yêu cầu giải bài tập sẽ lần lượt được chia đều cho các Key:
   - Câu 1: Key A
   - Câu 2: Key B
   - Câu 3: Key C
2. **Tự động chuyển tiếp khi hết lượt (Auto Failover)**:
   - Nếu Key A bị giới hạn 15 lượt/phút, hệ thống tự động đưa Key A vào chế độ nghỉ và **ngay lập tức dùng Key B** để trả lời câu hỏi của bạn mà không bị báo lỗi gián đoạn.
