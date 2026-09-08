# Changelog — Chrome Extension

Lịch sử phát hành của **Chrome Extension** (`extension/`).

> Desktop App có changelog riêng: [CHANGELOG-desktop.md](./CHANGELOG-desktop.md).
> Version của hai app **độc lập hoàn toàn**, không đồng bộ với nhau — xem
> [CLAUDE.md](./CLAUDE.md) mục 0 và 2.

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/),
đánh version theo [Semantic Versioning](https://semver.org/lang/vi/).

---

## [Unreleased]

_Chưa có thay đổi nào chờ phát hành._

---

## [1.10.0] — 2026-09-08

### Thêm mới
- Mỗi lần khởi động trình duyệt sẽ bắt đầu một hội thoại mới trong khung chat,
  thay vì tiếp tục nối vào hội thoại cũ vô thời hạn — nếu vẫn đang trong cùng
  một phiên làm việc và có hoạt động trong 24 giờ gần nhất thì hội thoại đang
  dùng vẫn được giữ nguyên như trước.
- Khi chat trực tiếp trong khung chat (Side Panel, Chat Drawer, hay popup thẻ
  nổi), AI giờ được gửi kèm các lượt hỏi/đáp trước đó trong cùng hội thoại để
  hiểu ngữ cảnh khi hỏi tiếp — kể cả khi đang dùng Gemini Nano chạy trên máy mà
  chưa cấu hình API Key nào (trước đây trường hợp này hoàn toàn không có ngữ
  cảnh). Riêng chụp ảnh giải bài hoặc bôi đen văn bản để giải/dịch luôn được
  xử lý như một yêu cầu độc lập, không kèm ngữ cảnh cũ, để AI không bị nhiễu
  bởi nội dung không liên quan và không tăng thời gian chờ với model cục bộ.
- Bảng "Lịch sử các hội thoại" (cả Side Panel, Chat Drawer, và popup thẻ nổi)
  nay có thêm: ô tìm kiếm theo tên hội thoại, nút "Tải thêm" khi danh sách dài,
  nút đổi tên hội thoại ngay tại chỗ, và xoá hội thoại sẽ hỏi xác nhận trước
  khi xoá thật.

### Sửa lỗi
- Gõ một câu chào đơn giản như "hello" trong khung chat không còn khiến AI trả
  lời lạc đề bằng một đoạn phân tích dài kèm 4 đáp án trắc nghiệm bịa ra, hay
  tường thuật lại việc nó đang xử lý câu hỏi kiểu gì — AI giờ tự nhận biết đâu
  là câu hỏi bài tập thật sự cần lời giải và đâu chỉ là trò chuyện thông
  thường, rồi trả lời thẳng như một tin nhắn chat bình thường.
- Xoá hội thoại đang mở trong bảng Lịch sử trước đây sẽ âm thầm nhảy sang một
  hội thoại CŨ khác còn sót lại, khiến việc xoá trông như không có tác dụng —
  nay xoá hội thoại đang mở luôn chuyển sang một đoạn chat mới, trống.
- Sửa lỗi khung chat hiển thị trùng lặp cả câu hỏi lẫn câu trả lời khi chuyển
  qua hội thoại khác trong lúc AI đang trả lời rồi quay lại hội thoại ban đầu.
- Câu trả lời của AI không còn bị ghi nhầm vào hội thoại đang xem nếu người
  dùng chuyển sang hội thoại khác trong lúc AI vẫn đang trả lời — câu trả lời
  luôn được lưu đúng vào hội thoại đã đặt câu hỏi.

---

## [1.9.2] — 2026-09-07

### Thay đổi
- Hiệu ứng "Liquid Glass" trên toàn bộ giao diện (Thanh Công Cụ Bôi Đen, tooltip
  Dịch nhanh khi di chuột, popup Giải bài/Dịch, nút tròn Minimize, Chat Drawer,
  các tooltip/toast ở Cài đặt/Popup/Side Panel...) trước đây chỉ làm mờ nền
  (backdrop blur) phía sau, nay thêm hiệu ứng khúc xạ ánh sáng thật sự — nội
  dung trang phía sau bị bẻ cong nhẹ khi nhìn qua lớp kính thay vì chỉ mờ đi —
  cùng một vệt sáng phản chiếu chéo trên mỗi bề mặt, giống chất liệu kính lỏng
  thật hơn thay vì chỉ như nhựa mờ.
- Nút Copy trên mỗi khối code trong lời giải nay hiện icon thay vì chữ "Copy",
  gọn hơn và đồng bộ với các nút icon khác trong thẻ popup.
- Nút tròn Minimize khi đang ở trạng thái "đã xong" (không còn xoay) giờ cứ
  mỗi 15 giây lại phát ra một vòng sáng lan ra rồi mờ dần một lần, để nhắc
  người dùng nó vẫn đang hoạt động — trước đây đứng yên hoàn toàn nên dễ bị
  quên mất là có thể bấm vào.
- "Chủ đề màu Popup" (Cài đặt > Giao diện > Homework Helper Popup) nay có
  thêm 2 lựa chọn Liquid Glass Light/Dark bên cạnh Tự động và 6 màu nhấn có
  sẵn — khoá cứng kính sáng hoặc tối riêng cho popup Giải bài/Dịch (và popup
  của nút tròn Minimize), không phụ thuộc vào "Chế độ màu (Sáng/Tối)" chung
  của toàn giao diện, giống hệt cách Thanh Công Cụ Bôi Đen đã làm từ trước.
- Đổi một số giá trị mặc định cho dễ nhìn hơn ngay từ lần cài đầu (chỉ áp
  dụng cho người dùng mới hoặc bấm "Khôi phục mặc định" — không ghi đè lên
  cấu hình đã lưu của người đang dùng): popup Giải bài/Dịch còn 60% trong
  suốt/10px blur (trước 92%/16px); Thanh Công Cụ Bôi Đen còn 25% trong
  suốt/6px blur (trước 90%/16px); tooltip Dịch nhanh khi di chuột còn 60%
  trong suốt/10px blur (trước 90%/16px) và đổi kiểu tô sáng mặc định sang
  "Bút highlight tự nhiên" (trước là "Tô nền" đơn giản), độ đậm màu tô sáng
  mặc định còn 30% (trước 40%).
- Phím tắt mở Chat AI (⌘K trên macOS, Alt+K nơi khác) nay mở panel chat ngay
  trong trang thay vì mở Side Panel gốc của Chrome — giống hệt bấm nút nổi
  hình tia sáng, bấm lần nữa để đóng lại.

### Sửa lỗi
- Phần Xem trước 2 nút nổi (FAB) ở trang Cài đặt tô màu ngược: nút "Chụp màn
  hình" hiện màu xanh đậm còn nút "Mở chat panel" hiện kính trắng — ngược lại
  hoàn toàn so với ngoài trang thật (nút mở chat mới là nút chính màu xanh
  đậm). Vì vậy khi kéo thanh Độ trong suốt, chỉ thấy nút Chụp đổi rõ, nút mở
  chat gần như không thấy gì khác — nay đã tô đúng, cả hai nút đều đổi rõ khi
  chỉnh độ trong suốt.
- Nút "Khôi phục mặc định" của Thanh Công Cụ Bôi Đen chỉ reset lại thứ tự
  công cụ trên toolbar, không đụng đến Chủ đề màu, Vị trí hiển thị, Hiển thị
  chữ, Kích cỡ, Độ trong suốt hay Độ mờ hậu cảnh — khiến người dùng tưởng nút
  này không hoạt động. Nay bấm một lần là khôi phục toàn bộ cấu hình của
  Thanh Công Cụ Bôi Đen, giống cách các thẻ Dịch nhanh/Popup/FAB đã làm.
- Độ đậm chữ (font-weight) của tooltip Dịch nhanh khi di chuột trong phần Xem
  trước ở trang Cài đặt bị đậm hơn (600) so với tooltip thật ngoài trang
  (400) — nay cả hai đều dùng chung độ đậm 400.
- Phần Xem trước (Live Preview) ở trang Cài đặt > Giao diện chưa áp dụng hiệu
  ứng Liquid Glass mới cho 3 khối mô phỏng (Thanh Công Cụ, tooltip Dịch nhanh,
  popup Giải bài) — vẫn chỉ mờ nền như kiểu cũ. Riêng khi chọn kiểu hiển thị
  "Minimize", khung xem trước không hiện gì hữu ích vì vẫn cố hiện mô phỏng
  thẻ popup thông thường. Nay cả 3 khối xem trước đã theo đúng hiệu ứng Liquid
  Glass, và chọn "Minimize" sẽ hiện đúng mô phỏng nút tròn ở dưới kèm popup
  đáp án phía trên, giống hệt lúc rê chuột vào nút tròn thật ngoài trang.
- Popup hiện ra khi rê chuột vào nút tròn Minimize luôn cố định nền sáng bất
  kể trang đang ở chế độ tối, nên trên các trang nền tối trông phẳng/xám thay
  vì kính lỏng như thẻ popup Normal/Compact (vốn tự đổi kính tối theo đúng
  giao diện). Nay popup này cũng tự đổi kính sáng/tối theo đúng cấu hình
  Giao diện, đồng bộ hoàn toàn với thẻ popup thường.
- Màu viền nút tròn Minimize trước đây lấy theo Chủ đề màu Thanh Công Cụ Bôi
  Đen thay vì Chủ đề màu Popup, nên có thể khác màu với chính popup hiện ra
  khi rê chuột vào nó (và khác với xem trước ở trang Cài đặt). Nay nút tròn
  lấy màu, độ trong suốt, độ mờ nền đều theo đúng cấu hình Homework Helper
  Popup, luôn đồng màu với popup của chính nó.

---

## [1.9.1] — 2026-09-07

### Thêm mới
- Tùy chỉnh được màu tô sáng của Dịch nhanh khi di chuột (Giao diện > Dịch
  nhanh khi di chuột > "Màu tô sáng") — chọn từ 10 màu pastel dựng sẵn thay
  vì bảng màu tự do, kèm thanh chỉnh "Độ đậm màu tô sáng" riêng để giữ màu
  luôn nhẹ nhàng, không bị gắt. Mặc định vẫn là vàng highlight quen thuộc,
  xem trước ngay trong trang Cài đặt.
- Thêm mục "Kiểu tô sáng" cho Dịch nhanh khi di chuột với 10 kiểu đánh dấu để
  chọn, mỗi kiểu xem trước thật ngay trên nút chọn: 4 kiểu gọn gàng (Tô nền,
  Gạch dưới, Gạch dưới lượn sóng, Gạch dưới đôi) và 6 kiểu "tự nhiên" như vẽ
  tay (Bút highlight tự nhiên — rìa nhấp nhô như dạ quang thật; Khoanh tròn
  và Khoanh chữ nhật tay vẽ quanh chữ; Gạch dưới tự nhiên nguệch ngoạc; Nét
  chì tự nhiên — tô chữ bằng nét đan chéo như bút chì màu; Tô nguệch ngoạc —
  nét bút ngoằn ngoèo qua lại như tô vội). Mỗi lần dịch một đoạn nhiều dòng,
  các kiểu tay vẽ đều được "vẽ" lại hơi khác nhau ở mỗi dòng cho tự nhiên,
  không lặp lại y hệt.
- Nút "Phím tắt" mới trên header của popup (cạnh nút Cài đặt) — bấm vào để
  xem danh sách các phím tắt hiện có (Chat AI, Chụp & Giải, Rê chuột dịch)
  kèm mô tả ngắn. Phím tắt hiển thị là phím Chrome **thực sự đang gán**, báo
  rõ nếu chưa gán được thay vì im lặng hiện sai.
- Thêm kiểu hiển thị "Minimize" cho popup Giải bài/Dịch (Cài đặt > Giao diện
  > "Kiểu hiển thị Popup"), bên cạnh Normal và Compact: khi giải bài hoặc
  dịch, thay vì mở cả thẻ popup, chỉ hiện một nút tròn nhỏ ở góc dưới bên
  phải màn hình — vòng viền chạy quanh trong lúc chờ, dừng lại ngay khi có
  kết quả. Rê chuột vào nút tròn để xem đáp án/bản dịch (tự động nằm trong
  màn hình, không tràn ra ngoài), rê chuột ra là ẩn đi; có nút x nhỏ khi rê
  chuột vào để đóng hẳn. Popup này tối giản hết mức — không tiêu đề, không
  nút phía trên/dưới, chỉ nội dung và 2 icon Nghe/Sao chép trần không khung.
- Thêm 3 nút chuyển nhanh kiểu hiển thị (Normal/Compact/Minimize) ngay dưới
  popup Giải bài/Dịch — dạng chấm tròn thu gọn, rê chuột vào để hiện icon,
  giống hệt kiểu 3 nút chuyển độ chi tiết ở tooltip Dịch nhanh khi di chuột.
  Chuyển kiểu có hiệu lực ngay lập tức kể cả khi đang chờ kết quả hoặc đã có
  đáp án/lỗi — không cần đợi lần giải/dịch tiếp theo. Nút này cũng có mặt
  trong popup của nút tròn Minimize để đổi ngược lại được từ đó.
- Tooltip Dịch nhanh khi di chuột nay có thêm một nút tròn nhỏ ở góc trên bên
  trái, hiện sẵn 2 chữ cái ngôn ngữ đang dịch ra (ví dụ "VI") để biết ngay
  đang dịch sang ngôn ngữ nào — rê chuột vào để đổi nhanh, dùng chung danh
  sách ngôn ngữ với ô "Ngôn ngữ trả lời" trong Chat.
- Popup Giải bài/Dịch nay có riêng một "Chủ đề màu Popup" (Cài đặt > Giao
  diện > Homework Helper Popup) — chọn màu nhấn cho nút chính, viền và tiêu
  đề ANSWER, dùng chung bảng màu với Thanh Công Cụ Bôi Đen (Cyber Blue,
  Emerald Green, Purple Glass, Rose Pink, Amber Gold, Indigo Night). Mặc
  định là Tự động, giữ nguyên màu xanh quen thuộc và tự đổi theo giao diện
  sáng/tối như trước đây.

### Thay đổi
- Tooltip tùy chỉnh (Cài đặt, Side Panel, Popup, và các nút nổi/thẻ trong
  trang) nay đồng bộ theo phong cách Liquid Glass — 30% trong suốt, 6px mờ
  nền — và tự chuyển sáng/tối theo đúng theme đang dùng ở từng nơi, mặc định
  là sáng. Riêng trang Cài đặt hiện chưa có chế độ tối nên tooltip ở đó luôn
  là bản sáng.
- 4 nút tắt nhanh (Chat AI, Chụp & Giải, Rê chuột dịch, Cài đặt) và 3 công tắc
  bên dưới trong popup thanh công cụ nay có tooltip mô tả rõ chức năng và
  phím tắt tương ứng khi rê chuột vào. Riêng "Rê chuột dịch" hiện đúng phím
  bổ trợ người dùng đang cấu hình (Ctrl/Shift/Alt/Cmd...), và phím tắt của
  "Chat AI"/"Chụp & Giải" đọc trực tiếp từ trạng thái gán phím thật của
  Chrome — nếu Chrome chưa gán được phím tắt do trùng tổ hợp, tooltip báo rõ
  thay vì hiện một phím tắt có thể không hoạt động.
- Tooltip Dịch nhanh khi di chuột nay có độ trong suốt và độ mờ nền mặc định
  giống hệt Thanh Công Cụ Bôi Đen (90% / 16px thay vì 96% / 18px trước đây) —
  trước đây quá đục nên trông không "kính mờ" (glass) như thanh công cụ.
- Thêm 3 chủ đề màu mới cho "Chủ đề Màu sắc Toolbar" và tooltip Dịch nhanh khi di
  chuột: Rose Pink (Hồng), Amber Gold (Cam), Indigo Night (Chàm) — bên cạnh các
  màu Cyber Blue, Emerald Green, Purple Glass đã có.
- Trang Cài đặt > Giao diện & Tùy biến Trực quan: các mục "Nút Nổi Trong Trang
  (Floating FABs)" và "Popup Giải Bài Nổi (Floating Solution Card)" nay có
  thêm nút "Khôi phục mặc định" giống các mục còn lại.
- Mục "Thanh Công Cụ Bôi Đen (Selection Toolbar)" nay có thêm công tắc bật/tắt
  ngay tại đây thay vì phải sang tab "Cài Đặt Chung" mới bật/tắt được — đồng bộ
  hai chiều với công tắc bên đó.
- Các mục có công tắc bật/tắt riêng (FAB, Thanh Công Cụ Bôi Đen, Dịch nhanh khi
  di chuột) nay làm mờ phần tùy chỉnh bên dưới khi tắt, vì lúc đó các tùy chỉnh
  đó chưa có tác dụng gì.
- Dịch nhanh khi di chuột nay **bật mặc định** khi cài extension mới, thay vì
  phải tự vào Cài đặt bật lên.
- "Chủ đề màu Tooltip" của Dịch nhanh khi di chuột nay có thêm lựa chọn Tự
  động (theo giao diện sáng/tối) giống Thanh Công Cụ Bôi Đen, và trở thành
  **mặc định mới** thay vì luôn cố định Liquid Glass Light như trước.
- Popup Giải bài/Dịch ở kiểu Normal: 3 nút Sao chép/Yêu thích/Thử lại nay chỉ
  hiện icon (bỏ chữ) để gọn hơn, giống cách kiểu Compact đã làm. Nút chính
  bên dưới cũng thông minh hơn theo ngữ cảnh: dịch nhanh một đoạn text bôi
  đen không còn hiện nút "Tiếp tục trong Chat" (vốn không có ý nghĩa với một
  bản dịch/tra từ đơn thuần), trong khi chụp ảnh để dịch vẫn giữ nút "Chụp
  lại" như cũ và các thao tác bôi đen khác (Giải thích, Tóm tắt, Tra cứu,
  Ngữ pháp) vẫn giữ nguyên nút "Tiếp tục trong Chat".

