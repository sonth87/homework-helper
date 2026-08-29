# Project Instructions for AI Agents

Quy tắc bắt buộc khi làm việc trong repo này. Đọc trước khi sửa code.

## 0. Repo này chứa HAI sản phẩm độc lập — xác định phạm vi trước khi sửa

```text
extension/   Chrome Extension MV3 · JavaScript ESM · không build step
desktop/     Desktop App (Electron) · TypeScript · [chưa khởi tạo]
```

**Hai app không chia sẻ một dòng code nào.** Chúng có version riêng, CHANGELOG riêng,
bộ locale riêng, chu kỳ phát hành riêng. Đây là quyết định kiến trúc đã chốt — xem
[roadmap/desktop-app-implementation-plan.md](./roadmap/desktop-app-implementation-plan.md) mục 3.

**Trước mọi thay đổi, xác định đang sửa app nào.** Mọi quy tắc bên dưới đều áp dụng
**riêng rẽ cho từng app**:

| | Extension | Desktop |
|---|---|---|
| Locale | `extension/shared/i18n/locales/*.js` | `desktop/src/shared/i18n/locales/*.ts` |
| Version | `package.json` + `extension/manifest.json` | `desktop/package.json` |
| CHANGELOG | `CHANGELOG-extension.md` | `CHANGELOG-desktop.md` |

> ⛔ **Cấm tuyệt đối:**
> - Bump version app này khi chỉ sửa app kia.
> - Ghi mục CHANGELOG vào file của app không bị ảnh hưởng.
> - Đồng bộ version giữa hai app cho "cho đẹp" — chúng **cố tình** lệch nhau.
> - Sửa file trong `extension/` khi đang làm task của desktop, và ngược lại.
>
> Nếu một thay đổi thật sự chạm cả hai app (hiếm — thường chỉ là tài liệu ở gốc repo),
> xử lý như **hai thay đổi riêng biệt**: bump riêng, ghi CHANGELOG riêng.

## 1. i18n — thêm text mới phải cập nhật đủ 13 locale

Áp dụng cho **cả hai app**, nhưng trên **hai bộ locale tách biệt**. 13 ngôn ngữ:
`en`, `vi`, `th`, `zh-CN`, `zh-TW`, `ja`, `ko`, `es`, `fr`, `de`, `pt`, `id`, `ru`.

> Thêm key vào locale của extension **không** tự động áp dụng cho desktop, và ngược lại.
> Hai bộ locale được phép khác nhau về nội dung (desktop có ngữ cảnh màn hình, extension
> có ngữ cảnh trang web). Không đồng bộ chéo trừ khi được yêu cầu rõ ràng.

### 1a. Extension

Xem đầy đủ tại [I18N-GUIDELINES.md](./I18N-GUIDELINES.md). Tóm tắt bắt buộc:

- Mỗi khi thêm/sửa **bất kỳ text hiển thị nào** (Options page, Sidepanel, content overlay...), phải thêm key đó vào **cả 13 file** trong `extension/shared/i18n/locales/`: `en`, `vi`, `th`, `zh-CN`, `zh-TW`, `ja`, `ko`, `es`, `fr`, `de`, `pt`, `id`, `ru`. Không được chỉ làm `vi.js`/`en.js` rồi dựa vào fallback `d.xxx || '...'` trong code — fallback đó là lưới an toàn khi thiếu sót, không phải cách làm đúng.
- Không hardcode text trực tiếp trong `.html`/JS template — luôn dùng `id` + `setText()`/`setAttribute()` trong `applyLanguageI18n()` (`extension/options/options.js`) hoặc `dict.xxx` khi render (sidepanel), để text đổi theo `uiLanguage`.
- Mỗi locale file có 2 khối riêng: `general` (dùng bởi Sidepanel qua `getI18n()`) và `options` (dùng bởi trang Options qua `getOptionsI18n()`). Nếu text xuất hiện ở cả 2 nơi, phải thêm key vào **cả 2 khối**.
- Nội dung tooltip/description sẽ được interpolate vào thuộc tính HTML (`data-tooltip-desc="${...}"`) — **không dùng dấu ngoặc kép thẳng `"..."` trong nội dung**, dùng ngoặc kép cong `"..."` (hoặc guillemets/dấu ngoặc phù hợp ngôn ngữ) để tránh vỡ HTML attribute.
- Trước khi coi là xong: `grep -c "keyName:" extension/shared/i18n/locales/*.js` phải ra đúng số khối đã dùng key đó (thường 2/file × 13 file), và `node --check` từng file locale đã sửa.

