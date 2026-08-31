import { MouseTracker } from '../acquisition/mouse/tracker';
import { acquire } from '../acquisition/acquire';
import { checkTrigger } from '../pipeline/guards';
import { quickTranslate } from '../translate/translate.service';
import { pickSegmentAtIndex, pickSegmentAtOffset } from '@shared/utils/text-segment';
import { hideHover, showHoverAt } from '../windows/hover.window';
import type { SettingsService } from '../settings/settings.service';
import type { Point } from '@shared/types/geometry';
import { estimateTextOffsetFraction } from '@shared/types/geometry';
import { LIMITS } from '@config/limits.config';
import { logger } from '../logging/logger';

type HoverContext = {
  /** Huỷ lệnh dịch đang bay tới mạng — không áp dụng cho acquire() (xem ghi chú isStale). */
  signal: AbortSignal;
  /** true nếu một hover MỚI đã bắt đầu hoặc chuột đã rời đi kể từ khi lệnh này được gọi. */
  isStale: () => boolean;
};

/**
 * Bật/tắt theo dõi chuột theo đúng setting `hoverEnabled` — không chạy ngầm
 * khi người dùng chưa bật, dù app đang mở.
 */
export function initMouseTracker(settings: SettingsService): void {
  // `generation` đổi mỗi khi có hover mới hoặc chuột rời đi — bất kỳ lệnh nào
  // từ một generation cũ khi resolve sẽ tự nhận ra mình đã lỗi thời (isStale())
  // và không hiển thị kết quả, thay vì hiện tooltip sai chỗ vì đến trễ.
  let generation = 0;
  let cancelController: AbortController | null = null;
  let hideTimer: NodeJS.Timeout | null = null;

  const cancelHideTimer = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const tracker = new MouseTracker({
    tolerancePx: settings.get().hoverTolerancePx,
    stableForMs: settings.get().hoverDelayMs,
    onStable: (point) => {
      const myGeneration = ++generation;
      // Hover TRƯỚC (nếu còn đang chạy) bị thay thế ngay — huỷ THẬT lệnh dịch
      // của nó đang bay tới mạng, không chỉ âm thầm bỏ qua kết quả.
      cancelController?.abort();
      cancelController = new AbortController();
      cancelHideTimer();

      const ctx: HoverContext = { signal: cancelController.signal, isStale: () => generation !== myGeneration };

      // Toàn bộ thân hàm bọc try/catch NGAY TẠI ĐÂY, không chỉ quanh phần
      // dịch — acquire()/getTextAtPoint() có thể REJECT (ví dụ helper AX
      // không phản hồi kịp timeout), và một promise reject không bắt trong
      // callback 'void fn()' sẽ trở thành unhandled rejection âm thầm, làm
      // cả luồng hover dừng lại mà không có dấu hiệu nào trong log thường.
      onHoverStable(point, settings, ctx).catch((error: unknown) => {
        if (ctx.signal.aborted) return; // huỷ có chủ đích, không phải lỗi thật
        logger.warn('Xử lý hover thất bại', error);
      });
    },
    onMoveAway: () => {
      generation++;
      cancelController?.abort();
      cancelController = null;

      // Không ẩn NGAY — rung tay hoặc vọt qua rồi quay lại trong khoảng ngắn
      // không nên làm overlay nháy tắt-bật. onStable() ở trên huỷ timer này
      // nếu một hover mới tới trước khi hết giờ.
      cancelHideTimer();
      hideTimer = setTimeout(() => {
        hideHover();
        hideTimer = null;
      }, LIMITS.hover.hideDelayMs);
    },
  });

  const apply = () => {
    const s = settings.get();
    tracker.updateOptions({ tolerancePx: s.hoverTolerancePx, stableForMs: s.hoverDelayMs });
    if (s.hoverEnabled) tracker.start();
    else tracker.stop();
  };

  apply();
  settings.onChange(apply);
}

