# ADR-0005: Dùng `node:sqlite` dựng sẵn, không dùng better-sqlite3

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-29

## Bối cảnh

Kế hoạch Phase 1 dự tính `better-sqlite3` và đã ghi nhận rủi ro 🟠
*"native module (Rust/N-API) làm vỡ packaging & auto-update"*.

Khi triển khai thật, rủi ro đó hiện ra ngay và tệ hơn dự tính:

| Bản | Kết quả |
|---|---|
| `better-sqlite3@11` | Build thất bại. Nó kéo theo `node-gyp@9`, vốn dùng `distutils` — module đã bị **xoá khỏi Python 3.12**. Máy dev có Python 3.13. |
| `better-sqlite3@13` | Cài được, nhưng `engines: { node: ">=22" }` trong khi Electron 33 chỉ có Node 20.18. Nạp vào Electron là **crash im lặng** vì lệch ABI — không có exception nào bắt được. |

Cả hai đều còn cần `electron-rebuild` cho từng nền tảng đích, và mỗi lần nâng
Electron lại phải rebuild.

## Quyết định

**Nâng Electron lên 37 (Node 22.21) và dùng `node:sqlite` — module SQLite dựng
sẵn trong Node từ 22.5.**

## Phương án đã cân nhắc và loại bỏ

**Hạ Python xuống 3.11 để `node-gyp@9` chạy được.** Loại bỏ vì đẩy ràng buộc
sang môi trường của mọi người đóng góp và của CI. Sửa triệu chứng, không sửa gốc.

**SQLite bằng WASM (sql.js, wa-sqlite).** Loại bỏ vì phải tự lo phần ghi xuống
đĩa, chậm hơn, và tốn bộ nhớ cho toàn bộ CSDL.

**Giữ JSON, hoãn SQLite.** Đã đề xuất và bị bác — quyết định là hoàn tất checklist
Phase 1 đúng kế hoạch.

## Hệ quả

- **Xoá bỏ toàn bộ một lớp rủi ro**: không native module, không `electron-rebuild`,
  không `node-gyp`, không phụ thuộc Python, không cần build riêng cho từng nền tảng.
  Rủi ro 🟠 trong kế hoạch coi như đã giải quyết, không phải giảm nhẹ.
- Electron 33 → 37 là nâng cấp đáng làm độc lập với SQLite (bản mới hơn, Node 22).
- API `DatabaseSync` đồng bộ, hình dạng gần giống `better-sqlite3`, nên nếu sau
  này cần đổi ngược lại thì công sức không lớn.
- Đã kiểm chứng chạy thật: 5 bảng, WAL, `user_version = 1`, 27 khoá cấu hình,
  và nhập được cấu hình từ `settings.json` cũ.

## Đánh đổi đã chấp nhận

- `node:sqlite` còn được đánh dấu **experimental** trong Node 22 — chạy ra cảnh
  báo `ExperimentalWarning` và API có thể đổi. Chấp nhận vì nó là module dựng sẵn:
  rủi ro nằm ở chữ ký hàm, không nằm ở khâu build và phân phối.
- Buộc phải giữ Electron ≥ 35. Không phải ràng buộc thật vì không có lý do nào
  để lùi về bản cũ hơn.
- Không có API bất đồng bộ. Với truy vấn nhỏ trong main process thì không thành
  vấn đề; nếu sau này có truy vấn nặng, chuyển sang `utilityProcess`.

## Xem lại khi

`node:sqlite` bị thay đổi API phá vỡ tương thích ở một bản Node mới, hoặc khi
xuất hiện truy vấn đủ nặng để chặn main process — khi đó cân nhắc `utilityProcess`
trước, chứ không quay lại native module.
