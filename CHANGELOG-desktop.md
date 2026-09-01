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

### Thêm mới

- **Thanh hành động nổi khi copy văn bản.** Bật ở Cài đặt → Thu nhận nội dung
  (mặc định TẮT — đọc mọi thứ bạn copy là hành vi nhạy cảm, phải tự bật). Khi
  bật, copy bất kỳ đoạn text nào (Ctrl/Cmd+C ở bất kỳ đâu) hiện một thanh nhỏ
  gần con trỏ với 3 nút: Tóm tắt / Giải thích / Viết lại — bấm vào xử lý ngay
  đúng đoạn vừa copy, không cần mở app hay nhớ phím tắt. Tự ẩn sau 8 giây nếu
  không bấm gì, hoặc Esc/bấm ra ngoài để đóng ngay. Không có nút Dịch (dùng
  dịch khi rê chuột sẵn có) hay Giải bài (cần chọn vùng màn hình, không hợp
  với văn bản đã copy).
- **Bắt đầu hỗ trợ Windows (đọc văn bản dưới con trỏ + OCR).** Trước đây app chỉ
  chạy đầy đủ trên macOS — trên Windows, phần đọc văn bản và OCR im lặng không
  hoạt động (rơi thẳng về "không có chiến lược thu nhận nào khả dụng"). Nay có
  cả hai, viết bằng PowerShell (không cần cài thêm gì trên máy người dùng).
  ⚠️ **Phần này chưa được test trên máy Windows thật** — máy phát triển hiện tại
  là macOS. Nếu bạn dùng bản Windows và gặp lỗi ở tính năng đọc màn hình, đây là
  nghi phạm đầu tiên; xem roadmap/desktop-app-implementation-plan.md mục Phase 4
  để biết chính xác phần nào chưa kiểm chứng.
- **Tóm tắt / Giải thích / Viết lại nay hoạt động qua phím tắt và tray menu.**
  Ba tác vụ này đã có trong menu và đặt được phím tắt riêng
  (mặc định `⌘⇧M`/`⌘⇧E` trên macOS) từ trước, nhưng bấm vào không có phản hồi
  vì tầng thu nhận nội dung chưa nối — nay bấm phím tắt (hoặc chọn từ tray)
  trong lúc trỏ chuột vào đoạn text sẽ lấy đúng đoạn đó để xử lý, giống cách
  "dịch khi rê chuột" đã hoạt động, chỉ khác ở chỗ chủ động kích hoạt thay vì
  tự động. Riêng "Viết lại" còn thử đọc clipboard nếu vị trí con trỏ không có
  text đọc được.
- **Chat nhớ được ngữ cảnh các lượt trước.** Trước đây mỗi câu hỏi tiếp theo
  trong một hội thoại chỉ gửi đúng câu vừa gõ — hỏi "còn cách nào khác không?"
  thì AI không biết đang hỏi tiếp về vấn đề gì. Nay gửi kèm lịch sử hội thoại
  (chỉ chữ, không gửi lại ảnh ở các lượt sau — ảnh không đổi nên gửi lại chỉ
  tốn băng thông). Số lượt giữ lại khác nhau giữa mô hình chạy trên máy (ít
  hơn, vì mỗi lượt cộng thẳng vào thời gian chờ) và mô hình trên mây (nhiều
  hơn). Áp dụng cho cả ba họ mô hình (Gemini, OpenAI và tương thích, Claude).
- **Màn hình xin quyền hệ thống (Accessibility + Screen Recording).** Trước
  đây thiếu quyền thì app chỉ im lặng không hoạt động, không giải thích vì
  sao. Nay tự mở màn hình hướng dẫn ngay khi khởi động nếu còn thiếu quyền,
  giải thích từng quyền dùng để làm gì, và nhắc khởi động lại sau khi cấp
  (bắt buộc trên macOS — quyền mới không áp dụng cho tiến trình đang chạy).
  Xem lại bất cứ lúc nào từ Cài đặt → Hệ thống. Xem
  [ADR-0010](./dev/decisions/0010-onboarding-xin-quyen-macos.md).
