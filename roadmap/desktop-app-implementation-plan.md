# Kế hoạch Triển khai Desktop App — Bản Phân tích Định hướng

> Tài liệu cấp 2, viết theo yêu cầu §171 của [desktop-app.md](./desktop-app.md).
> Phạm vi rộng hơn bản gốc: bản gốc chỉ đặc tả **dịch thuật**; tài liệu này mở rộng
> sang **toàn bộ tính năng extension hiện có** (giải bài tập, tóm tắt, giải thích,
> chat, trắc nghiệm, OCR, định tuyến AI đa provider, 13 ngôn ngữ UI).

**Nguyên tắc xuyên suốt (đã chốt):** Extension và Desktop App là **hai sản phẩm độc
lập hoàn toàn** — hai thư mục, hai build, hai chu kỳ release, hai version,
**không chia sẻ một dòng code nào**. Chúng chỉ kế thừa tư tưởng của nhau.
Extension giữ nguyên JavaScript ESM; Desktop dùng TypeScript strict.

> - Cấu trúc thư mục, registry khai báo tập trung, tách config/env và quy ước chống
>   god file: [desktop-app-structure.md](./desktop-app-structure.md)
> - Hệ thống tài liệu cho ba đối tượng (người dùng / lập trình viên / AI agent),
>   CHANGELOG và định nghĩa hoàn thành: [documentation-plan.md](./documentation-plan.md)

---

# 1. Khoảng cách giữa `desktop-app.md` và mục tiêu thật

Bản `desktop-app.md` (5.642 dòng) là một đặc tả rất tốt nhưng **chỉ mô hình hoá một
đường ống duy nhất**:

```ts
interface TranslationPipeline {
  processPoint(point: Point): Promise<TranslationOverlayResult | null>;
}
```

Đây là đường ống **hover → dịch**. Nó không mô tả được các tính năng còn lại vì 4 lý do
kiến trúc:

| # | Giả định của bản gốc | Vì sao vỡ khi thêm giải bài tập / tóm tắt |
|---|---|---|
| 1 | Input luôn là **một điểm chuột** (`Point`) | Giải bài tập cần **một vùng** (region), một file, hoặc một ảnh chụp; tóm tắt cần **cả trang/cả tài liệu** |
| 2 | Output luôn là **một chuỗi text ngắn** | Lời giải là **markdown + KaTeX + streaming**, dài vài trăm dòng |
| 3 | Backend là **Google Translate API** (1 request, ~200ms, miễn phí) | Giải/tóm tắt cần **AiEngine đa provider, streaming, key rotation, vision** (vài giây) |
| 4 | Overlay là cửa sổ **trong suốt, click-through, không nhận focus** | Chat/lời giải cần cửa sổ **có focus, scroll được, copy được, hỏi tiếp được** |

→ Cần **tổng quát hoá pipeline** và **tách thành 2 lane** (mục 4 & 5).

---

# 2. Kiểm kê tài sản: cái gì port được, cái gì phải viết lại

Điểm mạnh lớn nhất của repo hiện tại: **bề mặt tiếp xúc với Chrome API cực kỳ hẹp**.
Toàn bộ 12.526 dòng JS chỉ chạm vào Chrome qua đúng 24 API, và tập trung vào 4 nhóm:

```
 60 refs  messaging   chrome.runtime.sendMessage / onMessage / tabs.sendMessage
 14 refs  asset URL   chrome.runtime.getURL
 11 refs  storage     chrome.storage.local / onChanged
 ~20 refs shell/host  tabs.create, sidePanel.*, openOptionsPage, contextMenus,
                      commands, captureVisibleTab, offscreen, scripting
  3 refs  Nano        chrome.aiOriginTrial.languageModel
```

## 2.1. Nhóm A — Port nguyên trạng, 0 dòng phải sửa (~9.100 dòng)

