# ADR-0010: Onboarding xin quyền macOS — tự mở khi thiếu, không tự tin báo "đã cấp"

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-31

## Bối cảnh

Phase 3 hoàn tất với cả hai đường thu nhận (Accessibility, OCR) đã kiểm chứng
E2E — nhưng chỉ trên máy đã được tay bật quyền qua hai vòng debug riêng biệt
(ADR-0006, ADR-0007). Trước ADR này, không có gì trong app **chủ động** kiểm
tra hay xin quyền:

- `MacAccessibility.isTrusted()` tồn tại từ ADR-0006 nhưng **không nơi nào gọi
  tới** — chết trên giấy.
- Thiếu quyền Accessibility → `getTextAtPoint()` lặng lẽ trả `null`, rơi xuống
  OCR.
- Thiếu quyền Screen Recording → `desktopCapturer.getSources()` ném lỗi
  `"Failed to get sources."`, không có UI nào diễn giải lỗi đó cho người dùng.
- `IPC['permissions:check']` đã khai báo sẵn trong `channels.ts` từ trước
  nhưng **chưa từng có handler** — hợp đồng có, triển khai không.

Người dùng khác ngoài người phát triển sẽ thấy app "không làm gì cả", không
biết vì sao, không có đường sửa.

## Quyết định

Cửa sổ onboarding riêng, **tự động mở khi thiếu bất kỳ quyền nào lúc khởi
động** (thay vì luôn mở Cài đặt như trước), giải thích rõ từng quyền dùng để
làm gì, mở đúng pane System Settings, và nhắc khởi động lại sau khi cấp. Có
đường quay lại thủ công từ Cài đặt → Hệ thống cho trường hợp người dùng đóng
cửa sổ mà chưa cấp.

## Vì sao KHÔNG tự tin báo "đã cấp, xong"

Điểm thiết kế quan trọng nhất, không phải phần hiển nhiên (vẽ hai dòng trạng
thái + nút mở System Settings):

**Chỉ nhắc khởi động lại khi phát hiện quyền CHUYỂN từ chưa cấp sang đã cấp
TRONG PHIÊN NÀY** (`grantedDuringSession`, theo dõi bằng ref, không phải state
suy ra từ status hiện tại). Nếu quyền đã đủ ngay từ lúc mở cửa sổ — ví dụ
người dùng tự mở lại từ Cài đặt chỉ để xem — tiến trình hiện tại hẳn đã khởi
động với quyền đó rồi, không có gì cần khởi động lại. Nhắc khởi động lại vô
điều kiện mỗi lần trạng thái là "đã cấp" sẽ phiền không cần thiết ở đúng
trường hợp phổ biến nhất (mở lại để kiểm tra).

Đây là hệ quả trực tiếp của phát hiện thực nghiệm ở ADR-0006/0007: **cấp
quyền cho tiến trình đang chạy sẵn không có tác dụng ngay**. Trạng thái
`granted` do `checkPermissions()` trả về có thể đúng ngay khi vừa cấp (OS ghi
nhận tức thì), nhưng `accessibility-helper`/`desktopCapturer` của tiến trình
đang chạy vẫn chưa chắc hoạt động đúng cho tới khi khởi động lại. Giao diện
phải phản ánh đúng sự khác biệt giữa "OS nói đã cấp" và "app này đã thực sự
sẵn sàng dùng nó".

## Kiến trúc

```
src/shared/types/permissions.ts       PermissionStatus, PermissionKind
src/main/permissions/permissions.service.ts
  checkPermissions()    tái dùng lệnh 'trusted' có sẵn của accessibility-helper
                         (ADR-0006) — không dựng thêm binary chỉ để hỏi quyền
  openPermissionPane()  mở ĐÚNG HAI url x-apple.systempreferences: đã hardcode,
                         không nhận url tuỳ ý từ renderer
  relaunchApp()          app.relaunch() + app.exit(0)
src/main/ipc/permissions.ipc.ts       permissions:check / openPane / relaunch,
                                       windows:openOnboarding
src/main/windows/onboarding.window.ts
src/main/bootstrap/init-windows.ts    thiếu quyền -> mở onboarding thay vì Cài đặt
src/renderer/windows/onboarding/
```

