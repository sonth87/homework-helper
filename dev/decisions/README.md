# Architecture Decision Records

Ghi lại **quyết định kiến trúc và bối cảnh dẫn tới nó** — không phải hướng dẫn thực hiện.
Mục đích: sáu tháng sau không ai phải tranh luận lại từ đầu, và khi bối cảnh thay đổi
thì biết chính xác điều gì cần xem lại.

| # | Quyết định | Trạng thái | Ngày |
|---|---|---|---|
| [0001](./0001-tach-hoan-toan-hai-app.md) | Tách hoàn toàn extension và desktop, không có lõi dùng chung | Đã chấp nhận | 2026-08-29 |
| [0002](./0002-desktop-dung-typescript.md) | Desktop dùng TypeScript strict, extension giữ JavaScript | Đã chấp nhận | 2026-08-29 |
| [0003](./0003-hai-lane-thuc-thi.md) | Tách hai lane thực thi: dịch nhanh và suy luận LLM | Đã chấp nhận | 2026-08-29 |
| [0004](./0004-solve-truoc-translate.md) | Desktop ship Crop & Solve trước Hover Translate | Đã chấp nhận | 2026-08-29 |
| [0005](./0005-dung-node-sqlite.md) | Dùng `node:sqlite` dựng sẵn, không dùng better-sqlite3 | Đã chấp nhận | 2026-08-29 |

## Khi nào viết ADR mới

Viết khi quyết định **khó đảo ngược** hoặc **sẽ bị chất vấn lại**: chọn công nghệ nền
tảng, ranh giới giữa các thành phần, đánh đổi có hệ quả lâu dài, hoặc cố tình đi ngược
một thực hành phổ biến.

Không viết ADR cho: chọn thư viện nhỏ có thể thay dễ dàng, quy ước đặt tên, hay bất kỳ
điều gì có thể sửa trong một buổi chiều.

## Định dạng

Sáu mục, ngắn gọn. Đặc biệt không được bỏ **Đánh đổi đã chấp nhận** và **Xem lại khi** —
đó là hai mục khiến ADR khác một bài biện hộ.

```markdown
# ADR-000X: <Quyết định, viết ở thể khẳng định>

- **Trạng thái:** Đề xuất | Đã chấp nhận | Đã thay thế bởi ADR-000Y
- **Ngày:** YYYY-MM-DD

## Bối cảnh
## Quyết định
## Phương án đã cân nhắc và loại bỏ
## Hệ quả
## Đánh đổi đã chấp nhận
## Xem lại khi
```