| File | Dòng | Vai trò |
|---|---|---|
| `shared/i18n/locales/*.js` (13 file) | 7.785 | Toàn bộ 13 locale |
| `shared/i18n.js` | 90 | Resolver dictionary |
| `shared/markdown-katex.js` | 396 | Render markdown + công thức |
| `shared/icons.js` | 274 | SVG icon set |
| `shared/dictionary.js` | 242 | Schema tra từ đơn |
| `background/key-rotator.js` | 115 | Xoay vòng key pool, cooldown |
| `shared/study-prompt.js` | 80 | 5 chế độ học tập |
| `shared/toolbar-items.js` | 59 | Layout toolbar |
| `shared/thinking-control.js` | 58 | Tắt thinking theo provider |

**Đây là "bộ não" của sản phẩm và nó đã sẵn sàng chạy trên desktop.**

## 2.2. Nhóm B — Port qua adapter, sửa nhẹ (~2.100 dòng)

| File | Dòng | Chrome refs | Việc cần làm |
|---|---|---|---|
| `shared/storage.js` | 633 | 7 | Thay backend `chrome.storage.local` → SQLite/electron-store |
| `shared/ocr-engine.js` | 567 | 10 | Thay `getURL` + IndexedDB → đường dẫn file thật; thêm native OCR |
| `offscreen/ai-stream.js` | 469 | 5 | Bỏ heartbeat MV3, giữ nguyên logic 3 provider family |
| `background/ai-engine.js` | 298 | 11 | Bỏ nhánh `chrome-builtin`, giữ toàn bộ routing |
| `shared/local-model-detect.js` | 237 | 3 | `fetch` trực tiếp, không cần đi qua service worker |

## 2.3. Nhóm C — UI: port được nhưng cần đổi shell (~3.000 dòng)

`content/overlay/floating-card.js` (884 dòng, 5 chrome refs), `content/overlay/drawer.js`
(768/6), `content/selection-tooltip.js` (463), `content/hover-translate.js` (524/4),
`content/cropper.js` (352/2) — tất cả đều là **HTML + CSS + DOM thuần**, render vào
Shadow DOM. Trên Electron chúng render vào `BrowserWindow` thay vì Shadow DOM.
Toàn bộ CSS Liquid Glass (`content/styles/*.css`) dùng lại nguyên vẹn.

## 2.4. Nhóm D — Không port được, phải thiết kế lại

| Thành phần | Vì sao | Phương án desktop |
|---|---|---|
| **Gemini Nano** (`chrome.aiOriginTrial`) | API chỉ có trong Chrome | Ollama / LM Studio — **repo đã hỗ trợ sẵn 2 provider này** |
| **Offscreen document** (`offscreen/*`) | Workaround cho giới hạn 30s của MV3 service worker | **Xoá hẳn** — Electron main process không có giới hạn này |
| **Google Forms adapter** (`content/forms-adapter.js`) | Cần truy cập DOM để tự click radio | Chỉ gợi ý đáp án qua OCR/vision, **không auto-fill** |
| **Service worker routing** (`background/service-worker.js`) | Message passing của extension | Electron IPC + preload |
| `chrome.tabs.captureVisibleTab` | Chỉ chụp được tab | OS screen capture — **mạnh hơn**, chụp được mọi app |

**Kết luận kiểm kê:** khoảng **75% logic nghiệp vụ có giá trị tham chiếu**. Phần phải
thiết kế mới hoàn toàn nằm ở **tầng thu nhận nội dung** (DOM → OS) và **tầng shell**.
Xem mục 3.3 để biết "tham chiếu" khác "port" thế nào sau quyết định tách hoàn toàn.

---

# 3. Nguyên tắc tách Extension / Desktop — ĐÃ CHỐT

**Quyết định: hai app độc lập hoàn toàn trong một repo. Không có package lõi dùng chung.**

```text
homework-ai-extension/
├── extension/     ← MV3, JavaScript ESM, không build step — GIỮ NGUYÊN VỊ TRÍ
├── desktop/       ← Electron, TypeScript, Vite — hoàn toàn tự chứa
├── roadmap/
└── docs/
```

