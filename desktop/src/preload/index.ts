/**
 * Preload — bề mặt DUY NHẤT mà renderer nhìn thấy.
 *
 * `ipcRenderer` không bao giờ bị lộ ra. Renderer chỉ gọi được đúng những kênh
 * đã khai báo trong @shared/ipc/channels, và gọi sai kênh là lỗi biên dịch.
 */

import { contextBridge } from 'electron';
import { createApi } from './api';

const api = createApi();

contextBridge.exposeInMainWorld('api', api);

export type { RendererApi } from '@shared/ipc/channels';
