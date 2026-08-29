# Tôi muốn sửa X — vào file nào?

Bản đồ tra cứu từ **ý định** sang **file cần sửa**. Mục đích: khỏi phải đọc lại toàn bộ
kiến trúc mỗi lần chỉ muốn đổi một thứ nhỏ.

> **Cách đọc bảng:** cột "Sửa ở đâu" liệt kê **đầy đủ** các file phải chạm, theo thứ tự.
> Nếu bạn chỉ sửa một phần trong danh sách, thay đổi sẽ không có tác dụng hoặc gây lệch.

Tài liệu liên quan: [architecture.md](extension/architecture.md) · [development.md](extension/development.md) · [CLAUDE.md](../CLAUDE.md)

---

# Extension

## Text & ngôn ngữ

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Đổi chữ trong trang **Cài đặt** | `extension/options/options.html` (thêm `id`) → `options/options.js` trong `applyLanguageI18n()` (`setText`) → **13 locale**, khối `options` |
| Đổi chữ trong **Sidepanel / Chat Drawer** | **13 locale**, khối `general` |
| Đổi chữ **popup** khi bấm icon | **13 locale**, khối `popup` |
| Đổi chữ **thanh công cụ bôi đen** | **13 locale**, khối `selectionTooltip` |
| Đổi chữ **lớp khoanh vùng chụp ảnh** | **13 locale**, khối `cropper` |
| Đổi chữ **thẻ lời giải nổi** | **13 locale**, khối `floatingPopup` |
| Đổi chữ **tooltip dịch khi rê chuột** | **13 locale**, khối `hoverTranslate` |
| Thêm ngôn ngữ giao diện thứ 14 | `shared/i18n/locales/<mã>.js` (mới) → `shared/i18n.js` (import + `LOCALES`) → `shared/storage.js` (`SUPPORTED_LANGUAGES`) → `options/options.html` (dropdown) |

→ Quy trình đầy đủ: skill `add-i18n-key`, hoặc [I18N-GUIDELINES.md](../I18N-GUIDELINES.md)

## AI & mô hình

| Muốn làm gì | Sửa ở đâu |
|---|---|
| **Thêm provider AI** | `shared/storage.js` (`DEFAULT_PROVIDERS`) → `background/ai-engine.js` (định tuyến) → `offscreen/ai-stream.js` (hàm stream) → `extension/manifest.json` (`host_permissions`) → 13 locale |
| Đổi **chiến lược định tuyến** | `background/ai-engine.js` — biến `routingStrategy` |
| Đổi **xoay vòng key / cooldown khi lỗi** | `background/key-rotator.js` — `getHealthyConfigs()` |
| Đổi cách gọi **Gemini Nano** | `background/ai-engine.js` (`streamChromeBuiltin`) + `shared/nano-status.js` |
| Đổi phát hiện **Ollama / LM Studio** | `shared/local-model-detect.js` + `background/service-worker.js` (`DETECT_LOCAL_MODELS`) |
| Đổi **prompt giải bài** | `shared/study-prompt.js` |
| Đổi **system prompt mặc định** | `shared/storage.js` — `DEFAULT_SYSTEM_PROMPT`, `DEFAULT_NANO_SYSTEM_PROMPT` |
| Đổi **định dạng tra từ điển** | `shared/dictionary.js` — `DICTIONARY_SCHEMA` |
| Bật/tắt **thinking** theo provider | `shared/thinking-control.js` |

## Giao diện trên trang web

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Đổi **thẻ lời giải nổi** | `content/overlay/floating-card.js` + `content/styles/overlay.css` |
| Đổi **chat drawer** | `content/overlay/drawer.js` (+ `drawer-history.js`) + `content/styles/overlay.css` |
| Đổi **nút nổi (FAB)** | `content/overlay/fabs.js` + `content/styles/overlay.css` |
| Đổi **thanh công cụ bôi đen** | `content/selection-tooltip.js` + `content/styles/tooltip.css` |
| Đổi **nút nào có trên thanh công cụ** | `shared/toolbar-items.js` — `TOOLBAR_ITEM_IDS`, `TOOLBAR_ITEM_ICONS`, `DEFAULT_TOOLBAR_LAYOUT` |
| Đổi **tooltip dịch khi rê chuột** | `content/hover-translate.js` + `content/styles/tooltip.css` |
| Đổi **lớp khoanh vùng chụp ảnh** | `content/cropper.js` + `content/styles/cropper.css` |
| Đổi **cách chụp màn hình** | `content/cropper.js` → `background/service-worker.js` (`CAPTURE_VISIBLE_TAB`) |
| Đổi **cô lập Shadow DOM** | `content/shadow-root.js` |
| Đổi **thứ tự nạp script trên trang** | `content/loader.js` + `content/index.js` |
| Thêm **icon SVG** | `shared/icons.js` |