Hai thư mục **không import lẫn nhau, không có `packages/`, không có workspace**.
Chúng chỉ **kế thừa tư tưởng**: cùng mô hình cấu hình, cùng 5 study mode, cùng
13 ngôn ngữ, cùng triết lý Liquid Glass. Sửa một prompt hay thêm một locale key
là **sửa ở cả hai nơi, có chủ đích**.

## 3.1. Vì sao chấp nhận trùng lặp

Trùng lặp ở đây **không phải nợ kỹ thuật, mà là ranh giới sản phẩm**. Hai app đi theo
hai hướng tiếp cận khác nhau về bản chất:

| | Extension | Desktop |
|---|---|---|
| Nguồn nội dung | DOM (có cấu trúc, có ngữ nghĩa) | Pixel + Accessibility tree (phẳng, nhiễu) |
| Đơn vị làm việc | `Range`, `Node`, `Element` | `Rect`, `Point`, `ImageBuffer` |
| Vòng đời | service worker bị kill sau 30s | process sống suốt phiên |
| Bảo mật | CSP của MV3, không truy cập file | full Node, keychain, SQLite |
| UI | Shadow DOM chèn vào trang lạ | `BrowserWindow` mình sở hữu |
| Model on-device | Gemini Nano | Ollama / LM Studio |

Một lõi dùng chung phục vụ cả hai sẽ phải trừu tượng hoá qua **6 khác biệt nền tảng
này cùng lúc**. Cái giá là mỗi thay đổi phải cân nhắc "có vỡ bên kia không" — đắt hơn
nhiều so với việc sửa hai chỗ một cách tường minh.

**Đổi lại, mỗi app được tối ưu triệt để cho môi trường của nó** — desktop không phải
mang theo bất kỳ giới hạn nào của MV3, extension không phải chờ desktop.

## 3.2. Hệ quả cần chấp nhận (và cách kiểm soát)

| Hệ quả | Kiểm soát |
|---|---|
| 13 locale tồn tại 2 bản, có thể lệch | Script `desktop/scripts/check-locale-parity.ts` — chỉ **cảnh báo** key có ở extension mà thiếu ở desktop, không ép đồng bộ. Chạy trong CI, không fail build |
| Sửa study prompt phải sửa 2 nơi | Checklist trong `CLAUDE.md`; hai bản prompt **được phép khác nhau** (desktop có ngữ cảnh ảnh màn hình, extension có ngữ cảnh trang web) |
| Provider catalog trùng | Chấp nhận — desktop bỏ `chrome-builtin`, thêm cấu hình riêng cho Ollama/LM Studio |
| Version riêng | `extension/manifest.json` và `desktop/package.json` **không ràng buộc nhau**. Quy tắc bump ở `CLAUDE.md` áp dụng độc lập cho từng app |

## 3.3. Việc "port" nghĩa là gì trong bối cảnh mới

Mục 2 vẫn đúng về **giá trị tham chiếu**, nhưng đổi nghĩa: các file Nhóm A không còn
là "cắt-dán vào package chung" mà là **bản tham chiếu để viết lại bằng TypeScript**.

| Nhóm | Cách xử lý |
|---|---|
| **A** — 13 locale (7.785 dòng) | Chuyển sang `.ts` có type, **giữ nguyên nội dung chuỗi**. Đây là phần chép cơ học nhiều nhất và an toàn nhất |
| **A** — `markdown-katex`, `icons`, `dictionary`, `key-rotator`, `study-prompt` | Viết lại có type. Logic giữ nguyên, thêm `interface` và tách file theo mục 4 của [desktop-app-structure.md](./desktop-app-structure.md) |
| **B** — `ai-engine`, `ai-stream`, `ocr-engine`, `storage` | **Viết lại theo kiến trúc mới**, không port trực tiếp: `ai-engine.js` hiện là một `switch` lớn — desktop dùng provider registry (xem structure doc mục 5.1) |
| **C** — UI | CSS Liquid Glass chép được gần nguyên; JS DOM thuần viết lại thành React component |
| **D** | Không liên quan |

