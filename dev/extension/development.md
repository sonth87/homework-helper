# Sổ tay Lập trình viên & Hướng dẫn Đóng gói (Developer Guide & Packaging)

Tài liệu này hướng dẫn chi tiết cách phát triển, mở rộng thêm nhà cung cấp AI mới, thêm ngôn ngữ OCR mới, quy trình kiểm thử tự động và đóng gói bản phát hành cho Chrome Web Store.

---

## 1. Cấu trúc Mã nguồn Chi tiết (Source Code Breakdown)

```
homework-ai-extension/
├── extension/                       # Thư mục mã nguồn tiện ích độc lập (Dùng để nén hoặc nạp vào Chrome)
│   ├── manifest.json                # Manifest V3 cấu hình quyền, script, CSP và shortcut
│   ├── assets/
│   │   ├── icons/                   # Vector icon SVG và icon PNG đa độ phân giải (16, 32, 48, 128px)
│   │   └── ocr/                     # Tesseract WASM runtime và 3 model cốt lõi (vie, eng, equ)
│   ├── background/
│   │   ├── service-worker.js        # Điều phối sự kiện, xử lý Context Menu, Tab Capture & Message Bus
│   │   ├── ai-engine.js             # Bộ xử lý Streaming AI đa nhà cung cấp & thực thi 4 Routing Strategies
│   │   └── key-rotator.js           # Bộ quản lý Key Pool, giám sát sức khỏe, cân bằng tải & Circuit Breaker
│   ├── content/
│   │   ├── loader.js                # Tiêm Content Script và cầu nối Main World Bridge
│   │   ├── main-world-bridge.js     # Chạy trong Main World để giao tiếp trực tiếp với window.ai Prompt API
│   │   ├── index.js                 # Điểm khởi tạo Content Script
│   │   ├── overlay.js               # Quản lý Shadow DOM Root, Floating Drawer, Solution Card & History
│   │   ├── cropper.js               # Bộ máy chụp màn hình Canvas, chọn vùng cắt & nén JPEG 0.88
│   │   ├── selection-tooltip.js     # Thanh công cụ Liquid Glass nổi khi bôi đen văn bản
│   │   ├── forms-adapter.js         # Tự động nhận diện câu hỏi trắc nghiệm trên Google Forms
│   │   └── styles/                  # Toàn bộ CSS giao diện Liquid Glass & Hiệu ứng hoạt họa
│   ├── options/
│   │   ├── options.html             # Trang cài đặt trung tâm (Tabs: Providers, OCR, Themes, Guides)
│   │   ├── options.js               # Logic điều khiển, Live Preview thời gian thực & OCR Manager
│   │   └── options.css              # Giao diện Liquid Glass cho trang Options
│   ├── popup/
│   │   ├── popup.html               # Popup menu khi click vào icon tiện ích trên thanh công cụ
│   │   ├── popup.js                 # Điều hướng nhanh (Mở Chat, Chụp màn hình, Mở Cài đặt)
│   │   └── popup.css                # CSS cho Popup
│   ├── shared/
│   │   ├── icons.js                 # Thư viện Icon SVG Lucide độc lập (100% vector, 0 emoji)
│   │   ├── storage.js               # Lớp trừu tượng hóa Storage & Quản lý Đa Hội thoại
│   │   ├── ocr-engine.js            # Bộ máy WebAssembly OCR, xử lý IndexedDB & hậu kỳ công thức LaTeX
│   │   ├── markdown-katex.js        # Bộ biên dịch Markdown sang HTML và render công thức Toán học KaTeX
│   │   ├── i18n.js                  # Bản địa hóa giao diện đa ngôn ngữ (Tiếng Việt, Tiếng Anh...)
│   │   └── katex/                   # Thư viện KaTeX CSS, JS và font WOFF2 nhúng cục bộ
│   └── sidepanel/
│       ├── sidepanel.html           # Giao diện Chrome Side Panel cố định
│       ├── sidepanel.js             # Logic đồng bộ lịch sử hội thoại và streaming AI
│       └── sidepanel.css            # CSS giao diện Side Panel
├── docs/                            # Toàn bộ tài liệu kiến trúc & tính năng
│   ├── architecture.md              # Sơ đồ luồng, kiến trúc Shadow DOM & Routing
│   ├── features.md                  # Hướng dẫn chi tiết tính năng & 5 chế độ học tập
│   ├── api-setup.md                 # Hướng dẫn lấy key miễn phí & bật Gemini Nano
│   ├── storage-and-privacy.md       # Quyền riêng tư & cơ chế lưu trữ
│   └── development.md               # Sổ tay lập trình viên & đóng gói
└── README.md                        # Giới thiệu tổng quan & hướng dẫn cài đặt nhanh
```

