---
name: add-i18n-key
description: Thêm hoặc sửa chuỗi hiển thị (text UI) trong repo này. Dùng khi thêm bất kỳ text nào lên giao diện — nhãn, nút, tooltip, placeholder, thông báo lỗi, tiêu đề — ở extension hoặc desktop app. Bảo đảm đủ 13 locale, đúng khối, và nối đúng vào UI. Dùng cả khi chỉ SỬA text đã có.
---

# Thêm / sửa chuỗi hiển thị đa ngôn ngữ

13 ngôn ngữ: `en` `vi` `th` `zh-CN` `zh-TW` `ja` `ko` `es` `fr` `de` `pt` `id` `ru`

> Fallback `d.xxx || '...'` trong code là **lưới an toàn khi sơ suất, không phải cách
> làm đúng**. Thiếu locale nghĩa là người dùng ngôn ngữ đó thấy tiếng Anh.

---

## Bước 0 — Xác định app (BẮT BUỘC, làm trước tiên)

| App | Thư mục locale | Định dạng |
|---|---|---|
| **Extension** | `extension/shared/i18n/locales/*.js` | JavaScript, 13 file |
| **Desktop** | `desktop/src/shared/i18n/locales/*.ts` | TypeScript, 13 file |

⛔ Hai bộ locale **tách biệt hoàn toàn**. Thêm key cho extension **không** áp dụng cho
desktop và ngược lại. Không đồng bộ chéo trừ khi được yêu cầu rõ ràng.

Nếu desktop chưa được khởi tạo → chỉ làm phần extension.

---

## Bước 1 — Xác định khối

Mỗi file locale có **7 khối**. Chọn sai khối thì key sẽ không bao giờ được đọc tới.

| Khối | Getter | Dùng ở |
|---|---|---|
| `general` | `getI18n()` | Sidepanel, Chat Drawer, lịch sử hội thoại, modal key |
| `options` | `getOptionsI18n()` | Trang Cài đặt (`extension/options/`) |
| `popup` | `getPopupI18n()` | Popup khi bấm icon extension |
| `selectionTooltip` | `getSelectionTooltipI18n()` | Thanh công cụ khi bôi đen text |
| `cropper` | `getCropperI18n()` | Lớp phủ khoanh vùng chụp ảnh |
| `floatingPopup` | `getFloatingPopupI18n()` | Thẻ lời giải nổi trên trang |
| `hoverTranslate` | `getHoverTranslateI18n()` | Tooltip dịch khi rê chuột |

> **Text xuất hiện ở hai nơi thì phải thêm vào CẢ HAI khối.** Ví dụ nhãn "Dịch" có ở
> cả thanh bôi đen lẫn trang Cài đặt → thêm vào `selectionTooltip` **và** `options`.

Kiểm tra khối nào đang có key tương tự:

```bash
grep -n "tenKeyGanGiong" extension/shared/i18n/locales/en.js
```

---

## Bước 2 — Thêm key vào đủ 13 file

Bắt đầu từ `en.js` (locale tham chiếu), rồi 12 file còn lại. Đặt key **cạnh các key
cùng nhóm chức năng**, không nhét cuối khối.

**Quy tắc nội dung — vi phạm sẽ làm vỡ HTML:**

Nội dung tooltip/description được nội suy vào thuộc tính HTML
(`data-tooltip-desc="${...}"`). Vì vậy:

- ⛔ **Cấm dấu ngoặc kép thẳng `"..."` trong nội dung chuỗi.**
- ✅ Dùng ngoặc kép cong `"..."`, guillemets `«...»`, hoặc dấu phù hợp ngôn ngữ
  (`„..."` cho tiếng Đức, `「...」` cho tiếng Nhật).

**Dịch thật, đừng chép tiếng Anh.** Script ở bước 5 sẽ cảnh báo key nào còn nguyên
tiếng Anh. Ngoại lệ hợp lệ: tên phím (`Alt`, `Ctrl`, `Shift`, `Meta`), tên thương hiệu,
và những từ trùng nhau tự nhiên giữa các ngôn ngữ.

---

## Bước 3 — Nối vào UI

### Extension — trang Cài đặt (`options`)

Ba việc, thiếu một là text không đổi theo ngôn ngữ:

```html
<!-- 1. HTML: phải có id -->
<h3 class="opt-card-title" id="optMyNewTitle">My New Section</h3>
```

