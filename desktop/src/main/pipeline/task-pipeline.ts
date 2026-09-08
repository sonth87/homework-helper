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

import { screen, Notification } from 'electron';
import { extname } from 'node:path';
import { readFile } from 'node:fs/promises';
import { INTENTS } from '@config/intents.config';
import type { Settings } from '@config/settings';
import type { Intent, TriggerSource } from '@shared/types/intent';
import type { Point } from '@shared/types/geometry';
import { createTranslator } from '@shared/i18n';
import { checkTrigger } from './guards';
import { checkAppExcluded } from '../privacy/app-exclusion';
import { acquire } from '../acquisition/acquire';
import { extractPdfText } from '../acquisition/pdf/extract-text';
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

  const acquired = await acquire(intent, point, settings.performanceMode);

  if (!acquired.ok) {
    // Người dùng bấm Esc là hành vi bình thường, không phải lỗi — im lặng.
    if (!acquired.cancelled) logger.warn('Thu nhận nội dung thất bại', acquired.error);
    return;
  }

  // Chỉ áp được cho nội dung có tên app (nguồn 'accessibility') — xem giới
  // hạn đầy đủ trong privacy/app-exclusion.ts. Vẫn chặn dù người dùng chủ
  // động bấm hotkey/tray: quen tay bấm "Giải thích" khi đang trỏ vào ô mật
  // khẩu không nên gửi nội dung đó đi.
  const exclusion = checkAppExcluded(acquired.content.app?.name, settings);
  if (exclusion.excluded) {
    logger.debug('Bỏ qua intent — app bị loại trừ', { intent, reason: exclusion.reason });
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

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function notifyFileDropIssue(key: 'notifFileDropUnsupported' | 'notifFileDropPdfNoText' | 'notifFileDropReadError', settings: Settings): void {
  const t = createTranslator(settings.uiLanguage);
  new Notification({ title: 'Homework Helper', body: t(key) }).show();
}

/**
 * Kéo-thả file vào icon tray (Phase 4, hiện chỉ macOS — xem tray.ts). Tách
 * riêng khỏi handleIntent()/acquire() cùng lý do handleClipboardAction(): nội
 * dung đã CÓ SẴN từ chính sự kiện thả file, không có "chiến lược thu nhận"
 * nào để chọn.
 *
 * Ảnh → 'solve' (vision, đúng bản chất "ảnh chụp đề"). PDF → trích text layer
 * sẵn có rồi đưa vào 'summarize' — KHÔNG OCR trang scan (xem
 * acquisition/pdf/extract-text.ts để biết lý do), báo rõ cho người dùng bằng
 * Notification thay vì lặng lẽ không làm gì khi đó là PDF dạng scan hoặc định
 * dạng không hỗ trợ — thả file mà không thấy gì xảy ra còn khó hiểu hơn một
 * thông báo ngắn giải thích vì sao.
 */
export async function handleFileDrop(filePaths: string[], settings: Settings): Promise<void> {
  for (const filePath of filePaths) {
    await handleSingleFileDrop(filePath, settings).catch((err: unknown) => {
      logger.warn('Xử lý file thả vào tray thất bại', { filePath, err });
      notifyFileDropIssue('notifFileDropReadError', settings);
    });
  }
}

async function handleSingleFileDrop(filePath: string, settings: Settings): Promise<void> {
  const ext = extname(filePath).toLowerCase();

  if (IMAGE_EXTENSIONS.has(ext)) {
    const trigger = checkTrigger('solve', 'file-drop');
    if (!trigger.allowed) {
      logger.warn('Bỏ qua file thả vào tray', { filePath, reason: trigger.reason });
      return;
    }
    const buffer = await readFile(filePath);
    const config = INTENTS.solve;
    await showResult({
      intent: 'solve',
      prompt: '',
      imageBase64: buffer.toString('base64'),
      ...(config.defaultStudyMode ? { studyMode: settings.studyMode ?? config.defaultStudyMode } : {}),
    });
    return;
  }

  if (ext === '.pdf') {
    const trigger = checkTrigger('summarize', 'file-drop');
    if (!trigger.allowed) {
      logger.warn('Bỏ qua file thả vào tray', { filePath, reason: trigger.reason });
      return;
    }
    const { text, truncated, pageCount } = await extractPdfText(filePath);
    if (!text.trim()) {
      logger.warn('PDF không có text layer (có thể là bản scan)', { filePath, pageCount });
      notifyFileDropIssue('notifFileDropPdfNoText', settings);
      return;
    }

    const config = INTENTS.summarize;
    await showResult({
      intent: 'summarize',
      prompt: text,
      ...(config.defaultStudyMode ? { studyMode: settings.studyMode ?? config.defaultStudyMode } : {}),
    });
    if (truncated) logger.info('Đã cắt bớt nội dung PDF theo LIMITS.pdf', { filePath, pageCount });
    return;
  }

  logger.warn('Định dạng file thả vào tray không được hỗ trợ', { filePath, ext });
  notifyFileDropIssue('notifFileDropUnsupported', settings);
}