### Sửa lỗi
- Popup Minimize không theo cấu hình độ trong suốt/độ mờ nền (Blur) của
  Homework Helper Popup — luôn cố định một mức bất kể người dùng chỉnh gì
  trong Cài đặt. Nay dùng chung cấu hình với popup Normal/Compact.
- Kết quả tra từ điển (dịch một từ) trong popup Minimize hiện phẳng, không có
  định dạng — nay hiển thị đúng bố cục từ/phiên âm, từ loại, nghĩa, bản dịch
  như ở popup Normal/Compact, kèm nút Nghe riêng cho từng phần.
- Lời giải có công thức LaTeX đặt trong khối code (```latex ... ```) đôi khi
  hiển thị vỡ thành chữ và ký tự mã hoá lộn xộn kèm chữ "Copy" thừa, thay vì
  một khối công thức có nút Copy hoạt động bình thường. Nguyên nhân: các bước
  nhận diện công thức toán ($$, \\(...\\), các lệnh LaTeX đơn lẻ...) chạy
  trước bước nhận diện khối code, nên "nhìn xuyên" vào bên trong khối code
  chưa được nhận diện và trích một phần nội dung ra ngoài — làm hỏng khối
  code khi ráp lại. Nay khối code luôn được nhận diện và khoá lại đầu tiên.
