# Chi tiết Tính năng & Hướng dẫn Sử dụng (Features Guide)

**Homework Helper** là trợ lý AI đa năng, hỗ trợ giải quyết từ bài tập trắc nghiệm, bài toán đại số/giải tích, đồ thị khoa học, phản ứng hóa học đến bài đọc hiểu tài liệu và dịch thuật ngoại ngữ.

---

## 1. Bảng Tổng hợp Tính năng & Tài liệu Chi tiết (Feature Matrix)

| Nhóm Tính Năng | Tên Tính Năng | Tài liệu Chi tiết | Phím Tắt / Vị trí |
| :--- | :--- | :--- | :--- |
| **Ảnh & Đồ thị** | **Khoanh Vùng & Giải Bài Tập** | [01-crop-and-solve.md](01-crop-and-solve.md) | `Alt + C` (hoặc `Cmd + E` trên Mac) / Nút kéo nổi |
| **Trò chuyện Học tập** | **Ngăn Kéo Chat Học Tập Nổi** | [02-floating-chat-drawer.md](02-floating-chat-drawer.md) | `Alt + K` (hoặc `Cmd + K` trên Mac) / Nút nổi |
| **Tương tác Văn bản** | **Thanh Công Cụ Bôi Đen** | [03-selection-toolbar.md](03-selection-toolbar.md) | Bôi đen bất kỳ đoạn văn bản nào trên trang |
| **Trắc nghiệm & Quiz** | **Trợ lý Trắc nghiệm & Quiz** | [04-online-quiz-solver.md](04-online-quiz-solver.md) | Tự động nhận diện trắc nghiệm trên trang web |
| **Định tuyến AI** | **AI Routing & Key Rotator** | [05-ai-routing-and-models.md](05-ai-routing-and-models.md) | 4 Chiến lược định tuyến & Xoay vòng Key Pool |
| **Thị giác Máy tính** | **Local WebAssembly OCR** | [06-local-ocr-engine.md](06-local-ocr-engine.md) | 13 Mô hình ngôn ngữ Offline & Quản lý Model |
| **Cá nhân hóa UI** | **Tùy biến Liquid Glass** | [07-liquid-glass-customization.md](07-liquid-glass-customization.md) | Tab Giao diện trong Cài đặt & Live Preview |
| **Đa Ngôn ngữ** | **Cưỡng Chế Đa Ngôn Ngữ** | [08-multi-language-support.md](08-multi-language-support.md) | Cưỡng chế 12+ thứ tiếng đầu ra chuẩn 100% |

---

## 2. Chi tiết 5 Chế độ Học tập Chuyên biệt (Pedagogical Study Modes)

Người dùng có thể chuyển đổi chế độ học tập linh hoạt tại thanh công cụ dưới đáy khung chat hoặc menu lựa chọn:

### 2.1. Giải Chi tiết Từng Bước (`step-by-step`) - Mặc định
- **Mục đích**: Dành cho các bài tập tự luận, bài toán đại số, hình học, hóa học, vật lý cần lập luận chặt chẽ.
- **Cấu trúc lời giải**:
  1. **Kết luận / Đáp án nhanh**: Nêu rõ phương án đúng (A, B, C, D) hoặc giá trị số cuối cùng.
  2. **Phương pháp & Định lý áp dụng**: Trích dẫn các công thức, định lý liên quan bằng mã LaTeX ($...$).
  3. **Các bước biến đổi chi tiết**: Trình bày từng bước giải tích, rút gọn phương trình rõ ràng.
  4. **Đóng khung đáp án**: Khung viền nổi bật để người học dễ dàng đối chiếu.

### 2.2. Đáp án Trực tiếp (`direct`)
- **Mục đích**: Kiểm tra nhanh kết quả bài tập trắc nghiệm hoặc đối chiếu đáp số khi đang luyện đề thi gấp rút.
- **Cấu trúc**: Chỉ đưa ra kết quả trọng tâm ngắn gọn nhất, không phân tích dài dòng.

### 2.3. Gợi ý & Hướng dẫn Tự học (`hint`)
- **Mục đích**: Phương pháp sư phạm Socrate – giúp người học tự tư duy thay vì xem trước lời giải hoàn chỉnh.
- **Cấu trúc**:
  - Gợi ý hướng tiếp cận và công thức cần nhớ.
  - Đặt câu hỏi định hướng để người học tự làm bước tiếp theo.
  - Tuyệt đối không tiết lộ trực tiếp đáp án cuối cùng.

