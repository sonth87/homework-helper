/**
 * Quyết định "con trỏ đã đứng yên đủ lâu để tra cứu chưa" — THUẦN, không side
 * effect. Nhận điểm + mốc thời gian, KHÔNG tự đọc đồng hồ hay chuột.
 *
 * Tách khỏi tracker.ts (nơi polling chuột thật) để test được trực tiếp bằng
 * `node:test` với timestamp giả, không cần Electron, không cần chuột thật —
 * bài học từ việc debug Accessibility: mỗi vòng kiểm chứng cần người dùng di
 * chuột thật tốn rất nhiều thời gian. Logic quyết định không nên phụ thuộc vào
 * việc chạy được E2E.
 */

import { distance } from '@shared/types/geometry';
import type { Point, Space } from '@shared/types/geometry';

export class HoverDebouncer<S extends Space> {
  private anchor: Point<S> | null = null;
  private anchorAt = 0;
  private lastFired: Point<S> | null = null;

  /**
   * Gọi mỗi khi có vị trí chuột mới. Trả về điểm nên tra cứu, hoặc `null` nếu
   * chưa đủ điều kiện (đang di chuyển, chưa đủ thời gian đứng yên, hoặc đã
   * tra đúng chỗ này rồi).
   */
  update(point: Point<S>, now: number, tolerancePx: number, stableForMs: number): Point<S> | null {
    if (!this.anchor || distance(point, this.anchor) > tolerancePx) {
      // Di chuyển ra khỏi vùng dung sai: đặt lại mốc, bắt đầu đếm giờ lại từ đây.
      this.anchor = point;
      this.anchorAt = now;
      return null;
    }

    if (now - this.anchorAt < stableForMs) return null;

    if (this.lastFired && distance(point, this.lastFired) <= tolerancePx) {
      // Đã tra đúng vùng này rồi — không tra lại liên tục khi chuột đứng yên.
      return null;
    }

    this.lastFired = point;
    return point;
  }

  /** Chuột rời khỏi trạng thái theo dõi được (ví dụ rời màn hình, đổi app). */
  reset(): void {
    this.anchor = null;
    this.lastFired = null;
  }
}
