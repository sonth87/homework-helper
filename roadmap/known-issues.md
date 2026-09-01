# Vấn đề đã biết — chờ quay lại bàn

Ghi lại theo yêu cầu ngày 2026-08-30, sau khi phát hiện trong lúc phát triển
desktop app. **Không sửa ngay** — quay lại bàn kỹ sau khi xong toàn bộ nội dung
desktop app hiện tại. Cả hai vấn đề ảnh hưởng **cả extension lẫn desktop**.

---

## 1. Chat nhiều lượt không có ngữ cảnh hội thoại

> **Cập nhật 2026-09-01: đã sửa cho DESKTOP**, xem CHANGELOG-desktop.md mục
> "Thêm mới" và commit liên quan. Phần dưới vẫn mô tả đúng hiện trạng CÒN LẠI
> của **extension** — chưa đụng tới. Cắt nông + ngưỡng khác nhau theo
> local/cloud (phương án 1+3 đã bàn ở dưới), số lượt (6 local / 20 cloud) là
> ước lượng có lý do, KHÔNG phải đo thực nghiệm — máy làm việc không cài được
> Ollama để đo prefill time thật như tài liệu này yêu cầu. Xem lại khi có máy
> cài Ollama, hoặc có phản hồi thật.

**Hiện trạng đã xác nhận bằng code:** mỗi lượt hỏi tiếp trong một hội thoại chỉ
gửi đúng câu vừa gõ, không kèm bất kỳ nội dung nào của các lượt trước. AI không
biết "còn cách nào khác không?" đang hỏi tiếp về vấn đề gì.

### Bằng chứng