- Tính năng tự dịch nội dung vừa copy khi mở popup: trước đây copy bất kỳ nội
  dung gì (URL, email, chuỗi base64, mã SVG/HTML, hash, đường dẫn file...)
  cũng bị coi là văn bản cần dịch và tự động dịch ngay. Nay các dạng nội dung
  rõ ràng không phải văn bản như trên sẽ được bỏ qua, chỉ tự động dịch khi nội
  dung thật sự giống câu/từ ngôn ngữ tự nhiên.
- Bật/tắt "Rê chuột dịch" (hoặc "Thanh Công Cụ Bôi Đen") từ popup thanh công
  cụ trong khi trang Cài đặt đang mở sẵn ở nơi khác không cập nhật lại 2 công
  tắc tương ứng trong Cài đặt — vẫn hiện trạng thái cũ cho tới khi tải lại
  trang. Nay 2 công tắc này tự cập nhật ngay khi giá trị thay đổi từ bất kỳ
  đâu.
- Sau khi Chụp & Giải, đôi khi câu hỏi hoặc bài giải bị "mất tích" khỏi lịch sử
  Chat dù vừa giải xong vẫn thấy trên thẻ nổi. Nguyên nhân: hai lần ghi lịch
  sử (lượt hỏi và lượt trả lời) chạy gần như đồng thời, cùng đọc dữ liệu cũ
  rồi ghi đè lên nhau, khiến một trong hai lượt bị ghi đè mất mà không báo
  lỗi. Nay các lượt ghi lịch sử luôn chạy tuần tự, không còn đè lên nhau.
