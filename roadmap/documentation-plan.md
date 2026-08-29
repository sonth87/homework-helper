# Kiến trúc Tài liệu — Ba Đối tượng, Hai Sản phẩm

> Tài liệu thứ ba trong bộ kế hoạch, cùng với
> [desktop-app-implementation-plan.md](./desktop-app-implementation-plan.md) và
> [desktop-app-structure.md](./desktop-app-structure.md).
> Phạm vi: **cả extension lẫn desktop**, vì hệ thống tài liệu là thứ duy nhất
> hai app nên dùng chung quy ước (dù nội dung vẫn tách riêng).

---

# 1. Hiện trạng và bảy khoảng trống

Repo hiện có 16 file tài liệu, chất lượng nội dung tốt. Vấn đề nằm ở **cấu trúc và
tính đồng bộ**, không phải ở nội dung.

```text
README.md                  ← trộn 3 đối tượng đọc trong một file
CLAUDE.md                  ← luật cho AI agent  ⚠ có thông tin SAI (mục 1.1)
I18N-GUIDELINES.md         ← luật cho AI agent, chồng lấn CLAUDE.md §1
docs/  (14 file)           ← trộn tài liệu người dùng + kỹ thuật + published site
roadmap/ (3 file)          ← kế hoạch tương lai  ✅ nhánh duy nhất đang sạch
```

| # | Khoảng trống | Mức |
|---|---|---|
| 1 | **`CLAUDE.md` §2 nói sai sự thật** về lịch sử version (mục 1.1) | 🔴 |
| 2 | **Không có `CHANGELOG`** dù đã phát hành ~18 phiên bản (1.1.0 → 1.6.1) | 🔴 |
| 3 | Không có tài liệu nào cho **desktop app** ngoài kế hoạch | 🔴 |
| 4 | Không có `.claude/skills/` — mọi quy tắc lặp lại đều phải đọc thủ công | 🟠 |
| 5 | `docs/` trộn 3 đối tượng đọc, lại vừa là **site công khai** (`.nojekyll`, `privacy-policy.html`) | 🟠 |
| 6 | Không có tài liệu **"where"** — muốn sửa tính năng X thì vào file nào | 🟠 |
| 7 | Không có **định nghĩa hoàn thành**: sửa xong thì phải cập nhật những gì | 🟠 |

## 1.1. Lỗi cần sửa ngay trong `CLAUDE.md`

Mục 2 của `CLAUDE.md` hiện viết:

> *"Repo này **chưa từng bump version** (`package.json` và `extension/manifest.json`
> đều đứng yên ở `1.0.0` qua rất nhiều tính năng đã ship)"*

**Điều này không còn đúng.** Lịch sử git cho thấy version đã tăng đều đặn:

```text
1.1.0 → 1.1.1 → 1.1.3 → 1.1.4 → 1.1.5 → 1.2.1 → 1.2.2 → 1.2.3
      → 1.2.5 → 1.2.7 → 1.2.8 → 1.3.0 → 1.3.1 → 1.4.0 → 1.5.0
      → 1.6.0 → 1.6.1        (hiện tại)
```

Đây là loại lỗi tài liệu nguy hiểm nhất: một AI agent đọc `CLAUDE.md` sẽ tin rằng
quy tắc bump version "mới áp dụng từ giờ" và có thể suy luận sai về mốc bump kế tiếp.
**Sửa trước mọi việc khác.**

> Ghi chú khi backfill: commit `834c9c0` ghi `"version": "1.4.0"` rồi các commit sau
> lại quay về `1.2.3` — có một lần nhảy version nhầm trong lịch sử. Cần rà tay đoạn này.

---

# 2. Nguyên tắc: một tài liệu, một đối tượng đọc

Nguyên nhân gốc khiến tài liệu mục nát là **một file phục vụ nhiều đối tượng**.
`README.md` hiện tại vừa hướng dẫn người dùng cài đặt, vừa mô tả cấu trúc repo cho
lập trình viên — nên mỗi lần đổi cấu trúc thư mục là README lệch, và mỗi lần đổi
tính năng cũng lệch.

Ba đối tượng, ba nhánh, **không trộn**:

