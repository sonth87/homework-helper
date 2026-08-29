# Desktop App — Cấu trúc Mã nguồn & Quy ước Tổ chức

> Tài liệu đồng hành với [desktop-app-implementation-plan.md](./desktop-app-implementation-plan.md).
> Phạm vi: **chỉ `desktop/`**. Extension không bị đụng tới ở bất kỳ điểm nào.

**Bốn mục tiêu của tài liệu này:**

1. Chốt TypeScript và giải thích vì sao phù hợp với **đúng bài toán này**.
2. Tổ chức thư mục theo ranh giới process của Electron, không theo "loại file".
3. **Khai báo tập trung**: mỗi khái niệm (provider, setting, hotkey, intent, IPC
   channel, chuỗi ngôn ngữ) được định nghĩa **đúng một lần**, mọi nơi khác dẫn xuất ra.
4. Chống god file bằng luật cứng do lint ép, không dựa vào kỷ luật cá nhân.

---

# 1. TypeScript — phù hợp, và giờ không còn ma sát

Lý do duy nhất khiến TS từng là câu hỏi mở: nếu có lõi dùng chung với extension thì
extension (JavaScript ESM, nạp thẳng vào Chrome, không build step) sẽ bị kéo theo một
bước biên dịch mà nó không cần. **Quyết định tách hoàn toàn đã xoá bỏ ma sát đó.**
Electron vốn đã bắt buộc có bundler, nên TS không thêm bước build nào cả.

Bốn lý do TS đặc biệt đáng giá cho app này — không phải lý do chung chung:

## 1.1. Ba ranh giới process, tất cả đều là structured message

`main ↔ preload ↔ renderer` truyền object qua IPC. Không có type, một lần đổi tên field
trong payload sẽ **không lỗi lúc dev, chỉ lỗi lúc chạy bản đóng gói**. Với contract có
type (mục 5.3), sai lệch bị bắt ngay lúc biên dịch ở cả hai đầu.

## 1.2. Toạ độ — nơi TS cứu nhiều bug nhất

`desktop-app.md` §18 và §70 đã chỉ ra đây là phần khó nhất. Trong app này một `{x, y}`
có thể nằm ở **bốn không gian toạ độ khác nhau**:

```text
screen-physical   pixel vật lý, đã nhân DPI/Retina
screen-logical    điểm logic của OS (macOS point, Windows DIP)
window-relative   gốc là góc BrowserWindow
image-relative    gốc là góc ảnh đã chụp/crop
```

Trộn nhầm hai không gian **không ném lỗi** — overlay chỉ hiện lệch, và trên máy 1× thì
bug vô hình hoàn toàn. Branded type biến lỗi runtime này thành lỗi biên dịch:

```ts
// src/shared/types/geometry.ts
declare const __space: unique symbol;
type Space = 'screen-physical' | 'screen-logical' | 'window' | 'image';

export type Point<S extends Space> = { x: number; y: number; readonly [__space]: S };
export type Rect<S extends Space>  = Point<S> & { w: number; h: number };

// Chuyển đổi chỉ được phép qua các hàm tường minh trong geometry/convert.ts
export function toPhysical(p: Point<'screen-logical'>, scale: number): Point<'screen-physical'>;
```

Chỉ riêng điều này đã đủ biện minh cho TS ở một app xử lý màn hình đa DPI.

## 1.3. Provider đa dạng năng lực

Gemini / OpenAI-compatible / Claude / Ollama / LM Studio khác nhau ở: có vision không,
có thinking không, có structured output không, hình dạng SSE chunk ra sao. Discriminated
union + `ProviderCapabilities` khiến "gửi ảnh cho model text-only" trở thành lỗi biên dịch.

## 1.4. Schema cấu hình sinh ra kiểu

`settings.schema.ts` (mục 5.2) khai báo một lần, `z.infer` sinh ra `type Settings`.
Thêm một setting là tự động có type ở cả main lẫn renderer, không phải khai báo lại.

## 1.5. Cấu hình bắt buộc

```jsonc
// desktop/tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,      // bắt buộc — tránh undefined ngầm
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true             // không dùng enum/namespace/decorator cổ
  }
}
```

Ba `tsconfig` kế thừa từ base, tách theo process vì mỗi bên có `lib` khác nhau:
`tsconfig.main.json` (Node + Electron, không DOM), `tsconfig.preload.json`,
`tsconfig.renderer.json` (DOM, không Node).