- Highlight của Dịch nhanh khi di chuột bị chồng lấn thành nhiều dải màu đậm
  nhạt không đều khi câu/đoạn cần dịch nằm rải trong nhiều thẻ HTML lồng
  nhau (ví dụ vài từ in đậm `<b>` xen giữa câu). Nguyên nhân: trình duyệt trả
  về một hình chữ nhật riêng cho mỗi đoạn DOM cắt qua, kể cả khi chúng nằm
  chung một dòng — chữ in đậm lại có kích thước dòng hơi khác chữ thường nên
  các hình chữ nhật đó chồng lên nhau một chút, tạo ra vệt màu đậm nhạt như
  trong ảnh. Nay các hình chữ nhật cùng dòng được gộp lại thành một dải sáng
  liền mạch trước khi tô màu.
- Dịch nhanh khi di chuột đôi khi không hiện lên dù đã giữ đúng phím bổ trợ
  (ví dụ Ctrl) và để chuột yên trên chữ. Nguyên nhân: trạng thái phím
  Ctrl/Shift/Alt/Cmd chỉ được cập nhật mỗi khi chuột *di chuyển* — nếu giữ
  phím sau khi chuột đã đứng yên trên chữ (không có thao tác di chuột nào
  nữa), lần kiểm tra "đến lượt dịch chưa" vẫn dùng trạng thái phím cũ (chưa
  giữ) nên coi như chưa đúng điều kiện, im lặng bỏ qua. Đó là vì sao rê
  chuột ra ngoài rồi giữ phím và rê vào lại luôn có tác dụng — thao tác đó
  luôn tạo ra chuyển động chuột mới trong lúc đang giữ phím. Nay trạng thái
  phím được cập nhật ngay khi bấm/nhả, không cần đợi chuột nhúc nhích nữa.
- Phím tắt mở khung chat (⌘K trên macOS, Alt+K trên Windows/Linux) không mở
  được gì cả. Nguyên nhân: đoạn code xử lý phím tắt có một bước chờ
  (`await`) trước khi gọi API mở Side Panel — Chrome coi "cú bấm phím" đã
  hết hiệu lực ngay khi gặp `await` đó, nên lệnh mở Side Panel bị từ chối
  âm thầm. Phím Chụp màn hình (⌘E/Alt+C) không bị ảnh hưởng vì không đụng
  tới API này. Đã bỏ bước chờ thừa, phím tắt mở chat giờ hoạt động đúng.
- 2 nút nổi trên trang (Chụp màn hình, Mở chat panel) hiện tooltip phím tắt
  sai trên macOS — luôn ghi "Alt+C"/"Alt+K" dù phím thật trên Mac là ⌘E/⌘K.
  Nay tooltip đọc đúng phím Chrome đang thực sự gán cho từng hệ điều hành,
  giống cách đã sửa cho tooltip trong popup.
- Tooltip Dịch nhanh khi di chuột giảm khoảng đệm phía trên phần nội dung
  (14px → 12px) cho cân đối hơn với 3 cạnh còn lại — vẫn đủ chừa chỗ cho nút
  nghe nổi lên mép trên.
- Dịch nhanh khi di chuột: khi câu cần dịch bị ngắt bởi thẻ `<br>` giữa các
  thẻ HTML con (ví dụ tiêu đề xuống dòng giữa chừng bằng `<br>` rồi qua
  `<span>` khác), chữ ở hai bên bị dính liền vào nhau (ví dụ "vai trò" +
  "dựng từ" thành "tròdựng") do phần gộp text bỏ qua khoảng trắng tại vị trí
  `<br>`. Nay đã tự thêm khoảng trắng ở đúng vị trí đó.
