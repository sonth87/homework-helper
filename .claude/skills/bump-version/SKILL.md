---
name: bump-version
description: Bump version và ghi CHANGELOG sau một thay đổi user-facing. Dùng khi vừa hoàn thành thêm tính năng, sửa lỗi hành vi, đổi text UI, thêm setting hoặc provider — ở extension hoặc desktop app. Xác định đúng app, đúng mức semver, và tránh bump trùng trong cùng một phiên chưa commit.
---

# Bump version & ghi CHANGELOG

Repo có **hai app version độc lập hoàn toàn**. Sai lầm nghiêm trọng nhất là bump nhầm
app, hoặc "đồng bộ" version giữa hai app.

---

## Bước 1 — Có cần bump không?

```text
Thay đổi có ảnh hưởng tới NGƯỜI DÙNG không?
├── KHÔNG → DỪNG, không bump
│    · sửa tài liệu / README / CHANGELOG
│    · refactor không đổi hành vi
│    · thêm test
│    · đổi comment, đổi tên biến nội bộ
└── CÓ → tiếp bước 2
     · tính năng mới          · sửa lỗi ảnh hưởng hành vi
     · đổi text hiển thị      · thêm/đổi setting
     · thêm provider AI       · đổi phím tắt
```

---

## Bước 2 — Xác định app

| Đang sửa file trong… | App | File phải bump |
|---|---|---|
| `extension/` | Extension | `package.json` **và** `extension/manifest.json` |
| `desktop/` | Desktop | `desktop/package.json` |

⛔ **Cấm tuyệt đối:**
- Bump extension khi chỉ sửa desktop, và ngược lại.
- Đồng bộ version hai app cho "cho đẹp" — chúng **cố tình** lệch nhau.
  Extension ở `1.6.x` còn desktop ở `0.x` là **đúng**.

> `package.json` ở **gốc repo là của extension** (lịch sử để lại). Desktop dùng
> `desktop/package.json`. Đừng nhầm hai file này.

Nếu thay đổi chạm cả hai app (hiếm) → xử lý như **hai lần bump độc lập**.

---

## Bước 3 — Kiểm tra phiên này đã bump chưa

**Luật quan trọng nhất và dễ sai nhất.** Chỉ bump patch **một lần** cho mỗi phiên làm
việc **chưa commit**.

```bash
git status --short
git diff HEAD -- package.json extension/manifest.json desktop/package.json
```

```text
Diff cho thấy version ĐÃ được bump trong phiên này (chưa commit)?
├── CHƯA → bump bình thường theo bước 4
└── RỒI
     ├── Thay đổi lần này là PATCH → KHÔNG bump nữa. Giữ nguyên số.
     │                                Chỉ bổ sung nội dung vào mục CHANGELOG đã có.
     └── Thay đổi lần này là MINOR → bump minor. Nó NUỐT luôn patch đã bump.
                                     Ví dụ: 1.6.1 → (đã bump) 1.6.2 → giờ thành 1.7.0
                                     KHÔNG giữ cả hai mốc.
```

> **Mốc để được bump lần nữa là code ĐÃ COMMIT** — không phải "xong một task".
> Quy tắc này tính **riêng cho từng app**: một phiên sửa cả hai app được bump patch cho
> cả hai, đó là hai lần bump độc lập, không vi phạm.

---

## Bước 4 — Chọn mức semver

| Mức | Khi nào | Ví dụ |
|---|---|---|
| **Patch** `1.6.1` → `1.6.2` | Sửa lỗi, tinh chỉnh nhỏ, thêm tooltip/copy, đổi text | Sửa thẻ lời giải bị che khi cuộn |
| **Minor** `1.6.1` → `1.7.0` | Tính năng mới, thay đổi UI đáng kể, thêm provider | Thêm dịch khi rê chuột |
| **Major** `1.6.1` → `2.0.0` | Phá vỡ tương thích ngược | Hiếm — hỏi trước khi làm |

Thêm setting là **patch**, trừ khi setting đó mở ra một tính năng mới → **minor**.