### 2.4. Giải thích Chuyên sâu (`explain`)
- **Mục đích**: Ôn tập lý thuyết, bản chất hiện tượng khoa học, các khái niệm phức tạp trong môn Sinh học, Lịch sử, Triết học, Kinh tế học.
- **Cấu trúc**: Cung cấp định nghĩa gốc, các ví dụ thực tiễn trong đời sống và các trường hợp ngoại lệ cần lưu ý.

### 2.5. Dịch thuật Học thuật (`translate`)
- **Mục đích**: Đọc hiểu tài liệu nước ngoài, đề thi chuẩn hóa quốc tế (SAT, ACT, IELTS, GRE).
- **Cấu trúc**: Dịch chuẩn xác ngữ cảnh học thuật sang ngôn ngữ mục tiêu, giữ nguyên toàn bộ ký hiệu và cấu trúc công thức toán học.

---

## 3. Hệ thống Quản lý Đa Hội thoại (Multi-Session History Manager)

1. **Tạo Hội thoại Mới (`+ New Chat`)**:
   - Nút `+` có sẵn tại thanh Header của Chat Drawer, Popup Card và Side Panel.
   - Khi bấm `+`, khung chat sẽ được làm mới ngay lập tức với giao diện chào mừng và các chip gợi ý môn học (Toán, Lý, Hóa, Sinh, Anh, Văn).
2. **Xem Danh sách Lịch sử (`History Drawer`)**:
   - Nhấn vào biểu tượng đồng hồ lịch sử trên Header để mở danh sách toàn bộ các phiên hỏi bài trước đây.
   - Mỗi mục hiển thị: Ảnh đại diện bài tập đã crop, Tiêu đề tự động trích xuất từ câu hỏi, Thời gian tạo, và nút Xóa từng phiên riêng lẻ.
3. **Chuyển đổi Phiên tức thì**:
   - Click vào bất kỳ phiên nào trong lịch sử ➔ Toàn bộ tin nhắn, công thức KaTeX và hình ảnh của phiên đó sẽ được tải lại nguyên vẹn ngay lập tức.
4. **Tối ưu hóa Bộ nhớ**:
   - Tự động duy trì tối đa 50 cuộc hội thoại gần nhất để đảm bảo tốc độ mở nhanh và nhẹ nhất cho trình duyệt.

---

## 4. Trợ lý Trắc nghiệm Google Forms (Google Forms Deep Assistant)

Khi người dùng làm bài tập trên `https://docs.google.com/forms/*`:
1. **Tự động nhận diện DOM**: Tiện ích tự động quét tất cả các khối câu hỏi (`.geS5n`, `.Qr7Oae`) trên biểu mẫu.
2. **Gắn nút AI Solve**: Một nút **"AI Solve"** nhỏ gọn với hiệu ứng kính mờ xuất hiện tinh tế ngay phía trên góc phải của mỗi câu hỏi.
3. **Phân tích & Chọn đáp án**:
   - Khi bấm **AI Solve**, AI sẽ đọc nội dung câu hỏi và toàn bộ danh sách các phương án lựa chọn A, B, C, D.
   - AI tự động đưa ra phân tích lý do chọn và tự động kích hoạt sự kiện click chọn đúng ô radio/checkbox trên form cho người dùng.

---

## 5. Hỗ trợ Đa Ngôn ngữ Tuyệt đối (Multilingual Output Engine)

Tiện ích hỗ trợ cưỡng chế ngôn ngữ đầu ra trên toàn bộ các mô hình (bao gồm cả Gemini Nano On-Device):
- **Tiếng Việt (Vietnamese)**
- **Tiếng Anh (English)**
- **Tiếng Trung Giản thể (简体中文) & Phồn thể (繁體中文)**
- **Tiếng Nhật (日本語)**
- **Tiếng Hàn (한국어)**
- **Tiếng Tây Ban Nha (Español)**
- **Tiếng Pháp (Français)**
- **Tiếng Đức (Deutsch)**
- **Tiếng Bồ Đào Nha (Português)**
- **Tiếng Indonesia (Bahasa Indonesia)**
- **Tiếng Nga (Русский)**

*Khi người dùng chọn bất kỳ ngôn ngữ nào, toàn bộ lời giải, giải thích, các bước biến đổi và nhãn KaTeX đều được viết chuẩn 100% bằng ngôn ngữ đó.*