- Mục "Dịch nhanh khi di chuột" không còn hiện trùng lặp tiêu đề (tiêu đề mục
  và tên công tắc bật/tắt bên dưới trước đây giống hệt nhau) — công tắc giờ
  hiện đúng nhãn "Bật Dịch nhanh khi di chuột".
- Khi mục "Trên Toolbar" (Giao diện > Sắp xếp Toolbar) không còn công cụ nào,
  thanh công cụ nổi lúc bôi đen chỉ còn mỗi icon mặt cười — trước đây icon này
  vẫn bị bọc trong khung nền/viền/bóng đổ như một thanh công cụ đầy đủ, giờ
  hiện đúng mỗi icon trần, không nền không viền, và icon cũng nhỏ lại một
  chút (18px → 16px) cho gọn. Vị trí thanh công cụ (cả icon lẫn dạng đầy đủ)
  giờ canh giữa chính xác theo đúng phần chữ vừa bôi đen — trước đây dùng số
  đo cố định giả định trước kích thước nên bị lệch, nhất là ở dạng chỉ-icon.

---

## [1.8.0] — 2026-09-03

### Thêm mới
- **Lịch sử dịch, dùng chung cho thanh công cụ bôi đen và popup trên thanh
  công cụ.** Dịch một từ/câu ở đâu cũng vào chung một danh sách — không liên
  quan tới lịch sử chat. Bấm nút Lịch sử (mới, trên cả hai nơi) để xem dạng
  bottom sheet ngay trong popup: mỗi dòng 2 cột (từ gốc — bản dịch, tự động
  rút gọn bằng "..." nếu quá dài), bấm vào dòng để mở rộng xem chi tiết —
  dịch từ thì hiện phiên âm, ví dụ, nghĩa và nút nghe; dịch câu/đoạn thì hiện
  câu gốc kèm bản dịch. Dịch lại đúng nội dung cũ sẽ cập nhật dòng đó và đưa
  lên đầu thay vì tạo dòng mới. Có tab Yêu thích riêng — đánh dấu sao ngay
  trên kết quả vừa dịch hoặc trong danh sách lịch sử, lọc xem lại sau. Mỗi
  dòng có ô tick riêng, ô tick "chọn tất cả" ở đầu danh sách, và nút Xoá
  (kèm xác nhận) hiện ra ngay khi có ít nhất một dòng được chọn.
- **Chủ đề màu Toolbar có thêm lựa chọn "Tự động"**, và đây cũng là lựa chọn
  mặc định — tự chuyển giữa Liquid Glass Light và Liquid Glass Dark theo đúng
  giao diện sáng/tối hiện tại, không cần tự chọn tay. Bốn phong cách màu cũ
  (Light/Dark/Cyber Blue/Emerald/Purple) vẫn chọn được như trước.
- **Nghe phát âm ngay cạnh phiên âm.** Thẻ tra từ giờ có nút loa ngay sau phần
  phiên âm để nghe chính từ gốc, và một nút nữa cạnh nghĩa đã dịch để nghe bản
  dịch. Áp dụng cho cả popup trong trang, popup trên thanh công cụ và Side Panel.
  Nút loa cũ dưới chân thẻ chỉ còn xuất hiện với những câu trả lời không phải
  thẻ tra từ.
- **Chọn nguồn dịch ngay trên popup trong trang.** Thanh dịch có thêm ô chọn
  Microsoft Translator, Google Translate, Volcano Translate, MyMemory hoặc AI
  của bạn — đổi nguồn là dịch lại ngay. Trước đây popup này luôn dùng AI, tốn
  lượt gọi cho những câu chỉ cần dịch máy. Lựa chọn được ghi nhớ riêng, không
  ảnh hưởng tới popup trên thanh công cụ.
- **Nghe phát âm ngay trên tooltip dịch khi rê chuột.** Nút loa nhỏ ở góc trên
  tooltip đọc to đúng phần văn bản đang rê chuột (từ, câu hoặc đoạn) bằng giọng
  của chính ngôn ngữ đó — không phải bản dịch. Dùng giọng có sẵn của hệ điều
  hành: không cần API key, không gửi gì lên mạng. Nút tự ẩn trên máy không có
  giọng đọc.

### Thay đổi
- **Ô chọn nguồn dịch nay hiện logo kèm tên nhà cung cấp**, thay cho danh sách
  chữ trơn — nhận ra dịch vụ đang dùng nhanh hơn nhiều. Dùng chung một kiểu
  dropdown cho cả popup trên thanh công cụ lẫn popup trong trang.
- **Popup trên thanh công cụ: nhấn Enter là dịch luôn.** Muốn xuống dòng thì giữ
  Shift rồi nhấn Enter — giống ô chat trong Side Panel. Gợi ý phím được ghi ngay
  dưới ô nhập. Gõ tiếng Việt kiểu telex hay tiếng Trung/Nhật/Hàn vẫn an toàn:
  phím Enter dùng để chốt chữ đang gõ dở không kích hoạt dịch.
- **Mở popup trên thanh công cụ là con trỏ nằm sẵn trong ô nhập**, gõ hoặc dán
  được ngay không cần bấm chuột.
- **Đổi icon nút "Hover Translate"** trên popup thành hình con trỏ chuột, đúng
  với việc tính năng này kích hoạt bằng cách rê chuột chứ không phải click.
- **Thanh tiêu đề của popup dịch trong trang, ở chế độ thu gọn, tách làm hai.**
  Tên popup (icon + tên) giờ là một chip nhỏ gọn riêng; ba nút lịch sử/thu
  gọn/đóng nằm độc lập bên cạnh, không còn chung một thanh nền dài — đúng
  bằng bề rộng thẻ dịch như trước, chỉ để vừa 3 icon. Ba nút này giờ cũng nổi
  rõ trên mọi nền trang web: đổi màu theo giao diện sáng/tối và có viền mờ
  cùng tông để không bị chìm vào nội dung trang phía sau.
- **Popup trên thanh công cụ giờ theo đúng giao diện sáng/tối/tự động** đã
  chọn trong Cài đặt, thay vì luôn cố định giao diện sáng như trước.
