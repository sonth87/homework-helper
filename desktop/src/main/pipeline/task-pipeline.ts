/**
 * Đường ống chính: intent → thu nhận nội dung → hiển thị.
 *
 * Thay cho `processPoint(Point)` của đặc tả gốc, vốn chỉ mô hình hoá được việc
 * dịch. Xem roadmap/desktop-app-implementation-plan.md mục 4.
 *
 * Lưu ý phân vai: pipeline KHÔNG tự gọi AI. Nó thu nhận nội dung rồi giao cho
 * cửa sổ kết quả, và chính cửa sổ đó mở luồng `ai:ask`. Nhờ vậy nút "dừng" và
 * việc huỷ khi đóng cửa sổ hoạt động tự nhiên, không cần đường dây riêng.
 */

import { INTENTS } from '@config/intents.config';
import type { Settings } from '@config/settings';
import type { Intent, TriggerSource } from '@shared/types/intent';
import { checkTrigger } from './guards';
import { acquire } from '../acquisition/acquire';
import { showResult } from '../windows/result.window';
import { logger } from '../logging/logger';

export async function handleIntent(
  intent: Intent,
  source: TriggerSource,
  settings: Settings,
): Promise<void> {
  // Bất biến ADR-0003 — kiểm tra TRƯỚC mọi việc khác, kể cả trước khi chụp màn hình.
  const trigger = checkTrigger(intent, source);
  if (!trigger.allowed) {
    logger.warn('Bỏ qua intent', { intent, source, reason: trigger.reason });
    return;
  }

  const config = INTENTS[intent];
  logger.info('Nhận intent', { intent, source, lane: config.lane });

  if (config.lane === 'fast') {
    // Lane A cần Accessibility/OCR — Phase 3.
    logger.info('Lane nhanh chưa hiện thực', { intent });
    return;
  }

  const acquired = await acquire(intent);

  if (!acquired.ok) {
    // Người dùng bấm Esc là hành vi bình thường, không phải lỗi — im lặng.
    if (!acquired.cancelled) logger.warn('Thu nhận nội dung thất bại', acquired.error);
    return;
  }

  await showResult({
    intent,
    prompt: acquired.content.text ?? '',
    ...(acquired.content.imageBase64 ? { imageBase64: acquired.content.imageBase64 } : {}),
    ...(config.defaultStudyMode ? { studyMode: settings.studyMode ?? config.defaultStudyMode } : {}),
  });
}
