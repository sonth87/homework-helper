# ADR-0004: Desktop ship Crop & Solve trước Hover Translate

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-29

## Bối cảnh

Đặc tả gốc [`roadmap/desktop-app.md`](../../roadmap/desktop-app.md) §162 đề xuất thứ tự
milestone: M2 global mouse tracking → M4 macOS Accessibility → M5 macOS OCR → M6 Google
translation → M7 hoàn tất pipeline.

Thứ tự này hợp lý **nếu sản phẩm chỉ là dịch màn hình**. Nhưng desktop app phải mang cả
các tính năng khác của extension, và tính năng có giá trị nhất — Crop & Solve — không
cần bất kỳ thứ nào trong M2, M4, M5.

Đồng thời, rủi ro kỹ thuật lớn nhất của dự án nằm ở M4: **`AXUIElementCopyElementAtPosition`
có lấy được text từ Chrome, VS Code, và các app Electron khác hay không** — đây là điểm
yếu đã được chính đặc tả gốc thừa nhận ở §10.4.

## Quyết định

**Đảo thứ tự: ship Crop & Solve (Lane B) trước Hover Translate (Lane A).**

Phase 2 của lộ trình chỉ cần: screen capture + region selector + vision model + cửa sổ
kết quả streaming. **Không cần** Accessibility, OCR, mouse tracking, sentence detection,
tolerance zone, hay text stability.

Hover Translate lùi xuống Phase 3, cùng toàn bộ phần Accessibility và OCR.

## Phương án đã cân nhắc và loại bỏ

**Giữ nguyên thứ tự đặc tả gốc.** Loại bỏ vì đặt toàn bộ rủi ro cao nhất lên đường
tới hàng: nếu Accessibility thất bại ở tuần thứ 6, dự án chưa có gì dùng được.

**Làm song song cả hai lane.** Loại bỏ vì phân tán nguồn lực khi chưa xác nhận được
giả định nền tảng nào.

## Hệ quả

- **Sản phẩm có giá trị sử dụng thật sớm hơn nhiều.** Kết thúc Phase 2: nhấn phím tắt →
  khoanh vùng bất kỳ trên màn hình → nhận lời giải streaming có công thức KaTeX. Dùng
  được ở PDF reader, Word, PowerPoint, phần mềm học offline, máy ảo — những nơi
  extension bất lực hoàn toàn.
- **Rủi ro được cô lập.** Nếu Accessibility hoá ra không dùng được với Chrome/Electron,
  Phase 3 chuyển sang OCR-first mà **sản phẩm vẫn sống**.
- Phase 2 bám sát nhất phần logic đã được kiểm chứng ở extension (`cropper.js`,
  `ai-engine.js`, `markdown-katex.js`), nên rủi ro triển khai cũng thấp nhất.
- Quyền Screen Recording cần ngay từ Phase 2 → tài liệu onboarding phải sẵn sàng sớm.

## Đánh đổi đã chấp nhận

- Tính năng được mô tả kỹ nhất trong đặc tả gốc (hover translate, ~3.000 dòng đặc tả)
  lại ra sau. Chấp nhận: đặc tả đó không mất giá trị, chỉ dùng muộn hơn.
- Người dùng thử bản đầu sẽ không thấy tính năng "dịch khi rê chuột" vốn là điểm bán
  hàng dễ demo nhất.
- Phải xin quyền Screen Recording ngay từ bản đầu, trong khi Accessibility-first có thể
  hoãn được quyền đó.

## Xem lại khi

Một spike xác nhận Accessibility hoạt động tốt trên cả Chrome, VS Code và các app native
phổ biến **trước khi Phase 2 kết thúc**. Khi đó có thể cân nhắc kéo Phase 3 lên chạy
song song — nhưng vẫn ship Phase 2 trước.