**Desktop giai đoạn `0.x`:** `0.x.0` = hoàn tất một Phase trong lộ trình;
`0.x.y` = sửa lỗi trong cùng Phase. Chỉ lên `1.0.0` khi cả hai lane chạy ổn trên cả
macOS lẫn Windows, có đóng gói và tự cập nhật.

---

## Bước 5 — Sửa file

### Extension — hai file, giá trị giống hệt nhau

```bash
# package.json
"version": "1.6.2",

# extension/manifest.json
"version": "1.6.2",
```

⛔ Lệch nhau → Chrome Web Store reject khi upload `homework-helper.zip`.

### Desktop — một file

```bash
# desktop/package.json
"version": "0.2.0",
```

---

## Bước 6 — Ghi CHANGELOG (BẮT BUỘC)

**Bump mà không ghi CHANGELOG là thiếu sót, không phải tuỳ chọn.**

| App | File |
|---|---|
| Extension | `CHANGELOG-extension.md` |
| Desktop | `CHANGELOG-desktop.md` |

Chỉ ghi vào file của **app bị ảnh hưởng**. Thêm mục mới ngay **dưới `## [Unreleased]`**:

```markdown
## [1.6.2] — 2026-08-30

### Sửa lỗi
- Thẻ lời giải không còn bị che khuất khi cuộn trang trên các trang có header cố định.
```

Nhóm dùng: `### Thêm mới` · `### Thay đổi` · `### Sửa lỗi` · `### Gỡ bỏ`

**Viết bằng ngôn ngữ người dùng hiểu được:**

| ❌ Không viết | ✅ Viết |
|---|---|
| `refactor floating-card.js` | `Thẻ lời giải hiển thị mượt hơn khi cuộn trang` |
| `fix null check in ai-engine` | `Khắc phục lỗi treo khi API key hết hạn mức` |
| `add hoverTranslateDelay setting` | `Tuỳ chỉnh được độ trễ trước khi hiện tooltip dịch` |

Ngày theo định dạng `YYYY-MM-DD`. Version phải **khớp chính xác** số vừa bump.

---

## Bước 7 — Kiểm tra

```bash
node scripts/check-version-sync.mjs
```

Kết quả mong đợi:

```text
Extension
  ✓ 1.6.2 (package.json == manifest.json)
  ✓ CHANGELOG-extension.md có mục [1.6.2]
```

Script kiểm tra hai file extension khớp nhau, và version hiện tại đã có mục CHANGELOG.

---

## Checklist

- [ ] Thay đổi thật sự user-facing (không phải docs/refactor/test)
- [ ] Đã xác định đúng app
- [ ] Đã kiểm tra `git diff` — phiên này chưa bump cho app đó
- [ ] Mức semver đúng (patch / minor)
- [ ] Extension: **cả hai** file có giá trị giống hệt nhau
- [ ] CHANGELOG của **đúng app** có mục mới, viết cho người dùng đọc
- [ ] `node scripts/check-version-sync.mjs` báo ✓

---

## Cạm bẫy thường gặp

| Sai lầm | Hậu quả |
|---|---|
| Chỉ sửa `manifest.json`, quên `package.json` | Hai file lệch, khó truy vết |
| Chỉ sửa `package.json`, quên `manifest.json` | **Chrome Web Store reject** |
| Bump `package.json` gốc khi sửa desktop | Sai app hoàn toàn |
| Bump 3–4 lần trong một phiên chưa commit | Version nhảy vô nghĩa (`1.6.2`→`1.6.5`) |
| Giữ cả patch lẫn minor trong cùng phiên | Minor phải nuốt patch, không cộng dồn |
| Bump nhưng quên CHANGELOG | Không viết được "What's New" khi nộp store |
| Đồng bộ version desktop theo extension | Vi phạm nguyên tắc hai app độc lập |

> Repo từng có một lần nhảy version nhầm: commit `834c9c0` đặt `1.4.0` rồi cùng ngày
> phải kéo về `1.2.3`. Xem ghi chú cuối `CHANGELOG-extension.md`.