**Lưu ý tình trạng nợ kỹ thuật hiện tại (chỉ extension)**: tính năng Local AI Server (Ollama/LM Studio) — các key như `localPanelTitle`, `localVisionTag`, `btnAddLocalModel`... — hiện chỉ có ở `vi.js` và `en.js`, 11 locale còn lại đang fallback tiếng Anh. Đây là nợ có sẵn từ trước, chưa được dọn; đừng nhân bản kiểu thiếu sót này khi thêm tính năng mới.

### 1b. Desktop

- Locale nằm ở `desktop/src/shared/i18n/locales/*.ts`, **có type**: key sai hoặc locale
  thiếu key là **lỗi biên dịch**, không phải fallback im lặng.
- Dùng `t('key')`, không dùng chuỗi trực tiếp trong JSX.
- Mọi setting khai báo trong `desktop/config/settings/` **bắt buộc** có `i18n` key và
  đủ 13 bản dịch — `scripts/check-settings-i18n.ts` chặn build nếu thiếu.
- Kiểm tra trước khi coi là xong: `npx tsc --noEmit` trong `desktop/`.


## 2. Bump version sau mỗi thay đổi user-facing

**Version của hai app hoàn toàn độc lập.** Extension đang ở `1.6.1`; desktop chưa khởi
tạo (sẽ bắt đầu từ `0.1.0`). Chúng **không bao giờ** được đồng bộ với nhau.

### 2a. Bump ở đâu

| App | File phải sửa | Ràng buộc |
|---|---|---|
| **Extension** | `package.json` **và** `extension/manifest.json` | Hai file phải có giá trị **giống hệt nhau** |
| **Desktop** | `desktop/package.json` | Không liên quan tới hai file trên |

> `package.json` ở gốc repo là của **extension** (lịch sử để lại). Khi desktop ra đời,
> nó dùng `desktop/package.json` riêng — **đừng nhầm hai file này**.

### 2b. Khi nào bump

- **Patch** (`1.6.1` → `1.6.2`): sửa lỗi, tinh chỉnh nhỏ, thêm tooltip/copy.
- **Minor** (`1.6.1` → `1.7.0`): tính năng mới, thay đổi UI đáng kể.
- **Major**: phá vỡ tương thích ngược (hiếm).
- **Không bump**: sửa docs, refactor không đổi hành vi, thêm test.

### 2c. Một lần bump patch cho mỗi phiên chưa commit

Nếu nhiều thay đổi user-facing mức patch xảy ra liên tiếp trong cùng một phiên làm việc
mà code **chưa được commit**, chỉ bump patch **một lần duy nhất** cho phiên đó
(ví dụ `1.6.1` → `1.6.2`) — không bump tiếp lên `1.6.3`, `1.6.4`... cho từng fix nhỏ.

**Mốc để được bump thêm một lần patch nữa là code đã COMMIT** — không phải mỗi khi xong
một task.

Nếu trong cùng phiên chưa commit đó xuất hiện thay đổi đủ lớn để tính là **minor**, vẫn
bump minor bình thường (`1.6.x` → `1.7.0`) — bump minor này **nuốt luôn** phần patch đã
bump trước đó trong phiên, không giữ cả hai mốc.

> Quy tắc "một lần patch mỗi phiên" tính **riêng cho từng app**. Một phiên sửa cả hai app
> có thể bump patch cho extension **và** patch cho desktop — đó là hai lần bump độc lập,
> không vi phạm quy tắc.

### 2d. Vì sao bắt buộc

Chrome Web Store yêu cầu version tăng giữa các lần nộp gói — quên bump sẽ bị reject khi
upload `homework-helper.zip` (xem `dev/extension/development.md` mục 4). Desktop có ràng buộc
tương tự với auto-update.

### 2e. Cây quyết định

```text
Thay đổi có ảnh hưởng người dùng không?
├── KHÔNG (docs, refactor, test) → KHÔNG bump. Dừng.
└── CÓ
     ├── Đang sửa app nào?  → chỉ bump version của ĐÚNG app đó
     └── Phiên này đã bump cho app đó mà CHƯA COMMIT chưa?
          ├── Rồi + thay đổi này là patch  → KHÔNG bump nữa
          ├── Rồi + thay đổi này là MINOR  → bump minor (nuốt patch cũ)
          └── Chưa                          → bump theo loại

Sau khi bump → BẮT BUỘC ghi CHANGELOG (mục 3).
```

