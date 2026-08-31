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
  llmLane: { firstByteTimeoutMs: 90_000, totalTimeoutMs: 600_000 },

  /** Ngưỡng dưới thì coi như OCR không đọc được, chuyển sang chiến lược khác. */
  ocr: {
    minConfidence: 0.55,
    maxRegionPx: 2_000_000,
    /** Vùng chụp quanh con trỏ khi OCR làm fallback cho Lane A (screen-logical
     *  px). Đủ rộng để bắt một dòng chữ, không quá lớn để giữ OCR nhanh. */
    hoverCaptureWidth: 500,
    hoverCaptureHeight: 80,
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

  ipc: { maxPayloadBytes: 32 * 1024 * 1024 },
} as const;