---

# 2. Cấu trúc repo

```text
homework-ai-extension/
├── extension/          ← MV3, JavaScript, KHÔNG ĐỤNG TỚI
├── desktop/            ← Electron + TypeScript, tự chứa hoàn toàn
├── roadmap/
├── docs/
└── package.json        ← chỉ script tiện ích, không phải workspace
```

Root `package.json` **không** là workspace, chỉ để gõ lệnh cho tiện:

```jsonc
{
  "scripts": {
    "ext:zip":     "node build-zip.js",
    "desktop:dev": "npm --prefix desktop run dev",
    "desktop:build": "npm --prefix desktop run build"
  }
}
```

Hai app có `node_modules` riêng, dependency riêng, version riêng, CI job riêng.

---

# 3. Cấu trúc `desktop/`

Chia theo **ranh giới process của Electron trước, theo tính năng sau** — vì ranh giới
process là ràng buộc cứng (khác `lib`, khác quyền, khác vòng đời), còn tính năng thì mềm.

```text
desktop/
├── package.json
├── electron.vite.config.ts
├── electron-builder.yml
├── tsconfig.{base,main,preload,renderer}.json
├── eslint.config.js               ← luật chống god file (mục 7)
├── .env.example                   ← .env thật nằm trong .gitignore
│
├── config/                        ← ★ KHAI BÁO TẬP TRUNG, build-time, commit vào git
│   ├── app.config.ts              ← id, tên, đường dẫn userData, giới hạn cứng
│   ├── providers.config.ts        ← catalog provider AI + năng lực từng loại
│   ├── models.config.ts           ← model gợi ý sẵn cho mỗi provider
│   ├── ocr.config.ts              ← catalog model OCR (port từ ocr-engine.js)
│   ├── hotkeys.config.ts          ← hotkey mặc định cho từng intent
│   ├── intents.config.ts          ← ★ định nghĩa 6 intent (mục 5.5)
│   ├── study-modes.config.ts      ← 5 chế độ học tập
│   ├── languages.config.ts        ← 13 UI lang + danh sách ngôn ngữ đích
│   ├── theme.config.ts            ← design token Liquid Glass
│   ├── limits.config.ts           ← timeout, retry, debounce, cache TTL
│   └── settings/                  ← ★ SCHEMA CẤU HÌNH (mục 5.2)
│       ├── ai.settings.ts
│       ├── intent.settings.ts
│       ├── acquisition.settings.ts
│       ├── appearance.settings.ts
│       ├── language.settings.ts
│       ├── privacy.settings.ts
│       ├── storage.settings.ts
│       ├── system.settings.ts
│       ├── advanced.settings.ts
│       └── index.ts               ← gộp 9 nhóm, sinh defaults + zod + type
│
├── src/
│   ├── shared/                    ← ★ dùng bởi CẢ main lẫn renderer
│   │   │                            BẮT BUỘC isomorphic: cấm import 'electron',
│   │   │                            cấm 'node:*' (lint chặn — mục 7.3)
│   │   ├── types/
│   │   │   ├── geometry.ts        ← Point/Rect có brand không gian toạ độ
│   │   │   ├── intent.ts          ← Intent, Task, AcquiredContent
│   │   │   ├── ai.ts              ← ProviderId, AiDelta, Capabilities
│   │   │   ├── content.ts         ← OcrResult, AccessibilityText, ApplicationInfo
│   │   │   └── result.ts          ← TranslationResult | StreamingResult
│   │   ├── ipc/
│   │   │   ├── channels.ts        ← ★ contract IPC có type (mục 5.3)
│   │   │   └── serialize.ts       ← chuẩn hoá Error/Buffer qua ranh giới IPC
│   │   ├── i18n/
│   │   │   ├── locales/           ← 13 file .ts, cùng nội dung chuỗi với extension
│   │   │   ├── keys.ts            ← ★ union type mọi key — thiếu key = lỗi biên dịch
│   │   │   └── index.ts           ← t(), resolver, fallback
│   │   ├── env.ts                 ← đọc + validate env bằng zod (mục 6.2)
│   │   └── utils/                 ← thuần hàm, không side effect, mỗi file 1 chủ đề
│   │       ├── text-normalize.ts
│   │       ├── sentence-split.ts
│   │       ├── debounce.ts
│   │       └── result.ts          ← Result<T, E>, tránh throw xuyên IPC
│   │
│   ├── main/
│   │   ├── index.ts               ← ★ ≤ 60 dòng, CHỈ gọi các init*()
│   │   ├── bootstrap/             ← mỗi bước khởi động một file
│   │   │   ├── init-db.ts
│   │   │   ├── init-settings.ts
│   │   │   ├── init-ipc.ts
│   │   │   ├── init-tray.ts
│   │   │   ├── init-hotkeys.ts
│   │   │   ├── init-windows.ts
│   │   │   └── init-permissions.ts
│   │   ├── ipc/                   ← handler mỏng: validate → gọi service → trả về
│   │   │   ├── settings.ipc.ts
│   │   │   ├── ai.ipc.ts
│   │   │   ├── capture.ipc.ts
│   │   │   ├── ocr.ipc.ts
│   │   │   └── history.ipc.ts
│   │   ├── windows/               ← mỗi loại cửa sổ một file + factory chung
│   │   │   ├── window-factory.ts
│   │   │   ├── settings.window.ts
│   │   │   ├── chat.window.ts
│   │   │   ├── result.window.ts   ← có focus, scroll, copy
│   │   │   ├── hover.window.ts    ← trong suốt, click-through
│   │   │   └── region-select.window.ts
│   │   ├── settings/
│   │   │   ├── settings.service.ts
│   │   │   ├── settings.migrate.ts
│   │   │   └── settings.watch.ts  ← phát tán thay đổi tới mọi cửa sổ
│   │   ├── secrets/
│   │   │   └── keychain.ts        ← safeStorage — API key user, KHÔNG vào .env
│   │   ├── db/
│   │   │   ├── connection.ts
│   │   │   ├── migrations/        ← 001_init.ts, 002_… đánh số tăng dần
│   │   │   └── repositories/      ← mỗi bảng một repo, không SQL rải rác
│   │   │       ├── conversation.repo.ts
│   │   │       ├── message.repo.ts
│   │   │       ├── cache.repo.ts
│   │   │       └── usage.repo.ts  ← đếm token để cảnh báo chi phí
│   │   ├── ai/
│   │   │   ├── ai.service.ts      ← điều phối; KHÔNG chứa code riêng provider
│   │   │   ├── key-rotator.ts
│   │   │   ├── prompt/
│   │   │   │   ├── build-prompt.ts
│   │   │   │   ├── language-directive.ts
│   │   │   │   └── dictionary-schema.ts
│   │   │   └── providers/         ← ★ REGISTRY (mục 5.1) — mỗi provider 1 thư mục
│   │   │       ├── types.ts
│   │   │       ├── index.ts       ← map id → adapter, KHÔNG có switch ở nơi khác
│   │   │       ├── gemini/{request,stream,errors}.ts
│   │   │       ├── openai-compatible/{request,stream,errors}.ts
│   │   │       ├── claude/{request,stream,errors}.ts
│   │   │       └── local/         ← ollama, lmstudio + detect
│   │   ├── translate/             ← Lane A, tách hẳn khỏi ai/ (mục 5 của plan)
│   │   │   ├── translate.service.ts
│   │   │   ├── google.provider.ts
│   │   │   └── cache.ts
│   │   ├── acquisition/           ← ★ tầng thu nhận nội dung
│   │   │   ├── acquire.ts         ← chọn chiến lược theo intent
│   │   │   ├── accessibility/{index,darwin,win32}.ts
│   │   │   ├── ocr/{index,native-darwin,native-win32,tesseract}.ts
│   │   │   ├── capture/{index,region,display}.ts
│   │   │   ├── clipboard.ts
│   │   │   └── mouse/{tracker,debounce}.ts
│   │   ├── pipeline/              ← ghép acquisition + execution + presentation
│   │   │   ├── task-pipeline.ts
│   │   │   ├── lane-fast.ts       ← Lane A
│   │   │   ├── lane-llm.ts        ← Lane B
│   │   │   ├── cancellation.ts
│   │   │   └── guards.ts          ← ★ chặn Lane B tự kích hoạt bởi chuột
│   │   ├── permissions/{darwin,win32,check}.ts
│   │   ├── app-detect/            ← app đang foreground (cho exclusion + history)
│   │   ├── updater/
│   │   └── logging/
│   │
│   ├── preload/
│   │   ├── index.ts               ← contextBridge, CHỈ expose theo channels.ts
│   │   └── api.ts                 ← không rò rỉ ipcRenderer ra renderer
│   │
│   └── renderer/
│       ├── windows/               ← mỗi BrowserWindow một entry HTML + main.tsx
│       │   ├── settings/
│       │   │   ├── main.tsx
│       │   │   ├── SettingsApp.tsx
│       │   │   ├── groups/        ← 1 file/nhóm setting, render TỪ schema
│       │   │   └── controls/      ← ★ 1 file/kiểu control (mục 5.2)
│       │   ├── chat/
│       │   ├── result/
│       │   ├── hover/
│       │   └── region-select/
│       ├── components/            ← dùng chung nhiều cửa sổ
│       │   ├── markdown/          ← markdown + KaTeX (tham chiếu markdown-katex.js)
│       │   ├── glass/             ← Liquid Glass primitives
│       │   └── icons/             ← tham chiếu icons.js
│       ├── hooks/                 ← useSettings, useStream, useI18n, useHotkey
│       ├── stores/                ← zustand, mỗi domain một store
│       ├── styles/                ← token + CSS chép từ content/styles/*.css
│       └── lib/                   ← wrapper gọi preload API
│
├── native/                        ← chỉ dựng ở Phase 3+, khi đã đo được nút thắt
├── resources/                     ← icon, traineddata, tray asset
├── scripts/
│   ├── check-locale-parity.ts     ← cảnh báo key lệch với extension
│   └── check-settings-i18n.ts     ← mọi setting phải có đủ 13 bản dịch
└── tests/
```