**Ước lượng cập nhật:** giá trị tái sử dụng thực tế còn khoảng **40–45%** (chủ yếu là
locale, CSS, prompt, thuật toán), thay vì 75% như phương án lõi chung. Đây là cái giá
đã biết trước và chấp nhận.
# 4. Tổng quát hoá pipeline: từ "dịch" sang "mọi tác vụ AI"

Thay `processPoint(point) → TranslationOverlayResult` bằng ba giai đoạn tách bạch:

```text
   INTENT              ACQUISITION            EXECUTION            PRESENTATION
   (người dùng          (lấy nội dung          (xử lý)              (hiển thị)
    muốn gì)             từ màn hình)

  hover        ──┐   ┌── accessibility ──┐  ┌── Lane A ──┐   ┌── HoverOverlay
  hotkey       ──┤   │                   │  │ Translate  │   │  (click-through)
  region-select──┼──▶┤── screen capture ─┼─▶┤            ├──▶┤
  clipboard    ──┤   │      + OCR        │  │── Lane B ──│   │── ResultPanel
  file-drop    ──┤   │                   │  │  AiEngine  │   │  (có focus)
  tray-menu    ──┘   └── clipboard/file ─┘  └────────────┘   └── ChatWindow
```

## 4.1. Kiểu dữ liệu trung tâm

```ts
type Intent =
  | { kind: 'translate';  granularity: 'word' | 'sentence' | 'paragraph' }
  | { kind: 'solve';      studyMode: StudyMode }   // 5 chế độ hiện có
  | { kind: 'summarize';  length: 'short' | 'detailed' }
  | { kind: 'explain' }
  | { kind: 'rewrite';    tone?: string }
  | { kind: 'chat';       conversationId: string };

/** Kết quả của tầng thu nhận — thay cho `Point` của bản gốc */
interface AcquiredContent {
  text?: string;                 // từ Accessibility hoặc OCR
  image?: ImageBuffer;           // khi cần vision (đồ thị, công thức, hình vẽ)
  bounds: Rect;                  // toạ độ màn hình để neo overlay
  source: 'accessibility' | 'ocr' | 'capture' | 'clipboard' | 'file';
  confidence?: number;
  app?: ApplicationInfo;
}

interface Task { intent: Intent; content: AcquiredContent; }
```

## 4.2. Vì sao `image` phải là công dân hạng nhất

Đây là điểm **bản gốc thiếu hẳn**. Extension hiện tại có `content/cropper.js` +
vision model vì rất nhiều bài tập **không phải text**: đồ thị hàm số, hình học,
công thức hoá học, sơ đồ mạch điện. OCR chuyển chúng thành text là **mất thông tin**.

→ Quy tắc định tuyến thu nhận:

```text
intent = translate            → ưu tiên Accessibility, OCR là fallback (bản gốc đúng)
intent = solve | explain      → ưu tiên GỬI THẲNG ẢNH cho vision model,
                                text (AX/OCR) chỉ đi kèm làm ngữ cảnh phụ
intent = summarize            → ưu tiên Accessibility (cần nhiều text, ảnh tốn token)
```

---

# 5. Hai lane thực thi — quyết định kiến trúc quan trọng nhất

Bản gốc gộp mọi thứ vào một đường. Thực tế có **hai chế độ vận hành khác nhau về
bậc độ lớn** và không được để chúng chia sẻ hàng đợi, cache hay overlay:

| | **Lane A — Dịch nhanh** | **Lane B — Suy luận LLM** |
|---|---|---|
| Tác vụ | hover translate, tra từ | solve, summarize, explain, chat, rewrite |
| Backend | Google Translate endpoint (miễn phí, không key) | AiEngine đa provider + key rotation |
| Độ trễ | 200–400ms | 2–30s (streaming) |
| Chi phí | 0 | tính theo token |
| Kích hoạt | tự động khi rê chuột | **luôn do người dùng chủ động** |
| Cache | LRU + SQLite, hit rate cao | không cache (câu hỏi hiếm lặp) |
| Huỷ request | bắt buộc, liên tục | theo thao tác người dùng |
| Overlay | trong suốt, click-through, không focus | cửa sổ có focus, scroll, copy |
| Đã có sẵn | `content/hover-translate.js` | `background/ai-engine.js` |

