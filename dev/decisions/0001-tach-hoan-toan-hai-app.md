# ADR-0001: Tách hoàn toàn extension và desktop, không có lõi dùng chung

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-29

## Bối cảnh

Repo đang có một Chrome Extension MV3 (~12.500 dòng JavaScript) đã phát hành tới `1.6.1`.
Kế hoạch bổ sung một Desktop App (Electron) mang gần như toàn bộ tính năng đó sang môi
trường desktop: giải bài tập, tóm tắt, giải thích, chat, OCR, định tuyến AI đa provider,
13 ngôn ngữ giao diện.

Khảo sát cho thấy khoảng **75% logic nghiệp vụ có giá trị tham chiếu**: 13 file locale
(7.785 dòng), bộ render markdown/KaTeX, key rotator, study prompt, dictionary schema —
tất cả đều không chạm tới Chrome API. Điều này gợi ý một `packages/core` dùng chung.

## Quyết định

**Hai app hoàn toàn độc lập trong cùng một repo. Không có package lõi dùng chung, không
có workspace, không import lẫn nhau.** Chúng chỉ kế thừa tư tưởng: cùng mô hình cấu hình,
cùng 5 study mode, cùng 13 ngôn ngữ, cùng triết lý giao diện Liquid Glass.

Sửa một prompt hay thêm một locale key là **sửa ở cả hai nơi, có chủ đích**.

## Phương án đã cân nhắc và loại bỏ

**Một `packages/core` dùng chung.** Loại bỏ vì lõi đó sẽ phải trừu tượng hoá qua sáu
khác biệt nền tảng cùng lúc:

| | Extension | Desktop |
|---|---|---|
| Nguồn nội dung | DOM (có cấu trúc, có ngữ nghĩa) | Pixel + Accessibility tree (phẳng, nhiễu) |
| Đơn vị làm việc | `Range`, `Node`, `Element` | `Rect`, `Point`, `ImageBuffer` |
| Vòng đời | service worker bị kill sau 30s | process sống suốt phiên |
| Bảo mật | CSP của MV3, không truy cập file | full Node, keychain, SQLite |
| Giao diện | Shadow DOM chèn vào trang lạ | `BrowserWindow` mình sở hữu |
| Model on-device | Gemini Nano | Ollama / LM Studio |

Cái giá là **mỗi thay đổi phải cân nhắc "có vỡ bên kia không"** — đắt hơn nhiều so với
việc sửa hai chỗ một cách tường minh.

**Một app đa target** (extension là build target của desktop). Loại bỏ vì trói buộc quá
chặt; MV3 và Electron có ràng buộc khác nhau về bản chất.

## Hệ quả

- Mỗi app được tối ưu triệt để cho môi trường của nó. Desktop không mang theo bất kỳ
  giới hạn nào của MV3; extension không phải chờ desktop.
- Version, CHANGELOG, chu kỳ phát hành, bộ locale — tất cả đều riêng. Xem
  [CLAUDE.md](../../CLAUDE.md) mục 0.
- Desktop được tự do dùng TypeScript mà không kéo theo build step cho extension
  (xem [ADR-0002](./0002-desktop-dung-typescript.md)).
- Giá trị tái sử dụng thực tế giảm từ ~75% xuống **40–45%** (chủ yếu là locale, CSS,
  prompt, thuật toán).

## Đánh đổi đã chấp nhận

| Đánh đổi | Cách kiểm soát |
|---|---|
| 13 locale tồn tại hai bản, có thể trôi khỏi nhau | Script cảnh báo key lệch, **không ép đồng bộ** |
| Sửa study prompt phải sửa hai nơi | Hai bản prompt **được phép khác nhau** — desktop có ngữ cảnh ảnh màn hình, extension có ngữ cảnh trang web |
| Provider catalog trùng lặp | Chấp nhận — desktop bỏ `chrome-builtin`, thêm cấu hình riêng cho Ollama/LM Studio |
| Sửa lỗi logic chung phải sửa hai lần | Chấp nhận có ý thức; đây là ranh giới sản phẩm, không phải nợ kỹ thuật |

## Xem lại khi

Chi phí đồng bộ vượt quá chi phí trừu tượng hoá — cụ thể: khi có **ba lần trở lên** một
lỗi giống hệt nhau phải sửa ở cả hai app trong cùng một quý. Khi đó cân nhắc tách một
package hẹp cho **đúng phần đã chứng minh là ổn định**, không phải tách lại toàn bộ lõi.