---

# 4. Ba luật phân tầng (lint ép, không phải quy ước miệng)

```text
1. renderer  KHÔNG BAO GIỜ import từ  main/
2. main      KHÔNG BAO GIỜ import React / thư viện UI
3. shared/   KHÔNG BAO GIỜ import 'electron' hay 'node:*'
```

Luật 3 là luật hay bị vi phạm nhất và hậu quả nặng nhất: chỉ cần một `import { app }
from 'electron'` lọt vào `shared/`, bundle renderer sẽ vỡ ở **bản đóng gói** chứ không
phải lúc dev. Chặn bằng `import/no-restricted-paths` (mục 7.3).

---

# 5. Khai báo tập trung — năm registry

Nguyên tắc chung: **một khái niệm được định nghĩa đúng một lần; mọi nơi khác dẫn xuất
ra từ đó.** Thêm một provider / một setting / một intent / một hotkey không được phép
đòi hỏi sửa nhiều file rải rác.

## 5.1. Provider registry — thay cho `switch`

Extension hiện dùng `switch (config.provider)` trong [`ai-engine.js`](../extension/background/ai-engine.js)
và ba hàm `streamGemini` / `streamOpenAiCompatible` / `streamClaude` trong một file
469 dòng. Thêm provider thứ tư nghĩa là sửa cả hai chỗ. Desktop đảo ngược quan hệ đó:

