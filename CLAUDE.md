# Project Instructions for AI Agents

Quy tắc bắt buộc khi làm việc trong repo này. Đọc trước khi sửa code.

## 1. i18n — thêm text mới phải cập nhật đủ 13 locale

Xem đầy đủ tại [I18N-GUIDELINES.md](./I18N-GUIDELINES.md). Tóm tắt bắt buộc:

- Mỗi khi thêm/sửa **bất kỳ text hiển thị nào** (Options page, Sidepanel, content overlay...), phải thêm key đó vào **cả 13 file** trong `extension/shared/i18n/locales/`: `en`, `vi`, `th`, `zh-CN`, `zh-TW`, `ja`, `ko`, `es`, `fr`, `de`, `pt`, `id`, `ru`. Không được chỉ làm `vi.js`/`en.js` rồi dựa vào fallback `d.xxx || '...'` trong code — fallback đó là lưới an toàn khi thiếu sót, không phải cách làm đúng.
- Không hardcode text trực tiếp trong `.html`/JS template — luôn dùng `id` + `setText()`/`setAttribute()` trong `applyLanguageI18n()` (`extension/options/options.js`) hoặc `dict.xxx` khi render (sidepanel), để text đổi theo `uiLanguage`.
- Mỗi locale file có 2 khối riêng: `general` (dùng bởi Sidepanel qua `getI18n()`) và `options` (dùng bởi trang Options qua `getOptionsI18n()`). Nếu text xuất hiện ở cả 2 nơi, phải thêm key vào **cả 2 khối**.
- Nội dung tooltip/description sẽ được interpolate vào thuộc tính HTML (`data-tooltip-desc="${...}"`) — **không dùng dấu ngoặc kép thẳng `"..."` trong nội dung**, dùng ngoặc kép cong `"..."` (hoặc guillemets/dấu ngoặc phù hợp ngôn ngữ) để tránh vỡ HTML attribute.
- Trước khi coi là xong: `grep -c "keyName:" extension/shared/i18n/locales/*.js` phải ra đúng số khối đã dùng key đó (thường 2/file × 13 file), và `node --check` từng file locale đã sửa.

**Lưu ý tình trạng nợ kỹ thuật hiện tại**: tính năng Local AI Server (Ollama/LM Studio) — các key như `localPanelTitle`, `localVisionTag`, `btnAddLocalModel`... — hiện chỉ có ở `vi.js` và `en.js`, 11 locale còn lại đang fallback tiếng Anh. Đây là nợ có sẵn từ trước, chưa được dọn; đừng nhân bản kiểu thiếu sót này khi thêm tính năng mới.

## 2. Bump version sau mỗi thay đổi user-facing

Repo này **chưa từng bump version** (`package.json` và `extension/manifest.json` đều đứng yên ở `1.0.0` qua rất nhiều tính năng đã ship) — quy tắc dưới đây áp dụng từ giờ trở đi:

- Sau khi hoàn thành một thay đổi **user-facing** (tính năng mới, sửa lỗi ảnh hưởng hành vi, đổi nội dung UI...), phải bump field `"version"` ở **cả 2 file**, giữ giá trị giống hệt nhau:
  - `package.json`
  - `extension/manifest.json`
- Quy tắc semver đơn giản:
  - Patch (`1.0.0` → `1.0.1`): sửa lỗi, tinh chỉnh nhỏ, thêm tooltip/copy.
  - Minor (`1.0.0` → `1.1.0`): tính năng mới, thay đổi UI đáng kể.
  - Major: thay đổi phá vỡ tương thích ngược (hiếm khi cần trong extension này).
- **Một lần bump patch cho mỗi phiên chưa commit**: nếu nhiều thay đổi user-facing (nhỏ, ở mức patch) xảy ra liên tiếp trong cùng một phiên làm việc mà code **chưa được commit**, chỉ bump patch **một lần duy nhất** cho phiên đó (ví dụ `1.2.8` → `1.2.9`) — không bump tiếp lên `1.2.10`, `1.2.11`... cho từng fix nhỏ tiếp theo trong cùng phiên. Mốc để "được bump thêm một lần patch nữa" là code đã **commit** (không phải mỗi khi xong một task).
  - Nếu trong cùng phiên chưa commit đó xuất hiện một thay đổi đủ lớn để tính là **minor**, vẫn bump minor bình thường (`1.2.x` → `1.3.x`) — bump minor này thay thế/nuốt luôn phần patch đã bump trước đó trong phiên, không cần giữ cả hai mốc.
- **Không bump** cho thay đổi thuần nội bộ không ảnh hưởng người dùng: sửa docs, refactor không đổi hành vi, thêm test.
- Chrome Web Store bắt buộc version tăng giữa các lần nộp gói — quên bump sẽ bị reject khi upload `homework-helper.zip` (xem `docs/development.md` mục 4 để đóng gói).

## Tài liệu liên quan khác

- [docs/architecture.md](./docs/architecture.md) — kiến trúc tổng thể, luồng Shadow DOM & Routing.
- [docs/development.md](./docs/development.md) — sổ tay mở rộng provider/OCR + lệnh đóng gói.
- [I18N-GUIDELINES.md](./I18N-GUIDELINES.md) — chi tiết đầy đủ quy tắc i18n (mục 1 ở trên chỉ là tóm tắt).
