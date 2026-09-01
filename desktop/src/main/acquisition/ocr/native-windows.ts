/**
 * Cầu nối tới ocr-windows/helper.ps1 — cùng mẫu JSON-stdio với native-darwin.ts,
 * chạy qua PowerShell thay vì binary biên dịch (xem windows.ts của
 * accessibility/ cho lý do, và ghi chú đầu file helper.ps1 cho rủi ro cụ thể
 * của nhánh WinRT/OCR — đặc biệt là cầu nối IAsyncOperation → Task qua
 * reflection, điểm CHƯA được kiểm chứng trên máy Windows thật).
 */

import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { join } from 'node:path';
import { app } from 'electron';
import type { OcrResult, TextBlock, TextWord } from '@shared/types/content';
import { rect } from '@shared/types/geometry';
import { logger } from '../../logging/logger';

type PendingResolve = (value: Record<string, unknown>) => void;

// PowerShell khởi động + Add-Type nạp assembly WinRT lần đầu chưa được đo thực
// nghiệm trên Windows — giữ biên độ rộng như macOS từng cần cho Vision nạp
// model lần đầu (native-darwin.ts: 30s), thà chờ hơi lâu còn hơn reject oan.
const FIRST_REQUEST_TIMEOUT_MS = 30_000;
const SUBSEQUENT_TIMEOUT_MS = 10_000;

export class WindowsOcr {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private pending = new Map<number, PendingResolve>();
  private nextId = 1;
  private buffer = '';
  private readyPromise: Promise<void> | null = null;
  private hasCompletedOneRequest = false;

  private scriptPath(): string {
    return app.isPackaged
      ? join(process.resourcesPath, 'ocr-helper.ps1')
      : join(app.getAppPath(), 'native/ocr-windows/helper.ps1');
  }

  private ensureStarted(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      const proc = spawn(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', this.scriptPath()],
        { stdio: ['pipe', 'pipe', 'pipe'] },
      );
      this.proc = proc;

      proc.once('error', (err) => {
        logger.error('Không khởi động được ocr helper (PowerShell)', err);
        reject(err);
      });

      proc.stderr.on('data', (chunk: Buffer) => logger.warn('ocr helper stderr', chunk.toString()));

      proc.stdout.on('data', (chunk: Buffer) => {
        this.buffer += chunk.toString('utf8');
        let newlineAt: number;
        while ((newlineAt = this.buffer.indexOf('\n')) !== -1) {
          const line = this.buffer.slice(0, newlineAt).trim();
          this.buffer = this.buffer.slice(newlineAt + 1);
          if (line) this.handleLine(line, resolve);
        }
      });

      proc.once('exit', (code) => {
        logger.warn('ocr helper (PowerShell) thoát', { code });
        this.proc = null;
        this.readyPromise = null;
      });
    });

    return this.readyPromise;
  }

  private handleLine(line: string, onReady: () => void): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }
    if (msg.ready === true) {
      onReady();
      return;
    }
    const id = msg.id as number;
    this.pending.get(id)?.(msg);
    this.pending.delete(id);
  }

  async recognize(imageBase64: string): Promise<OcrResult> {
    await this.ensureStarted();
    const proc = this.proc;
    if (!proc) throw new Error('ocr helper (PowerShell) không chạy');

    const id = this.nextId++;
    const payload = JSON.stringify({ id, cmd: 'recognize', imageBase64 }) + '\n';
    const timeoutMs = this.hasCompletedOneRequest ? SUBSEQUENT_TIMEOUT_MS : FIRST_REQUEST_TIMEOUT_MS;

    const msg = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('ocr helper (PowerShell) không phản hồi kịp'));
      }, timeoutMs);

      this.pending.set(id, (m) => {
        clearTimeout(timer);
        resolve(m);
      });

      proc.stdin.write(payload);
    });

    this.hasCompletedOneRequest = true;

    if (typeof msg.error === 'string') throw new Error(msg.error);

    const rawBlocks = (msg.blocks as Record<string, unknown>[] | undefined) ?? [];
    const blocks: TextBlock[] = rawBlocks.map((b) => {
      const rawWords = (b.words as Record<string, unknown>[] | undefined) ?? [];
      const words: TextWord[] = rawWords.map((w) => ({
        text: String(w.text),
        startOffset: Number(w.startOffset),
        endOffset: Number(w.endOffset),
        bounds: rect('image', {
          x: Number(w.x), y: Number(w.y), width: Number(w.width), height: Number(w.height),
        }),
      }));

      return {
        text: String(b.text),
        confidence: Number(b.confidence),
        bounds: rect('image', {
          x: Number(b.x), y: Number(b.y), width: Number(b.width), height: Number(b.height),
        }),
        words,
      };
    });

    return {
      text: String(msg.text ?? ''),
      blocks,
      durationMs: Number(msg.durationMs ?? 0),
      engine: 'windows-ocr',
    };
  }

  stop(): void {
    this.proc?.kill();
    this.proc = null;
    this.readyPromise = null;
  }
}

export const windowsOcr = new WindowsOcr();
