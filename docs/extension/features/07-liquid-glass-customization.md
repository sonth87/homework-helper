# Tính năng: Tùy Biến Giao Diện Liquid Glass & Xem Trước Trực Tiếp (UI Customization)

**Homework Helper** được thiết kế theo ngôn ngữ thẩm mỹ **Liquid Glass (Kính Mờ Động)** hiện đại, mang lại trải nghiệm thị giác cao cấp, nhẹ nhàng và hòa nhập tự nhiên vào bất kỳ giao diện website nào.

---

## 1. Triết lý Thiết kế Liquid Glass (Design Aesthetics)

1. **Hiệu ứng Kính Mờ Động (Translucent Backdrop Blur)**:
   - Sử dụng công nghệ `backdrop-filter: blur(...)` kết hợp với dải màu nền bán trong suốt (alpha opacity), cho phép người học vẫn nhìn thấy mờ mờ nội dung trang sách/bài giảng phía sau mà không bị cảm giác che khuất hoàn toàn.
2. **Bo Góc Mềm Mại & Viền Sáng Tinh Tế**:
   - Viền kính siêu mỏng `border: 1px solid rgba(255, 255, 255, 0.2)` tạo hiệu ứng phản chiếu ánh sáng chân thực.
3. **100% Vector Icons (Không dùng Emojis trong Giao diện)**:
   - Sử dụng bộ icon vector Lucide SVG thuần túy, đảm bảo sự chuyên nghiệp, chuẩn mực và hiển thị sắc nét ở mọi độ phân giải màn hình.

---

## 2. Bảng Điều Khiển Tùy Biến & Khung Xem Trước Trực Tiếp (Live Preview)

Trong trang **Cài đặt (Options)** ➔ Tab **Giao diện & Tùy biến UI**, người dùng có thể điều chỉnh và nhìn thấy ngay kết quả thay đổi trong khung **Live Preview Thời Gian Thực**:

```
+-------------------------------------------------------------+
| CÁC THANH TRƯỢT TÙY CHỈNH     | KHUNG XEM TRƯỚC (LIVE PREVIEW)|
|-------------------------------|-----------------------------|
| 1. Nút Nổi Màn Hình (FAB):    | [Giao diện mô phỏng trang web]|
|   [x] Hiển thị 2 nút nổi      |                             |
|   Kích thước: [Tiêu chuẩn v]  | [Thanh Toolbar Bôi Đen     ]|
|                               |  [Dịch] [Giải] [Tóm tắt]    |
| 2. Thanh Toolbar Bôi Đen:     |                             |
|   Chủ đề: [Cyber Blue v]      | [Thẻ Solution Card         ]|
|   Kích thước: [Nhỏ gọn v]     |  Hiệu ứng kính mờ thời gian |
|                               |  thực theo thanh trượt      |
| 3. Độ Trong Suốt & Làm Mờ:    |                             |
|   Độ trong suốt: [ 92% ] ===o-|                             |
|   Độ mờ hậu cảnh: [ 16px ] =o-|                             |
+-------------------------------------------------------------+
```

---

## 3. Chi tiết Các Thông Số Tùy Biến (Customizable Parameters)

### 3.1. Hai Nút Nổi Ngoài Màn Hình (Floating Action Buttons - FAB)
- **Bật/Tắt hiển thị**: Người dùng có thể ẩn hoàn toàn 2 nút nổi ở mép màn hình nếu thích dùng phím tắt (`Alt+C`, `Alt+K`).
- **3 Cỡ Kích Thước**:
  - `Small`: Đường kính 30px (tiết kiệm diện tích tối đa).
  - `Normal`: Đường kính 36px (chuẩn mực, cân đối).
  - `Large`: Đường kính 44px (dành cho màn hình cảm ứng hoặc người thích nút to).

### 3.2. Thanh Công Cụ Khi Bôi Đen (Selection Toolbar)
- **5 Chủ đề Màu sắc (Themes)**:
  - `glass-light`: Nền kính sáng sang trọng.
  - `glass-dark`: Nền kính tối sâu lắng, chống mỏi mắt ban đêm.
  - `cyber-blue`: Tông xanh dương công nghệ cao.
  - `emerald`: Tông xanh ngọc lục bảo dịu mát.
  - `purple`: Tông tím sáng tạo, trẻ trung.
- **Chế độ hiển thị chữ**:
  - `Icon + Nhãn chữ`: Rõ ràng, dễ nhận biết tính năng.
  - `Chỉ hiển thị Icon`: Cực kỳ nhỏ gọn, không chiếm diện tích văn bản.

### 3.3. Thẻ Kết Quả & Khung Chat (Solution Card & Drawer)
- **Thanh trượt Độ trong suốt (Opacity)**: Điều chỉnh từ `40%` (rất trong suốt) đến `100%` (nền đặc hoàn toàn).
- **Thanh trượt Độ mờ hậu cảnh (Backdrop Blur)**: Điều chỉnh từ `0px` (không làm mờ) đến `30px` (làm mờ nhòe hậu cảnh mạnh mẽ).

---

## 4. Cơ chế Cập nhật Biến CSS Thời Gian Thực (CSS Variables Injection)

Khi người dùng kéo thanh trượt trong Cài đặt:
1. Giá trị mới được lưu ngay vào `chrome.storage.local`.
2. Content Script trên các tab đang mở lắng nghe sự kiện `chrome.storage.onChanged` và tự động cập nhật lại các biến CSS cục bộ bên trong Shadow DOM:
   ```css
   :host {
     --hw-popup-opacity: 0.92;
     --hw-popup-blur: 16px;
     --hw-theme-color: #0284c7;
   }
   ```
3. Giao diện trên trang web lập tức đổi màu sắc và độ trong suốt mà **không cần người dùng phải F5 tải lại trang web**.