```ts
// src/main/ai/providers/types.ts
export interface ProviderCapabilities {
  vision: boolean;
  streaming: boolean;
  thinking: boolean;
  structuredOutput: boolean;
  maxImageBytes?: number;
}

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;
  buildRequest(ctx: RequestContext): ProviderRequest;
  parseChunk(raw: string, state: ParseState): AiDelta[];
  normalizeError(err: unknown): ProviderError;
}
```

```ts
// src/main/ai/providers/index.ts — NƠI DUY NHẤT biết danh sách provider
export const PROVIDERS = {
  gemini:   geminiAdapter,
  openai:   openAiCompatibleAdapter,
  claude:   claudeAdapter,
  ollama:   ollamaAdapter,
  lmstudio: lmStudioAdapter,
} satisfies Record<ProviderId, ProviderAdapter>;
```

`ai.service.ts` chỉ làm: `const adapter = PROVIDERS[config.provider]`. **Không có
`switch` nào khác trong toàn bộ codebase.**

Ba lợi ích cụ thể:
- Thêm provider = thêm **một thư mục**, sửa **một dòng** trong `index.ts`.
- `capabilities` được kiểm tra **trước khi** gửi request → không còn lỗi "gửi ảnh cho
  model text-only" phát hiện muộn.
- `buildRequest` / `parseChunk` / `normalizeError` tách ba mối quan tâm → mỗi provider
  còn khoảng 80–120 dòng thay vì góp phần vào một file 469 dòng.