- **Cách chọn/xoá mục trong bottom sheet Lịch sử làm lại hoàn toàn, bỏ hẳn
  checkbox.** Bấm vào một dòng là chọn dòng đó (bấm lại để bỏ chọn); bấm
  riêng mũi tên bên phải mới là mở rộng/thu gọn chi tiết. Khi có dòng đang
  được chọn, số lượng hiện cạnh nút xoá. Nút xoá giờ là nút gộp hai phần:
  phần chính xoá các dòng đang chọn, phần mũi tên nhỏ mở menu "Xoá tất cả"
  (xoá toàn bộ danh sách đang xem, không phụ thuộc dòng nào đang được chọn).
  Cả hai thao tác xoá đều có hộp thoại xác nhận trước khi xoá thật.

### Sửa lỗi
- **Menu "..." của thanh công cụ bôi đen (Giải thích/Tóm tắt/Kiểm tra ngữ pháp/Tắt
  công cụ...) và menu con của nó luôn hiện kiểu kính sáng màu trắng cố định,
  gần như không mờ, bất kể đang chọn theme màu nào hay chỉnh độ trong suốt/độ
  mờ backdrop nào trong Cài đặt** — lạc tông hẳn so với chính thanh công cụ
  ngay phía trên nó. Nguyên nhân sâu hơn một bước so với tưởng ban đầu: 2 menu
  này vốn nằm *bên trong* thanh công cụ mà chính thanh công cụ cũng có hiệu ứng
  kính mờ riêng — hiệu ứng mờ của phần tử con bị "nhốt" trong phạm vi vẽ của
  phần tử cha, không lấy được nội dung trang thật phía sau để làm mờ, dù giá
  trị CSS đặt ra đúng. Giờ 2 menu này tách ra render độc lập (không còn là con
  của thanh công cụ), tự nhuộm màu theo đúng theme đang chọn (Liquid Glass
  Dark, Cyber Blue, Emerald, Purple) và bám đúng độ trong suốt + độ mờ backdrop
  đã chỉnh trong Cài đặt.
- **Bottom sheet Lịch sử ở popup trên thanh công cụ đóng không dứt điểm** —
  trước đây đóng lại nhưng vẫn còn thấy một phần ở mép dưới popup. Nút Lịch
  sử cũng được dời lại gần nút Cài đặt cho gọn thay vì tách xa nhau.
- **Popup dịch trong trang: ô chọn nguồn dịch và bottom sheet Lịch sử bị kẹt
  giao diện sáng khi bật giao diện tối** — chữ khó đọc trên nền trắng giữa
  một thẻ toàn màu tối. Nguyên nhân do thứ tự nạp CSS, đã sửa tận gốc.
- **Mục "Google Gemini" trong "Cấu hình AI Models & API Keys" hiển thị nền
  trắng lạc quẻ giữa các mục khác đã theo đúng giao diện tối.**
- **Thanh công cụ bôi đen bị nháy liên tục** nếu bôi đen một đoạn văn bản mới
  trong lúc một bản dịch/câu trả lời khác đang generate dần dần ở nơi khác
  trên trang — dữ liệu nội bộ đổi liên tục trong lúc đó khiến thanh công cụ
  cứ tự vẽ lại dù không có gì thực sự thay đổi ở nó.
- **Từ điển tra nhanh (Google) thiếu phiên âm và ví dụ khi từ cần tra viết
  hoa chữ đầu** — ví dụ "Result" copy từ đầu câu ra thiếu hẳn hai phần này,
  trong khi "result" viết thường lại đầy đủ. API của Google phân biệt hoa
  thường ở đúng hai trường này; giờ tra bằng chữ thường nhưng vẫn hiển thị
  đúng cách viết gốc.
- **Tự dịch clipboard khi mở popup trên thanh công cụ đôi khi không chạy** —
  ô nhập trống trơn, không dán cũng không dịch. Nguyên nhân xác nhận qua log
  lỗi thật: trình duyệt đôi khi chưa kịp trao focus cho popup vào đúng lúc
  code đọc clipboard chạy, khiến `NotAllowedError: Document is not focused`.
  Giờ chủ động chờ sự kiện focus thật rồi thử đọc lại nhiều lần thay vì chỉ
  một lần, đủ để chờ cả những máy trao focus chậm; nếu người dùng đã gõ chữ
  vào ô nhập trong lúc chờ thì không còn bị nội dung clipboard ghi đè lên.
- **Bottom sheet Lịch sử cao vượt quá phần hiển thị của popup** khi đang có
  sẵn một bản dịch dài khiến popup vốn đã cần cuộn — sheet trồi dài xuống
  tận "chân" thật của popup (phần đã nằm ngoài khung nhìn), thay vì vừa
  khít đúng phần đang hiển thị. Sheet giờ luôn khớp đúng khung nhìn thực tế
  của popup, không phụ thuộc nội dung phía sau nó dài hay ngắn. Kèm theo:
  khoá cuộn cả popup trong lúc sheet đang mở, tránh cuộn nhầm phần nội dung
  ở phía sau.

### Gỡ bỏ
- **Bỏ nút "Hoàn tác" ở popup** khi văn bản được tự lấy từ clipboard. Nút xoá
  (×) ngay trong ô nhập đã làm đúng việc đó rồi.

---

## [1.7.2] — 2026-09-01

### Thay đổi
- **Dịch nhanh khi rê chuột và ô dịch nhanh trên popup nay có cache trong phiên
  duyệt web.** Rê lại đúng một từ/câu, hoặc dịch lại đúng nội dung vừa dịch,
  trả kết quả ngay không cần gọi lại máy chủ dịch — nhanh hơn và đỡ tốn lượt
  gọi các dịch vụ dịch miễn phí. Cache tự xoá khi đóng trình duyệt, không lưu
  lâu dài. Chỉ áp dụng cho dịch nhanh (không phải AI); chat/giải bài bằng AI
  chưa có cache.

---

## [1.7.1] — 2026-09-01

