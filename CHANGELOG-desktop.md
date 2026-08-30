# Changelog — Desktop App

Lịch sử phát hành của **Desktop App** (`desktop/`) — Electron + TypeScript,
chạy trên macOS và Windows.

> Chrome Extension có changelog riêng: [CHANGELOG-extension.md](./CHANGELOG-extension.md).
> Version của hai app **độc lập hoàn toàn**. Việc desktop ở `0.x` trong khi extension ở
> `1.6.x` là **bình thường và đúng** — hai app không đồng bộ version với nhau.
> Xem [CLAUDE.md](./CLAUDE.md) mục 0 và 2.

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/),
đánh version theo [Semantic Versioning](https://semver.org/lang/vi/).

---

## [Unreleased]

### Phase 0 — Nền móng (hoàn tất 2026-08-29)

Chưa có tính năng cho người dùng. Đây là tầng khai báo tập trung mà mọi thứ sau
này dựa vào:

- Khung Electron + TypeScript strict + Vite, ba `tsconfig` tách theo process
- ESLint chống god file (400 dòng/file, 60 dòng/hàm) + ba luật phân tầng
- Branded type cho toạ độ — chặn trộn 4 không gian toạ độ ở mức biên dịch
- Contract IPC có type hai đầu, phân biệt request và stream
- `defineSettings` — một khai báo sinh ra defaults, zod schema, kiểu TS, UI và migration
- Đủ **13 locale** ngay từ đầu, thiếu khoá là lỗi biên dịch
- Trang Cài đặt render hoàn toàn từ schema
- `npm run check` — typecheck + lint + i18n parity + locale parity

### Phase 1 — Khung Electron (đang làm)

Đã xong:
- Tiến trình chính khởi động, đăng ký 6 phím tắt toàn cục từ intent registry
- Tray dựng menu từ intent registry, nhãn đổi theo ngôn ngữ người dùng
- `SettingsService` đọc/ghi + tự migrate theo schema (chỉ chạy khi cần)
- API key lưu trong OS keychain qua `safeStorage` — không bao giờ ở dạng plaintext,
  renderer chỉ hỏi được "có key chưa", không đọc lại được giá trị
- Hạ tầng streaming IPC: huỷ khi đóng cửa sổ, gom chunk theo nhịp ~60fps,
  gửi an toàn khi `webContents` đã destroy
- `guards.ts` cưỡng chế bất biến ADR-0003 + hạn mức request/phút

- Cửa sổ Cài đặt render hoàn toàn từ schema, đổi ngôn ngữ có hiệu lực ngay
- Phím tắt tuỳ biến được: ghi bằng cách bấm phím thật, cảnh báo khi trùng nhau

- Màn hình quản lý key pool: thêm/xoá/bật-tắt, chọn model, kiểm tra kết nối.
  API key lưu trong OS keychain, không bao giờ lọt vào file cấu hình.
- SQLite qua `node:sqlite` dựng sẵn — 5 bảng, WAL, migration runner đánh số.
  Tự nhập cấu hình từ `settings.json` cũ rồi xoá file.
- `HoverOverlay`: cửa sổ trong suốt, click-through, không cướp focus, nổi trên
  cả ứng dụng toàn màn hình.
- Nâng Electron 33 → 37 (Node 22.21) để dùng được `node:sqlite`.

**Phase 1 hoàn tất.**

### Phase 2 — Crop & Solve (đang làm)

- Provider registry: 3 họ adapter (Gemini, tương thích OpenAI, Claude) thay cho
  `switch`. Họ tương thích OpenAI phục vụ 6 nhà cung cấp.
- KeyRotator với cooldown theo loại lỗi; lỗi cấu hình không kích hoạt cooldown.
- Đọc SSE chịu được chunk cắt lệch ranh giới dòng, timeout byte đầu tách khỏi
  timeout tổng, huỷ giải phóng kết nối.
- Chụp màn hình + khoanh vùng: kéo mọi hướng, Esc huỷ, hiện kích thước vùng.
- Cửa sổ kết quả: markdown + KaTeX streaming, tách phần suy luận, bám đáy khi
  cuộn nhưng không cướp vị trí nếu người dùng đã cuộn lên.
- Chế độ học tập (5 chế độ) trong Cài đặt.

- Cửa sổ chat đa hội thoại, lưu trong SQLite: đóng rồi mở lại vẫn còn nguyên.
- Phát hiện Ollama / LM Studio đang chạy và liệt kê model đã nạp — thay vai trò
  "dùng được ngay không cần key" mà Gemini Nano đảm nhiệm ở extension.

**Phase 2 hoàn tất.**

### Phase 3 — Accessibility macOS (đang làm)

- Kiểm chứng thực nghiệm: AX API đọc được text từ ứng dụng Electron/Chromium
  (Chrome, VS Code) sau khi kích hoạt `AXManualAccessibility` — câu hỏi rủi ro
  lớn nhất của toàn dự án (ADR-0004) giờ có câu trả lời dứt khoát.
- Helper Swift độc lập (`native/accessibility-macos/`), sống lâu dài, giao tiếp
  qua JSON stdio — không native Node addon, tránh rủi ro ABI như ADR-0005.
- Xác nhận toạ độ Electron khớp tuyệt đối với Quartz, không cần quy đổi.
- `AccessibilityProvider` interface chung (macOS xong, Windows để Phase 4),
  nối vào tầng thu nhận nội dung cho Lane A.

- Mouse tracking + debounce: theo dõi chuột toàn cục bằng polling, thuật toán
  quyết định "đã đứng yên đủ lâu chưa" tách thuần, kiểm thử bằng 8 unit test
  không cần chuột thật. Đã kiểm chứng E2E: 4 lần hover riêng biệt trên các
  app/ngữ cảnh khác nhau (TeamViewer, VS Code, menu hệ thống) đều đọc đúng text
  đúng vị trí qua Accessibility.
- Nhóm setting mới: bật/tắt hover, độ trễ, dung sai di chuyển, phím kích hoạt.

- Cắt văn bản theo từ/câu/đoạn bằng `Intl.Segmenter` — nhận biết đúng ngôn ngữ
  cho tiếng Việt/Trung/Nhật (không dựa vào dấu câu/khoảng trắng kiểu Latin).
- Google Translate + cache SQLite, đúng phạm vi Lane A đã chốt trong
  roadmap/known-issues.md.
- HoverOverlay hiển thị kết quả dịch thật — đã kiểm chứng E2E toàn chuỗi: rê
  chuột → Accessibility → cắt đoạn → dịch → cache → hiện overlay đúng vị trí.

Còn lại: OCR (fallback khi Accessibility không có, ví dụ PDF/ảnh/app native
không hỗ trợ), rồi Phase 3 coi như hoàn tất.

Bản phát hành đầu tiên sẽ là **`0.1.0`** khi hoàn tất Phase 1.

---

Tài liệu kế hoạch:

- [roadmap/desktop-app.md](./roadmap/desktop-app.md) — đặc tả gốc
- [roadmap/desktop-app-implementation-plan.md](./roadmap/desktop-app-implementation-plan.md) — kế hoạch & lộ trình
- [roadmap/desktop-app-structure.md](./roadmap/desktop-app-structure.md) — cấu trúc mã nguồn

### Quy ước version cho giai đoạn `0.x`

- `0.x.0` — hoàn tất một Phase trong lộ trình.
- `0.x.y` — sửa lỗi và tinh chỉnh trong cùng một Phase.
- `1.0.0` — khi cả hai lane (dịch nhanh + suy luận LLM) chạy ổn định trên **cả macOS
  lẫn Windows**, có đóng gói và tự cập nhật.