**Quy tắc bất di bất dịch:** Lane B **không bao giờ tự kích hoạt bởi chuyển động chuột.**
Nếu vi phạm, một lần rê chuột qua màn hình = hàng chục lời gọi LLM tính phí.
Đây là rủi ro chi phí nghiêm trọng nhất của dự án.

---

# 6. Ma trận parity tính năng Extension → Desktop

| Tính năng extension | Vị trí hiện tại | Desktop | Thay đổi tầng thu nhận |
|---|---|---|---|
| **Hover Translate** | `content/hover-translate.js` | ✅ Có | DOM Range → Accessibility/OCR (đúng phạm vi `desktop-app.md`) |
| **Crop & Solve** (`Alt+C`) | `content/cropper.js` | ✅ Có, **mạnh hơn** | `captureVisibleTab` → OS capture: chụp được **mọi app**, không chỉ tab |
| **Chat Drawer** (`Alt+K`) | `content/overlay/drawer.js` | ✅ Có | Shadow DOM → `BrowserWindow` always-on-top |
| **Selection Toolbar** | `content/selection-tooltip.js` | ✅ Có, cần thiết kế lại trigger | Không có `selectionchange` toàn hệ thống → dùng hotkey + `AXSelectedText`, fallback region-select |
| **5 Study Modes** | `shared/study-prompt.js` | ✅ Nguyên trạng | không |
| **AI Routing + Key Pool** | `background/ai-engine.js` | ✅ Nguyên trạng | không |
| **Multi-conversation history** | `shared/storage.js` | ✅ **Nâng cấp** | `chrome.storage` (giới hạn 50 hội thoại) → SQLite, không giới hạn, tìm kiếm full-text |
| **13 locale UI** | `shared/i18n/` | ✅ Nguyên trạng | không |
| **Liquid Glass customization** | `options/tabs/appearance-tab.js` | ✅ **Nâng cấp** | CSS giữ nguyên + thêm vibrancy/acrylic thật của OS |
| **Local OCR (Tesseract WASM)** | `shared/ocr-engine.js` | ✅ **Nâng cấp** | + macOS Vision / Windows OCR (native, nhanh hơn ~10×), Tesseract làm fallback & cho `equ` |
| **Gemini Nano on-device** | `shared/nano-status.js` | ❌ **Mất** | Thay bằng Ollama/LM Studio (đã hỗ trợ). Đổi mặc định `routingStrategy` → `prefer_config` |
| **Google Forms auto-solve** | `content/forms-adapter.js` | ⚠️ **Suy giảm** | Chỉ gợi ý đáp án, không tự click. Auto-fill vẫn là **lợi thế độc quyền của extension** |
| **Quiz solver trên web** | `content/forms-adapter.js` | ⚠️ Suy giảm | như trên |

## 6.1. Tính năng chỉ desktop mới có (đề xuất mới)

Đây là phần biện minh cho việc làm desktop app thay vì chỉ dùng extension:

1. **Giải bài tập ở mọi ứng dụng** — PDF reader, Word, PowerPoint, ảnh chụp đề, phần mềm
   học tập offline, máy ảo, remote desktop. Extension bất lực với tất cả những thứ này.
2. **Clipboard watcher** — copy bất kỳ đoạn nào → hiện thanh hành động nổi
   (Dịch / Giải / Tóm tắt / Giải thích).
3. **Kéo–thả file vào tray** — thả PDF/ảnh → tóm tắt hoặc giải cả tài liệu.
4. **Hotkey toàn hệ thống theo tác vụ** — mỗi intent một phím tắt
   (`⌘⇧T` dịch vùng, `⌘⇧S` giải vùng, `⌘⇧M` tóm tắt vùng).