`openPermissionPane()` **không đi qua** `shell:openExternal` — kênh đó chỉ cho
phép `http:`/`https:` (`isSafeUrl()` trong `shell.ipc.ts`) và đúng vậy: nới
lỏng nó để nhận thêm scheme `x-apple.systempreferences:` sẽ mở một lỗ chung
cho một nhu cầu hẹp. Handler riêng chỉ mở đúng hai URL đã hardcode.

## Kiểm chứng E2E thật

Ba lượt gọi thật, không mock, qua đúng binary Electron production:

1. `checkPermissions()` trên máy đã cấp cả hai quyền (từ ADR-0006/0007) →
   `{"accessibility":true,"screenRecording":true}` — đúng.
2. `npm run build` (electron-vite build thật, không chỉ `tsc`) — bắt được lớp
   lỗi mà typecheck bỏ lọt: routing multi-page, CSP, import CSS. Ra đúng
   `onboarding-*.js` + `onboarding-*.css` thành chunk riêng.
3. Mở thật cửa sổ onboarding qua `BrowserWindow` + `webContents`, đọc DOM sau
   khi render: `h1` đúng chữ tiếng Việt thật ("Quyền hệ thống"), 0 lỗi
   console. Tình cờ bắt được cả **ca hỗn hợp** (một quyền có, một quyền
   chưa — do driver test chạy từ thư mục tạm khiến `accessibility-helper`
   không spawn được, còn Screen Recording qua thẳng `systemPreferences` nên
   không bị ảnh hưởng): badge và class `is-granted` render đúng riêng cho
   từng dòng, không lẫn lộn trạng thái giữa hai quyền.

## Phương án đã cân nhắc và loại bỏ

- **Luôn hiện nút "Khởi động lại" khi cả hai quyền đã cấp**, bất kể có vừa
  chuyển trạng thái hay không — đơn giản hơn để code, nhưng phiền ở đúng
  trường hợp người dùng mở lại chỉ để xem, vốn là lý do chính họ quay lại
  màn hình này sau lần đầu.
- **Poll định kỳ (setInterval) thay vì lắng nghe sự kiện `focus`** — tốn tài
  nguyên vô ích khi cửa sổ không phải là nơi trạng thái có thể đổi (trạng thái
  chỉ đổi khi người dùng rời sang System Settings rồi quay lại, đúng lúc cửa
  sổ nhận `focus`).
- **Chặn hẳn app nếu thiếu quyền** (không cho vào Cài đặt/dùng tính năng khác)
  — quá cứng nhắc; người dùng có thể muốn xem Cài đặt trước khi quyết định cấp
  quyền. Cửa sổ onboarding có nút "Để sau" đóng lại được, không khoá app.

## Đánh đổi đã chấp nhận

- Chỉ xây cho macOS. Windows (Phase 4, UI Automation) chưa có mô hình quyền
  tương đương để thiết kế theo — `checkPermissions()` trả `{true, true}`
  không điều kiện trên nền tảng khác, nhánh onboarding không bao giờ tự mở ở
  đó cho tới khi Phase 4 xác định rõ Windows có cần luồng tương tự không.
- Không phân biệt "chưa từng hỏi" với "đã từ chối" — cả hai đều hiện lại
  onboarding y hệt nhau ở lần khởi động sau. macOS không có API phân biệt hai
  trạng thái này cho Accessibility một cách đáng tin cậy.

## Xem lại khi

- Bắt đầu nhánh Windows (Phase 4) — quyết định UI Automation có cần màn hình
  xin quyền tương đương không, hay hoạt động không cần cấp quyền đặc biệt.
- Có phản hồi thực tế cho thấy nhắc khởi động lại theo kiểu
  "chuyển trạng thái trong phiên" bỏ sót ca thật (ví dụ quyền bị macOS âm thầm
  thu hồi giữa phiên) — cần thêm điều kiện phát hiện.
