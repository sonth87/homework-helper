# Bảng tra cứu Cấu hình — Chrome Extension

Toàn bộ tuỳ chọn có trong trang **Cài đặt** (chuột phải icon extension → *Tuỳ chọn*),
kèm giá trị mặc định và ý nghĩa thực tế.

> Dành cho **người dùng**. Nếu bạn muốn biết setting được lưu ở file nào trong mã nguồn,
> xem [dev/where.md](../../dev/where.md).

**Mục lục:** [Ngôn ngữ](#1-ngôn-ngữ) · [AI & Mô hình](#2-ai--mô-hình) ·
[Chế độ học tập](#3-chế-độ-học-tập) · [Dịch khi rê chuột](#4-dịch-khi-rê-chuột) ·
[Thanh công cụ bôi đen](#5-thanh-công-cụ-bôi-đen) · [Giao diện](#6-giao-diện) ·
[OCR offline](#7-ocr-offline) · [Tính năng bật/tắt](#8-bật--tắt-tính-năng) ·
[Dữ liệu](#9-dữ-liệu--lịch-sử)

---

## 1. Ngôn ngữ

| Tuỳ chọn | Mặc định | Ý nghĩa |
|---|---|---|
| **Ngôn ngữ giao diện** | Tiếng Việt | Ngôn ngữ của chính extension: menu, nhãn, thông báo. Có 13 lựa chọn. |
| **Ngôn ngữ trả lời** | English | Ngôn ngữ AI dùng để **viết lời giải**. Độc lập với ngôn ngữ giao diện — bạn có thể để giao diện tiếng Việt nhưng bắt AI trả lời tiếng Anh. |

**13 ngôn ngữ giao diện:** Tiếng Việt · English · ไทย · 简体中文 · 繁體中文 · 日本語 ·
한국어 · Español · Français · Deutsch · Português · Bahasa Indonesia · Русский

> Ngôn ngữ trả lời có thêm lựa chọn **Auto** — để AI tự chọn theo ngôn ngữ của đề bài.

---

## 2. AI & Mô hình

### Nhà cung cấp được hỗ trợ

| Nhà cung cấp | Cần API key? | Ghi chú |
|---|---|---|
| **Chrome Built-in (Gemini Nano)** | ❌ Không | Chạy ngay trong Chrome, offline, miễn phí. Chỉ xử lý văn bản, không đọc được ảnh. |
| **Ollama** | ❌ Không | Chạy trên máy bạn. Cần cài Ollama, mặc định `http://127.0.0.1:11434/v1` |
| **LM Studio** | ❌ Không | Chạy trên máy bạn. Mặc định `http://127.0.0.1:1234/v1` |
| **Google Gemini** | ✅ Có | Có gói miễn phí rộng rãi — khuyến nghị nếu mới bắt đầu |
| **OpenAI** | ✅ Có | GPT-5.6, GPT-4o, o3 |
| **Anthropic Claude** | ✅ Có | Claude Opus 5, Sonnet 5, Haiku 4.5 |
| **DeepSeek** | ✅ Có | Rẻ, có model chuyên suy luận (R1) |
| **Groq** | ✅ Có | Rất nhanh, chạy model mã nguồn mở |
| **Custom / OpenRouter** | ✅ Có | Bất kỳ endpoint nào tương thích OpenAI |

→ Cách lấy key miễn phí: [api-setup.md](../shared/api-setup.md)

### Chiến lược định tuyến

| Giá trị | Mặc định | Hành vi |
|---|---|---|
| **Ưu tiên cấu hình** (`prefer_config`) | ✅ | Dùng API key đã cấu hình trước. **Khuyến nghị.** |
| Ưu tiên Nano (`prefer_nano`) | | Thử Gemini Nano trước; tự chuyển sang cloud khi gặp câu hỏi có ảnh hoặc Nano lỗi |
| Chỉ Nano (`nano_only`) | | 100% trên máy. Không gửi gì ra ngoài. Không xử lý được ảnh. |
| Chỉ cấu hình (`config_only`) | | Không bao giờ dùng Nano |

### Xoay vòng key

| Tuỳ chọn | Mặc định | Ý nghĩa |
|---|---|---|
| **Key đang dùng** | Tự động | `Tự động` = luân phiên giữa các key đang bật. Hoặc chọn cứng một key. |
| **Cách xoay vòng** | Lần lượt | `Lần lượt` (round-robin) · `Ngẫu nhiên` · `Chỉ đổi khi lỗi` |

> Khi một key bị giới hạn tốc độ, extension tự động tạm ngưng key đó và chuyển sang key
> khác. Bạn có thể thêm nhiều key cho cùng một nhà cung cấp để tăng hạn mức.

---

## 3. Chế độ học tập

Đổi nhanh ở thanh dưới đáy khung chat, hoặc đặt mặc định trong Cài đặt.

| Chế độ | Mặc định | Dùng khi |
|---|---|---|
| **Giải chi tiết từng bước** | ✅ | Bài tự luận, toán, lý, hoá — cần lập luận đầy đủ |
| **Đáp án trực tiếp** | | Kiểm tra nhanh kết quả, luyện đề gấp |
| **Gợi ý & tự học** | | Muốn tự nghĩ — AI chỉ gợi hướng, **không** tiết lộ đáp án |
| **Giải thích chuyên sâu** | | Ôn lý thuyết, hiểu bản chất khái niệm |
| **Dịch học thuật** | | Đọc tài liệu nước ngoài, giữ nguyên công thức |

---

## 4. Dịch khi rê chuột

| Tuỳ chọn | Mặc định | Phạm vi | Ý nghĩa |
|---|---|---|---|
| **Bật tính năng** | Tắt | | Rê chuột lên văn bản để xem bản dịch, không cần bôi đen |
| **Phím bổ trợ** | `Ctrl` | Ctrl/Shift/Alt/Cmd | Phím phải giữ để kích hoạt. **Bỏ chọn hết** = dịch ngay khi rê chuột, không cần phím. |
| **Mức chi tiết** | Câu | Từ · Câu · Đoạn | Dịch một từ, cả câu, hay cả đoạn văn |
| **Độ trễ** | 350ms | 150–800ms | Thời gian chuột phải đứng yên trước khi tra |
| **Độ mờ nền** | 96% | 40–100% | |
| **Độ nhoè nền** | 18px | 0–30px | Hiệu ứng kính mờ phía sau tooltip |
| **Cỡ chữ** | 13px | 11–16px | |
| **Chiều rộng tối đa** | 300px | 220–420px | |
| **Chủ đề màu** | Kính sáng | 5 chủ đề | Kính sáng · Kính tối · Xanh cyber · Ngọc lục bảo · Tím |
| **Làm nổi văn bản** | Bật | | Tô nền vùng văn bản đang được dịch |
| **Hiệu ứng** | Tô từ đầu đến cuối | | Không · Nhấp nháy · Phát sáng · Quét gạch chân · Tô từ đầu đến cuối |

> **Tính năng này miễn phí và không cần API key.** Nó dùng dịch vụ dịch của Google, không
> gọi mô hình AI — nên phản hồi tức thì và không tốn hạn mức của bạn.

---

## 5. Thanh công cụ bôi đen

| Tuỳ chọn | Mặc định | Phạm vi | Ý nghĩa |
|---|---|---|---|
| **Bật thanh công cụ** | Bật | | Hiện thanh công cụ khi bôi đen văn bản |
| **Sắp xếp nút** | 4 nút ngoài | | Kéo–thả để chọn nút nào hiện ngoài, nút nào vào menu phụ |
| **Hiện chữ trên nút** | Bật | | Tắt = chỉ hiện icon, thanh gọn hơn |
| **Kích thước** | Vừa | Gọn · Vừa · Lớn | |
| **Độ mờ nền** | 90% | 0–100% | |
| **Độ nhoè nền** | 16px | 0–30px | |
| **Chủ đề màu** | Kính sáng | 5 chủ đề + tuỳ chỉnh | Có thể chọn màu riêng bằng mã hex |

**7 nút có sẵn:** Trả lời · Sao chép · Tìm kiếm · Dịch *(mặc định hiện ngoài)* ·
Giải thích · Tóm tắt · Kiểm tra ngữ pháp *(mặc định trong menu phụ)*

---

## 6. Giao diện

### Nút nổi (FAB)

| Tuỳ chọn | Mặc định | Phạm vi |
|---|---|---|
| **Hiện nút nổi** | Bật | |
| **Kích thước** | Vừa | Rất nhỏ · Nhỏ · Vừa · Lớn |
| **Độ mờ** | 90% | 30–100% |
| **Vị trí** | Mặc định | Kéo nút để đổi — vị trí được ghi nhớ |

### Thẻ lời giải nổi

| Tuỳ chọn | Mặc định | Phạm vi |
|---|---|---|
| **Kiểu hiển thị** | Bình thường | Bình thường · Gọn *(ẩn nút phụ cho tới khi rê chuột)* |
| **Độ mờ nền** | 92% | 0–100% |
| **Độ nhoè nền** | 16px | 0–30px |

### Chung

| Tuỳ chọn | Mặc định | Ý nghĩa |
|---|---|---|
| **Chủ đề** | Theo hệ thống | Theo hệ thống · Sáng · Tối |
| **Chiều rộng ngăn kéo chat** | Mặc định | Kéo mép trái ngăn kéo để đổi — được ghi nhớ |

---

## 7. OCR offline

Nhận diện chữ trong ảnh **ngay trên máy**, không gửi ảnh đi đâu.

**Kèm sẵn khi cài** (không cần tải thêm):

| Model | Kích thước | Dùng cho |
|---|---|---|
| Tiếng Việt | 1.9 MB | Đề bài tiếng Việt |
| English | 4.1 MB | Đề bài tiếng Anh, thuật ngữ quốc tế |
| Toán & Ký hiệu | 2.3 MB | Công thức, ký hiệu toán học |

**Tải thêm khi cần:** 简体中文 (4.2 MB) · 繁體中文 (4.8 MB) · 日本語 (4.6 MB) ·
한국어 (3.9 MB) · Español (3.2 MB) · Français (3.8 MB) · Deutsch (3.7 MB) ·
Português (3.3 MB) · Bahasa Indonesia (2.8 MB) · Русский (4.0 MB)

> Model đã tải được lưu trong trình duyệt và dùng được offline. Xoá bất cứ lúc nào
> trong Cài đặt → OCR.

---

## 8. Bật / tắt tính năng

| Tuỳ chọn | Mặc định | Ý nghĩa |
|---|---|---|
| **Trợ lý Google Forms** | Bật | Gắn nút *AI Solve* vào từng câu hỏi trên Google Forms |
| **Thanh công cụ bôi đen** | Bật | |
| **Nút nổi trên trang** | Bật | |
| **Dịch khi rê chuột** | Tắt | |

---

## 9. Dữ liệu & Lịch sử

| Mục | Hành vi |
|---|---|
| **Lịch sử hội thoại** | Giữ tối đa **50** cuộc gần nhất, lưu trong trình duyệt |
| **API key** | Lưu trong bộ nhớ cục bộ của extension, **không** gửi đi đâu ngoài chính nhà cung cấp bạn chọn |
| **Ảnh chụp màn hình** | Chỉ gửi tới mô hình AI bạn đang dùng. Với Gemini Nano / Ollama / LM Studio thì **không rời khỏi máy** |
| **Model OCR** | Lưu trong trình duyệt, chạy offline |

→ Chi tiết: [Quyền riêng tư & lưu trữ dữ liệu](../../dev/extension/storage-and-privacy.md)

---

## Câu hỏi thường gặp

**Tôi phải trả tiền không?**
Không bắt buộc. Gemini Nano, Ollama và LM Studio hoàn toàn miễn phí. Google Gemini có
gói miễn phí đủ dùng cho học tập.

**Extension có đọc mọi trang tôi truy cập không?**
Không. Nó chỉ hoạt động khi bạn chủ động bôi đen, bấm nút, hoặc bật dịch khi rê chuột.

**Vì sao lời giải ra tiếng Anh dù giao diện tiếng Việt?**
Đó là hai tuỳ chọn khác nhau — đổi **Ngôn ngữ trả lời** ở mục [1](#1-ngôn-ngữ).

**Dịch khi rê chuột có tốn hạn mức API không?**
Không. Nó dùng dịch vụ dịch miễn phí, không gọi mô hình AI.
