# ADR-0003: Tách hai lane thực thi — dịch nhanh và suy luận LLM

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-29

## Bối cảnh

Đặc tả gốc [`roadmap/desktop-app.md`](../../roadmap/desktop-app.md) chỉ mô hình hoá
**một** đường ống: `processPoint(Point) → TranslationOverlayResult` — hover chuột rồi
dịch, dùng Google Translate endpoint miễn phí.

Nhưng desktop app phải mang cả các tính năng khác của extension: giải bài tập, tóm tắt,
giải thích, chat. Những tác vụ này chạy qua AiEngine đa provider, tính phí theo token,
mất vài giây và trả về markdown streaming.

Nếu gộp chung vào một đường ống, **chuyển động chuột sẽ kích hoạt lời gọi LLM tính phí**.
Một lần rê chuột ngang màn hình có thể sinh hàng chục request.

## Quyết định

**Tách thành hai lane độc lập, không chia sẻ hàng đợi, cache hay cửa sổ hiển thị.**

| | Lane A — Dịch nhanh | Lane B — Suy luận LLM |
|---|---|---|
| Tác vụ | hover translate, tra từ | solve, summarize, explain, chat, rewrite |
| Backend | Google Translate endpoint (miễn phí, không key) | AiEngine đa provider + key rotation |
| Độ trễ | 200–400ms | 2–30s (streaming) |
| Chi phí | 0 | tính theo token |
| Kích hoạt | tự động khi rê chuột | **luôn do người dùng chủ động** |
| Cache | LRU + SQLite, hit rate cao | không cache |
| Cửa sổ | trong suốt, click-through, không nhận focus | có focus, scroll, copy được |

**Bất biến kiến trúc:** intent thuộc lane `llm` **không bao giờ** được kích hoạt từ
nguồn `mouse-move`. Luật này được mã hoá trong `config/intents.config.ts` (trường `lane`)
và cưỡng chế tại `src/main/pipeline/guards.ts` — không phải là quy ước, mà là kiểm tra
chạy được.

## Phương án đã cân nhắc và loại bỏ

**Một đường ống chung, phân biệt bằng cấu hình.** Loại bỏ vì ranh giới quá dễ vỡ: chỉ
cần một lần refactor vô ý là hover nối vào LLM. Rủi ro tài chính không tương xứng với
lợi ích gọn code.

**Chặn bằng hạn mức request thay vì tách kiến trúc.** Loại bỏ vì hạn mức là lưới an
toàn cuối, không phải hàng rào đầu tiên. Nó chặn thiệt hại sau khi đã phát sinh.

## Hệ quả

- Cần **hai loại cửa sổ overlay**, không phải một: `HoverOverlay` (trong suốt,
  click-through) và `ResultPanel` (có focus, tương tác được). Đặc tả gốc chỉ thiết kế loại đầu.
- `main/translate/` tách hẳn khỏi `main/ai/` trong cây thư mục — ranh giới thể hiện
  ngay ở cấu trúc file, không chỉ trong tài liệu.
- Lane A phải huỷ request liên tục theo chuyển động chuột; Lane B huỷ theo thao tác
  người dùng. Hai mô hình huỷ khác nhau, không dùng chung.
- Bổ sung hạn mức request/phút và hiển thị token đã dùng — làm lưới an toàn thứ hai.

## Đánh đổi đã chấp nhận

- Trùng lặp một phần ở tầng cache và tầng huỷ request giữa hai lane. Chấp nhận: đây là
  trùng lặp có chủ đích để giữ ranh giới rõ ràng.
- Người dùng không thể "hover để giải bài tập" — phải chủ động bấm phím tắt hoặc khoanh
  vùng. Đây là **tính năng, không phải hạn chế**: nó khiến chi phí luôn nằm dưới sự
  kiểm soát của người dùng.

## Xem lại khi

Xuất hiện mô hình LLM local đủ nhanh và **miễn phí hoàn toàn** (chạy trên máy người
dùng, độ trễ < 500ms). Khi đó có thể cho phép một số intent lane B chạy tự động, nhưng
**chỉ khi provider đang dùng là local** — ranh giới lane vẫn giữ, chỉ nới điều kiện
kích hoạt.
