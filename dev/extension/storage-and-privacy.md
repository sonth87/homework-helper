# Quyền Riêng tư & Lưu trữ Dữ liệu (Privacy & Storage Architecture)

**Homework Helper** tuân thủ nguyên tắc thiết kế **Local-First & Zero-Tracking (Ưu tiên Cục bộ & Không Thu Thập Dữ Liệu)**. Mọi dữ liệu học tập, ảnh chụp bài tập và cấu hình API Key đều thuộc quyền sở hữu riêng của người dùng.

---

## 1. Cam kết Quyền Riêng tư (Privacy Principles)

1. **Không yêu cầu Đăng nhập (Zero-Login)**:
   - Người dùng không cần tạo tài khoản, không cần cung cấp email, số điện thoại hay thông tin cá nhân.
2. **Không có Máy chủ Thu thập Dữ liệu Trung gian (No Telemetry / No Tracking)**:
   - Tiện ích không chứa bất kỳ mã theo dõi quảng cáo, Google Analytics, hay máy chủ proxy thu thập dữ liệu trung gian nào.
   - Toàn bộ kết nối API được gửi trực tiếp từ trình duyệt của người dùng đến máy chủ của nhà cung cấp AI mà bạn đã chọn (Google, OpenAI, Anthropic, Groq...).
3. **100% Cục bộ khi dùng Gemini Nano**:
   - Khi chạy ở chế độ Gemini Nano On-Device, dữ liệu câu hỏi và hình ảnh không bao giờ rời khỏi máy tính của bạn.

---

## 2. Cơ chế Lưu trữ Cục bộ (Local Storage Architecture)

Tiện ích sử dụng hai cơ chế lưu trữ chuẩn của trình duyệt Chrome:

### A. Chrome Storage Local (`chrome.storage.local`)
- **Mục đích**: Lưu trữ cấu hình cài đặt, danh sách API Key Pool (được mã hóa/ẩn trên giao diện), tùy biến màu sắc Liquid Glass và lịch sử đa hội thoại.
- **Quyền `unlimitedStorage` trong Manifest**:
  - Chrome mặc định giới hạn mỗi tiện ích 5MB lưu trữ trong `chrome.storage.local`.
  - Tiện ích khai báo quyền `"unlimitedStorage"` để người dùng thoải mái lưu trữ các phiên học tập kèm ảnh crop bài tập mà không bao giờ gặp lỗi `QUOTA_EXCEEDED_ERR`.

### B. Cơ sở dữ liệu Offline IndexedDB (`IndexedDB`)
- **Database Name**: `HomeworkAi_Ocr_DB`
- **Object Store**: `traineddata_models`
- **Mục đích**: Lưu trữ các file nhị phân mô hình OCR WebAssembly (`.traineddata`) được tải về theo nhu cầu của người dùng.
- **Giải phóng Bộ nhớ**: Người dùng có thể xóa từng mô hình OCR bất cứ lúc nào trong tab **Quản lý Model OCR Cục bộ** để thu hồi dung lượng ổ cứng.

---

## 3. Sao lưu & Xóa Dữ liệu (Backup & Data Retention)

Trong tab **Cài đặt Chung (`tabGeneral`)** của trang Options:
- **Xuất Cấu hình JSON (`Export Config`)**: Cho phép sao lưu toàn bộ danh sách API Key, prompt hệ thống và cài đặt màu sắc sang file `.json` để dễ dàng đồng bộ sang máy tính khác.
- **Xóa Lịch sử Chat (`Clear Chat History`)**: Xóa sạch toàn bộ các phiên hội thoại và ảnh bài tập đã lưu, đưa tiện ích về trạng thái ban đầu chỉ với 1 click.