## 5.2. Settings schema — một nguồn sự thật sinh ra năm thứ

Đây là registry quan trọng nhất cho yêu cầu "hỗ trợ tối đa những thứ user cấu hình được".

```ts
// config/settings/appearance.settings.ts
export const appearanceSettings = defineSettings('appearance', {
  overlayTheme: {
    type: 'enum',
    options: ['auto', 'light', 'dark'],
    default: 'auto',
    i18n: 'setOverlayTheme',
    surfaces: ['hover', 'result', 'chat'],   // áp riêng cho từng loại cửa sổ
  },
  popupOpacity: {
    type: 'number', min: 40, max: 100, step: 1, default: 92, unit: '%',
    i18n: 'setPopupOpacity',
  },
  popupBlur: {
    type: 'number', min: 0, max: 30, step: 1, default: 16, unit: 'px',
    i18n: 'setPopupBlur',
  },
} as const);
```

Từ **một** khai báo đó, `config/settings/index.ts` dẫn xuất ra:

```text
1. DEFAULT_SETTINGS      → object mặc định, không viết tay lần hai
2. settingsZodSchema     → validate khi đọc từ DB và khi nhận qua IPC
3. type Settings         → z.infer, dùng chung main + renderer
4. UI Settings           → duyệt schema, render control theo `type`
5. Migration             → so khoá đã lưu với khoá schema, tự thêm/xoá
```

Renderer chỉ cần **một component cho mỗi `type`** — `controls/EnumControl.tsx`,
`NumberControl.tsx`, `BooleanControl.tsx`, `TextControl.tsx`, `HotkeyControl.tsx`,
`ListControl.tsx`. Trang Settings không hardcode một control nào.

> **Hệ quả thực tế:** thêm một tuỳ chọn mới cho người dùng = thêm **một entry** vào
> đúng một file, cộng 13 chuỗi dịch. Nó tự xuất hiện trong UI, tự được validate,
> tự có type, tự được migrate. So với extension hiện tại — nơi thêm một setting phải
> sửa `storage.js` + `options.html` + `options.js` + tab tương ứng + 13 locale —
> đây là khác biệt lớn nhất về chi phí mở rộng.

Để tránh chính `settings/` thành god file: chia **9 nhóm, mỗi nhóm một file**, gộp ở
`index.ts`. `index.ts` chỉ gộp, không chứa định nghĩa.

## 5.3. IPC contract — một nơi, hai đầu cùng type

```ts
// src/shared/ipc/channels.ts
export const IPC = {
  'settings:get':     req<void, Settings>(),
  'settings:patch':   req<Partial<Settings>, void>(),
  'secrets:setKey':   req<{ configId: string; apiKey: string }, void>(),
  'capture:region':   req<void, CaptureResult | null>(),
  'ocr:recognize':    req<OcrParams, OcrResult>(),
  'translate:quick':  req<QuickTranslateParams, TranslationResult>(),
  'ai:ask':           stream<AskParams, AiDelta>(),   // ★ kênh streaming
  'history:list':     req<ListParams, Conversation[]>(),
} as const;

export type Channel = keyof typeof IPC;
```

`preload/api.ts` duyệt đúng object này để expose — **không thể expose nhầm kênh
không khai báo**, và cũng không rò `ipcRenderer` ra renderer.

`stream<>()` phải được thiết kế ngay từ Phase 0 với **abort + backpressure**, vì đây là
đường đi của mọi phản hồi LLM và là rủi ro 🟠 đã ghi trong plan.

## 5.4. i18n — cùng nội dung với extension, nhưng có type

```ts
// src/shared/i18n/keys.ts
export type I18nKey = keyof typeof import('./locales/en').default;
```

Hàm `t(key: I18nKey)` khiến **gõ sai key là lỗi biên dịch**, và locale thiếu key cũng
là lỗi biên dịch — thay cho lưới an toàn `d.xxx || '...'` mà extension đang dùng.
Chuỗi vẫn giữ nguyên phẳng theo nhóm như extension để chép qua lại được dễ dàng.

`scripts/check-settings-i18n.ts` bảo đảm **mọi setting trong schema đều có đủ 13 bản
dịch** trước khi build — biến quy tắc §1 của `CLAUDE.md` từ checklist thủ công thành
kiểm tra tự động.

