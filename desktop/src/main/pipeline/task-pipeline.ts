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

import { screen } from 'electron';
import { INTENTS } from '@config/intents.config';
import type { Settings } from '@config/settings';
import type { Intent, TriggerSource } from '@shared/types/intent';
import type { Point } from '@shared/types/geometry';
import { checkTrigger } from './guards';
import { acquire } from '../acquisition/acquire';
import { showResult } from '../windows/result.window';
import { openChatWindow } from '../windows/chat.window';
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

  // Chat không thu nhận gì từ màn hình — người dùng gõ trực tiếp.
  if (config.acquisition.length === 0) {
    openChatWindow();
    return;
  }

  // 'mouse-move' không tới được đây (đã return sớm ở lane 'fast', và guard chặn
  // llm+mouse-move ở checkTrigger phía trên) — trigger còn lại (hotkey/tray/ui)
  // không có toạ độ chuột "tự nhiên" đi kèm sự kiện như mouse-move đã có sẵn từ
  // debounce. Dùng vị trí con trỏ NGAY LÚC kích hoạt: người dùng bấm hotkey
  // trong lúc đang trỏ vào đoạn text muốn xử lý, giống mô tả "tóm tắt vùng" ở
  // desktop-app-implementation-plan.md mục 6.1 — chỉ khác 'translate' ở chỗ
  // kích hoạt chủ động thay vì tự động theo chuyển động chuột.
  const { x, y } = screen.getCursorScreenPoint();
  const point = { x, y } as Point<'screen-logical'>;

  const acquired = await acquire(intent, point);

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

/**
 * Xử lý một nút bấm trên thanh hành động nổi của clipboard watcher
 * (bootstrap/init-clipboard-watcher.ts, windows/clipboard-bar.window.ts).
 *
 * Tách riêng khỏi handleIntent() thay vì tái dùng qua trigger 'clipboard': ở
 * đây đã CÓ SẴN đúng text cần xử lý (chính là đoạn vừa copy khiến thanh hành
 * động hiện ra) — gọi lại acquire() sẽ đọc lại clipboard LẦN NỮA, thừa một
 * vòng, và có rủi ro đọc phải nội dung khác nếu người dùng đã copy thứ khác
 * trong lúc thanh hành động còn hiện (dù hiếm, nhưng "trả lời sai còn tệ hơn
 * không trả lời" — xem CLAUDE.md/known-issues.md nguyên tắc xuyên suốt dự án).
 *
 * Chỉ nhận intent thuộc lane 'llm' và có `surface: 'result-panel'` — thanh
 * hành động không hiện nút cho 'translate' (Lane A, luồng UI khác hẳn:
 * quickTranslate() + HoverOverlay không dùng showResult()) hay 'solve' (cần
 * ẢNH, không phải text) hay 'chat' (không có "nội dung" để xử lý, chỉ gõ
 * trực tiếp) — xem clipboard-bar.window.ts để biết đúng 3 intent hiện ra.
 */
export async function handleClipboardAction(
  intent: Intent,
  text: string,
  settings: Settings,
): Promise<void> {
  const trigger = checkTrigger(intent, 'clipboard');
  if (!trigger.allowed) {
    logger.warn('Bỏ qua hành động từ thanh clipboard', { intent, reason: trigger.reason });
    return;
  }

  const config = INTENTS[intent];
  await showResult({
    intent,
    prompt: text,
    ...(config.defaultStudyMode ? { studyMode: settings.studyMode ?? config.defaultStudyMode } : {}),
  });
}
