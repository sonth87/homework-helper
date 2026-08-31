/**
 * Cầu nối tới ocr-helper — binary Swift sống lâu dài, cùng mẫu JSON-stdio với
 * accessibility-helper (xem darwin.ts của accessibility/). Tách class riêng
 * thay vì dùng chung một class trừu tượng: hai tiến trình có vòng đời và giao
 * thức khác nhau (OCR không có khái niệm "activatedPids"), gộp trừu tượng sẽ
 * chỉ thêm gián tiếp mà không giảm trùng lặp thật.
 */

import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { join } from 'node:path';
import { app } from 'electron';
import type { OcrResult, TextBlock } from '@shared/types/content';
import { rect } from '@shared/types/geometry';
import { logger } from '../../logging/logger';

type PendingResolve = (value: Record<string, unknown>) => void;

// Request đầu tiên trong tiến trình có thể mất tới ~27s (Vision nạp model lần
// đầu — đã đo thực nghiệm, xem main.swift). Timeout phải chịu được ca đó,
// không chỉ ca bình thường (~20ms).
const FIRST_REQUEST_TIMEOUT_MS = 30_000;
const SUBSEQUENT_TIMEOUT_MS = 5_000;

export class MacOcr {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private pending = new Map<number, PendingResolve>();
  private nextId = 1;
  private buffer = '';
  private readyPromise: Promise<void> | null = null;
  private hasCompletedOneRequest = false;

  private binaryPath(): string {
    return app.isPackaged
      ? join(process.resourcesPath, 'ocr-helper')
      : join(app.getAppPath(), 'native/ocr-macos/ocr-helper');
  }

  private ensureStarted(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      const proc = spawn(this.binaryPath(), [], { stdio: ['pipe', 'pipe', 'pipe'] });
      this.proc = proc;

      proc.once('error', (err) => {
        logger.error('Không khởi động được ocr-helper', err);
        reject(err);
      });

      proc.stderr.on('data', (chunk: Buffer) => logger.warn('ocr-helper stderr', chunk.toString()));

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
        logger.warn('ocr-helper thoát', { code });
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
    if (!proc) throw new Error('ocr-helper không chạy');

    const id = this.nextId++;
    const payload = JSON.stringify({ id, cmd: 'recognize', imageBase64 }) + '\n';
    const timeoutMs = this.hasCompletedOneRequest ? SUBSEQUENT_TIMEOUT_MS : FIRST_REQUEST_TIMEOUT_MS;

    const msg = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('ocr-helper không phản hồi kịp'));
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
    const blocks: TextBlock[] = rawBlocks.map((b) => ({
      text: String(b.text),
      confidence: Number(b.confidence),
      bounds: rect('image', {
        x: Number(b.x), y: Number(b.y), width: Number(b.width), height: Number(b.height),
      }),
    }));

    return {
      text: String(msg.text ?? ''),
      blocks,
      durationMs: Number(msg.durationMs ?? 0),
      engine: 'vision-darwin',
    };
  }

  stop(): void {
    this.proc?.kill();
    this.proc = null;
    this.readyPromise = null;
  }
}

export const macOcr = new MacOcr();
