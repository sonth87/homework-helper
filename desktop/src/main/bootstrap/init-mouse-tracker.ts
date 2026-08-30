import { MouseTracker } from '../acquisition/mouse/tracker';
import { acquire } from '../acquisition/acquire';
import { checkTrigger } from '../pipeline/guards';
import { quickTranslate } from '../translate/translate.service';
import { pickFirstSegment } from '@shared/utils/text-segment';
import { hideHover, showHoverAt } from '../windows/hover.window';
import type { SettingsService } from '../settings/settings.service';
import type { Point } from '@shared/types/geometry';
import { logger } from '../logging/logger';

/**
 * Bật/tắt theo dõi chuột theo đúng setting `hoverEnabled` — không chạy ngầm
 * khi người dùng chưa bật, dù app đang mở.
 */
export function initMouseTracker(settings: SettingsService): void {
  const tracker = new MouseTracker({
    tolerancePx: settings.get().hoverTolerancePx,
    stableForMs: settings.get().hoverDelayMs,
    onStable: (point) => {
      // Toàn bộ thân hàm bọc try/catch NGAY TẠI ĐÂY, không chỉ quanh phần
      // dịch — acquire()/getTextAtPoint() có thể REJECT (ví dụ helper AX
      // không phản hồi kịp timeout), và một promise reject không bắt trong
      // callback 'void fn()' sẽ trở thành unhandled rejection âm thầm, làm
      // cả luồng hover dừng lại mà không có dấu hiệu nào trong log thường.
      onHoverStable(point, settings).catch((error: unknown) => {
        logger.warn('Xử lý hover thất bại', error);
      });
    },
    onMoveAway: () => hideHover(),
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

async function onHoverStable(point: Point<'screen-logical'>, settings: SettingsService): Promise<void> {
  // Bất biến ADR-0003 vẫn kiểm tra ở đây dù intent 'translate' thuộc lane
  // 'fast' và luôn được phép — nhất quán với mọi đường vào pipeline khác,
  // không có ngoại lệ ngầm nào.
  const trigger = checkTrigger('translate', 'mouse-move');
  if (!trigger.allowed) return;

  const s = settings.get();

  logger.debug('Hover ổn định, đang thu nhận nội dung', { point });
  const acquired = await acquire('translate', point);
  if (!acquired.ok) {
    logger.debug('Thu nhận thất bại hoặc bị huỷ', acquired);
    return;
  }
  if (!acquired.content.text) {
    logger.debug('Thu nhận thành công nhưng không có text');
    return;
  }

  // Cắt theo độ chi tiết đã chọn — xem giới hạn "chưa cursor-accurate" trong
  // text-segment.ts. Với văn bản một câu/nhãn ngắn (đa số trường hợp AX thực
  // tế), kết quả đã đúng tự nhiên bất kể giới hạn này.
  const segment = pickFirstSegment(acquired.content.text, s.hoverGranularity ?? 'sentence');
  if (!segment) {
    logger.debug('Không cắt được đoạn nào từ text đã thu nhận', { text: acquired.content.text });
    return;
  }

  logger.debug('Đang dịch đoạn', { segment });
  const result = await quickTranslate(segment, s.translateTargetLanguage, s);

  await showHoverAt(acquired.content.bounds, {
    sourceText: segment,
    translatedText: result.translatedText,
    sourceLanguage: result.sourceLanguage,
  });

  logger.debug('Hover dịch xong', { fromCache: result.fromCache, source: acquired.content.source });
}