5. **Tóm tắt phụ đề video liên tục** — chế độ continuous của `desktop-app.md` §67
   nhưng áp cho intent `summarize`.
6. **Chạy hoàn toàn offline** — Ollama/LM Studio + native OCR = không cần mạng,
   không rời máy. Đây là điểm bán hàng mạnh cho môi trường giáo dục.

---

# 7. Bổ sung/điều chỉnh so với `desktop-app.md`

| Mục bản gốc | Điều chỉnh cần thiết |
|---|---|
| §62 `TranslationPipeline` | → `TaskPipeline` với `Intent` (mục 4.1) |
| §63 `TranslationOverlayResult` | → union: `TranslationResult` \| `StreamingResult` (markdown + KaTeX + trạng thái stream) |
| §34–38 Overlay Window | Tách **hai loại cửa sổ**: `HoverOverlay` (click-through) và `ResultPanel` (có focus) — mục 5 |
| §25 Translation Engine | Giữ nguyên cho Lane A; **thêm** AiEngine cho Lane B, hai hệ thống độc lập |
| §57 Data Model | Thêm bảng `conversations` / `messages` (port từ `DEFAULT_SETTINGS.conversations`) |
| §85 API Key Security | Bản gốc bàn về 1 key Google; thực tế cần bảo vệ **cả key pool đa provider** → OS keychain (`safeStorage` của Electron), không để plaintext |
| §93 Configuration | Phải khớp schema `DEFAULT_SETTINGS` hiện có (≈45 khoá) để hai sản phẩm cùng một mô hình cấu hình |
| §11–14 OCR | Bổ sung: giữ Tesseract cho `equ` (công thức toán) — native OCR của OS **không nhận diện được ký hiệu toán** |
| §159 Tech Stack | Bổ sung KaTeX + markdown renderer (đã có sẵn `shared/markdown-katex.js`) |

---

# 8. Lộ trình theo giai đoạn

> **Extension không bị đụng tới ở bất kỳ phase nào.** Không refactor, không dựng
> workspace, không di chuyển thư mục. Mọi công việc dưới đây diễn ra hoàn toàn
> bên trong `desktop/`.
>
> Chi tiết cấu trúc thư mục, registry, config/env và quy ước code:
> [desktop-app-structure.md](./desktop-app-structure.md).

## Phase 0 — Nền móng `desktop/`

**Mục tiêu: dựng khung TypeScript + toàn bộ tầng khai báo tập trung, trước khi
viết bất kỳ tính năng nào.** Đây là phase quyết định chất lượng cấu trúc — làm ẩu
ở đây thì god file xuất hiện từ Phase 2.

- [ ] `desktop/` với electron-vite + TypeScript strict + ESLint (bật `max-lines`,
      `max-lines-per-function`, `complexity` — xem structure doc mục 7)
- [ ] Ba `tsconfig` tách theo process (main / preload / renderer) + path alias
- [ ] `src/shared/ipc/channels.ts` — **contract IPC có type, khai báo một lần**
- [ ] `config/settings.schema.ts` — **schema cấu hình một nguồn sự thật**, sinh ra
      cả defaults, validator, kiểu TS và UI Settings (structure doc mục 5.2)
- [ ] `config/providers.config.ts`, `config/hotkeys.config.ts`, `config/ocr.config.ts`
- [ ] `.env.example` + `src/shared/env.ts` (validate bằng zod lúc khởi động)
- [ ] Chuyển 13 locale sang `.ts` có type — chép nội dung chuỗi từ extension
- [ ] `scripts/check-locale-parity.ts` (cảnh báo, không fail build)

**Nghiệm thu:** `npm run dev` mở cửa sổ trắng; thêm một setting mới = sửa **đúng một
file** và nó tự xuất hiện trong UI Settings với đủ 13 ngôn ngữ.

## Phase 1 — Khung Electron (tương ứng M1–M3 bản gốc)

