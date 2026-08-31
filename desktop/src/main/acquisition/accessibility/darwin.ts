/**
 * Cầu nối tới accessibility-helper — binary Swift sống lâu dài giao tiếp qua
 * JSON theo dòng trên stdin/stdout.
 *
 * VÌ SAO SUBPROCESS CHỨ KHÔNG PHẢI NATIVE NODE ADDON: xem lời giải thích đầy
 * đủ trong native/accessibility-macos/main.swift — tránh lặp lại đúng rủi ro
 * ABI/node-gyp đã cắn thật ở Phase 1 (better-sqlite3, xem ADR-0005).
 */

import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { join } from 'node:path';
import { app } from 'electron';
import type { AccessibilityText } from '@shared/types/content';
import { rect } from '@shared/types/geometry';
import type { Point } from '@shared/types/geometry';
import { logger } from '../../logging/logger';

type PendingResolve = (value: Record<string, unknown>) => void;

// PHẢI lớn hơn thời gian chờ kích hoạt Chromium tối đa trong main.swift
// (10 lần thử × 200ms = 2000ms cho ensureActivated()). Từng đặt 800ms — nếu
// timeout ngoài bắn TRƯỚC khi helper kịp xong lần kích hoạt đầu tiên cho một
// app mới gặp, request bị reject dù helper sắp trả kết quả đúng. Cộng thêm
// biên độ cho round-trip IPC + hit-test.
const QUERY_TIMEOUT_MS = 2500;

export class MacAccessibility {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private pending = new Map<number, PendingResolve>();
  private nextId = 1;
  private buffer = '';
  private readyPromise: Promise<void> | null = null;

  private binaryPath(): string {
    // KHÔNG dùng __dirname: electron-vite có thể tách code thành nhiều chunk
    // (đã xảy ra thật — out/main/chunks/ xuất hiện khi code đủ lớn), nên
    // __dirname của module này thay đổi tuỳ chunk nó rơi vào, làm phép đếm
    // "../../ " ra vị trí sai một cách âm thầm (ENOENT) tuỳ thời điểm build.
    //
    // app.getAppPath() là điểm neo ỔN ĐỊNH của Electron — luôn là thư mục gốc
    // chứa package.json ở dev, hoặc thư mục app.asar/Resources khi đóng gói.
    // Không phụ thuộc bundler chia chunk thế nào.
    return app.isPackaged
      ? join(process.resourcesPath, 'accessibility-helper')
      : join(app.getAppPath(), 'native/accessibility-macos/accessibility-helper');
  }

  private ensureStarted(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      const proc = spawn(this.binaryPath(), [], { stdio: ['pipe', 'pipe', 'pipe'] });
      this.proc = proc;

      proc.once('error', (err) => {
        logger.error('Không khởi động được accessibility-helper', err);
        reject(err);
      });

      proc.stderr.on('data', (chunk: Buffer) => logger.warn('accessibility-helper stderr', chunk.toString()));

      proc.stdout.on('data', (chunk: Buffer) => {
        this.buffer += chunk.toString('utf8');
        let newlineAt: number;
        // Có thể nhận nhiều dòng JSON trong một lần 'data', hoặc một dòng bị
        // cắt giữa hai lần — xử lý giống hệt cách sse.ts đọc luồng provider.
        while ((newlineAt = this.buffer.indexOf('\n')) !== -1) {
          const line = this.buffer.slice(0, newlineAt).trim();
          this.buffer = this.buffer.slice(newlineAt + 1);
          if (!line) continue;
          this.handleLine(line, resolve);
        }
      });

      proc.once('exit', (code) => {
        logger.warn('accessibility-helper thoát', { code });
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

  private async request(cmd: string, extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    await this.ensureStarted();
    const proc = this.proc;
    if (!proc) throw new Error('accessibility-helper không chạy');

    const id = this.nextId++;
    const payload = JSON.stringify({ id, cmd, ...extra }) + '\n';

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('accessibility-helper không phản hồi kịp'));
      }, QUERY_TIMEOUT_MS);

      this.pending.set(id, (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });

      proc.stdin.write(payload);
    });
  }

  async isTrusted(): Promise<boolean> {
    try {
      const res = await this.request('trusted');
      return res.trusted === true;
    } catch {
      return false;
    }
  }

  /**
   * `point` PHẢI ở hệ toạ độ Quartz (gốc trên-trái) — cùng hệ với
   * `CGEvent`/AX API, đã kiểm chứng thực nghiệm KHỚP với
   * `screen.getCursorScreenPoint()` của Electron trên macOS (xem ghi chú xác
   * minh trong acquire.ts). Không tự suy luận từ tài liệu Cocoa — Cocoa gốc
   * dưới-trái, nhưng Electron chuẩn hoá toạ độ màn hình về gốc trên-trái trên
   * mọi nền tảng, nên hai hệ này trùng nhau một cách không hiển nhiên.
   */
  async getTextAtPoint(point: Point<'screen-logical'>): Promise<AccessibilityText | null> {
    const res = await this.request('queryPoint', { x: point.x, y: point.y });
    if (!res.text || typeof res.text !== 'string') return null;

    const b = res.bounds as { x: number; y: number; width: number; height: number } | undefined;
    // charOffset chỉ có mặt khi helper đã KIỂM CHỨNG KHỨ HỒI được nó (xem
    // verifiedOffset trong main.swift). Vắng mặt nghĩa là "không biết chắc",
    // không phải "ở đầu chuỗi" — tầng trên phải tự ước lượng và biết rõ điều đó.
    const offset = typeof res.charOffset === 'number' ? res.charOffset : undefined;
    const src = res.offsetSource === 'position' || res.offsetSource === 'lines' ? res.offsetSource : undefined;
    const visStart = typeof res.visibleStart === 'number' ? res.visibleStart : undefined;
    const visLength = typeof res.visibleLength === 'number' ? res.visibleLength : undefined;

    return {
      text: res.text,
      bounds: b
        ? rect('screen-logical', { x: b.x, y: b.y, width: b.width, height: b.height })
        : rect('screen-logical', { x: point.x, y: point.y, width: 0, height: 0 }),
      ...(offset !== undefined ? { charOffset: offset } : {}),
      ...(src !== undefined ? { offsetSource: src } : {}),
      ...(visStart !== undefined && visLength !== undefined
        ? { visibleRange: { start: visStart, length: visLength } }
        : {}),
      ...(typeof res.app === 'string' ? { role: res.app } : {}),
    };
  }

  stop(): void {
    this.proc?.kill();
    this.proc = null;
    this.readyPromise = null;
  }
}

export const macAccessibility = new MacAccessibility();