| Nhánh | Đối tượng | Câu hỏi họ hỏi | Ngôn ngữ |
|---|---|---|---|
| `docs/` | **Người dùng cuối** | "Dùng thế nào? Cấu hình ở đâu? Sao không chạy?" | Tiếng Việt + Anh |
| `dev/` | **Lập trình viên** | "Kiến trúc ra sao? Sửa ở đâu? Thêm tính năng thế nào?" | Tiếng Việt |
| `CLAUDE.md` + `.claude/` | **AI agent** | "Luật gì? Bước nào? Kiểm tra thế nào?" | Tiếng Việt, mệnh lệnh |
| `roadmap/` | Người ra quyết định | "Sắp tới làm gì? Vì sao chọn thế?" | Tiếng Việt |

Quy tắc kiểm tra: **nếu một đoạn văn phục vụ hai đối tượng, nó thuộc về hai file.**

---

# 3. Cây tài liệu đề xuất

```text
homework-ai-extension/
├── README.md                       ← CHỈ là cổng vào, phân luồng 3 đối tượng (≤ 80 dòng)
├── CHANGELOG-extension.md          ← ★ mới, backfill từ git
├── CHANGELOG-desktop.md            ← ★ mới, bắt đầu từ 0.1.0
├── CLAUDE.md                       ← luật agent, scope lại theo từng app
├── CONTRIBUTING.md                 ← ★ mới, quy trình đóng góp + definition of done
│
├── .claude/                        ← ★ mới — TÀI LIỆU CHO AI AGENT
│   ├── settings.json
│   └── skills/
│       ├── add-i18n-key/SKILL.md
│       ├── bump-version/SKILL.md
│       ├── add-ai-provider/SKILL.md
│       ├── add-setting/SKILL.md
│       └── release/SKILL.md
│
├── docs/                           ← TÀI LIỆU NGƯỜI DÙNG (GitHub Pages)
│   ├── index.md                    ← trang chủ site, chọn extension hay desktop
│   ├── extension/
│   │   ├── getting-started.md
│   │   ├── features/01-08.md       ← 8 file hiện có, chuyển vào
│   │   ├── configuration.md        ← ★ mới: toàn bộ setting, giải thích cho người dùng
│   │   ├── troubleshooting.md      ← ★ mới
│   │   └── changelog.md            ← render từ CHANGELOG-extension.md
│   ├── desktop/                    ← ★ toàn bộ mới
│   │   ├── getting-started.md
│   │   ├── permissions.md          ← ★ tách riêng — rào cản bỏ cuộc lớn nhất
│   │   ├── features/
│   │   ├── configuration.md
│   │   ├── troubleshooting.md
│   │   └── changelog.md
│   ├── shared/
│   │   ├── api-setup.md            ← lấy key miễn phí, cài Ollama/LM Studio
│   │   ├── privacy.md
│   │   └── faq.md
│   └── privacy-policy.html         ← giữ nguyên vị trí (đã public, có link ngoài)
│
├── dev/                            ← ★ mới — TÀI LIỆU KỸ THUẬT
│   ├── README.md                   ← bản đồ tài liệu kỹ thuật
│   ├── where.md                    ← ★★ BẢN ĐỒ "SỬA Ở ĐÂU" (mục 5.3)
│   ├── extension/
│   │   ├── architecture.md         ← chuyển từ docs/
│   │   ├── development.md          ← chuyển từ docs/
│   │   ├── storage-and-privacy.md
│   │   └── how-to/
│   │       ├── add-ai-provider.md
│   │       ├── add-ocr-language.md
│   │       ├── add-i18n-key.md
│   │       └── add-setting.md
│   ├── desktop/
│   │   ├── architecture.md
│   │   ├── structure.md            ← chuyển từ roadmap/ khi bắt đầu code
│   │   ├── testing.md
│   │   ├── build-and-release.md
│   │   └── how-to/
│   │       ├── add-ai-provider.md
│   │       ├── add-setting.md
│   │       ├── add-intent.md
│   │       ├── add-ipc-channel.md
│   │       ├── add-window.md
│   │       └── add-locale-key.md
│   └── decisions/                  ← ★ ADR — vì sao chọn như vậy
│       ├── 0001-tach-hoan-toan-2-app.md
│       ├── 0002-desktop-dung-typescript.md
│       ├── 0003-hai-lane-thuc-thi.md
│       └── 0004-solve-truoc-translate.md
│
└── roadmap/                        ← KẾ HOẠCH (giữ nguyên)
```

---

# 4. Nhánh 1 — Tài liệu người dùng (`docs/`)

## 4.1. Bốn loại tài liệu người dùng, đừng trộn

Theo mô hình Diátaxis, mỗi loại trả lời một nhu cầu khác nhau:

| Loại | Mục đích | File | Trạng thái |
|---|---|---|---|
| **Tutorial** | Lần đầu dùng, đi từ đầu đến cuối | `getting-started.md` | ⚠️ đang lẫn trong README |
| **How-to** | Giải quyết một việc cụ thể | `features/*.md` | ✅ 8 file, chất lượng tốt |
| **Reference** | Tra cứu đầy đủ | `configuration.md` | ❌ **thiếu hẳn** |
| **Explanation** | Hiểu vì sao | `privacy.md`, `faq.md` | ⚠️ một phần |

Thiếu nghiêm trọng nhất là **`configuration.md`**: extension có ~45 tuỳ chọn, desktop
sẽ có nhiều hơn, nhưng **không có bảng tra cứu nào** liệt kê chúng cho người dùng.
Người dùng chỉ biết một setting tồn tại nếu tình cờ nhìn thấy trong trang Options.

## 4.2. `configuration.md` — sinh tự động cho desktop

Với desktop, tài liệu này **không viết tay**. `config/settings/*.ts` đã chứa đủ
`type`, `default`, `min`/`max`, `unit`, `i18n` — một script duyệt schema và sinh ra
bảng markdown:

```text
scripts/gen-config-docs.ts  →  docs/desktop/configuration.md
```

Chạy trong CI. **Tài liệu cấu hình không bao giờ lệch với code**, vì nó là code.
Đây là lợi ích trực tiếp thứ hai của schema tập trung ở
[desktop-app-structure.md](./desktop-app-structure.md) mục 5.2.

Extension viết tay (không có schema tập trung), và đó là một lý do nữa để desktop
không lặp lại mô hình cũ.

## 4.3. `docs/desktop/permissions.md` — tài liệu quan trọng nhất của desktop

Desktop app yêu cầu quyền Accessibility và Screen Recording. Đây là **điểm bỏ cuộc
lớn nhất** — người dùng gặp hộp thoại hệ thống lạ ngay lần chạy đầu, trước khi thấy
bất kỳ giá trị nào. Tài liệu phải có:

- Ảnh chụp màn hình từng bước cho macOS và Windows
- Giải thích **vì sao** cần quyền đó (người dùng nghi ngờ app đọc màn hình là đúng)
- Cách kiểm tra quyền đã cấp chưa
- Cách thu hồi
- Điều gì vẫn hoạt động nếu **từ chối** cấp quyền

Điểm cuối quan trọng: phải nói rõ tính năng nào vẫn dùng được khi từ chối, thay vì
để app thành vô dụng.

---

# 5. Nhánh 2 — Tài liệu kỹ thuật (`dev/`)

Trả lời bốn câu hỏi, mỗi câu một dạng tài liệu:

| Câu hỏi | Dạng tài liệu | Vị trí |
|---|---|---|
| **What** — hệ thống gồm gì | `architecture.md`, `structure.md` | `dev/*/` |
| **How** — làm thế nào | `how-to/*.md` | `dev/*/how-to/` |
| **Where** — sửa ở đâu | `where.md` | `dev/where.md` |
| **Why** — vì sao chọn thế | ADR | `dev/decisions/` |

## 5.1. What — kiến trúc

Extension đã có `docs/architecture.md` khá tốt (sơ đồ tổng thể, vòng đời Crop & Solve,
Shadow DOM, key rotator). Chỉ cần **chuyển sang `dev/extension/`** vì đây là tài liệu
lập trình viên, không phải người dùng.

Desktop cần `dev/desktop/architecture.md` mới, tập trung vào những thứ
`structure.md` không nói: vòng đời process, luồng dữ liệu qua IPC, sơ đồ trạng thái
pipeline, mô hình huỷ request.

## 5.2. How — công thức từng việc

Mỗi how-to là **một quy trình có thể làm theo mà không cần hiểu toàn hệ thống**.
Cấu trúc bắt buộc của mỗi file:

```markdown
# Thêm một Provider AI mới

## Khi nào dùng tài liệu này
## Các file phải sửa          ← danh sách đầy đủ, có đường dẫn
## Từng bước                  ← đánh số, kèm code mẫu
## Cách kiểm tra              ← lệnh cụ thể, kết quả mong đợi
## Cạm bẫy thường gặp
```

