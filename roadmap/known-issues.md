# Vấn đề đã biết — chờ quay lại bàn

Ghi lại theo yêu cầu ngày 2026-08-30, sau khi phát hiện trong lúc phát triển
desktop app. **Không sửa ngay** — quay lại bàn kỹ sau khi xong toàn bộ nội dung
desktop app hiện tại. Cả hai vấn đề ảnh hưởng **cả extension lẫn desktop**.

---

## 1. Chat nhiều lượt không có ngữ cảnh hội thoại

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

### Việc cần làm khi quay lại

1. Desktop: hoàn thiện `translate.service.ts` (Phase 3) kèm cache ngay từ đầu,
   dùng bảng và `LIMITS.fastLane` đã có sẵn — không phải xây thêm gì mới, chỉ
   là nối nốt phần đã thiết kế.
2. Extension: thêm cache in-memory hoặc `chrome.storage` cho `QUICK_TRANSLATE`,
   khoá theo `hash(text + targetLang)`.
3. Không làm cache cho Lane B giải bài có ảnh trừ khi có bằng chứng thực tế
   người dùng lặp lại chính xác cùng một crop — hit-rate lý thuyết thấp không
   đáng công sức.
4. Cân nhắc cache cho Lane B chat text thuần như một hạng mục riêng, sau khi đã
   giải quyết xong mục 1 (ngữ cảnh hội thoại) — vì cache key của chat phụ thuộc
   vào cách xử lý `messages[]` cuối cùng chọn ở mục 1.

---

## Trạng thái

- [ ] Chưa sửa gì cho cả hai vấn đề.
- [ ] Chưa đo thời gian thật trên model local để chốt tham số (N lượt giữ lại,
      TTL cache).
- [ ] Bàn lại sau khi hoàn tất toàn bộ nội dung desktop app hiện tại (Phase 3
      trở đi — xem [desktop-app-implementation-plan.md](./desktop-app-implementation-plan.md)).
