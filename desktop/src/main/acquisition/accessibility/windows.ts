/**
 * Cầu nối tới accessibility-windows/helper.ps1 — script PowerShell sống lâu dài
 * giao tiếp qua JSON theo dòng trên stdin/stdout, CÙNG GIAO THỨC với
 * accessibility-helper (Swift) của macOS ở darwin.ts. Khác biệt duy nhất so với
 * darwin.ts: spawn `powershell.exe -File ...` thay vì spawn thẳng một binary đã
 * biên dịch — không có toolchain Windows trên máy phát triển app này để build
 * native thật, xem ghi chú đầu file helper.ps1.
 *
 * ⚠️ CHƯA ĐO THỰC NGHIỆM TRÊN MÁY WINDOWS THẬT — xem cảnh báo chi tiết trong
 * helper.ps1 (hệ toạ độ DPI, độ phủ TextPattern theo từng loại app).
 */

import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { join } from 'node:path';
import { app } from 'electron';
import type { AccessibilityText } from '@shared/types/content';
import { rect } from '@shared/types/geometry';
import type { Point } from '@shared/types/geometry';
import type { ModifierState } from '@shared/types/modifiers';
import { logger } from '../../logging/logger';

type PendingResolve = (value: Record<string, unknown>) => void;

// PowerShell khởi động và Add-Type nạp UIAutomationClient/UIAutomationTypes lần
// đầu chậm hơn đáng kể so với gọi lệnh sau đó (tương tự Vision của macOS nạp
// model lần đầu, xem native-darwin.ts) — CHƯA đo con số thật trên Windows, ước
// lượng rộng rãi để không reject oan trong lần gọi đầu.
const QUERY_TIMEOUT_MS = 5_000;

export class WindowsAccessibility {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private pending = new Map<number, PendingResolve>();
  private nextId = 1;
  private buffer = '';
  private readyPromise: Promise<void> | null = null;

  private scriptPath(): string {
    // Cùng lý do dùng app.getAppPath()/process.resourcesPath thay vì __dirname
    // như darwin.ts — xem ghi chú ở đó.
    return app.isPackaged
      ? join(process.resourcesPath, 'accessibility-helper.ps1')
      : join(app.getAppPath(), 'native/accessibility-windows/helper.ps1');
  }

  private ensureStarted(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      // -ExecutionPolicy Bypass CHỈ áp dụng cho tiến trình con này, không đổi
      // policy hệ thống — không cần quyền admin, không cần người dùng tự đổi
      // policy máy họ trước. -NoProfile bỏ qua profile PowerShell cá nhân
      // (tránh output/lỗi lạ từ script khởi động của người dùng lẫn vào stdout).
      const proc = spawn(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', this.scriptPath()],
        { stdio: ['pipe', 'pipe', 'pipe'] },
      );
      this.proc = proc;

      proc.once('error', (err) => {
        logger.error('Không khởi động được accessibility helper (PowerShell)', err);
        reject(err);
      });

      proc.stderr.on('data', (chunk: Buffer) => logger.warn('accessibility helper stderr', chunk.toString()));

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
        logger.warn('accessibility helper (PowerShell) thoát', { code });
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
    if (!proc) throw new Error('accessibility helper (PowerShell) không chạy');

    const id = this.nextId++;
    const payload = JSON.stringify({ id, cmd, ...extra }) + '\n';

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('accessibility helper (PowerShell) không phản hồi kịp'));
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

  async getModifiers(): Promise<ModifierState | null> {
    try {
      const res = await this.request('modifiers');
      return {
        command: res.command === true,
        control: res.control === true,
        option: res.option === true,
        shift: res.shift === true,
      };
    } catch {
      return null;
    }
  }

  async getTextAtPoint(point: Point<'screen-logical'>): Promise<AccessibilityText | null> {
    const res = await this.request('queryPoint', { x: point.x, y: point.y });
    if (!res.text || typeof res.text !== 'string') return null;

    const b = res.bounds as { x: number; y: number; width: number; height: number } | undefined;
    // charOffset CHƯA làm ở helper.ps1 (xem ghi chú ở đó) — luôn vắng mặt cho
    // nhánh Windows hiện tại, hợp lệ theo đúng quy ước "vắng mặt = không xác
    // định" của AccessibilityText.charOffset.
    return {
      text: res.text,
      bounds: b
        ? rect('screen-logical', { x: b.x, y: b.y, width: b.width, height: b.height })
        : rect('screen-logical', { x: point.x, y: point.y, width: 0, height: 0 }),
      ...(typeof res.app === 'string' ? { role: res.app } : {}),
    };
  }

  stop(): void {
    this.proc?.kill();
    this.proc = null;
    this.readyPromise = null;
  }
}

export const windowsAccessibility = new WindowsAccessibility();