```javascript
// 2. extension/options/options.js — bên trong applyLanguageI18n()
setText('optMyNewTitle', dict.myNewTitle);
// dùng setHtml() nếu nội dung có thẻ HTML
```

```javascript
// 3. Locale (cả 13 file), trong khối `options`
myNewTitle: "My New Section",
```

⛔ **Không hardcode text trong `.html`** — nó sẽ không đổi khi người dùng chuyển ngôn ngữ.

### Extension — các khối khác

Lấy dict rồi dùng `dict.key` khi render:

```javascript
import { getSelectionTooltipI18n } from '../shared/i18n.js';
const dict = getSelectionTooltipI18n(uiLanguage);
button.textContent = dict.btnTranslate;
```

### Desktop

```tsx
const { t } = useI18n();
<h3>{t('myNewTitle')}</h3>
```

Key sai hoặc locale thiếu key = **lỗi biên dịch**, không phải fallback im lặng.

---

## Bước 4 — Kiểm tra cú pháp

```bash
# Extension — chạy cho TỪNG file locale đã sửa
node --check extension/shared/i18n/locales/vi.js

# Desktop
cd desktop && npx tsc --noEmit
```

---

## Bước 5 — Kiểm tra đồng bộ (BẮT BUỘC, không được bỏ)

```bash
# Kiểm tra đúng key vừa thêm
node scripts/check-i18n-parity.mjs --key=myNewTitle

# Kết quả mong đợi:
# ✓ Key "myNewTitle" có đủ ở 13 locale, khối: options
```

Script bắt được hai lỗi mà mắt thường bỏ sót: key thiếu ở một số locale, và key có
nhưng giá trị còn nguyên tiếng Anh.

Kiểm tra toàn bộ repo:

```bash
node scripts/check-i18n-parity.mjs
```

> ⚠️ Repo hiện **đã có sẵn nợ**: 63 key thiếu (chủ yếu là các key tooltip `*Desc` chỉ
> có ở `en`, `vi`, `th`, `zh-CN`) và ~128 key chưa dịch. Khi chạy toàn bộ, hãy đối
> chiếu để chắc chắn con số **không tăng thêm** vì thay đổi của bạn. Đừng nhận nợ cũ
> là lỗi của mình, và cũng đừng nhân bản kiểu thiếu sót đó.

---

## Bước 6 — Bump version & CHANGELOG

Thêm/sửa text hiển thị **là thay đổi user-facing** → phải bump.

- Extension: `package.json` + `extension/manifest.json` (giá trị **giống hệt nhau**)
- Desktop: `desktop/package.json`
- Kèm mục trong CHANGELOG của **đúng app đó**

Xem [CLAUDE.md](../../../CLAUDE.md) mục 2 và 3. Lưu ý quy tắc **một lần bump patch cho
mỗi phiên chưa commit** — nếu phiên này đã bump rồi thì không bump nữa.

---

## Checklist trước khi báo cáo xong

- [ ] Đã xác định đúng app (extension hay desktop)
- [ ] Đã chọn đúng khối — và **cả hai khối** nếu text dùng ở hai nơi
- [ ] Key có mặt ở đủ **13** file locale
- [ ] Nội dung **đã dịch thật**, không chép tiếng Anh
- [ ] Không có dấu `"` thẳng trong nội dung tooltip/description
- [ ] HTML có `id` + `setText()` trong `applyLanguageI18n()` (nếu là trang Options)
- [ ] `node --check` sạch cho từng file đã sửa
- [ ] `node scripts/check-i18n-parity.mjs --key=<key>` báo ✓
- [ ] Đã bump version + ghi CHANGELOG của đúng app

---

## Cạm bẫy thường gặp

| Triệu chứng | Nguyên nhân |
|---|---|
| Text hiện tiếng Anh dù đã đổi ngôn ngữ | Thiếu key ở locale đó, hoặc quên `setText()` |
| Text không đổi khi chuyển ngôn ngữ | Hardcode trong HTML, không có `id` |
| Đổi ngôn ngữ xong text bị mất | `setText()` gọi với `id` sai → `dict.key` là `undefined` |
| Tooltip vỡ giao diện, HTML lộ ra | Dùng dấu `"` thẳng trong nội dung |
| Key thêm rồi mà không hiển thị | Thêm nhầm khối (`general` thay vì `options`) |
