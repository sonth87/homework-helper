/**
 * Toạ độ có gắn nhãn không gian (branded coordinate types).
 *
 * VÌ SAO CẦN THỨ NÀY
 * ------------------
 * Trong app này một cặp {x, y} có thể nằm ở bốn không gian khác nhau. Trộn nhầm
 * hai không gian KHÔNG ném lỗi — overlay chỉ hiện lệch vị trí. Tệ hơn: trên màn
 * hình 1× (không Retina) thì scale = 1 nên lỗi VÔ HÌNH HOÀN TOÀN, chỉ lộ ra trên
 * máy Retina hoặc màn hình phụ có DPI khác.
 *
 * Đây là lớp lỗi tốn thời gian nhất được cảnh báo ở roadmap/desktop-app.md §18 và §70.
 * Brand biến nó thành lỗi biên dịch.
 *
 *   const p = getMousePosition();        // Point<'screen-physical'>
 *   overlay.moveTo(p);                   // cần Point<'screen-logical'> → LỖI BIÊN DỊCH
 *   overlay.moveTo(toLogical(p, scale)); // ✓
 *
 * Brand chỉ tồn tại lúc biên dịch — runtime vẫn là object {x, y} bình thường,
 * không tốn bộ nhớ, truyền qua IPC vô tư.
 */

declare const __space: unique symbol;

/**
 * screen-physical — pixel vật lý của màn hình, đã nhân hệ số DPI/Retina.
 *                   Dùng cho: ảnh chụp màn hình, vùng crop, kết quả OCR.
 * screen-logical  — điểm logic của hệ điều hành (macOS point, Windows DIP).
 *                   Dùng cho: vị trí/kích thước cửa sổ Electron, con trỏ chuột.
 * window          — gốc toạ độ là góc trên-trái của một BrowserWindow.
 * image           — gốc toạ độ là góc trên-trái của một ảnh đã chụp/cắt.
 */
export type Space = 'screen-physical' | 'screen-logical' | 'window' | 'image';

export type Point<S extends Space> = {
  readonly x: number;
  readonly y: number;
  readonly [__space]: S;
};

export type Size = { readonly width: number; readonly height: number };

export type Rect<S extends Space> = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly [__space]: S;
};

// ── Khởi tạo ────────────────────────────────────────────────────────────────
// Cách DUY NHẤT hợp lệ để tạo ra một giá trị có brand. Bắt buộc phải nêu tên
// không gian, nên không thể "lỡ tay" tạo nhầm.

export function point<S extends Space>(_space: S, x: number, y: number): Point<S> {
  return mkPoint(x, y);
}