## 5.5. Intent registry — nơi mọi tính năng được khai báo

```ts
// config/intents.config.ts
export const INTENTS = {
  translate: {
    lane: 'fast',                          // ★ quyết định Lane A hay Lane B
    defaultHotkey: { darwin: 'Cmd+Shift+T', win32: 'Ctrl+Shift+T' },
    acquisition: ['accessibility', 'ocr'], // thứ tự ưu tiên
    needsImage: false,
    i18n: 'intentTranslate',
  },
  solve: {
    lane: 'llm',
    defaultHotkey: { darwin: 'Cmd+Shift+S', win32: 'Ctrl+Shift+S' },
    acquisition: ['capture'],              // ưu tiên ảnh, không OCR trước
    needsImage: true,
    defaultStudyMode: 'step-by-step',
    i18n: 'intentSolve',
  },
  summarize: { lane: 'llm', acquisition: ['accessibility', 'ocr'], needsImage: false, … },
  explain:   { lane: 'llm', … },
  rewrite:   { lane: 'llm', … },
  chat:      { lane: 'llm', acquisition: [], … },
} as const;
```

Một khai báo này điều khiển đồng thời: hotkey mặc định, chiến lược thu nhận, chọn lane,
loại cửa sổ hiển thị, mục trong tray menu, mục trong thanh hành động nổi, và nhóm
setting per-intent. **Thêm một tính năng AI mới = thêm một entry + một prompt builder.**

`lane: 'llm'` cũng chính là dữ liệu để `pipeline/guards.ts` chặn cứng: intent thuộc
lane `llm` **không được phép** kích hoạt từ nguồn `mouse-move`.

## 5.6. Theme token

`config/theme.config.ts` giữ toàn bộ biến Liquid Glass (màu, blur, radius, shadow,
easing) → xuất ra CSS custom properties lúc build. Không hardcode màu trong component.

---

# 6. Bốn tầng cấu hình — config, env, settings, secret

Đây là phần dễ nhầm nhất. Quy tắc phân loại dứt khoát:

| Tầng | Nơi lưu | Đổi lúc nào | Ai đổi | Vào git? |
|---|---|---|---|---|
| **Config sản phẩm** | `config/*.ts` | build-time | dev | ✅ có |
| **Env** | `.env`, CI secrets | build/deploy | dev, CI | ❌ chỉ `.env.example` |
| **User settings** | SQLite | runtime | **người dùng** | ❌ |
| **Secret của user** | OS keychain | runtime | **người dùng** | ❌ |

## 6.1. Câu hỏi quyết định

```text
Người dùng cuối có cần đổi được không?
   ├── CÓ  → User settings (SQLite), khai báo trong config/settings/
   └── KHÔNG
        ├── Là bí mật của NGƯỜI DÙNG (API key)?  → OS keychain
        ├── Khác nhau giữa các MÁY BUILD / môi trường?  → .env
        └── Còn lại → config/*.ts
```

> **Sai lầm phải tránh:** để API key của người dùng vào `.env`. Đó là **dữ liệu của
> người dùng**, không phải cấu hình build — nó phải nằm trong OS keychain qua
> `safeStorage`, mã hoá theo tài khoản OS, và không bao giờ chạm vào ổ đĩa ở dạng
> plaintext. `.env` chỉ chứa bí mật của **nhà phát triển**.

## 6.2. `.env` chứa đúng những gì

```bash
# desktop/.env.example
NODE_ENV=development
LOG_LEVEL=info                  # error | warn | info | debug | trace
VITE_DEV_SERVER_PORT=5173

UPDATE_FEED_URL=                # endpoint auto-update
SENTRY_DSN=                     # để trống là tắt crash reporting

# Chỉ dùng khi ký số & phát hành — nằm trong CI secrets, không nằm trên máy dev
APPLE_ID=
APPLE_APP_SPECIFIC_PASSWORD=
APPLE_TEAM_ID=
CSC_LINK=
CSC_KEY_PASSWORD=
GH_TOKEN=
```

Đọc qua `src/shared/env.ts`, validate bằng zod **lúc khởi động**, fail nhanh với thông
báo rõ ràng. Không có `process.env.X` rải rác trong code — chỉ một nơi đọc.

## 6.3. Vì sao không dùng `.env` cho hằng số sản phẩm

