/// <reference types="vite/client" />
import type { RendererApi } from '@shared/ipc/channels';

declare global {
  interface Window {
    api?: RendererApi;
  }
}

export {};