---

## 2. Hướng dẫn Mở rộng (How-To Extend)

### A. Thêm một Nhà cung cấp AI Mới (Adding a New AI Provider)
1. Mở `extension/shared/storage.js`:
   - Bổ sung cấu hình nhà cung cấp vào mảng `DEFAULT_PROVIDERS`:
     ```javascript
     {
       id: 'mistral',
       name: 'Mistral AI',
       defaultBaseUrl: 'https://api.mistral.ai/v1',
       models: [
         { id: 'mistral-large-latest', name: 'Mistral Large' },
         { id: 'codestral-latest', name: 'Codestral (Code & Math)' }
       ]
     }
     ```
2. Nếu nhà cung cấp tương thích với chuẩn OpenAI Chat Completions (hầu hết các hãng hiện nay):
   - Không cần viết thêm hàm mới, `AiEngine.streamOpenAiCompatible` trong `ai-engine.js` sẽ tự động xử lý kết nối và stream SSE.

### B. Thêm một Ngôn ngữ OCR Mới (Adding a New OCR Language)
1. Mở `extension/shared/ocr-engine.js`:
   - Thêm định nghĩa vào mảng `OCR_MODEL_CATALOG`:
     ```javascript
     {
       lang: 'hin',
       name: 'Tiếng Hindi',
       nativeName: 'हिन्दी',
       size: '3.6 MB',
       sizeBytes: 3700000,
       version: '1.0.0',
       isBundled: false,
       category: 'international',
       description: 'Nhận diện chữ Devanagari tiếng Hindi.'
     }
     ```
   - Thêm mã ánh xạ vào `LANG_MAP`:
     ```javascript
     hi: 'hin',
     ```

---

## 3. Quy trình Kiểm thử Cú pháp & Đảm bảo Chất lượng (Quality Assurance)

Trước khi commit hoặc đóng gói bản phát hành, chạy script kiểm tra cú pháp ES Module:

```bash
node -e '
const fs = require("fs");
const files = [
  "extension/content/overlay.js", "extension/content/index.js", "extension/content/cropper.js",
  "extension/content/selection-tooltip.js", "extension/content/loader.js", "extension/content/main-world-bridge.js",
  "extension/content/forms-adapter.js", "extension/background/service-worker.js", "extension/background/ai-engine.js",
  "extension/background/key-rotator.js", "extension/sidepanel/sidepanel.js", "extension/options/options.js",
  "extension/shared/i18n.js", "extension/shared/storage.js", "extension/shared/icons.js",
  "extension/shared/markdown-katex.js", "extension/shared/ocr-engine.js"
];

let failed = 0;
for (const file of files) {
  if (fs.existsSync(file)) {
    try {
      require("child_process").execSync(`node --input-type=module --check < ${file}`);
      console.log("PASS:", file);
    } catch (e) {
      console.error("FAIL:", file);
      failed++;
    }
  }
}
if (failed === 0) console.log("ALL FILES PASSED SYNTAX CHECK");
'
```

---

## 4. Lệnh Đóng gói Bản Phát hành (Production Build & Packaging)

Để tạo tệp `.zip` sạch sẽ, tối ưu dung lượng sẵn sàng nộp lên **Chrome Web Store Developer Dashboard**:

```bash
# Di chuyển vào thư mục extension và nén toàn bộ tệp bên trong
cd extension
zip -r ../homework-helper.zip . -x ".*" -x "__MACOSX"
```

Tệp `homework-helper.zip` (~5.7 MB) sẽ được tạo ra tại thư mục gốc của dự án.