`docs/development.md` hiện đã có mầm mống này (mục 2A "Thêm nhà cung cấp AI", 2B "Thêm
ngôn ngữ OCR") — tách chúng thành file riêng và bổ sung phần **"Cách kiểm tra"** đang
thiếu.

## 5.3. ★ Where — bản đồ "sửa ở đâu"

**Đây là tài liệu bị thiếu mà tốn thời gian nhất khi không có.** Một bảng duy nhất,
tra từ ý định sang file:

```markdown
# dev/where.md — Tôi muốn sửa X, vào file nào?

## Extension

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Đổi chữ trong trang Cài đặt | `extension/options/options.html` + `options.js` (`applyLanguageI18n`) + 13 locale |
| Đổi chữ trong Sidepanel/Drawer | 13 locale, khối `general` |
| Thêm provider AI | `shared/storage.js` (catalog) + `background/ai-engine.js` + `offscreen/ai-stream.js` |
| Đổi prompt giải bài | `shared/study-prompt.js` |
| Đổi giao diện thẻ lời giải | `content/overlay/floating-card.js` + `content/styles/overlay.css` |
| Đổi hành vi bôi đen | `content/selection-tooltip.js` |
| Đổi hành vi hover dịch | `content/hover-translate.js` |
| Đổi cách chụp màn hình | `content/cropper.js` + `background/service-worker.js` (`CAPTURE_VISIBLE_TAB`) |
| Thêm ngôn ngữ OCR | `shared/ocr-engine.js` (`OCR_MODEL_CATALOG`) + `assets/ocr/` |
| Thêm một setting | `shared/storage.js` (`DEFAULT_SETTINGS`) + `options.html` + tab tương ứng + 13 locale |
| Đổi phím tắt | `extension/manifest.json` (`commands`) |

## Desktop

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Thêm một setting | `config/settings/<nhóm>.settings.ts` + 13 locale — **chỉ vậy** |
| Thêm provider AI | `src/main/ai/providers/<tên>/` + một dòng ở `providers/index.ts` |
| Thêm một tính năng AI | `config/intents.config.ts` + một prompt builder |
| Đổi phím tắt mặc định | `config/hotkeys.config.ts` |
| Thêm kênh IPC | `src/shared/ipc/channels.ts` + handler ở `main/ipc/` |
| Đổi giao diện overlay | `src/renderer/windows/<loại>/` + `config/theme.config.ts` |
```

Bảng này cũng là **thước đo chất lượng kiến trúc**: nếu một dòng liệt kê quá 3 file,
đó là dấu hiệu khái niệm đó chưa được khai báo tập trung. So sánh hai bảng ở trên
cho thấy rõ điều desktop cải thiện được so với extension.

## 5.4. Why — ADR

Ghi lại **quyết định và bối cảnh**, không phải hướng dẫn. Định dạng ngắn:

```markdown
# ADR-0001: Tách hoàn toàn extension và desktop

- **Trạng thái:** Đã chấp nhận — 2026-08-29
- **Bối cảnh:** Hai app dùng chung ~75% logic nghiệp vụ...
- **Quyết định:** Không có package lõi dùng chung...
- **Đánh đổi đã chấp nhận:** 13 locale tồn tại hai bản...
- **Xem lại khi:** chi phí đồng bộ vượt quá chi phí trừu tượng hoá
```

Bốn ADR đầu tiên trích thẳng từ các quyết định đã chốt trong bộ kế hoạch này —
viết một lần, khỏi phải tranh luận lại sau sáu tháng.

---

# 6. Nhánh 3 — Tài liệu cho AI agent

Nguyên tắc phân chia: **`CLAUDE.md` là luật luôn được nạp; skill là quy trình nạp
theo yêu cầu.** Đừng nhét quy trình dài vào `CLAUDE.md` — nó tốn context mỗi phiên
làm việc kể cả khi không dùng đến.

| Loại nội dung | Nơi đặt |
|---|---|
| Luật ngắn, luôn đúng, phải nhớ mọi lúc | `CLAUDE.md` |
| Quy trình nhiều bước, chỉ dùng khi làm việc đó | `.claude/skills/<tên>/SKILL.md` |
| Giải thích dài, tham chiếu | `dev/**` (skill trỏ tới) |

## 6.1. Sửa `CLAUDE.md`

Ba việc, theo thứ tự ưu tiên:

1. **Sửa thông tin sai ở §2** (mục 1.1) — nói đúng rằng repo đã ở `1.6.1` sau ~18 lần bump.
2. **Scope lại §1 và §2 theo từng app.** Hai quy tắc hiện viết như thể chỉ có một app.
   Sau quyết định tách, cần nói rõ:
   - §1 (13 locale): extension sửa `extension/shared/i18n/locales/*.js`;
     desktop sửa `desktop/src/shared/i18n/locales/*.ts`. **Không đồng bộ chéo bắt buộc.**
   - §2 (bump version): extension bump `package.json` + `extension/manifest.json`;
     desktop bump `desktop/package.json`. **Hai app độc lập, không ràng buộc version.**
3. **Thêm §3: mỗi lần bump phải kèm một mục CHANGELOG.** Đây là mắt xích còn thiếu —
   hiện tại bump version xong thì người dùng không có cách nào biết đã đổi gì.

Đồng thời `I18N-GUIDELINES.md` chỉ nói về **trang Options**, trong khi `CLAUDE.md` §1
mở rộng ra mọi text hiển thị. Thống nhất lại: `I18N-GUIDELINES.md` thành tài liệu
tham chiếu đầy đủ đặt trong `dev/extension/how-to/add-i18n-key.md`, `CLAUDE.md` giữ
bản tóm tắt và trỏ tới.

## 6.2. Skill nào đáng làm

Tiêu chí: **lặp lại nhiều + nhiều bước + dễ làm sai + có cách kiểm tra máy móc.**
Việc chỉ thoả một hai tiêu chí thì viết how-to là đủ, không cần skill.

| Skill | Lặp lại | Số bước | Dễ sai | Đáng làm |
|---|---|---|---|---|
| **`add-i18n-key`** | rất cao | 26 file | rất cao | ✅ **ưu tiên 1** |
| **`bump-version`** | mỗi lần ship | ít nhưng luật tinh vi | cao | ✅ **ưu tiên 2** |
| `add-setting` | cao | 5 nơi (ext) / 1 nơi (desktop) | TB | ✅ ưu tiên 3 |
| `add-ai-provider` | thấp | nhiều | cao | ⚠️ how-to là đủ |
| `release` | mỗi lần ship | nhiều | TB | ✅ khi có desktop |
| `add-intent` | desktop, TB | ít | thấp | ❌ how-to là đủ |

> Đừng viết skill dự phòng. Viết khi việc đó đã lặp lại **ít nhất ba lần** và mỗi lần
> đều phải mở `CLAUDE.md` ra đọc lại.

## 6.3. Vì sao `add-i18n-key` là ưu tiên số một

Đây là việc tốn công và dễ sai nhất trong repo — bằng chứng là nó có **hẳn hai tài
liệu riêng** (`CLAUDE.md` §1 và toàn bộ `I18N-GUIDELINES.md`), mà vẫn còn nợ kỹ thuật
được chính `CLAUDE.md` thừa nhận: các key của Local AI Server hiện chỉ có ở `vi.js`
và `en.js`, 11 locale còn lại đang fallback tiếng Anh.

Skill cần bao gồm đủ những chi tiết mà tài liệu văn xuôi hay bị bỏ sót:

```markdown
---
name: add-i18n-key
description: Thêm hoặc sửa chuỗi hiển thị trong extension hoặc desktop app.
  Dùng khi thêm bất kỳ text nào lên UI — nút, nhãn, tooltip, thông báo lỗi.
  Bảo đảm đủ 13 locale và đúng khối general/options.
---

## Bước 0 — Xác định app
extension → `extension/shared/i18n/locales/*.js`  (13 file .js)
desktop   → `desktop/src/shared/i18n/locales/*.ts` (13 file .ts, có type)

## Bước 1 — Xác định khối
`general` (Sidepanel, Drawer) · `options` (trang Cài đặt) ·
`popup` · `selectionTooltip` · `cropper` · `floatingPopup` · `hoverTranslate`
→ Text xuất hiện ở hai nơi thì phải thêm vào **cả hai khối**.

## Bước 2 — Thêm key vào đủ 13 file
en, vi, th, zh-CN, zh-TW, ja, ko, es, fr, de, pt, id, ru

## Bước 3 — Quy tắc nội dung
- Tooltip/description sẽ được nội suy vào thuộc tính HTML
  (`data-tooltip-desc="${...}"`) → **cấm dấu ngoặc kép thẳng `"`**,
  dùng ngoặc kép cong `"…"` hoặc dấu phù hợp ngôn ngữ.
- Không hardcode text trong `.html`/template.

## Bước 4 — Nối vào UI
extension: `id` trong HTML + `setText()` trong `applyLanguageI18n()`
desktop:   `t('key')` — key sai sẽ là lỗi biên dịch

## Bước 5 — Kiểm tra (BẮT BUỘC, không được bỏ)
grep -c "keyName:" extension/shared/i18n/locales/*.js
  → phải ra đúng số khối đã dùng key (thường 2 × 13 file)
node --check <từng file locale đã sửa>
desktop: npx tsc --noEmit
```

Giá trị của skill so với tài liệu văn xuôi nằm ở **bước 5**: nó biến "nhớ kiểm tra"
thành một lệnh cụ thể có kết quả đúng/sai rõ ràng.

## 6.4. `bump-version` — luật tinh vi, dễ sai

Quy tắc ở `CLAUDE.md` §2 có ba chỗ dễ hiểu nhầm, và skill phải mã hoá chúng thành
cây quyết định thay vì văn xuôi:

```text
Thay đổi có ảnh hưởng người dùng không?
├── KHÔNG (docs, refactor, test) → KHÔNG bump. Dừng.
└── CÓ
     ├── Phiên này đã bump patch mà CHƯA COMMIT chưa?
     │    ├── Rồi + thay đổi này vẫn là patch → KHÔNG bump nữa (giữ nguyên)
     │    └── Rồi + thay đổi này là MINOR   → bump minor, NUỐT patch đã bump
     └── Chưa → bump theo loại (patch / minor)

Sau khi bump:
  - extension: package.json + extension/manifest.json phải GIỐNG HỆT nhau
  - desktop:   desktop/package.json
  - LUÔN kèm một mục trong CHANGELOG tương ứng
  - Mốc "được bump lần nữa" là ĐÃ COMMIT, không phải xong task
```

---

# 7. `CHANGELOG` — khoảng trống lớn nhất

Repo đã phát hành ~18 phiên bản mà **không có bất kỳ ghi chép nào** về nội dung từng
bản. Hệ quả cụ thể: không viết được phần "What's New" khi nộp Chrome Web Store, người
dùng không biết vì sao nên cập nhật, và không truy được lỗi xuất hiện từ version nào.

## 7.1. Backfill được từ git

May mắn là lịch sử commit đủ mô tả để dựng lại. Mỗi lần đổi `manifest.json` đều có
commit message rõ ràng:

```text
1.6.0  feat: add hover translation feature with customizable settings
1.5.0  feat: Add Gemini Nano support and quick guide features
1.4.0  feat: implement drag-and-drop toolbar layout editor
1.3.1  feat: enhance overlay loading behavior and selection tooltip
1.3.0  feat: Enhance dictionary functionality for single-word translations
1.2.8  feat: add toolbar position setting
…
```

Lệnh dựng bản nháp:

```bash
git log -p --format="%h %ad %s" --date=short -- extension/manifest.json \
  | grep -E '^[0-9a-f]{7} |^\+  "version"'
```

Rà tay khoảng nhảy version nhầm ở `834c9c0` (mục 1.1), rồi hoàn thiện.

## 7.2. Hai file, vì hai app độc lập version

`CHANGELOG-extension.md` và `CHANGELOG-desktop.md`. Gộp chung sẽ tạo ra thứ vô nghĩa:
người đọc không biết `1.7.0` là của app nào.

Theo chuẩn Keep a Changelog, nhóm theo **tác động tới người dùng**, không theo commit:

```markdown
## [1.6.0] — 2026-08-2x

### Thêm mới
- Dịch nhanh khi rê chuột trên mọi trang web, có tuỳ chỉnh phím bổ trợ,
  độ trễ, mức chi tiết (từ / câu / đoạn).

### Thay đổi
- …

### Sửa lỗi
- …
```

Viết bằng ngôn ngữ người dùng hiểu được, không phải `refactor selection-tooltip.js`.

---

# 8. Định nghĩa hoàn thành — sửa xong thì cập nhật gì

Đây là bảng trả lời trực tiếp "những lưu ý mỗi lần sửa". Đặt trong `CONTRIBUTING.md`
và tóm tắt trong `CLAUDE.md`:

| Loại thay đổi | Bump | CHANGELOG | `docs/` người dùng | `dev/` kỹ thuật | 13 locale | ADR |
|---|---|---|---|---|---|---|
| Tính năng mới | **minor** | ✅ | ✅ features + configuration | nếu đổi kiến trúc | ✅ | nếu là quyết định lớn |
| Sửa lỗi hành vi | **patch** | ✅ | nếu đổi cách dùng | — | — | — |
| Thêm/đổi setting | patch\* | ✅ | ✅ configuration | — | ✅ | — |
| Thêm provider AI | **minor** | ✅ | ✅ api-setup | ✅ how-to | ✅ | — |
| Đổi text UI | **patch** | nếu đáng kể | nếu đổi nghĩa | — | ✅ **bắt buộc** | — |
| Đổi phím tắt | **patch** | ✅ | ✅ | — | — | — |
| Refactor không đổi hành vi | ❌ | ❌ | ❌ | nếu đổi cấu trúc | ❌ | — |
| Sửa tài liệu | ❌ | ❌ | — | — | ❌ | — |
| Thêm test | ❌ | ❌ | ❌ | ❌ | ❌ | — |
| Đổi quyết định kiến trúc | tuỳ | ✅ | — | ✅ | — | ✅ **bắt buộc** |

\* minor nếu setting đó mở ra một tính năng mới.

**Hai quy tắc nhớ nằm lòng:**
1. Bump version thì **luôn** kèm mục CHANGELOG. Không có ngoại lệ.
2. Thêm text hiển thị thì **luôn** đủ 13 locale. Fallback `d.xxx || '...'` là lưới an
   toàn khi sơ suất, không phải cách làm đúng.

---

# 9. Tự động hoá — biến quy tắc thành kiểm tra

Tài liệu chỉ được tuân thủ khi có máy kiểm tra. Bốn script, chạy trong CI:

| Script | Kiểm tra | Hành vi khi sai |
|---|---|---|
| ✅ `check-i18n-parity.mjs` | 13 locale có đủ key như nhau | ❌ fail (`--strict`) |
| ✅ `check-version-sync.mjs` | `package.json` == `manifest.json`, và version có mục CHANGELOG | ❌ fail (`--strict`) |
| ✅ `check-doc-links.mjs` | mọi link markdown nội bộ còn tồn tại | ❌ fail (`--strict`) |
| ⬜ `gen-config-docs.ts` | sinh `docs/desktop/configuration.md` từ schema | dựng cùng Phase 0 của desktop |

Chạy tất cả: `npm run check`

### 9.1. Kết quả chạy thật `check-i18n-parity` (2026-08-29)

```text
63 key thiếu
128 key chưa dịch (còn nguyên tiếng Anh)
```

**Món nợ thật khác với những gì `CLAUDE.md` mô tả.** Ghi chú trong `CLAUDE.md` nói các
key Local AI Server "chỉ có ở `vi.js` và `en.js`". Thực tế script cho thấy chúng **có
mặt ở đủ 13 locale** nhưng **chưa được dịch** (`localVisionTag`, `localEmbeddingTag`
còn nguyên tiếng Anh ở 11–12 locale). Hiện tượng người dùng thấy giống nhau, nhưng cách
sửa hoàn toàn khác: dịch nội dung, không phải thêm key.

Nợ **thiếu key thật** nằm ở chỗ khác — 7 key tooltip trong khối `options`:

```text
labelFabDisplayDesc · labelToolbarThemeDesc · labelToolbarTextDesc
labelToolbarOpacityDesc · labelToolbarBlurDesc · labelPopupOpacityDesc
labelPopupBlurDesc
```

Chỉ có ở `en`, `vi`, `th`, `zh-CN` — thiếu ở 9 locale còn lại. Người dùng 9 ngôn ngữ đó
**không thấy tooltip giải thích nào** cho các tuỳ chọn giao diện.

Trong ~128 key "chưa dịch" có nhiều trường hợp **hợp lệ**: tên phím (`Alt`, `Ctrl`,
`Shift`, `Meta`), tên thương hiệu, và từ trùng nhau tự nhiên giữa các ngôn ngữ
(`Normal` trong tiếng Đức và Pháp). Vì vậy script để mức **cảnh báo**, chỉ key thiếu
mới làm CI fail.

---

# 10. Thứ tự triển khai

## ✅ Đã hoàn thành — 2026-08-29

1. ~~Sửa thông tin sai ở `CLAUDE.md` §2~~ → đã sửa; thêm hẳn **§0 phân định phạm vi
   hai app** với danh sách cấm tuyệt đối để tránh xung đột chéo.
2. ~~Scope lại `CLAUDE.md` §1, §2 theo từng app~~ → §1 tách `1a` (extension) / `1b`
   (desktop); §2 tách bảng "bump ở đâu" + cây quyết định có bước xác định app.
3. ~~Thêm §3 về CHANGELOG~~ → đã thêm, kèm **§4 Định nghĩa hoàn thành**.
4. ~~Backfill `CHANGELOG-extension.md`~~ → dựng lại đủ 18 bản từ `1.1.0` → `1.6.1`,
   có ghi chú về lần nhảy version nhầm ở `834c9c0` và các version bị bỏ qua.
5. ~~Tạo `CHANGELOG-desktop.md`~~ → seed với quy ước version giai đoạn `0.x`.

6. ~~Skill `add-i18n-key` + `bump-version`~~ → `.claude/skills/`, kèm hai script kiểm tra
   thực thi được (`scripts/check-i18n-parity.mjs`, `scripts/check-version-sync.mjs`)
   và npm script `npm run check`.
7. ~~`dev/where.md`~~ → bản đồ "sửa ở đâu" cho extension (39 đường dẫn đã xác minh tồn tại)
   + bảng desktop theo thiết kế.

**Phát hiện khi chạy `check-i18n-parity` lần đầu:** 63 key **thiếu thật** (7 key tooltip
`*Desc` × 9 locale: de, es, fr, id, ja, ko, pt, ru, zh-TW) và ~128 key còn nguyên tiếng
Anh. Đây là nợ có sẵn, chưa dọn — xem mục 9.1.

8. ~~Viết 4 ADR~~ → `dev/decisions/` + README chỉ mục và quy ước viết ADR mới.
9. ~~Tái cấu trúc `docs/`~~ → `docs/` (người dùng) + `dev/` (kỹ thuật), dùng `git mv`
   để giữ lịch sử. `privacy-policy.html` **giữ nguyên vị trí** vì có link ngoài.
10. ~~Rút gọn `README.md` thành cổng vào~~ → phân luồng 3 đối tượng, 2 sản phẩm.
11. ~~`scripts/check-doc-links.mjs`~~ → bắt được **16 link chết** ngay sau khi di chuyển
    file; đã sửa hết. Nay 107 link nội bộ đều sống.

12. ~~`docs/extension/configuration.md`~~ → bảng tra cứu **toàn bộ** tuỳ chọn, dữ liệu
    trích thẳng từ `DEFAULT_SETTINGS`, `DEFAULT_PROVIDERS`, `OCR_MODEL_CATALOG` và các
    `input[type=range]` trong `options.html` — không viết tay, không đoán.
13. ~~`docs/extension/troubleshooting.md`~~ → dựa trên thông báo lỗi và hằng số thật
    trong code (cooldown 60s cho `429`, 30s cho lỗi máy chủ; 4 trạng thái Nano).

**Trạng thái kiểm tra tự động:** `npm run check` = i18n parity + version sync + doc links.
118 link nội bộ, không có link chết.

## Còn lại — đều phụ thuộc desktop app

- `scripts/gen-config-docs.ts` — sinh `docs/desktop/configuration.md` từ schema, dựng
  cùng `config/settings/` ở Phase 0.
- `docs/desktop/permissions.md` — viết **trước** khi code phần xin quyền.
- `docs/desktop/getting-started.md`, `features/`, `troubleshooting.md` — khi có bản chạy được.
- Chuyển `roadmap/desktop-app-structure.md` → `dev/desktop/structure.md` khi bắt đầu code.

## Ngay lập tức (trước mọi việc code)

## Trước khi bắt đầu Phase 0 của desktop

4. Dựng `.claude/skills/add-i18n-key/` và `bump-version/`.
5. Tạo `dev/where.md` cho extension — viết được ngay, không cần chờ desktop.
6. Viết 4 ADR đầu từ các quyết định đã chốt.

## Song song với Phase 0

7. Tái cấu trúc `docs/` thành `docs/extension/` + `dev/extension/`, rút gọn `README.md`
   thành cổng vào.
8. `scripts/gen-config-docs.ts` — dựng cùng lúc với `config/settings/`, không sau.
9. `docs/desktop/permissions.md` — viết **trước** khi code phần xin quyền, vì nội dung
   tài liệu sẽ quyết định luồng onboarding trông như thế nào.

## Khi desktop có bản chạy được

10. `docs/desktop/getting-started.md`, `features/`, `troubleshooting.md`.
11. `CHANGELOG-desktop.md` bắt đầu từ `0.1.0`.
12. Chuyển `roadmap/desktop-app-structure.md` → `dev/desktop/structure.md`
    (từ kế hoạch thành tài liệu sống).
