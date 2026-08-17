# Homework Helper

> **Zero-Fee AI Homework Solver & Academic Assistant for Chrome**

Homework Helper is a fast, privacy-focused Chrome Extension (Manifest V3) that helps students and educators solve homework questions, understand complex math/science formulas with step-by-step KaTeX reasoning, and run on-device AI with Chrome Gemini Nano and offline WebAssembly OCR.

---

## ⚡ Quick Start

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the **`extension/`** folder.
4. Press `Alt + C` to crop and solve any homework problem on your screen.

---

## 🚀 Key Highlights

- **Dual Engine AI Execution**: Run 100% offline via **Chrome Gemini Nano** or route complex visual questions through **Cloud Vision AI** (Gemini, chatGPT, Claude, DeepSeek R1).
- **Offline WebAssembly OCR**: Pre-bundled with Vietnamese, English, and Mathematical formula models (`.traineddata`) for instant offline recognition.
- **KaTeX Step-by-Step Solutions**: High-clarity mathematical rendering with boxed final answers.
- **Floating Study Drawer & Toolbars**: Seamless in-page experience with multi-session chat history, prompt study modes, and online quiz auto-solving.
- **Smart Key Pool & Failover**: Automatic round-robin load balancing and instant circuit-breaker failover for rate-limited API keys.

---

## 📁 Repository Structure

```
homework-ai-extension/
├── extension/          # The actual Chrome Extension (Load or zip this folder)
├── docs/               # Technical & architectural documentation
│   ├── architecture.md # System design & routing strategies
│   ├── features.md     # Full feature matrix & study modes
│   ├── api-setup.md    # Guide to obtain free API keys & Gemini Nano setup
│   └── development.md  # Testing & packaging instructions
└── README.md
```

---

## 📚 Documentation & Detailed Guides

Toàn bộ tài liệu kỹ thuật và hướng dẫn sử dụng chuyên sâu nằm trong thư mục `docs/`:

### 🚀 Hướng Dẫn Tính Năng Chi Tiết:

- [01. Khoanh Vùng Chụp Ảnh & Giải Bài Tập (Crop & Solve)](docs/01-crop-and-solve.md)
- [02. Ngăn Kéo Chat Học Tập Nổi (Floating Study Drawer)](docs/02-floating-chat-drawer.md)
- [03. Thanh Công Cụ Bôi Đen Văn Bản (Selection Quick Toolbar)](docs/03-selection-toolbar.md)
- [04. Trợ Lý Trắc Nghiệm & Quiz Trực Tuyến (Online Quiz & Form Solver)](docs/04-online-quiz-solver.md)
- [05. Định Tuyến AI Đa Chiến Lược & Xoay Vòng Key Pool (AI Routing & Rotator)](docs/05-ai-routing-and-models.md)
- [06. Bộ Máy Local WebAssembly OCR & Quản Lý Model (Local OCR Engine)](docs/06-local-ocr-engine.md)
- [07. Tùy Biến Giao Diện Liquid Glass & Xem Trước Trực Tiếp (UI Customization)](docs/07-liquid-glass-customization.md)
- [08. Cưỡng Chế Đa Ngôn Ngữ & Bản Địa Hóa (Multilingual Output Engine)](docs/08-multi-language-support.md)

### 🏛️ Kiến Trúc, Cấu Hình & Phát Triển:

- [Kiến trúc Kỹ thuật Toàn diện (System Architecture)](docs/architecture.md)
- [Hướng dẫn Cấu hình API & Bật Gemini Nano (API Setup & Config)](docs/api-setup.md)
- [Quyền Riêng tư & Lưu trữ Dữ liệu (Privacy & Storage)](docs/storage-and-privacy.md)
- [Sổ tay Lập trình viên & Đóng gói Bản phát hành (Developer Guide & Packaging)](docs/development.md)

---

## 📜 License

MIT License.
