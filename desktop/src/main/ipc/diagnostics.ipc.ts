import { BrowserWindow, app, dialog, ipcMain } from 'electron';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createTranslator } from '@shared/i18n';
import type { LogLevel } from '@shared/types/log';
import { getDiagnostics } from '../diagnostics/diagnostics.service';
import { clearOcrCache } from '../acquisition/ocr/region-cache';
import { translateRotator } from '../translate/translate-rotator';
import { logger } from '../logging/logger';
import type { SettingsService } from '../settings/settings.service';

/**
 * Kênh còn lại (`get`) là dữ liệu thuần chỉ-đọc — xem diagnostics.service.ts.
 * Các kênh dưới đây là "Công cụ debug" mới thêm ở cuối trang Chẩn đoán: xem
 * log gần đây, xoá cache/cooldown thủ công, đổi mức log lúc runtime, xuất gói
 * debug ra file. Không phải Debug Mode (§91/§151 roadmap — vẽ bounding-box
 * OCR trên overlay, tính năng khác, chưa làm).
 */
export function registerDiagnosticsIpc(settings: SettingsService): void {
  ipcMain.handle('diagnostics:get', () => getDiagnostics(settings.get()));

  // Đẩy MỌI dòng log mới ghi (không chỉ lúc bấm nút) tới mọi cửa sổ đang mở —
  // trang Chẩn đoán tự cập nhật danh sách log theo thời gian thực thay vì
  // phải bấm lại "Xem log gần đây" để thấy dòng mới. Đăng ký một lần ở đây
  // (registerDiagnosticsIpc chỉ gọi một lần lúc khởi động app), sống suốt
  // vòng đời app — không cần huỷ đăng ký.
  logger.onEntry((entry) => {
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send('diagnostics:logEntry', entry);
  });

  ipcMain.handle('diagnostics:getLogs', () => logger.recent());

  ipcMain.handle('diagnostics:getLogLevel', () => logger.getLevel());

  ipcMain.handle('diagnostics:setLogLevel', (_e, { level }: { level: LogLevel }) => {
    logger.configure(level);
    logger.info('Đổi mức log lúc runtime từ trang Chẩn đoán', { level });
  });

  ipcMain.handle('diagnostics:clearCaches', () => {
    clearOcrCache();
    translateRotator.clearAll();
    logger.info('Đã xoá cache OCR + cooldown provider dịch (thủ công, từ trang Chẩn đoán)');
  });

  /**
   * Không hỏi lại API key hay bất kỳ thông tin đăng nhập nào — `settings.get()`
   * vốn không bao giờ chứa chúng (API key nằm trong keychain hệ điều hành qua
   * secrets/keychain.ts, tách hẳn khỏi SettingsService, xem secrets.ipc.ts).
   * Không cần logic "che secret" riêng ở đây vì không có gì để che.
   */
  ipcMain.handle('diagnostics:exportDebugBundle', async () => {
    const t = createTranslator(settings.get().uiLanguage);
    const bundle = {
      exportedAt: new Date().toISOString(),
      diagnostics: await getDiagnostics(settings.get()),
      settings: settings.get(),
      recentLogs: logger.recent(),
    };

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: t('diagExportDialogTitle'),
      defaultPath: join(app.getPath('desktop'), `homework-helper-debug-${Date.now()}.json`),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return { canceled: true as const };

    await writeFile(filePath, JSON.stringify(bundle, null, 2), 'utf8');
    logger.info('Đã xuất gói debug', { filePath });
    return { canceled: false as const, path: filePath };
  });
}