### Sửa lỗi
- **Chat nhiều lượt nay nhớ được ngữ cảnh hội thoại trước đó** — trước đây mỗi câu hỏi
  gửi lên AI chỉ có mỗi tin nhắn hiện tại, khiến các câu hỏi nối tiếp kiểu "còn câu 2 thì
  sao?" bị model trả lời sai vì không biết "câu 2" là gì. Áp dụng cho cả khung chat
  (Sidepanel), thẻ nổi trên trang, và ô hỏi nhanh khi bôi đen văn bản. Model chạy trên máy
  (Ollama/LM Studio) giữ ít lượt hội thoại gần nhất hơn model trên mây, vì ngữ cảnh dài
  cộng thẳng vào thời gian chờ trả lời mà model local vốn đã chậm hơn.

---

## [1.7.0] — 2026-09-01

### Thêm mới
- **Bấm vào icon extension trên thanh công cụ nay mở ô dịch nhanh**, thay vì mở thẳng
  khung chat AI. Ô dịch có cặp ngôn ngữ (tự động nhận diện → ngôn ngữ đích), nút đảo
  chiều, ô nhập và ô kết quả kèm nút sao chép. `Ctrl/Cmd + Enter` để dịch mà không rời
  ô nhập.
- **Tự dịch nội dung vừa copy.** Nếu bạn copy một đoạn text rồi bấm vào icon extension,
  nội dung đó được điền sẵn và dịch luôn, kèm dòng ghi chú và nút *Hoàn tác*. Đoạn quá
  dài chỉ được điền sẵn chứ không tự dịch. Bật/tắt ngay trong ô dịch — mặc định **bật**.
  Cùng một nội dung sẽ không bị dịch lại ở những lần mở sau.
- **Chọn nguồn dịch.** Bốn dịch vụ miễn phí không cần API key — Microsoft Translator
  (mặc định), Google Translate, Volcano Translate, MyMemory — hoặc **Mô hình AI**, dùng
  chính kho API key / mô hình cục bộ (Ollama, LM Studio, Gemini Nano) mà bạn đã cấu hình.
  Tra một từ đơn bằng mô hình AI vẫn cho ra thẻ từ điển đầy đủ như thanh công cụ bôi đen.
- Hàng nút chức năng nhanh dưới ô dịch: **Chat AI · Chụp & Giải · Rê chuột dịch · Cài đặt**.
  Nút *Rê chuột dịch* bật/tắt tính năng ngay tại chỗ và sáng lên khi đang bật.
- **Tra từ điển khi dịch một từ.** Gõ đúng một từ vào ô dịch nhanh sẽ ra thẻ từ điển đầy
  đủ: phiên âm, các nghĩa gom theo từ loại (danh từ, động từ…), và câu ví dụ — không cần
  API key, kể cả khi đang chọn nguồn dịch miễn phí. Cả câu vẫn dịch như thường. Nhãn từ
  loại hiển thị theo **Ngôn ngữ giao diện** bạn đã chọn trong Cài đặt, không phụ thuộc
  ngôn ngữ đang dịch sang.
- **Nút nghe phát âm** ở cả ô dịch nhanh (nghe từ gốc và nghe bản dịch) lẫn thẻ kết quả
  nổi trong trang. Dùng giọng đọc sẵn có của hệ điều hành — không cần API key, không tốn
  hạn mức, không gửi gì lên mạng. Với chữ Hán, ngôn ngữ của trang web được dùng để chọn
  đúng giọng Nhật hay Trung.

### Thay đổi
- Khung chat AI nay mở bằng `Alt+K` / `Cmd+K`, nút nổi trên trang, hoặc nút **Chat AI**
  trong ô dịch — icon trên thanh công cụ đã nhường chỗ cho ô dịch.

### Sửa lỗi
- **Dịch khi rê chuột hay báo "Không thể dịch".** Trước đây tính năng này chỉ gọi một
  endpoint Google miễn phí duy nhất; endpoint đó chặn theo địa chỉ IP, nên trong mạng
  công ty hay trường học — nơi nhiều người cùng dùng một IP — nó trả lỗi *429* và mọi
  yêu cầu dịch đều hỏng. Nay khi một dịch vụ từ chối, extension tự chuyển sang dịch vụ
  kế tiếp trong danh sách bốn nguồn miễn phí.

---

## [1.6.2] — 2026-08-31

### Thay đổi
- Icon thu gọn của thẻ giải bài (khi kéo thẻ để ẩn thành nút tròn) nay đổi kích thước
  **và độ mờ** theo đúng cài đặt **Kích thước** / **Độ mờ nút nổi FAB**, thay vì luôn
  cố định một cỡ và độ mờ 85%.
- Thẻ giải bài (popup) có thể thu nhỏ hơn khi kéo cạnh để resize.
- Ở chế độ Compact, nút hành động chính dưới đáy thẻ (ví dụ *Tiếp tục trong chat*,
  *Chụp câu tiếp theo*) nay chỉ hiện icon, ẩn chữ — đồng bộ với nút Sao chép/Thử lại
  vốn đã làm vậy.
- Thanh công cụ khi cắt ảnh (Huỷ / Sao chép / Dịch / Hỏi AI) nay dùng **chung một giao
  diện** với thanh công cụ khi bôi đen văn bản — cùng kiểu viên thuốc kính mờ, cùng
  chịu ảnh hưởng của mọi cài đặt **Chủ đề / Kích thước / Độ mờ / Độ nhoè / Hiện chữ trên
  toolbar** — thay vì mỗi nơi một kiểu (trước đây thanh cắt ảnh nền tối, nút "Hỏi AI"
  tô nổi bật riêng). Chức năng của từng nút giữ nguyên.

### Sửa lỗi
- **Nhận diện chữ từ ảnh (OCR) không hoạt động trong bản cài từ Chrome Web Store.**
  Bước nén gói phát hành làm hỏng bộ máy OCR ngoại tuyến, khiến chức năng "Cắt ảnh &
  Giải bài" luôn báo lỗi *"Không trích xuất được văn bản từ ảnh"* với người dùng chưa
  cấu hình API key — dù bản chạy trực tiếp từ mã nguồn vẫn bình thường. Gói phát hành
  nay giữ nguyên vẹn các thư viện OCR và tự kiểm tra trước khi đóng gói.