export function rect<S extends Space>(
  _space: S,
  bounds: { x: number; y: number; width: number; height: number },
): Rect<S> {
  return mkRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

// Dựng giá trị mà không cần biết tên không gian — dùng cho các phép toán giữ
// nguyên không gian (mục "Phép toán trong CÙNG một không gian" bên dưới), nơi
// kiểu S đã được suy ra từ tham số đầu vào.
//
// Brand CHỈ tồn tại lúc biên dịch. Không bao giờ đọc `[__space]` lúc chạy —
// nó luôn là undefined.
const mkPoint = <S extends Space>(x: number, y: number): Point<S> =>
  ({ x, y }) as unknown as Point<S>;

const mkRect = <S extends Space>(x: number, y: number, width: number, height: number): Rect<S> =>
  ({ x, y, width, height }) as unknown as Rect<S>;

/**
 * Gỡ brand để truyền cho API bên ngoài (Electron, native addon).
 *
 * Overload Rect phải đứng TRƯỚC: `Rect` khớp cấu trúc với `Point` (đều có x, y),
 * nên nếu Point đứng trước thì mọi Rect sẽ rơi vào nhánh Point và mất width/height.
 */
export function raw<S extends Space>(r: Rect<S>): { x: number; y: number; width: number; height: number };
export function raw<S extends Space>(p: Point<S>): { x: number; y: number };
export function raw(v: { x: number; y: number; width?: number; height?: number }) {
  const { x, y, width, height } = v;
  return width === undefined || height === undefined ? { x, y } : { x, y, width, height };
}

// ── Chuyển đổi giữa các không gian ──────────────────────────────────────────
// Mọi phép đổi không gian PHẢI đi qua đây. Không có đường tắt.

/** Điểm logic → pixel vật lý. `scale` lấy từ Display.scaleFactor của màn hình tương ứng. */
export function toPhysical(p: Point<'screen-logical'>, scale: number): Point<'screen-physical'> {
  return point('screen-physical', Math.round(p.x * scale), Math.round(p.y * scale));
}

/** Pixel vật lý → điểm logic. */
export function toLogical(p: Point<'screen-physical'>, scale: number): Point<'screen-logical'> {
  return point('screen-logical', p.x / scale, p.y / scale);
}

export function rectToPhysical(r: Rect<'screen-logical'>, scale: number): Rect<'screen-physical'> {
  return rect('screen-physical', {
    x: Math.round(r.x * scale),
    y: Math.round(r.y * scale),
    width: Math.round(r.width * scale),
    height: Math.round(r.height * scale),
  });
}

export function rectToLogical(r: Rect<'screen-physical'>, scale: number): Rect<'screen-logical'> {
  return rect('screen-logical', {
    x: r.x / scale,
    y: r.y / scale,
    width: r.width / scale,
    height: r.height / scale,
  });
}

/** Toạ độ màn hình → toạ độ tương đối với một ảnh đã chụp từ vùng `captureArea`. */
export function screenToImage(
  p: Point<'screen-physical'>,
  captureArea: Rect<'screen-physical'>,
): Point<'image'> {
  return point('image', p.x - captureArea.x, p.y - captureArea.y);
}

/** Toạ độ trong ảnh → toạ độ màn hình. Dùng để neo overlay lên kết quả OCR. */
export function imageToScreen(
  p: Point<'image'>,
  captureArea: Rect<'screen-physical'>,
): Point<'screen-physical'> {
  return point('screen-physical', p.x + captureArea.x, p.y + captureArea.y);
}

export function rectImageToScreen(
  r: Rect<'image'>,
  captureArea: Rect<'screen-physical'>,
): Rect<'screen-physical'> {
  return rect('screen-physical', {
    x: r.x + captureArea.x,
    y: r.y + captureArea.y,
    width: r.width,
    height: r.height,
  });
}

// ── Phép toán trong CÙNG một không gian ─────────────────────────────────────
// Generic <S> bảo đảm không thể so một Rect<'image'> với một Point<'window'>.

export function contains<S extends Space>(r: Rect<S>, p: Point<S>): boolean {
  return p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height;
}

export function intersects<S extends Space>(a: Rect<S>, b: Rect<S>): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export function center<S extends Space>(r: Rect<S>): Point<S> {
  return mkPoint(r.x + r.width / 2, r.y + r.height / 2);
}

/** Nới rộng hình chữ nhật ra mọi phía — dùng cho vùng dung sai khi dò text quanh con trỏ. */
export function inflate<S extends Space>(r: Rect<S>, by: number): Rect<S> {
  return mkRect(r.x - by, r.y - by, r.width + by * 2, r.height + by * 2);
}

export function distance<S extends Space>(a: Point<S>, b: Point<S>): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Ước lượng vị trí (0..1) của một điểm trong dòng chảy đọc (trái→phải,
 * trên→dưới) của một khối text — dùng để chọn đúng từ/câu dưới con trỏ khi
 * chỉ có khung bao của CẢ khối văn bản, không có offset ký tự thật (xem
 * `pickSegmentAtOffset` ở text-segment.ts).
 *
 * VÌ SAO CẦN CẢ HAI TRỤC, KHÔNG CHỈ X
 * ------------------------------------
 * `bounds` từ Accessibility là khung bao cả khối, có thể trải NHIỀU DÒNG —
 * một đoạn văn nhiều câu bị word-wrap. Nếu chỉ xét trục X (coi cả khối là một
 * dòng) thì con trỏ ở đầu dòng 2 sẽ bị hiểu nhầm gần đầu văn bản — sai hẳn
 * hướng đọc. Ở đây chia khối thành `rows` dòng ước lượng theo chiều cao
 * (`lineHeightPx`), xác định con trỏ rơi vào dòng nào rồi mới nội suy theo X
 * trong dòng đó.
 *
 * Với văn bản MỘT DÒNG (rows tính ra = 1, đa số nhãn/UI ngắn thực tế), công
 * thức rút gọn đúng về suy luận thuần trục X — không đổi hành vi so với
 * trước.
 *
 * GIỚI HẠN: không có font metric thật của app đang hover (không thêm lệnh
 * gọi native nào), nên `lineHeightPx` là hằng số cấu hình gần đúng
 * (`LIMITS.hover.estimatedLineHeightPx`), và công thức giả định mỗi dòng
 * chứa lượng ký tự xấp xỉ nhau. Vẫn tốt hơn hẳn bỏ qua trục Y khi khối text
 * thật sự nhiều dòng — kết quả LỆCH THEO vị trí hover thay vì hằng số cố
 * định không đổi dù hover ở đâu.
 */
export function estimateTextOffsetFraction<S extends Space>(
  p: Point<S>,
  r: Rect<S>,
  lineHeightPx: number,
): number {
  if (r.width <= 0 || r.height <= 0) return 0;

  const rows = Math.max(1, Math.round(r.height / lineHeightPx));
  const relY = Math.min(1, Math.max(0, (p.y - r.y) / r.height));
  const relX = Math.min(1, Math.max(0, (p.x - r.x) / r.width));
  const rowIndex = Math.min(rows - 1, Math.floor(relY * rows));

  return Math.min(1, Math.max(0, (rowIndex + relX) / rows));
}

/** Ghim một điểm vào trong hình chữ nhật — dùng khi overlay tràn khỏi mép màn hình. */
export function clamp<S extends Space>(p: Point<S>, bounds: Rect<S>): Point<S> {
  return mkPoint(
    Math.min(Math.max(p.x, bounds.x), bounds.x + bounds.width),
    Math.min(Math.max(p.y, bounds.y), bounds.y + bounds.height),
  );
}
