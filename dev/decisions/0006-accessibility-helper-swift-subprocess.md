# ADR-0006: Accessibility macOS qua subprocess Swift, không qua native Node addon

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-30

## Bối cảnh

[ADR-0004](./0004-solve-truoc-translate.md) hoãn Lane A (dịch khi rê chuột) sang
Phase 3 vì rủi ro lớn nhất của cả dự án nằm ở một câu hỏi chưa kiểm chứng được:
**`AXUIElementCopyElementAtPosition` có thực sự đọc được text từ Chrome, VS Code,
và các app Electron khác không** — hay chỉ hoạt động với app native Cocoa.

Đây không kiểm chứng được bằng đọc tài liệu — phải chạy thật. Đã tiến hành spike
theo đúng khuyến nghị của kế hoạch (mục 10 trong
[desktop-app-implementation-plan.md](../../roadmap/desktop-app-implementation-plan.md)),
biên dịch một binary Swift độc lập, xin quyền Accessibility qua System Settings,
và thử trên VS Code (một app Electron thật).

## Quyết định

**Chấp nhận kiến trúc: Accessibility trên macOS đọc qua một binary Swift độc lập,
sống lâu dài, giao tiếp với main process qua JSON theo dòng trên stdin/stdout —
không viết native Node addon (N-API/node-gyp) gọi thẳng AppKit.**

## Ba phát hiện thực nghiệm quyết định thiết kế

Không có phát hiện nào trong ba cái này có trong tài liệu Apple chính thức — cả
ba chỉ lộ ra khi chạy thật.

### 1. Chromium/Electron cần "đánh thức" trước khi lộ cây accessibility

Chrome và Electron (kể cả VS Code) **không dựng cây accessibility đầy đủ theo
mặc định** — vì lý do hiệu năng, chúng chỉ dựng khi phát hiện một AT client
(VoiceOver...) đang hỏi tới. Không có bước này, mọi truy vấn tại một điểm chỉ
trả về một container rỗng (`AXScrollArea`, 0 con) — không có lỗi, không có dấu
hiệu nào cho biết vì sao rỗng.

Cách ép bật: set thuộc tính riêng của Chromium `AXManualAccessibility = true`
lên `AXUIElementCreateApplication(pid)` của app đó. Việc dựng tree là **bất
đồng bộ** — phải đợi (poll `children(appElement)` cho tới khi khác 0, tối đa
~2s) rồi **hit-test lại từ đầu**, vì tham chiếu element lấy trước khi kích hoạt
không tự cập nhật.

### 2. Toạ độ Electron khớp tuyệt đối với toạ độ Quartz, không cần quy đổi

Đã kiểm chứng: `hitFrame` do AX trả về khớp **chính xác từng pixel** với
`BrowserWindow.getBounds()` của Electron. `screen.getCursorScreenPoint()` và
toạ độ mà `AXUIElementCopyElementAtPosition` cần là **cùng một hệ** — không
lệch trục Y (khác với lo ngại ban đầu rằng Cocoa dùng gốc dưới-trái còn Quartz
dùng gốc trên-trái; Electron đã tự chuẩn hoá về top-left trên mọi nền tảng).

`AccessibilityText.bounds` sửa lại thành `Rect<'screen-logical'>` (Phase 0 từng
khai sai thành `screen-physical` — chưa có bằng chứng thực nghiệm lúc đó).

### 3. Đào cây phải thận trọng — đoán bừa cho ra kết quả sai, không phải không có kết quả

Heuristic ban đầu ("không con nào khớp hình học thì đi vào con đầu tiên") từng
cho kết quả **sai hoàn toàn** — truy vấn tại một điểm giữa màn hình (vùng Dock)
trả về text của một icon Dock cách xa điểm thật hàng trăm pixel, vì node đó có
nhiều con và không con nào chứa điểm, nhưng heuristic vẫn chọn đại con đầu tiên.

Sửa: chỉ đào xuống khi (a) một con có frame chứa điểm, hoặc (b) node hiện tại
có **đúng một** con (wrapper đơn giản, phổ biến trong cây AX của Chromium — một
`<div>` bọc chỉ để nhóm). Không đoán khi có nhiều con mà không con nào khớp —
thà trả "không có text" còn hơn trả text sai vị trí.

## Vì sao subprocess, không phải native Node addon