- **Dịch nhanh có thêm hai dịch vụ dự phòng: Bing Translator và MyMemory.**
  Trước đây chỉ dùng Google Translate — nếu Google chặn hoặc lỗi, dịch khi rê
  chuột im lặng không hoạt động. Nay tự động chuyển sang dịch vụ tiếp theo khi
  một dịch vụ lỗi. Vào Cài đặt → Ngôn ngữ để bật/tắt từng dịch vụ và sắp xếp
  thứ tự ưu tiên. Xem [ADR-0009](./dev/decisions/0009-chuoi-fallback-provider-dich.md).

### Sửa lỗi

- Với đoạn văn dài hơn 500 ký tự, MyMemory (dịch vụ dự phòng cuối) trước đây
  luôn bị từ chối lỗi mà vẫn tốn một lượt gọi mạng. Nay bỏ qua thẳng dịch vụ
  này khi biết trước sẽ bị từ chối — **không cắt bớt văn bản** để cố vừa giới
  hạn (dịch một câu cụt mà không báo là cụt còn tệ hơn không dịch).
- **Dịch khi rê chuột trên PDF/trình soạn thảo trả về câu SAI mà trông vẫn hợp
  lý.** Khi phải đọc bằng nhận dạng ảnh, app chụp một ô vuông quanh con trỏ —
  ô đó cắt ngang dòng chữ ở cả hai đầu, nên câu lấy ra bị **mất chữ** hoặc dính
  sang câu bên cạnh. Câu vẫn đọc xuôi tai nên người dùng không có cách nào biết
  bản dịch mình đang đọc là của một câu không tồn tại. Nay chụp trọn bề rộng
  dòng nên câu lấy ra là câu thật. Đo trên cùng một đoạn văn: trước ra
  *"...instead of writing rule by hand."* (thiếu chữ), sau ra
  *"...instead of writing every rule by hand."* Xem
  [ADR-0011](./dev/decisions/0011-chup-dai-ngang-thay-vi-o-vuong.md).
- **Nhiều trường hợp rê chuột trên văn bản dày không hiện gì cả.** Cùng nguyên
  nhân trên: khi dòng chữ tràn ra cả hai mép ô chụp, bộ nhận dạng của macOS trả
  về rỗng — im lặng, không lỗi. Nay không còn xảy ra, và nhận dạng còn **nhanh
  hơn gấp đôi** (90ms so với 169ms).
- **Thẻ dịch bị cắt cụt nội dung dài.** Cửa sổ thẻ cố định 320×120px nên bản
  dịch dài hơn vài dòng bị mất phần cuối, không cuộn được, không dấu hiệu gì.
  Nay thẻ tự giãn vừa nội dung (tối đa 60% chiều cao màn hình).
- **Thẻ dịch khi rê chuột không tự ẩn khi đưa chuột ra ngoài.** Nguyên nhân:
  bộ đếm đứng-yên nhớ "đã từng kích hoạt" nhưng không bao giờ quên nó khi chuột
  rời đi, nên tín hiệu ẩn chỉ đúng ở LẦN ĐẦU TIÊN trong cả phiên rồi im bặt —
  quay lại đúng chỗ vừa dịch cũng không hiện lại được vì cùng lý do. Nay ẩn
  đúng lúc, có một khoảng trễ ngắn (250ms) trước khi ẩn hẳn để rung tay nhẹ
  không làm thẻ nháy tắt-bật.
- Lệnh dịch đang bay tới mạng bị huỷ THẬT (không chỉ bỏ qua kết quả) ngay khi
  chuột rời đi hoặc chuyển sang hover chỗ khác — tránh lãng phí gọi dịch vụ
  dịch cho một vị trí không còn ai xem, và tránh thẻ dịch hiện sai chỗ nếu kết
  quả trễ về sau khi chuột đã di chuyển.
- Đọc vị trí chữ chính xác (Notes, TextEdit và các app dùng khung soạn thảo
  lớn tương tự) từng âm thầm thất bại khi phần tử con dưới con trỏ không tự
  mang nội dung riêng, phải lấy từ phần tử cha — mọi phép tính vị trí ký tự
  khi đó hỏi nhầm phần tử con, luôn ra kết quả rỗng dù nội dung đọc được vẫn
  đúng. Nay tính đúng theo phần tử thực sự chứa nội dung.