- [ ] Bootstrap main process, tray, cửa sổ Settings (React)
- [ ] SQLite + migration runner; `SettingsService` đọc/ghi theo schema Phase 0
- [ ] IPC + preload theo contract Phase 0, **bao gồm streaming** (quan trọng nhất)
- [ ] Cửa sổ Settings tự render từ `settings.schema.ts` — 6 nhóm tab
- [ ] Global hotkey (đọc từ `hotkeys.config.ts`, user đổi được) + `HoverOverlay`
      trong suốt, click-through
- [ ] Key pool lưu qua `safeStorage` (OS keychain) — **không bao giờ vào `.env`**

**Nghiệm thu:** cấu hình được API key, chọn được ngôn ngữ UI trong 13 thứ tiếng,
đổi được hotkey.

## Phase 2 — Lane B trước Lane A (đảo thứ tự bản gốc)

> **Đây là khác biệt lớn nhất so với `desktop-app.md`.** Bản gốc đặt Accessibility
> ở M4 và OCR ở M5, trước cả translation ở M6. Nhưng **Crop & Solve chỉ cần screen
> capture + vision model** — không cần Accessibility, không cần OCR, không cần
> mouse tracking, không cần sentence detection. Nó là con đường ngắn nhất tới một
> sản phẩm dùng được thật, và nó bám sát nhất phần logic đã được kiểm chứng ở extension.

- [ ] Screen capture + region selector (port `content/cropper.js`)
- [ ] `AiEngine` + `KeyRotator` + 3 provider adapter trong main process theo
      provider registry (structure doc mục 5.1) — không còn offscreen, không còn `switch`
- [ ] `ResultPanel`: streaming markdown + KaTeX (port `markdown-katex.js` + `floating-card.js`)
- [ ] 5 study mode + chọn ngôn ngữ đầu ra
- [ ] Chat window đa hội thoại trên SQLite (port `drawer.js`)
- [ ] Ollama / LM Studio detection thay cho Gemini Nano

**Nghiệm thu:** `⌘⇧S` → khoanh vùng bất kỳ trên màn hình → lời giải streaming có công thức.
**Tại đây app đã có giá trị sử dụng thật**, độc lập với toàn bộ phần Accessibility/OCR.

## Phase 3 — Lane A: Hover Translate (M2, M4–M7 bản gốc)

- [ ] Mouse tracking toàn cục + debounce + huỷ request
- [ ] macOS Accessibility (AXUIElement) → `getTextAtPoint`
- [ ] macOS Vision OCR fallback
- [ ] Sentence detection, tolerance zone, text stability (§19–33 bản gốc — dùng nguyên)
- [ ] Google Translate provider + LRU/SQLite cache
- [ ] Hệ thống quyền macOS (Accessibility + Screen Recording) + onboarding

**Nghiệm thu:** rê chuột trên PDF/VS Code/app native → tooltip dịch trong <400ms.

## Phase 4 — Mở rộng intent & Windows

- [ ] Intent `summarize` / `explain` / `rewrite` dùng lại pipeline Phase 2
- [ ] Clipboard watcher + thanh hành động nổi
- [ ] Kéo–thả file (PDF/ảnh)
- [ ] Windows: UI Automation + Windows OCR + xử lý DPI
- [ ] Native OCR + Tesseract fallback cho `equ`

## Phase 5 — Sản phẩm hoá

- [ ] Đa màn hình, Retina/DPI, fullscreen, exclusion zone cho app nhạy cảm
- [ ] electron-builder, ký số (notarize macOS / code-sign Windows), auto-update
- [ ] Chế độ hiệu năng Fast/Balanced/Accurate (§51 bản gốc)
- [ ] Telemetry opt-in, trang chẩn đoán (§92 bản gốc)

---

# 9. Rủi ro & các quyết định cần chốt trước khi code