## Trắc nghiệm & Google Forms

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Đổi cách nhận diện câu hỏi Forms | `content/forms-adapter.js` — selector `div[role="listitem"]`, `.Qr7Oae`, `.geS5n` |
| Đổi hành vi nút **AI Solve** | `content/forms-adapter.js` |
| Bật/tắt adapter | `shared/storage.js` — `enableFormsAdapter` |

## OCR

| Muốn làm gì | Sửa ở đâu |
|---|---|
| **Thêm ngôn ngữ OCR** | `shared/ocr-engine.js` (`OCR_MODEL_CATALOG`) → `extension/assets/ocr/<mã>.traineddata` → 13 locale |
| Đổi luồng chạy OCR | `shared/ocr-engine.js` → `offscreen/ocr.js` → `background/ocr-bridge.js` |
| Đổi model đi kèm sẵn | `shared/storage.js` — `installedOcrModels` + `extension/assets/ocr/` |

## Cấu hình & lưu trữ

| Muốn làm gì | Sửa ở đâu |
|---|---|
| **Thêm một setting** | `shared/storage.js` (`DEFAULT_SETTINGS`) → `options/options.html` (control) → `options/tabs/<tab>.js` (đọc/ghi) → `options/options.js` (`applyLanguageI18n`) → 13 locale |
| Đổi **tab nào trong Cài đặt** | `options/options.html` + `options/options.js` + `options/tabs/` |
| Đổi **tooltip giải thích** trong Cài đặt | `options/options-tooltips.js` + 13 locale (khối `options`) |
| Đổi **lịch sử hội thoại** | `shared/storage.js` — `conversations`, `activeConversationId` |
| Đổi **giới hạn 50 hội thoại** | `shared/storage.js` |

## Vỏ extension

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Đổi **phím tắt** | `extension/manifest.json` — khối `commands` |
| Đổi **quyền** | `extension/manifest.json` — `permissions`, `host_permissions` |
| Đổi **menu chuột phải** | `background/service-worker.js` — `contextMenus` |
| Thêm **loại message mới** | `background/service-worker.js` — thêm nhánh `action === '...'` |
| Đổi **sidepanel** | `sidepanel/sidepanel.js` + `sidepanel.html` + `sidepanel.css` |
| Đổi **render markdown / công thức** | `shared/markdown-katex.js` |
| Đổi **đóng gói bản phát hành** | `build-zip.js` |

---

# Desktop

> ⚠️ Chưa khởi tạo. Bảng dưới theo thiết kế tại
> [desktop-app-structure.md](../roadmap/desktop-app-structure.md) — cập nhật lại khi code thật.

| Muốn làm gì | Sửa ở đâu |
|---|---|
| **Thêm một setting** | `desktop/config/settings/<nhóm>.settings.ts` + 13 locale — **chỉ vậy** |
| **Thêm provider AI** | `src/main/ai/providers/<tên>/` (thư mục mới) + một dòng ở `providers/index.ts` |
| **Thêm tính năng AI** (tóm tắt, viết lại…) | `config/intents.config.ts` + một prompt builder ở `main/ai/prompt/` |
| Đổi **phím tắt mặc định** | `config/hotkeys.config.ts` |
| Thêm **kênh IPC** | `src/shared/ipc/channels.ts` + handler ở `src/main/ipc/` |
| Đổi **giao diện overlay** | `src/renderer/windows/<loại>/` + `config/theme.config.ts` |
| Đổi **cách lấy text từ màn hình** | `src/main/acquisition/accessibility/` hoặc `ocr/` |
| Đổi **model OCR** | `config/ocr.config.ts` |
| Đổi **timeout / retry / debounce** | `config/limits.config.ts` |
| Thêm **bảng dữ liệu** | `src/main/db/migrations/` + `db/repositories/` |
| Đổi **văn bản UI** | `src/shared/i18n/locales/*.ts` (13 file `.ts`, có type) |

---

# So sánh — và vì sao desktop tổ chức khác

Cùng một việc, số nơi phải chạm:

| Việc | Extension | Desktop |
|---|---|---|
| Thêm một setting | **5 nơi** + 13 locale | **1 file** + 13 locale |
| Thêm provider AI | **4 nơi** + 13 locale | **1 thư mục + 1 dòng** |
| Thêm tính năng AI | rải rác nhiều file | **1 entry** + 1 prompt builder |

Chênh lệch này không phải vì extension viết tệ — nó là kết quả của việc **chưa có
tầng khai báo tập trung**. Desktop sinh ra sau nên đưa mỗi khái niệm về một registry
duy nhất ngay từ đầu.

> **Bảng này cũng là thước đo chất lượng kiến trúc.** Nếu một dòng liệt kê quá 3 file,
> đó là dấu hiệu khái niệm đó chưa được khai báo tập trung — đáng cân nhắc gom lại.