async function onHoverStable(point: Point<'screen-logical'>, settings: SettingsService, ctx: HoverContext): Promise<void> {
  // Bất biến ADR-0003 vẫn kiểm tra ở đây dù intent 'translate' thuộc lane
  // 'fast' và luôn được phép — nhất quán với mọi đường vào pipeline khác,
  // không có ngoại lệ ngầm nào.
  const trigger = checkTrigger('translate', 'mouse-move');
  if (!trigger.allowed) return;

  const s = settings.get();
  const start = performance.now();

  logger.debug('Hover ổn định, đang thu nhận nội dung', { point });
  // acquire() gọi subprocess native (AX/OCR) qua round-trip đồng bộ trong vòng
  // lặp readLine() của helper — không có cách huỷ giữa chừng một khi đã gửi
  // yêu cầu (khác quickTranslate() ở dưới, vốn là fetch() huỷ được thật qua
  // AbortSignal). Bù lại bằng isStale(): nếu chuột đã rời đi hoặc đã hover chỗ
  // khác trước khi acquire() kịp trả lời, bỏ luôn kết quả trễ này thay vì hiện
  // tooltip sai vị trí — đây chính là bug đã sửa cho HoverDebouncer, và kiểm
  // tra này là lớp phòng thủ thứ hai cho đúng loại lỗi đó.
  const acquired = await acquire('translate', point);
  const acquireMs = performance.now() - start;
  if (ctx.isStale()) return;
  if (!acquired.ok) {
    logger.debug('Thu nhận thất bại hoặc bị huỷ', acquired);
    return;
  }
  if (!acquired.content.text) {
    logger.debug('Thu nhận thành công nhưng không có text');
    return;
  }

  // Hai đường, KHÔNG trộn vào nhau:
  //
  //   charOffset có  -> vị trí ký tự đã được tầng native kiểm chứng khứ hồi.
  //                     Chính xác tuyệt đối, dùng thẳng.
  //   charOffset vắng -> phải ước lượng từ hình học. Đo được ~90% cho text một
  //                     dòng nhưng chỉ ~24% cho đoạn văn nhiều dòng (ADR-0008),
  //                     nên đây là phương án chót, không phải mặc định.
  //
  // Không bao giờ lấy trung bình hai nguồn: trộn một giá trị chính xác với một
  // giá trị đoán chỉ làm hỏng giá trị chính xác.
  const granularity = s.hoverGranularity ?? 'sentence';
  const exactOffset = acquired.content.charOffset;
  const segment =
    exactOffset !== undefined
      ? pickSegmentAtIndex(acquired.content.text, exactOffset, granularity)
      : pickSegmentAtOffset(
          acquired.content.text,
          estimateTextOffsetFraction(point, acquired.content.bounds, LIMITS.hover.estimatedLineHeightPx),
          granularity,
        );
  if (!segment) {
    logger.debug('Không cắt được đoạn nào từ text đã thu nhận', { text: acquired.content.text });
    return;
  }

  logger.debug('Đang dịch đoạn', { segment });
  const beforeTranslate = performance.now();
  const result = await quickTranslate(segment, s.translateTargetLanguage, s, ctx.signal);
  const translateMs = performance.now() - beforeTranslate;
  if (ctx.isStale()) return;

  const beforeDisplay = performance.now();
  await showHoverAt(acquired.content.bounds, {
    sourceText: segment,
    translatedText: result.translatedText,
    sourceLanguage: result.sourceLanguage,
  });
  const displayMs = performance.now() - beforeDisplay;

  const totalMs = performance.now() - start;
  const timing = { totalMs: round1(totalMs), acquireMs: round1(acquireMs), translateMs: round1(translateMs), displayMs: round1(displayMs) };

  // LIMITS.fastLane.targetLatencyMs tồn tại từ Phase 0 nhưng chưa nơi nào dùng
  // — đây là chỗ đúng để dùng nó: người dùng cảm nhận "chậm" ở đúng đường này.
  // Không chặn gì, chỉ log để biết đường nào (acquire hay translate) là thủ
  // phạm khi vượt ngân sách — nhất là đường OCR, đã đo riêng ~314ms chỉ cho
  // bước nhận dạng, chưa cộng chụp màn hình lẫn dịch.
  if (totalMs > LIMITS.fastLane.targetLatencyMs) {
    logger.warn('Hover dịch vượt ngân sách độ trễ', { ...timing, source: acquired.content.source });
  }

  logger.debug('Hover dịch xong', {
    ...timing,
    fromCache: result.fromCache,
    translateProvider: result.provider ?? '(cache)',
    source: acquired.content.source,
    // Phân biệt được các đường trong log là điều kiện để đo tầng nào thực sự
    // gánh việc khi dùng thật — dữ liệu mà ADR-0008 nói cần có trước khi xây tiếp.
    offset: acquired.content.offsetSource ?? 'ước lượng',
  });
}

const round1 = (ms: number): number => Math.round(ms * 10) / 10;
