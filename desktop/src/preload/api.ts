import { ipcRenderer } from 'electron';
import { IPC } from '@shared/ipc/channels';
import type {
  ChunkOf, PayloadOf, RendererApi, ReqOf, RequestChannelName, ResOf,
  SendChannelName, StreamChannelName,
} from '@shared/ipc/channels';
import type { Settings } from '@config/settings';
import type { LogEntry } from '@shared/types/log';

let streamSeq = 0;

export function createApi(): RendererApi {
  return {
    invoke<K extends RequestChannelName>(channel: K, ...args: ReqOf<K> extends void ? [] : [ReqOf<K>]) {
      // Duyệt đúng IPC để không thể gọi kênh chưa khai báo, kể cả khi type bị bỏ qua.
      if (!(channel in IPC)) throw new Error(`Kênh IPC chưa khai báo: ${String(channel)}`);
      return ipcRenderer.invoke(channel, args[0]) as Promise<ResOf<K>>;
    },

    stream<K extends StreamChannelName>(
      channel: K,
      payload: ReqOf<K>,
      onChunk: (chunk: ChunkOf<K>) => void,
    ) {
      if (!(channel in IPC)) throw new Error(`Kênh IPC chưa khai báo: ${String(channel)}`);

      const requestId = `s${Date.now()}_${streamSeq++}`;
      const chunkEvent = `${channel}:chunk:${requestId}`;
      const endEvent = `${channel}:end:${requestId}`;

      const listener = (_e: unknown, chunk: ChunkOf<K>) => onChunk(chunk);
      ipcRenderer.on(chunkEvent, listener);

      const done = new Promise<void>((resolve, reject) => {
        ipcRenderer.once(endEvent, (_e, error?: string) => {
          ipcRenderer.removeListener(chunkEvent, listener);
          if (error) reject(new Error(error));
          else resolve();
        });
      });

      ipcRenderer.send(channel, { requestId, payload });

      return {
        done,
        abort: () => ipcRenderer.send(`${channel}:abort`, { requestId }),
      };
    },

    send<K extends SendChannelName>(channel: K, payload: PayloadOf<K>) {
      if (!(channel in IPC)) throw new Error(`Kênh IPC chưa khai báo: ${String(channel)}`);
      ipcRenderer.send(channel, payload);
    },

    onSettingsChanged(cb: (settings: Settings) => void) {
      const listener = (_e: unknown, settings: Settings) => cb(settings);
      ipcRenderer.on('settings:changed', listener);
      return () => ipcRenderer.removeListener('settings:changed', listener);
    },

    onLogEntry(cb: (entry: LogEntry) => void) {
      const listener = (_e: unknown, entry: LogEntry) => cb(entry);
      ipcRenderer.on('diagnostics:logEntry', listener);
      return () => ipcRenderer.removeListener('diagnostics:logEntry', listener);
    },
  };
}