- **Model cục bộ chỉ đọc được chữ (Ollama / LM Studio) không nhận được nội dung ảnh.**
  Bước OCR đệm trước khi gửi cho model luôn thất bại, nên câu hỏi được gửi đi mà
  không kèm cả ảnh lẫn chữ trích xuất — model trả lời lạc đề hoặc hỏi lại đề bài.

## [1.6.1] — 2026-08-29

### Thay đổi
- Tái cấu trúc mã nguồn nội bộ để dễ đọc và dễ bảo trì hơn. Không đổi hành vi.

## [1.6.0] — 2026-08-28

### Thêm mới
- **Dịch nhanh khi rê chuột** trên mọi trang web: chỉ cần đưa chuột lên văn bản là
  hiện tooltip dịch, không cần bôi đen trước.
- Tuỳ chỉnh đầy đủ cho tính năng này: phím bổ trợ (Ctrl/Shift/Alt/Cmd), mức chi tiết
  (từ / câu / đoạn), độ trễ, độ mờ, độ nhoè nền, cỡ chữ, chiều rộng tối đa, chủ đề màu,
  làm nổi vùng văn bản và hiệu ứng.
- Bản địa hoá đầy đủ 13 ngôn ngữ cho toàn bộ tuỳ chọn mới.

## [1.5.0] — 2026-08-28

### Thêm mới
- Hỗ trợ **Gemini Nano** — mô hình AI chạy hoàn toàn trên thiết bị, không cần API key
  và không gửi dữ liệu ra ngoài.
- Trang hướng dẫn nhanh giúp bật và kiểm tra trạng thái Gemini Nano.

## [1.4.0] — 2026-08-27

### Thêm mới
- **Trình sắp xếp thanh công cụ bằng kéo–thả**: tự chọn nút nào hiện ngoài thanh chính,
  nút nào nằm trong menu phụ.
- Bản địa hoá cho toàn bộ giao diện sắp xếp.

## [1.3.1] — 2026-08-27

### Thay đổi
- Cải thiện hiển thị trạng thái đang tải của overlay lời giải.

### Sửa lỗi
- Khắc phục một số trường hợp thanh công cụ bôi đen hoạt động không ổn định.

## [1.3.0] — 2026-08-27

### Thêm mới
- **Tra từ điển cho từ đơn**: khi dịch một từ duy nhất, kết quả hiển thị theo dạng từ
  điển (loại từ, nghĩa, ví dụ) thay vì một dòng dịch thô.

## [1.2.8] — 2026-08-26

### Thêm mới
- Tuỳ chọn **vị trí thanh công cụ** khi bôi đen văn bản.

## [1.2.7] — 2026-08-25

### Thay đổi
- Tối ưu tốc độ vẽ và tinh chỉnh giao diện thanh công cụ bôi đen.

## [1.2.5] — 2026-08-25

### Thay đổi
- Chuẩn hoá tên các ngôn ngữ hiển thị trong Cài đặt cho nhất quán.

## [1.2.3] — 2026-08-25

### Thêm mới
- Hướng dẫn cài đặt Ollama và LM Studio bằng đủ 13 ngôn ngữ, kèm liên kết tải trực tiếp.

### Sửa lỗi
- Đưa version về đúng nhánh phát hành sau một lần đánh số nhầm (xem ghi chú cuối file).

## [1.2.2] — 2026-08-24

### Thêm mới
- **Kiểm tra kết nối** tới nhà cung cấp AI ngay trong Cài đặt.
- Cải thiện màn hình quản lý API key.

### Thay đổi
- Nâng cấp xử lý dịch thuật.

## [1.2.1] — 2026-08-24

### Thêm mới
- Hỗ trợ dịch thuật trong luồng khoanh vùng ảnh.

### Thay đổi
- Cải thiện thao tác khoanh vùng chụp ảnh.

## [1.1.5] — 2026-08-20

### Sửa lỗi
- Xử lý công thức LaTeX chính xác hơn trong bộ dựng markdown.

## [1.1.4] — 2026-08-20

### Thay đổi
- Cải thiện hành vi của thẻ lời giải nổi.

## [1.1.3] — 2026-08-20

### Thay đổi
- Làm rõ phần tiêu đề trong prompt gửi kèm ảnh, giúp AI hiểu đúng đề bài hơn.

## [1.1.1] — 2026-08-20

### Thay đổi
- Bổ sung nhãn trợ năng cho các nút trên thanh công cụ.
- Tinh chỉnh độ mờ mặc định.

## [1.1.0] — 2026-08-20

### Thêm mới
- **Hỗ trợ mô hình AI chạy nội bộ** qua Ollama và LM Studio — dùng được hoàn toàn
  offline, không cần API key.
- Giao diện kết nối và quản lý máy chủ AI nội bộ.

---

## Trước 1.1.0

Các phiên bản trước `1.1.0` đứng yên ở `1.0.0` trong khi nhiều tính năng lớn đã được
phát hành mà không bump version, gồm:

- Bộ máy **OCR offline** bằng Tesseract.js chạy trong offscreen document (2026-08-17)
- **Đa ngôn ngữ giao diện** và tách nhỏ mã nguồn sidepanel/content script (2026-08-17)
- Hỗ trợ mô hình nội bộ trong Side Panel (2026-08-18)
- Hiển thị các bước xử lý khi AI đang trả lời (2026-08-19)

---

## Ghi chú về tính chính xác của lịch sử

File này được **dựng lại từ lịch sử git** ngày 2026-08-29, vì repo không có changelog
trong suốt ~18 lần phát hành đầu tiên. Nội dung suy ra từ commit message nên mô tả có
thể thiếu chi tiết so với thực tế thay đổi.

Hai điểm bất thường trong lịch sử version:

1. **Nhảy version nhầm**: commit `834c9c0` (2026-08-25) đặt version thành `1.4.0`, sau đó
   commit `4dbcaad` cùng ngày đưa về `1.2.3`. Bản `1.4.0` thật sự được phát hành ngày
   2026-08-27 tại commit `9b33266`.
2. **Version bị bỏ qua**: `1.1.2`, `1.2.0`, `1.2.4`, `1.2.6` không tồn tại.

Từ `1.6.1` trở đi, mọi lần bump **bắt buộc** kèm một mục trong file này — xem
[CLAUDE.md](./CLAUDE.md) mục 3.
