/**
 * Hằng số sản phẩm. Không phải user settings (người dùng không cần đổi), không
 * phải env (không khác nhau giữa các máy build).
 */

export const LIMITS = {
  /** Thời gian tạm ngưng một key sau khi lỗi. Bám theo hành vi đã kiểm chứng ở
   *  extension (background/key-rotator.js): 60s cho rate limit, 30s cho lỗi máy chủ. */
  cooldown: { rateLimitMs: 60_000, serverErrorMs: 30_000 },

  /** Lane A phải phản hồi trong khoảng này để cảm giác tức thì. */
  fastLane: { targetLatencyMs: 400, timeoutMs: 5_000, cacheTtlMs: 7 * 24 * 60 * 60 * 1000, cacheMaxEntries: 10_000 },

  /** Lane B — mô hình suy luận có thể im lặng rất lâu trước byte đầu tiên. */
  llmLane: {
    firstByteTimeoutMs: 90_000,
    totalTimeoutMs: 600_000,
    /**
     * Số LƯỢT (một lượt = một tin nhắn user hoặc assistant) giữ lại làm ngữ
     * cảnh khi chat nhiều lượt — xem roadmap/known-issues.md mục 1.
     *
     * CHƯA ĐO THỰC NGHIỆM — tài liệu yêu cầu "đo thời gian thật trên Qwen/Gemma
     * qua Ollama trước khi chốt số N", nhưng máy này không cài Ollama nên
     * không đo được. Hai số dưới đây là ước lượng có lý do, KHÔNG phải kết quả
     * đo: model local chạy trên CPU/GPU máy người dùng, mỗi lượt thêm vào đều
     * cộng thẳng vào thời gian prefill họ phải chờ — giữ ít hơn hẳn cloud (có
     * phần cứng riêng, prefill nhanh hơn nhiều bậc). Cắt NÔNG (giữ N lượt gần
     * nhất, không viết lại nội dung cũ) — phương án 1+3 trong ba phương án đã
     * bàn, không làm phương án 2 (tóm tắt) vì tự nó là một lần suy luận nữa
     * trên chính model local đang chậm sẵn.
     *
     * Xem lại khi: có Ollama thật để đo prefill time theo số lượt, hoặc có
     * phản hồi thật cho thấy hai con số này sai hướng.
     */
    historyTurnsLocal: 6,
    historyTurnsCloud: 20,
  },

  /** Ngưỡng dưới thì coi như OCR không đọc được, chuyển sang chiến lược khác. */
  ocr: {
    maxRegionPx: 2_000_000,
    /**
     * Ba chế độ hiệu năng (setting `performanceMode`, acquisition.settings.ts)
     * — điều chỉnh CHIỀU CAO dải chụp quanh con trỏ khi OCR làm fallback cho
     * Lane A (screen-logical px; bề rộng KHÔNG cấu hình ở đây, luôn lấy trọn
     * bề rộng màn hình, xem `tryOcr()`) và NGƯỠNG TIN CẬY tối thiểu để chấp
     * nhận kết quả OCR.
     *
     * `balanced` là hai số ĐÃ ĐO THỰC NGHIỆM 2026-09-01, hai phát hiện đổi hẳn
     * thiết kế cũ (ô 500×80 lấy con trỏ làm tâm):
     *
     * 1. Vision trả về **0 khối** khi dòng chữ tràn ra CẢ HAI mép trái–phải
     *    của ảnh (không còn khoảng trắng ở rìa). Ô cắt quanh con trỏ giữa một
     *    đoạn văn dày rơi đúng vào trạng thái này → OCR im lặng trả rỗng,
     *    đúng ở tình huống nó sinh ra để phục vụ (PDF, editor).
     * 2. Chụp rộng lại NHANH HƠN: dải 2560×200 mất 90ms, trong khi ô 500×80
     *    cắt cụt mất 169ms — Vision không phải vật lộn với chữ gãy ở rìa.
     *
     * 240px ≈ 6–12 dòng văn bản thường: đủ để câu chứa con trỏ (thường trải
     * 1–3 dòng) nằm TRỌN trong ảnh, nên câu cắt ra là câu thật chứ không phải
     * mảnh vụn.
     *
     * `fast`/`accurate` là ƯỚC LƯỢNG có lý do dựa trên số `balanced` đã đo,
     * KHÔNG phải số đo riêng — chưa có máy để đo lại thời gian thực tế cho
     * hai chế độ này. `fast` giảm chiều cao (ít pixel hơn = Vision xử lý
     * nhanh hơn, đổi lại dễ cắt cụt câu dài hơn 3 dòng) và hạ ngưỡng tin cậy
     * (chấp nhận kết quả kém chắc chắn hơn, ưu tiên có gì đó hơn im lặng).
     * `accurate` ngược lại: cao hơn (ít khả năng cắt cụt) và ngưỡng tin cậy
     * cao hơn (thà báo "không đọc được" còn hơn dịch sai).
     */
    performanceModes: {
      fast: { hoverCaptureHeight: 160, minConfidence: 0.45 },
      balanced: { hoverCaptureHeight: 240, minConfidence: 0.55 },
      accurate: { hoverCaptureHeight: 320, minConfidence: 0.65 },
    },
  },

  /** Vùng dung sai khi dò text quanh con trỏ (logical px). */
  hover: {
    tolerancePx: 12,
    minStableFrames: 2,
    /** Ước lượng chiều cao một dòng chữ (logical px) — dùng để suy ra số dòng
     *  của một khối text nhiều dòng khi chọn đúng từ/câu dưới con trỏ (xem
     *  `estimateTextOffsetFraction` ở geometry.ts). Không đo cỡ chữ thật của
     *  từng app, chỉ là hằng số gần đúng cho UI text thông thường. */
    estimatedLineHeightPx: 20,
    /** Chờ một chút trước khi thật sự ẩn overlay sau khi chuột rời đi — chuột
     *  hơi vọt qua rồi quay lại ngay (rung tay, đổi hướng đọc) không nên làm
     *  overlay nháy tắt-bật. Đủ ngắn để vẫn cảm giác tức thì khi rời hẳn. */
    hideDelayMs: 250,
  },

  history: { maxConversations: 1_000, maxMessagesPerConversation: 500 },

  /**
   * Kéo-thả file PDF (Phase 4) — chỉ trích text layer sẵn có, không OCR trang
   * scan (xem acquisition/pdf/extract-text.ts). Số trang/ký tự tối đa là ước
   * lượng có lý do (chặn chi phí token khi ai đó thả nhầm một cuốn sách),
   * KHÔNG phải số đo — chưa có phản hồi thật để chốt con số tối ưu.
   */
  pdf: { maxPages: 30, maxChars: 60_000 },

  ipc: { maxPayloadBytes: 32 * 1024 * 1024 },
} as const;
