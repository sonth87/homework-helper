import { ipcMain } from 'electron';
import { keychain } from '../secrets/keychain';

/**
 * Renderer chỉ hỏi được "có key chưa", không bao giờ đọc lại được giá trị.
 * Không có kênh nào trả về nội dung API key — đó là chủ ý, không phải thiếu sót.
 */
export function registerSecretsIpc(): void {
  ipcMain.handle('secrets:setApiKey', async (_e, { configId, apiKey }: { configId: string; apiKey: string }) => {
    await keychain.set(configId, apiKey);
  });

  ipcMain.handle('secrets:hasApiKey', (_e, { configId }: { configId: string }) => keychain.has(configId));

  ipcMain.handle('secrets:deleteApiKey', async (_e, { configId }: { configId: string }) => {
    await keychain.delete(configId);
  });
}
