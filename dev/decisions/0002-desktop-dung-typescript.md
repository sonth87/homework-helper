# ADR-0002: Desktop dùng TypeScript strict, extension giữ JavaScript

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-29

## Bối cảnh

Extension hiện viết bằng JavaScript ESM thuần, **không có build step** — Chrome nạp
thẳng file nguồn. Đây là một ưu điểm thật: sửa file, reload extension, xong.

Câu hỏi đặt ra khi lập kế hoạch desktop: dùng TypeScript hay giữ JavaScript cho nhất quán?

Lý do duy nhất khiến TypeScript từng là câu hỏi mở: nếu có lõi dùng chung, extension sẽ
bị kéo theo một bước biên dịch mà nó không cần. [ADR-0001](./0001-tach-hoan-toan-hai-app.md)
đã xoá bỏ ma sát đó.

## Quyết định

**Desktop dùng TypeScript ở chế độ `strict`, kèm `noUncheckedIndexedAccess` và
`exactOptionalPropertyTypes`. Extension giữ nguyên JavaScript ESM, không thêm build step.**

## Phương án đã cân nhắc và loại bỏ

**JavaScript + JSDoc cho desktop.** Loại bỏ vì không diễn đạt được branded type —
thứ giải quyết vấn đề toạ độ bên dưới, vốn là lý do mạnh nhất chọn TypeScript.

**TypeScript cho cả hai app.** Loại bỏ vì thêm build step vào extension đang chạy tốt,
đổi lấy lợi ích không tương xứng: extension đã ổn định, phần lớn thay đổi là UI và chuỗi
ngôn ngữ, không phải logic phức tạp.

## Hệ quả

Bốn lợi ích cụ thể cho **đúng bài toán desktop**, không phải lý do chung chung:

**1. Toạ độ — nơi cứu nhiều lỗi nhất.** Trong app này một `{x, y}` có thể nằm ở bốn
không gian khác nhau: `screen-physical`, `screen-logical`, `window-relative`,
`image-relative`. Trộn nhầm hai không gian **không ném lỗi** — overlay chỉ hiện lệch,
và trên màn hình 1× thì lỗi vô hình hoàn toàn. Branded type biến lỗi runtime này thành
lỗi biên dịch. `roadmap/desktop-app.md` §18 và §70 đã xác định đây là phần khó nhất.

**2. Ba ranh giới process.** `main ↔ preload ↔ renderer` truyền structured message.
Không có type, đổi tên một field sẽ không lỗi lúc dev mà chỉ lỗi ở **bản đóng gói**.

**3. Provider đa dạng năng lực.** Discriminated union khiến "gửi ảnh cho model
text-only" thành lỗi biên dịch thay vì lỗi API lúc chạy.

**4. Schema cấu hình sinh ra kiểu.** Khai báo setting một lần, `z.infer` sinh
`type Settings` dùng chung main và renderer.

Bổ sung: locale desktop có type nên **thiếu key là lỗi biên dịch**, thay cho lưới an
toàn `d.xxx || '...'` mà extension đang phải dùng.

## Đánh đổi đã chấp nhận

- Hai ngôn ngữ trong một repo — người đóng góp phải biết cả hai. Chấp nhận được vì hai
  app vốn đã tách bạch hoàn toàn.
- Desktop có build step. Không phải chi phí thêm: Electron vốn đã bắt buộc có bundler.
- Chuyển 13 locale sang `.ts` là công việc chép cơ học một lần.

## Xem lại khi

Không dự kiến xem lại cho desktop. Với extension: nếu có lúc phải thêm bundler vì lý do
khác (ví dụ cần tree-shaking để giảm kích thước gói), khi đó mới cân nhắc lại TypeScript
cho extension — và đó sẽ là một ADR riêng.
