import { MouseTracker } from '../acquisition/mouse/tracker';
import { acquire } from '../acquisition/acquire';
import { checkTrigger } from '../pipeline/guards';
import type { SettingsService } from '../settings/settings.service';
import { logger } from '../logging/logger';

/**
 * Bật/tắt theo dõi chuột theo đúng setting `hoverEnabled` — không chạy ngầm
 * khi người dùng chưa bật, dù app đang mở.
 *
 * Phase 3 hiện tại: khi đứng yên, thu nhận nội dung qua Accessibility rồi ghi
 * log. Nối vào Google Translate + hiển thị HoverOverlay là bước tiếp theo,
 * chưa có translate.service.ts.
 */
export function initMouseTracker(settings: SettingsService): void {
  const tracker = new MouseTracker({
    tolerancePx: settings.get().hoverTolerancePx,
    stableForMs: settings.get().hoverDelayMs,
    onStable: (point) => void onHoverStable(point),
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

async function onHoverStable(point: Parameters<typeof acquire>[1]): Promise<void> {
  // Bất biến ADR-0003 vẫn kiểm tra ở đây dù intent 'translate' thuộc lane
  // 'fast' và luôn được phép — nhất quán với mọi đường vào pipeline khác,
  // không có ngoại lệ ngầm nào.
  const trigger = checkTrigger('translate', 'mouse-move');
  if (!trigger.allowed) return;

  const result = await acquire('translate', point);
  if (!result.ok) return;

  logger.info('Hover ổn định — đã thu nhận nội dung', {
    text: result.content.text?.slice(0, 80),
    source: result.content.source,
  });
}