## 3. CHANGELOG — mỗi lần bump phải kèm một mục

**Bump version mà không ghi CHANGELOG là thiếu sót, không phải tuỳ chọn.** Đây là nguồn
duy nhất để viết "What's New" khi nộp Chrome Web Store và để người dùng biết vì sao nên
cập nhật.

### 3a. Hai file tách biệt

| App | File |
|---|---|
| Extension | [`CHANGELOG-extension.md`](./CHANGELOG-extension.md) |
| Desktop | [`CHANGELOG-desktop.md`](./CHANGELOG-desktop.md) |

Không gộp chung. Gộp sẽ tạo ra thứ vô nghĩa: người đọc không biết `1.7.0` là của app nào.

### 3b. Định dạng (Keep a Changelog)

Nhóm theo **tác động tới người dùng**, không theo commit:

```markdown
## [1.7.0] — 2026-09-05

### Thêm mới
- Dịch nhanh khi rê chuột, tuỳ chỉnh được phím bổ trợ và mức chi tiết.

### Thay đổi
- …

### Sửa lỗi
- …
```

Viết bằng ngôn ngữ người dùng hiểu được — `sửa lỗi thẻ lời giải bị che khi cuộn trang`,
**không** phải `refactor floating-card.js`.

### 3c. Quy tắc

- Mục mới thêm vào **đầu file**, ngay dưới `## [Unreleased]`.
- Ngày theo định dạng `YYYY-MM-DD`.
- Version trong CHANGELOG phải **khớp chính xác** version vừa bump ở mục 2.
- Chỉ ghi vào CHANGELOG của **app bị ảnh hưởng**.

## 4. Định nghĩa hoàn thành

Trước khi báo cáo xong một thay đổi, đối chiếu bảng này:

| Loại thay đổi | Bump | CHANGELOG | 13 locale | Tài liệu |
|---|---|---|---|---|
| Tính năng mới | **minor** | ✅ | ✅ nếu có text | ✅ `docs/` |
| Sửa lỗi hành vi | **patch** | ✅ | — | nếu đổi cách dùng |
| Thêm/đổi setting | patch* | ✅ | ✅ | ✅ configuration |
| Thêm provider AI | **minor** | ✅ | ✅ | ✅ api-setup |
| Đổi text UI | **patch** | nếu đáng kể | ✅ **bắt buộc** | nếu đổi nghĩa |
| Refactor không đổi hành vi | ❌ | ❌ | ❌ | nếu đổi cấu trúc |
| Sửa tài liệu / thêm test | ❌ | ❌ | ❌ | — |

\* minor nếu setting đó mở ra một tính năng mới.

**Ba điều luôn đúng:**
1. Bump version → **luôn** kèm mục CHANGELOG của đúng app đó.
2. Thêm text hiển thị → **luôn** đủ 13 locale của đúng app đó.
3. Mọi thao tác trên đều giới hạn trong **một** app. Không lan sang app kia.

## Tài liệu liên quan khác

### Extension (hiện hành)
- [docs/architecture.md](./dev/extension/architecture.md) — kiến trúc tổng thể, luồng Shadow DOM & Routing.
- [docs/development.md](./dev/extension/development.md) — sổ tay mở rộng provider/OCR + lệnh đóng gói.
- [I18N-GUIDELINES.md](./I18N-GUIDELINES.md) — chi tiết đầy đủ quy tắc i18n (mục 1a chỉ là tóm tắt).
- [CHANGELOG-extension.md](./CHANGELOG-extension.md) — lịch sử phát hành.

### Desktop (đang lập kế hoạch)
- [roadmap/desktop-app.md](./roadmap/desktop-app.md) — đặc tả gốc (pipeline dịch màn hình).
- [roadmap/desktop-app-implementation-plan.md](./roadmap/desktop-app-implementation-plan.md) — kế hoạch, lộ trình, rủi ro.
- [roadmap/desktop-app-structure.md](./roadmap/desktop-app-structure.md) — cấu trúc mã nguồn, registry, config/env, chống god file.
- [CHANGELOG-desktop.md](./CHANGELOG-desktop.md) — lịch sử phát hành.

### Chung
- [roadmap/documentation-plan.md](./roadmap/documentation-plan.md) — kiến trúc tài liệu cho ba đối tượng đọc.
- [roadmap/known-issues.md](./roadmap/known-issues.md) — vấn đề đã biết ảnh hưởng cả hai app, chờ quay lại bàn (chat thiếu ngữ cảnh, thiếu cache).