Catalog provider, danh sách model OCR, giới hạn timeout... nằm ở `config/*.ts` chứ
không phải `.env` vì chúng cần **type checking, autocomplete và cấu trúc lồng nhau** —
những thứ mà biến môi trường dạng chuỗi phẳng không có. `.env` chỉ hợp cho giá trị vô
hướng thay đổi theo môi trường.

---

# 7. Chống god file — luật cứng

## 7.1. Bài học từ chính extension

Extension hiện có những file đã vượt ngưỡng dễ bảo trì:

```text
content/overlay/floating-card.js   884 dòng
sidepanel/sidepanel.js             797 dòng
content/overlay/drawer.js          768 dòng
content/overlay.js                 706 dòng
shared/storage.js                  633 dòng
options/tabs/appearance-tab.js     595 dòng
```

Chúng phình dần vì **không có ngưỡng nào bị vi phạm một cách rõ ràng** — mỗi lần chỉ
thêm 30 dòng. Cách duy nhất hiệu quả là đặt ngưỡng cứng **trước khi có code**.

## 7.2. Ngưỡng

| Đối tượng | Cảnh báo | Lỗi (chặn commit) |
|---|---|---|
| File | 250 dòng | **400 dòng** |
| Hàm | 40 dòng | **60 dòng** |
| React component | 120 dòng | **180 dòng** |
| Độ phức tạp chu trình | 10 | **15** |
| Tham số hàm | 3 | **4** (nhiều hơn thì dùng object) |
| Độ sâu lồng nhau | 3 | **4** |

Quy ước bổ sung:
- **Một file = một trách nhiệm**, tên file khớp export chính.
- `index.ts` **chỉ re-export**, không chứa logic.
- `main/index.ts` ≤ 60 dòng, chỉ gọi các `init*()` trong `bootstrap/`.
- IPC handler **chỉ** validate → gọi service → trả về. Không có nghiệp vụ trong handler.
- Component React chỉ render; logic đi vào hook; gọi IPC đi vào `lib/`.
- Không có `utils.ts` chung chung — mỗi tiện ích một file theo chủ đề.

## 7.3. ESLint ép luật

```js
// desktop/eslint.config.js (trích)
rules: {
  'max-lines':              ['error', { max: 400, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
  'max-params':             ['error', 4],
  'max-depth':              ['error', 4],
  'complexity':             ['error', 15],

  'import/no-restricted-paths': ['error', { zones: [
    { target: './src/renderer', from: './src/main',
      message: 'renderer không được import từ main — dùng IPC contract' },
    { target: './src/shared',   from: './src/main' },
    { target: './src/shared',   from: './src/renderer' },
  ]}],

  'no-restricted-imports': ['error', { patterns: [
    { group: ['electron', 'node:*'],
      message: "shared/ phải isomorphic — chuyển sang main/ hoặc renderer/" },
  ]}],
}
```

Luật cuối áp `overrides` chỉ cho `src/shared/**`. Ngưỡng 400 dòng có thể nới cho
`src/shared/i18n/locales/*.ts` (file dữ liệu thuần, không phải logic).

---

# 8. Danh mục cấu hình cho người dùng

Extension hiện có ~45 khoá. Desktop nên mở rộng đáng kể — đây là danh mục đề xuất,
nhóm đúng theo 9 file trong `config/settings/`:

## 8.1. AI & Định tuyến (`ai.settings.ts`)
Key pool (thêm/sửa/xoá/bật-tắt/kéo thả ưu tiên) · chiến lược định tuyến · số lần retry ·
thời gian cooldown khi lỗi · timeout request · max output tokens · temperature ·
bật/tắt thinking · **hạn mức token mỗi ngày/tháng + ngưỡng cảnh báo** ·
**giới hạn request mỗi phút** · endpoint tuỳ biến · URL Ollama/LM Studio.

## 8.2. Theo từng Intent (`intent.settings.ts`) — ★ nâng cấp so với extension
Mỗi intent (`translate`/`solve`/`summarize`/`explain`/`rewrite`/`chat`) cấu hình **độc lập**:
bật/tắt · hotkey riêng · **model ưu tiên riêng** · study mode mặc định ·
**system prompt riêng** · loại cửa sổ hiển thị · ngôn ngữ đầu ra riêng.

> Đây là thứ extension chưa làm được và có giá trị thực tế lớn: **dịch dùng model rẻ
> và nhanh, giải bài tập dùng model mạnh có vision, tóm tắt dùng model context dài.**
> Hiện tại extension chỉ có **một** `systemPrompt` cho tất cả.

