/**
 * Theo dõi clipboard hệ thống bằng polling — Electron không có API push-based
 * cho thay đổi clipboard, cùng lý do MouseTracker (mouse/tracker.ts) phải poll
 * vị trí chuột thay vì dùng event native.
 */

import { clipboard } from 'electron';

const POLL_INTERVAL_MS = 600;
// Tránh bắn khi copy 1-2 ký tự (ID ngắn, phím tắt copy nhầm, double-click chọn
// một chữ cái) — thanh hành động cho nội dung vụn vặt chỉ gây phiền.
const MIN_TEXT_LENGTH = 3;
// Dán/chọn nhầm cả một tài liệu dài không nên bật thanh hành động — người
// dùng khi đó thường đang thao tác khác (copy để paste đi nơi khác), không
// phải "vừa copy một đoạn muốn xử lý ngay".
const MAX_TEXT_LENGTH = 20_000;

export class ClipboardWatcher {
  private timer: NodeJS.Timeout | null = null;
  private lastSeen: string;
  private readonly onChange: (text: string) => void;

  constructor(onChange: (text: string) => void) {
    this.onChange = onChange;
    // Khởi tạo bằng nội dung ĐANG CÓ SẴN, không phải chuỗi rỗng — nếu không,
    // bật watcher lên sẽ coi bất kỳ thứ gì đang nằm sẵn trong clipboard (từ
    // trước khi bật tính năng) là "vừa copy", hiện thanh hành động ngay lập
    // tức dù người dùng chẳng vừa làm gì cả.
    this.lastSeen = this.safeRead();
  }

  private safeRead(): string {
    try {
      return clipboard.readText();
    } catch {
      // Một số nội dung clipboard (ảnh, file, định dạng độc quyền của app
      // khác) khiến readText() ném lỗi trên vài nền tảng thay vì trả rỗng —
      // coi như không đổi, không phải lỗi cần báo.
      return this.lastSeen;
    }
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    const text = this.safeRead();
    if (text === this.lastSeen) return;
    this.lastSeen = text;

    const trimmed = text.trim();
    if (trimmed.length < MIN_TEXT_LENGTH || trimmed.length > MAX_TEXT_LENGTH) return;

    this.onChange(trimmed);
  }
}
