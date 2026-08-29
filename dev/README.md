# Tài liệu Kỹ thuật

Dành cho **người phát triển**. Tài liệu người dùng nằm ở [`docs/`](../docs/).

---

## Bắt đầu từ đâu

| Bạn muốn | Đọc |
|---|---|
| Sửa một thứ cụ thể, không rõ file nào | **[where.md](./where.md)** — bản đồ ý định → file |
| Hiểu hệ thống hoạt động ra sao | [extension/architecture.md](./extension/architecture.md) |
| Thêm provider AI / ngôn ngữ OCR / đóng gói | [extension/development.md](./extension/development.md) |
| Biết dữ liệu lưu ở đâu | [extension/storage-and-privacy.md](./extension/storage-and-privacy.md) |
| Hiểu **vì sao** kiến trúc như vậy | [decisions/](./decisions/) — ADR |
| Làm việc trên desktop app | [../roadmap/desktop-app-structure.md](../roadmap/desktop-app-structure.md) |

## Trước khi commit

```bash
npm run check      # i18n parity + version sync + link tài liệu
```

Quy tắc bắt buộc (bump version, 13 locale, CHANGELOG): [`CLAUDE.md`](../CLAUDE.md).
Quy trình từng bước cho việc lặp lại: [`.claude/skills/`](../.claude/skills/).

## Cấu trúc

```text
dev/
├── where.md          Bản đồ "sửa ở đâu"
├── extension/        Tài liệu kỹ thuật của Chrome Extension
└── decisions/        ADR — quyết định kiến trúc và bối cảnh
```
