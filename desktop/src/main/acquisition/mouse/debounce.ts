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
      //
      // BUG THẬT đã gặp: trước đây chỉ reset `anchor`, không reset `lastFired`
      // — mà `hasFired()` chỉ nhìn vào `lastFired !== null`. Hệ quả: sau lần
      // hover đầu tiên trong CẢ PHIÊN, `hasFired()` mãi mãi trả `true`, nên
      // điều kiện `wasFired && !hasFired()` ở tracker.ts không bao giờ đúng
      // nữa — `onMoveAway()` chết lâm sàng, tooltip không bao giờ tự ẩn khi
      // chuột rời đi. Còn kéo theo lỗi thứ hai: quay lại ĐÚNG điểm đã hover
      // trước đó (sau khi đã rời đi) cũng không hiện lại được, vì dòng kiểm
      // tra `lastFired` bên dưới vẫn còn nhớ điểm cũ. Rời khỏi vùng dung sai
      // là đúng thời điểm để coi phiên hover trước đã kết thúc — reset cả hai.
      this.anchor = point;
      this.anchorAt = now;
      this.lastFired = null;
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

  /** true nếu lần update() gần nhất đã từng kích hoạt — dùng để biết khi nào
   *  cần ẩn overlay (chuột di chuyển ra khỏi vùng vừa hiện kết quả). */
  hasFired(): boolean {
    return this.lastFired !== null;
  }
}
