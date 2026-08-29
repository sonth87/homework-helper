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

**Phase 1 hoàn tất.** Còn lại cho Phase 2: provider adapter và handler streaming AI.

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