| | Vị trí | Payload thực tế gửi đi |
|---|---|---|
| Extension — Sidepanel | [sidepanel.js:468](../extension/sidepanel/sidepanel.js#L468) | `{ prompt, imageBase64, studyMode, outputLanguage }` |
| Extension — Chat Drawer | [drawer.js:403](../extension/content/overlay/drawer.js#L403) | như trên |
| Extension — Floating Card | [floating-card.js:599](../extension/content/overlay/floating-card.js#L599) | như trên |
| Extension — điều phối | [service-worker.js:196](../extension/background/service-worker.js#L196) | `AiEngine.ask({ prompt, ... })` — không có `messages[]` |
| Extension — build request | [offscreen/ai-stream.js:142](../extension/offscreen/ai-stream.js#L142) | `userContent` dựng từ đúng 1 `prompt` + `imageBase64` |
| Desktop — ChatApp | `desktop/src/renderer/windows/chat/ChatApp.tsx:75` | `stream('ai:ask', { intent: 'chat', prompt: text }, ...)` |

**Tin tốt:** dữ liệu cần thiết đã được lưu đúng hình dạng sẵn, chỉ là không được
đọc lại và gửi kèm:
- Extension: `Storage.addChatMessage()` ở [storage.js:512](../extension/shared/storage.js#L512)
  lưu `{ role: 'user'|'assistant', content, image, timestamp }`.
- Desktop: `ConversationRepo.messages()` trả về đúng `{ role, content }[]`.

### Việc cần làm khi quay lại

1. Đổi contract "một `prompt`" → "mảng `messages`" ở cả hai bên. Cả 3 định dạng
   provider (Gemini `contents[]`, OpenAI-compatible `messages[]`, Claude
   `messages[]`) vốn đã hỗ trợ nhiều lượt — hiện code chỉ tự giới hạn còn 1 phần tử.
2. Extension chạm 5 điểm (3 UI × service-worker × ai-engine × ai-stream.js);
   desktop chạm ít hơn (ChatApp + ai.service.ts + 3 adapter).
3. Chỉ giữ ảnh ở lượt gốc — các lượt sau chỉ gửi text. Gửi lại ảnh mỗi lượt vừa
   tốn `maxImageBytes`, vừa không thêm giá trị vì nội dung ảnh không đổi.
4. Extension bump patch + CHANGELOG khi sửa (đây là sửa lỗi ảnh hưởng hành vi).
   Desktop chưa release, không cần bump.

### Đánh đổi hiệu năng — mối lo chính, xem mục dưới

Thêm ngữ cảnh làm tăng chi phí prefill của **model chạy local** (Ollama, LM
Studio, Gemini Nano) — vốn đã chậm và phụ thuộc CPU rảnh của máy người dùng, khác
hẳn cloud có phần cứng riêng.

**Cơ chế giảm nhẹ có thật, có điều kiện:** Ollama/LM Studio chạy trên llama.cpp,
hỗ trợ **prefix caching** — nếu tiền tố request (system prompt + các lượt trước)
**giống hệt byte-for-byte** so với lần gọi trước, server chỉ tính phần mới thêm
vào cuối, không tính lại từ đầu. Điều kiện để có tác dụng:
- System prompt phải ổn định trong cùng hội thoại (cần kiểm tra `buildSystemPrompt()`
  không đổi giữa các lượt).
- Model phải còn "ấm" — Ollama tự unload sau `keep_alive` (mặc định 5 phút).
- **Bất kỳ việc cắt/tóm tắt lịch sử nào cũng phá cache** — mâu thuẫn trực tiếp
  với nhu cầu giới hạn độ dài khi hội thoại dài.

### Ba phương án đã thảo luận, chưa chọn

1. Giới hạn nông + append-only (giữ N lượt gần nhất, không viết lại nội dung cũ).
2. Tóm tắt lượt cũ khi vượt ngưỡng — **tự nó là một lần inference nữa trên chính
   model local đang chậm sẵn**, có thể phản tác dụng.
3. Ngưỡng khác nhau theo provider — local giữ ít lượt hơn cloud, dùng
   `ProviderCapabilities` đã có sẵn trong registry.

**Khuyến nghị sơ bộ (chưa chốt):** kết hợp 1 + 3, không làm 2. Cần **đo thời gian
thật trên Qwen/Gemma qua Ollama** trước khi chốt số N — không đoán con số.

---

## 2. Không có cache cho kết quả dịch/giải đã xử lý trước đó

**Hiện trạng đã xác nhận bằng code:** dịch hay giải cùng một nội dung hai lần
đều xử lý lại từ đầu — tốn thời gian và tài nguyên vô ích, đặc biệt nặng với
model local (liên quan trực tiếp tới mối lo hiệu năng ở mục 1).

### Bằng chứng

| | Vị trí | Ghi nhận |
|---|---|---|
| Extension — Lane A (`QUICK_TRANSLATE`) | [service-worker.js:166-182](../extension/background/service-worker.js#L166) | Mỗi lần rê chuột → 1 request HTTP mới tới Google Translate, không có bước tra cache |
| Extension — `hover-translate.js` | `_lastText` (dòng 70, 167, 179) | Chỉ chặn refire khi con trỏ đứng yên trên **đúng một ô**, KHÔNG phải cache — rê ra rồi rê lại vẫn gọi lại |
| Extension — toàn repo | `grep -rln "class.*Cache\|LRU"` | Không có class/utility cache nào (ngoài mã nguồn Tesseract WASM, không liên quan) |
| Extension — Lane B (`ASK_AI`) | [service-worker.js:196](../extension/background/service-worker.js#L196) | Không có bước tra cache trước khi stream |
| Desktop — bảng `translation_cache` | `desktop/src/main/db/migrations/001-init.ts` | **Đã có schema**, chưa có code nào đọc/ghi — vì `translate.service.ts` (Lane A) thuộc Phase 3 (ADR-0004), chưa xây |
| Desktop — `LIMITS.fastLane` | `desktop/config/limits.config.ts` | `cacheTtlMs`, `cacheMaxEntries` đã định nghĩa sẵn, chưa nơi nào dùng |
| Desktop — Lane B (`ai.service.ts`) | toàn file | Không có cache, giống extension |

### Giá trị cache khác nhau rõ rệt theo lane — cần tách bạch khi quyết định

| Lane | Đặc điểm | Hit-rate thực tế | Mức ưu tiên |
|---|---|---|---|
| **Lane A — dịch nhanh** | Text ngắn, tần suất lặp cao (hover lại đúng từ/câu, từ phổ biến lặp trong 1 trang) | Cao | **Ưu tiên cao** — đã có sẵn kế hoạch (bảng + LIMITS ở desktop) |
| **Lane B — giải bài (có ảnh)** | Ảnh crop lần sau hiếm khi trùng bit-for-bit với lần trước dù người dùng "làm y hệt" | Thấp | Ưu tiên thấp — cache key phức tạp (hash ảnh+prompt+model) mà lợi ích nhỏ |
| **Lane B — chat (text thuần)** | Hỏi lại đúng câu vẫn có thể xảy ra | Trung bình | Cân nhắc riêng, không gộp chung với giải bài có ảnh |

### Thiết kế khoá cache — đã thảo luận và chốt hình dạng (2026-08-30)

Áp dụng **chung một cơ chế cho cả dịch (Lane A) lẫn giải bài dạng text (Lane B)**,
không tách riêng như bản ghi đầu tiên từng viết. Khoá bắt buộc gồm 4 trục —
thiếu trục nào thì cache trả **sai**, không chỉ chậm hơn:

```
hash(text đã chuẩn hoá + provider/model + intent/studyMode + outputLanguage)
```

- **Đổi ngôn ngữ đầu ra** → miss, gọi lại bình thường.
- **Đổi study mode** (`direct` vs `step-by-step`...) → miss.
- **Đổi model** → miss.
- **Đổi provider/baseUrl** → miss. Riêng `custom`/OpenRouter, cùng một model id
  có thể trỏ qua nhiều `baseUrl` khác nhau — khoá phải tính `provider`/`baseUrl`,
  không chỉ `model`, để không lẫn hai cấu hình khác nhau.

### Ảnh chụp + OCR fallback — tự động hưởng lợi từ cache text, KHÔNG cần logic riêng

Nhánh model local không có vision (`isLocalTextOnly` ở
[ai-stream.js:150-165](../extension/offscreen/ai-stream.js#L150)) đã OCR ảnh
thành text **trước khi** build request gửi model:

```js
effectivePrompt = `${prompt}

[Nội dung câu hỏi & các phương án từ ảnh]:
${ocrText.trim()}`
```

Nếu điểm tra cache đặt **sau** bước OCR fallback này (tra theo text cuối cùng
thực sự gửi đi, không tra theo ảnh gốc), nó tự động khớp khi OCR ra đúng text đã
cache trước đó — không cần viết thêm logic riêng cho "trường hợp ảnh". Cache chỉ
cần biết một chuỗi text, không cần biết chuỗi đó tới từ gõ tay, bôi đen, hay OCR.

**Giới hạn quan trọng:** lợi ích này CHỈ tự nhiên xảy ra ở nhánh local-không-vision,
vì đó là nhánh duy nhất ảnh bị OCR thành text trong luồng bình thường. Với model
có vision (đa số cloud, và đúng loại câu hỏi cần vision nhất — đồ thị, công thức,
chữ viết tay, sơ đồ hoá học), ảnh gửi thẳng dạng bytes, không có text nào để tra.

**Hai quyết định tách biệt, không gộp ngầm:**
1. Cache hưởng lợi tự nhiên ở nhánh local-text-only-OCR-fallback — gần như miễn
   phí (OCR đã chạy sẵn cho mục đích khác), **nên làm**.
2. Chủ động chạy OCR chỉ để dò khoá cache trên nhánh có vision — rủi ro riêng:
   tốn OCR mỗi lần kể cả cache miss (không tiết kiệm gì), và OCR yếu đúng với
   loại nội dung mà người dùng chọn vision model để xử lý → dễ miss liên tục dù
   tốn thêm compute local. **Cần cân nhắc riêng khi quay lại, chưa quyết.**

### Việc cần làm khi quay lại

1. Desktop: hoàn thiện `translate.service.ts` (Phase 3) kèm cache ngay từ đầu,
   dùng bảng và `LIMITS.fastLane` đã có sẵn — không phải xây thêm gì mới, chỉ
   là nối nốt phần đã thiết kế. Mở rộng khoá cache cho cả Lane B text (không chỉ Lane A).
2. Extension: thêm cache in-memory hoặc `chrome.storage`, khoá theo 4 trục ở trên.
   Đặt điểm tra cache SAU bước OCR fallback trong `ai-stream.js`.
3. Không làm cache cho Lane B giải bài có ảnh gửi trực tiếp (vision) trừ khi
   quyết định làm mục "hai" ở trên — hit-rate lý thuyết thấp, rủi ro riêng.
4. Chat text thuần (Lane B, không ảnh) dùng chung cơ chế cache trên, nhưng khoá
   phụ thuộc cách xử lý `messages[]` cuối cùng chọn ở mục 1 — làm sau khi mục 1
   đã chốt.

---

## Trạng thái

- [ ] Chưa sửa gì cho cả hai vấn đề.
- [ ] Chưa đo thời gian thật trên model local để chốt tham số (N lượt giữ lại,
      TTL cache).
- [ ] Bàn lại sau khi hoàn tất toàn bộ nội dung desktop app hiện tại (Phase 3
      trở đi — xem [desktop-app-implementation-plan.md](./desktop-app-implementation-plan.md)).