### Thay đổi

- Khi phải đọc chữ bằng nhận dạng ảnh (OCR — VS Code, PDF, ảnh chụp…), vị trí
  từng từ giờ lấy thẳng từ kết quả nhận dạng, không còn ước lượng theo tỉ lệ vị
  trí trong dòng — chính xác hơn với các dòng có từ ngắn/dài xen kẽ nhiều.
- **App đóng gói được và chạy thật.** Trước đây `npm run pack` tạo ra file .app
  trông bình thường nhưng bên trong **thiếu cả hai bộ đọc màn hình lẫn icon** —
  nghĩa là mọi tính năng dịch/giải bài chết lặng trong bản đóng gói, dù chạy từ
  mã nguồn thì hoàn hảo. Nay bản đóng gói khởi động, nạp đủ thành phần, và khai
  báo sẵn lý do xin quyền cho macOS. Chưa ký số (cần Developer ID) nên vẫn phải
  cho phép thủ công khi mở lần đầu.

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

- OCR macOS (Vision framework) làm fallback khi Accessibility không đọc được —
  ví dụ vùng soạn thảo Monaco Editor trong VS Code. Đã kiểm chứng E2E thật:
  hệ thống tự chọn Accessibility trước, OCR chỉ chạy khi cần, cả hai đường đều
  dịch thành công.

**Phase 3 hoàn tất.** Lane A (dịch khi rê chuột) chạy đầy đủ trên macOS: mouse
tracking → Accessibility/OCR → cắt đoạn → dịch → cache → hiển thị.

### Sửa lỗi

- **Dịch khi rê chuột giờ bám đúng chữ đang trỏ vào.** Trước đây khi để chế độ
  dịch theo *từ*, hover vào bất kỳ từ nào trong một dòng cũng trả về **từ đầu
  tiên** — dịch theo từ gần như vô nghĩa. Nay lấy đúng từ dưới con trỏ: đo trên
  font hệ thống thật, tỉ lệ đúng tăng từ **20%** lên **93,5%**.
- Hover vào khoảng trắng giữa hai từ từng trả về **từ cuối câu** — sai lệch
  hoàn toàn, xảy ra ở khoảng 1/6 số vị trí. Nay luôn trả một trong hai từ kề bên.
- Với ứng dụng hỗ trợ đầy đủ (Finder, Notes, Terminal…), vị trí chữ được lấy
  **chính xác tuyệt đối** từ hệ điều hành thay vì ước lượng — kể cả trong **văn
  bản dài nhiều dòng đang cuộn**, nơi trước đây hay chọn nhầm câu. Khi không lấy
  được, app ước lượng như cũ chứ không đưa ra kết quả sai một cách tự tin.
- **Đường OCR giờ bám đúng dòng chữ.** Khi phải đọc bằng nhận dạng ảnh (VS Code,
  PDF, ảnh chụp…), trước đây kết quả **không đổi dù rê chuột đi đâu** trong vùng
  đọc. Nay xác định đúng dòng và đúng từ dưới con trỏ, và thẻ dịch bám vào chính
  dòng chữ đó thay vì một khung cố định quanh chuột.
- Icon tray từng là `nativeImage.createEmpty()` — vô hình hoàn toàn trên thanh
  menu. Sau khi đóng cửa sổ Settings, không có cách nào mở lại app trừ khởi
  động lại từ đầu. Thêm icon tạm (`resources/trayTemplate.png`) — sẽ thay
  bằng thiết kế chính thức sau, không cần sửa code khi đổi.

### Còn hạn chế đã biết

- Với ứng dụng không cho biết vị trí chữ **và** cũng không đọc được bằng OCR,
  app vẫn phải ước lượng — khi đó dịch theo **câu** trong đoạn văn nhiều dòng có
  thể chọn nhầm. Xem [ADR-0008](./dev/decisions/0008-offset-ky-tu-phai-tu-kiem-chung.md).

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