## 8.3. Thu nhận nội dung (`acquisition.settings.ts`)
Thứ tự ưu tiên Accessibility ↔ OCR · ngưỡng confidence OCR · độ trễ hover ·
phím modifier · granularity (từ/câu/đoạn) · chế độ hiệu năng (Fast/Balanced/Accurate) ·
kích thước vùng OCR · bật/tắt clipboard watcher · bật/tắt continuous mode ·
ngôn ngữ OCR đã cài · số màn hình theo dõi.

## 8.4. Giao diện (`appearance.settings.ts`)
Theme (auto/sáng/tối) · **cấu hình riêng cho từng surface** (hover / result / chat):
opacity, blur, font size, max width, bo góc · animation · highlight text nguồn ·
vị trí overlay ưa thích · dùng vibrancy/acrylic của OS · thu nhỏ về tray hay đóng hẳn.

## 8.5. Ngôn ngữ (`language.settings.ts`)
Ngôn ngữ UI (13) · ngôn ngữ đầu ra AI · ngôn ngữ đích khi dịch ·
tự nhận diện ngôn ngữ nguồn · danh sách ngôn ngữ đích dùng nhanh.

## 8.6. Riêng tư (`privacy.settings.ts`)
Danh sách app loại trừ · vùng loại trừ trên màn hình · **tự tắt khi đang chia sẻ màn
hình** · tự tắt khi password manager / app ngân hàng đang focus · có lưu lịch sử không ·
tự xoá lịch sử sau N ngày · có gửi ảnh lên cloud không (chỉ dùng model local) ·
telemetry opt-in.

## 8.7. Lưu trữ (`storage.settings.ts`)
Giới hạn số hội thoại · TTL cache dịch · dung lượng cache tối đa · vị trí file DB ·
export/import toàn bộ cấu hình dạng JSON · **profile cấu hình** (ví dụ "Học tập" và
"Dịch tài liệu" với model và prompt khác nhau, chuyển nhanh từ tray).

## 8.8. Hệ thống (`system.settings.ts`)
Khởi động cùng máy · ẩn khỏi Dock/Taskbar · kênh cập nhật (stable/beta) ·
tự cập nhật · hotkey toàn cục bật/tắt nhanh toàn app.

## 8.9. Nâng cao (`advanced.settings.ts`)
Log level · overlay debug (vẽ bounding box) · mở DevTools · xoá cache · chạy chẩn đoán ·
reset về mặc định.

---

# 9. Ghi chú kỹ thuật cần quyết khi bắt tay

| Vấn đề | Khuyến nghị | Đánh đổi |
|---|---|---|
| SQLite driver | `better-sqlite3` | Native module → cần `electron-rebuild`, và nó chạm vào rủi ro "native module làm vỡ packaging" đã ghi trong plan. `node:sqlite` tránh được điều đó nhưng còn experimental |
| State renderer | `zustand` | Nhẹ, không boilerplate; mỗi domain một store |
| Validate | `zod` | Dùng chung cho settings schema, env, và payload IPC |
| Build | `electron-vite` | Xử lý sẵn ba entry main/preload/renderer |
| Test | `vitest` cho `shared/` + `main/`, Playwright cho E2E | `acquisition/` và `native/` phải test thủ công theo nền tảng |

---

# 10. Thứ tự dựng ở Phase 0

Làm đúng thứ tự này, vì mỗi bước là đầu vào của bước sau:

```text
1. tsconfig × 4 + electron-vite + eslint (luật mục 7 bật NGAY, trước khi có code)
2. shared/types/geometry.ts        ← branded type, làm sớm nhất có thể
3. shared/ipc/channels.ts          ← contract, gồm cả stream<>
4. config/settings/*.ts            ← schema 9 nhóm + defineSettings()
5. shared/env.ts + .env.example
6. shared/i18n/ (13 locale .ts)    ← chép nội dung từ extension
7. config/{providers,intents,hotkeys,ocr,limits}.config.ts
8. scripts/check-*.ts              ← chạy trong CI ngay từ đầu
```

**Nghiệm thu Phase 0:** chưa có tính năng nào, nhưng thêm một setting mới chỉ cần sửa
**một file** và nó tự xuất hiện trong UI Settings với validate, type và 13 ngôn ngữ đầy đủ.
