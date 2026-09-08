/**
 * Preload — bề mặt DUY NHẤT mà renderer nhìn thấy.
 *
 * `ipcRenderer` không bao giờ bị lộ ra. Renderer chỉ gọi được đúng những kênh
 * đã khai báo trong @shared/ipc/channels, và gọi sai kênh là lỗi biên dịch.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { createApi } from './api';

const api = createApi();

contextBridge.exposeInMainWorld('api', api);

/**
 * Main đẩy nhiệm vụ xuống cửa sổ kết quả và overlay. Chuyển thành CustomEvent
 * thay vì expose thêm hàm: renderer chỉ cần lắng nghe, không cần gọi ngược lại,
 * và cách này không mở rộng bề mặt API mà preload phơi ra.
 */
for (const channel of ['result:task', 'hover:update'] as const) {
  ipcRenderer.on(channel, (_e, detail: unknown) => {
    window.dispatchEvent(new CustomEvent(channel, { detail }));
  });
}

export type { RendererApi } from '@shared/ipc/channels';
