/**
 * Theo dõi vị trí chuột toàn cục bằng polling `screen.getCursorScreenPoint()`.
 *
 * VÌ SAO POLLING, KHÔNG PHẢI HOOK NATIVE (CGEventTap)
 * -----------------------------------------------------
 * Electron không có API push-based cho chuyển động chuột toàn cục. Có thể bắt
 * bằng CGEventTap trong helper Swift đã có sẵn (native/accessibility-macos/),
 * nhưng đó là kiến trúc event-loop khác hẳn (CFRunLoop callback thay vì
 * readLine() chặn từng dòng) — phức tạp hơn đáng kể cho lợi ích chưa rõ ràng ở
 * mức độ trễ polling ~30ms đã đủ nhanh so với `hoverDelayMs` (350ms mặc định).
 *
 * `screen.getCursorScreenPoint()` không cần quyền Accessibility — khác hẳn
 * `getTextAtPoint()`, tra cứu thật chỉ chạy SAU khi debounce quyết định đứng
 * yên, nên polling vị trí không tốn gì đáng kể dù chưa có quyền.
 */

import { screen } from 'electron';
import { HoverDebouncer } from './debounce';
import type { Point } from '@shared/types/geometry';

const POLL_INTERVAL_MS = 30;

export type TrackerOptions = {
  tolerancePx: number;
  stableForMs: number;
  onStable: (point: Point<'screen-logical'>) => void;
  /** Chuột bắt đầu di chuyển lại sau khi đã kích hoạt — dấu hiệu nên ẩn overlay. */
  onMoveAway: () => void;
};

export class MouseTracker {
  private debouncer = new HoverDebouncer<'screen-logical'>();
  private timer: NodeJS.Timeout | null = null;
  private options: TrackerOptions;

  constructor(options: TrackerOptions) {
    this.options = options;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.debouncer.reset();
  }

  /** Cập nhật ngưỡng khi người dùng đổi setting — không cần start()/stop() lại. */
  updateOptions(options: Partial<Pick<TrackerOptions, 'tolerancePx' | 'stableForMs'>>): void {
    this.options = { ...this.options, ...options };
  }

  private tick(): void {
    const { x, y } = screen.getCursorScreenPoint();
    const point = { x, y } as Point<'screen-logical'>;
    const now = Date.now();

    const wasFired = this.debouncer.hasFired();
    const stable = this.debouncer.update(point, now, this.options.tolerancePx, this.options.stableForMs);

    if (stable) this.options.onStable(stable);
    else if (wasFired && !this.debouncer.hasFired()) this.options.onMoveAway();
  }
}