AXUIElement chỉ gọi được từ code Objective-C/Swift. Viết native addon bằng N-API
gọi AppKit sẽ lặp lại đúng rủi ro đã cắn thật ở Phase 1 với `better-sqlite3`
([ADR-0005](./0005-dung-node-sqlite.md)): phụ thuộc `node-gyp`/Python, lệch ABI
giữa Node hệ thống và Node đóng gói trong Electron, phải `electron-rebuild` mỗi
lần đổi phiên bản Electron.

Một binary Swift độc lập, giao tiếp qua stdio, tránh hoàn toàn lớp rủi ro đó —
không ABI Node nào để lệch, không build step phụ thuộc Python. Cùng một logic
quyết định như ADR-0005, áp dụng cho một vấn đề khác.

**Sống lâu dài, không phải spawn mới mỗi lần hover:**
1. Tránh chi phí khởi động tiến trình (~10-20ms) trên mỗi lần hover — Lane A
   cần phản hồi tức thì (`LIMITS.fastLane.targetLatencyMs = 400`).
2. Nhớ được app nào đã kích hoạt `AXManualAccessibility` (`activatedPids: Set<pid_t>`
   trong bộ nhớ tiến trình) — không phải kích hoạt lại mỗi lần, chỉ tốn chi phí
   một lần cho mỗi app mới gặp trong phiên.

## Hệ quả cho onboarding — quan trọng, chưa giải quyết ở ADR này

Quyền Accessibility trên macOS gắn theo **tiến trình chịu trách nhiệm** (responsible
process), không phải riêng lẻ từng binary con. Khi app đóng gói thật spawn
`accessibility-helper` làm subprocess, quyền chỉ cần cấp cho **app chính**
("Homework Helper.app") — người dùng không phải cấp quyền riêng cho helper.

Nhưng: **cấp quyền cho một tiến trình đang chạy sẵn không có tác dụng ngay** —
phải khởi động lại tiến trình đó thì quyền mới thật sự áp dụng. Đây là hành vi
chuẩn của macOS (Zoom, OBS... đều vậy), nhưng ảnh hưởng trực tiếp tới luồng
onboarding: màn hình xin quyền lần đầu (roadmap gốc §95 "First-Run Test") phải
hướng dẫn người dùng **khởi động lại app** sau khi cấp quyền, không chỉ "cấp
quyền rồi thử lại ngay" — nếu không, người dùng sẽ thấy tính năng "vẫn không
hoạt động" ngay sau khi vừa cấp quyền và bỏ cuộc.

## Đánh đổi đã chấp nhận

- Thêm một ngôn ngữ (Swift) vào codebase vốn chỉ có TypeScript. Chấp nhận vì
  đây là lựa chọn bắt buộc về mặt kỹ thuật — không có cách nào gọi AXUIElement
  từ JavaScript/TypeScript thuần.
- `native/accessibility-macos/` cần bước build riêng (`swiftc`), chưa tích hợp
  vào `npm run build` — sẽ làm khi tới bước đóng gói (`electron-builder`,
  `extraResources`), chưa cần thiết ở giai đoạn phát triển tính năng.
- Giới hạn 2 giây chờ kích hoạt Chromium tree có thể chưa đủ với cửa sổ cực lớn
  hoặc máy chậm — cần theo dõi khi có phản hồi thực tế, chưa có dữ liệu để tối
  ưu con số này.
- Thuộc tính `AXManualAccessibility` không có trong tài liệu Apple chính thức —
  rủi ro Chromium đổi hành vi ở bản tương lai mà không báo trước. Chấp nhận vì
  đây là kỹ thuật đã được cộng đồng tự động hoá AX (nhiều công cụ dựa trên
  Chromium) dùng ổn định qua nhiều năm.

## Xem lại khi

- Bắt đầu đóng gói thật (`electron-builder`) — cần quyết định cách bundle binary
  Swift vào `Resources/` và build nó trong CI cho cả arm64/x86_64.
- Xây màn hình onboarding thật — cần thiết kế lại luồng "cấp quyền → khởi động
  lại" thay vì giả định quyền có hiệu lực ngay.
- Khi bắt đầu nhánh Windows (UI Automation) — kiểm tra UI Automation có cùng vấn
  đề "cây rỗng cho tới khi kích hoạt" với Electron/Chromium trên Windows không;
  rất có thể không giống hệt vì đó là một tầng accessibility khác hẳn.
