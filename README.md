# Homework Helper

> **Trợ lý AI giải bài tập, dịch thuật và học tập — miễn phí, ưu tiên quyền riêng tư**

Giải bài tập từ ảnh chụp, dịch tài liệu, tóm tắt và giải thích nội dung — bằng AI đám mây
hoặc mô hình chạy hoàn toàn trên máy bạn.

---

## Repo này chứa hai sản phẩm độc lập

| | [**Chrome Extension**](#-chrome-extension) | [**Desktop App**](#-desktop-app) |
|---|---|---|
| Trạng thái | ✅ Đang phát hành — `1.6.1` | 🚧 Đang lập kế hoạch |
| Nền tảng | Chrome (Manifest V3) | macOS, Windows (Electron) |
| Phạm vi | Trong trình duyệt | **Mọi ứng dụng trên màn hình** |
| Mã nguồn | [`extension/`](extension/) | `desktop/` — chưa khởi tạo |

Hai app **không chia sẻ mã nguồn**, có version và chu kỳ phát hành riêng.
Xem [ADR-0001](dev/decisions/0001-tach-hoan-toan-hai-app.md) để biết vì sao.

---

## 🧩 Chrome Extension

### Cài đặt nhanh

1. Mở Chrome, vào `chrome://extensions`
2. Bật **Developer mode** (góc trên bên phải)
3. Bấm **Load unpacked**, chọn thư mục **`extension/`**
4. Nhấn `Alt + C` (`Cmd + E` trên Mac) để khoanh vùng và giải bài tập bất kỳ

### Tính năng chính

- **Khoanh vùng & giải bài tập** — chụp đề bài trên màn hình, nhận lời giải từng bước
  với công thức KaTeX
- **Dịch khi rê chuột** — đưa chuột lên văn bản bất kỳ để xem bản dịch, không cần bôi đen
- **Chat học tập nổi** — hỏi đáp nhiều lượt, lưu lịch sử hội thoại
- **Trợ lý trắc nghiệm** — tự nhận diện và gợi ý đáp án trên Google Forms
- **OCR offline** — nhận diện chữ bằng WebAssembly, không cần mạng
- **Chạy 100% trên máy** — Gemini Nano, Ollama hoặc LM Studio, không cần API key
- **13 ngôn ngữ giao diện**, ép ngôn ngữ đầu ra cho mọi mô hình

---

## 🖥️ Desktop App

Đang ở giai đoạn thiết kế. Mục tiêu: mang toàn bộ tính năng trên ra **mọi ứng dụng** —
PDF, Word, PowerPoint, IDE, phần mềm học offline, máy ảo, remote desktop — những nơi
extension không với tới được.

Tài liệu kế hoạch: [đặc tả gốc](roadmap/desktop-app.md) ·
[kế hoạch & lộ trình](roadmap/desktop-app-implementation-plan.md) ·
[cấu trúc mã nguồn](roadmap/desktop-app-structure.md)

---

## 📚 Tài liệu

Tài liệu chia theo **người đọc**, không theo chủ đề:

### 👤 Cho người dùng — [`docs/`](docs/)

- [Toàn bộ tính năng & 5 chế độ học tập](docs/extension/features/index.md)
- [Bảng tra cứu cấu hình](docs/extension/configuration.md) — mọi tuỳ chọn và ý nghĩa
- [Khắc phục sự cố](docs/extension/troubleshooting.md)
- [Cấu hình API key & bật mô hình chạy nội bộ](docs/shared/api-setup.md)
- [Quyền riêng tư và dữ liệu được lưu ở đâu](dev/extension/storage-and-privacy.md)
- [Lịch sử phát hành](CHANGELOG-extension.md)

Hướng dẫn từng tính năng:
[Khoanh vùng & giải bài](docs/extension/features/01-crop-and-solve.md) ·
[Chat nổi](docs/extension/features/02-floating-chat-drawer.md) ·
[Thanh công cụ bôi đen](docs/extension/features/03-selection-toolbar.md) ·
[Trắc nghiệm](docs/extension/features/04-online-quiz-solver.md) ·
[Định tuyến AI](docs/extension/features/05-ai-routing-and-models.md) ·
[OCR offline](docs/extension/features/06-local-ocr-engine.md) ·
[Tuỳ biến giao diện](docs/extension/features/07-liquid-glass-customization.md) ·
[Đa ngôn ngữ](docs/extension/features/08-multi-language-support.md)

### 🛠️ Cho lập trình viên — [`dev/`](dev/)

- **[Tôi muốn sửa X — vào file nào?](dev/where.md)** ← bắt đầu từ đây
- [Kiến trúc kỹ thuật](dev/extension/architecture.md)
- [Sổ tay phát triển & đóng gói](dev/extension/development.md)
- [Quyết định kiến trúc (ADR)](dev/decisions/)

### 🤖 Cho AI agent

- [`CLAUDE.md`](CLAUDE.md) — quy tắc bắt buộc: phạm vi app, i18n, bump version, CHANGELOG
- [`.claude/skills/`](.claude/skills/) — quy trình từng bước cho việc lặp lại
- [`I18N-GUIDELINES.md`](I18N-GUIDELINES.md) — chi tiết quy tắc đa ngôn ngữ

### 🗺️ Kế hoạch — [`roadmap/`](roadmap/)

- [Kiến trúc tài liệu](roadmap/documentation-plan.md)

---

## 🔧 Lệnh thường dùng

```bash
npm run check          # kiểm tra i18n + version trước khi commit
npm run check:i18n     # 13 locale có đồng bộ không
npm run check:version  # package.json == manifest.json, đã có mục CHANGELOG chưa
npm run zip            # đóng gói homework-helper.zip để nộp Chrome Web Store
```

---

## 📜 Giấy phép

MIT License.