## 9.1. Rủi ro kỹ thuật

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **Lane B bị kích hoạt bởi chuột → cháy chi phí API** | 🔴 Cao | Bất biến kiến trúc: Lane B chỉ nhận intent do người dùng chủ động. Thêm hạn mức request/phút + hiển thị số token đã dùng |
| Accessibility trên macOS không ổn định với Electron/Chromium app | 🔴 Cao | Đây là rủi ro đã biết của bản gốc §10.4. Phase 2 không phụ thuộc vào nó → sản phẩm vẫn dùng được nếu Phase 3 chậm |
| ~~Native module làm vỡ packaging & auto-update~~ | ✅ **Đã giải quyết** | Dùng `node:sqlite` dựng sẵn thay better-sqlite3 — không còn native module nào. Xem [ADR-0005](../dev/decisions/0005-dung-node-sqlite.md) |
| Streaming qua Electron IPC bị nghẽn/rò | 🟠 TB | Thiết kế `Bus.stream` với backpressure + abort ngay từ Phase 1 |
| Mất Gemini Nano làm hỏng trải nghiệm "dùng ngay không cần key" | 🟠 TB | Onboarding hướng dẫn cài Ollama; hoặc bundle sẵn một model nhỏ |
| Quyền Screen Recording khiến người dùng bỏ cuộc ở lần chạy đầu | 🟠 TB | Phase 2 (`solve`) cần quyền này ngay → onboarding phải rất tốt, có màn hình kiểm tra như §95 |
| **13 locale hai bản trôi khỏi nhau theo thời gian** | 🟠 TB | Hệ quả đã chấp nhận của mục 3. `check-locale-parity.ts` cảnh báo key lệch; quy tắc §1 `CLAUDE.md` áp riêng cho từng app |
| Cấu trúc `desktop/` phình thành god file như `floating-card.js` (884 dòng) của extension | 🟠 TB | ESLint chặn cứng ở 400 dòng/file, 50 dòng/hàm ngay từ Phase 0 — trước khi có code để mà nhân nhượng |
| Schema cấu hình tập trung trở thành nút thắt (mọi thứ đổ vào một file) | 🟡 Thấp | `settings.schema.ts` chia theo nhóm, mỗi nhóm một file, gộp lại ở `index.ts` |

## 9.2. Quyết định

### Đã chốt

1. ✅ **Tách hoàn toàn** — hai app độc lập trong một repo, không có lõi dùng chung,
   chấp nhận sửa hai nơi (mục 3).
2. ✅ **Desktop dùng TypeScript strict** — extension giữ nguyên JavaScript ESM.

### Còn cần chốt

3. **Phạm vi MVP desktop:** làm cả `solve` + `translate`, hay ship `solve` trước
   (Phase 2) rồi mới tới `translate` (Phase 3)? — Khuyến nghị: **ship Phase 2 trước.**
4. **Windows song song hay sau macOS?** Bản gốc để Windows ở M8; khuyến nghị giữ vậy.
5. **Đổi tên repo?** `homework-ai-extension` → `homework-ai` cho đúng phạm vi mới.
6. **Mô hình phân phối:** miễn phí tự cấu hình key (như extension), hay có bản trả phí
   với key sẵn? Ảnh hưởng trực tiếp tới thiết kế §85–86 của bản gốc.

---

# 10. Việc nên làm ngay tuần này

1. Chốt 4 quyết định còn lại ở mục 9.2.
2. Bắt đầu **Phase 0** — dựng `desktop/` và tầng khai báo tập trung theo
   [desktop-app-structure.md](./desktop-app-structure.md). Extension không bị đụng tới,
   nên phase này rủi ro bằng không với sản phẩm đang chạy.
3. Làm một **spike 1 ngày** kiểm chứng hai giả định đắt nhất, trước khi cam kết lộ trình:
   - Electron `desktopCapturer` + region selector có chụp được vùng màn hình đúng
     toạ độ trên macOS Retina đa màn hình không?
   - `AXUIElementCopyElementAtPosition` có lấy được text từ Chrome/VS Code/Preview không?

   Nếu spike thứ hai thất bại, Phase 3 phải chuyển hẳn sang OCR-first — biết sớm
   tiết kiệm được vài tuần.
