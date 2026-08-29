/**
 * Kiểm tra kiểu — chạy bằng `npm run typecheck`, không cần test runner.
 *
 * Mỗi `@ts-expect-error` là một khẳng định: "dòng này PHẢI lỗi". Nếu một ngày
 * nào đó nó ngừng lỗi (ví dụ type bị suy biến thành `any` sau một lần refactor),
 * TypeScript sẽ báo "Unused '@ts-expect-error' directive" và build fail.
 *
 * Nhờ đó an toàn kiểu không thể âm thầm biến mất.
 */

import type { Settings } from '../config/settings';
import { DEFAULT_SETTINGS } from '../config/settings';
import { point, raw, rect, toPhysical } from '../src/shared/types/geometry';
import type { RendererApi } from '../src/shared/ipc/channels';

// ── Settings suy ra từ schema, không phải any ───────────────────────────────
const uiLang: Settings['uiLanguage'] = 'vi';
const retries: Settings['maxRetries'] = 3;
const thinking: Settings['thinkingEnabled'] = true;
const excluded: Settings['excludedApps'] = ['Slack'];

// @ts-expect-error uiLanguage là enum 13 ngôn ngữ, không nhận giá trị tuỳ ý
const badLang: Settings['uiLanguage'] = 'klingon';
// @ts-expect-error maxRetries là number
const badRetries: Settings['maxRetries'] = 'ba';
// @ts-expect-error khoá không tồn tại trong schema
const badKey = DEFAULT_SETTINGS.khongTonTai;

// ── Branded geometry chặn trộn không gian toạ độ ────────────────────────────
const logical = point('screen-logical', 100, 50);
const physical = toPhysical(logical, 2);
// @ts-expect-error toPhysical chỉ nhận screen-logical — đây chính là lớp lỗi
// mà branded type sinh ra để chặn (xem geometry.ts)
const doubleConverted = toPhysical(physical, 2);

// raw() phải giữ width/height cho Rect. Overload Point đứng trước sẽ nuốt mất
// hai trường này mà KHÔNG báo lỗi ở chỗ khai báo — chỉ lộ ra ở nơi dùng.
const box = rect('image', { x: 0, y: 0, width: 10, height: 20 });
const rawBox: { x: number; y: number; width: number; height: number } = raw(box);
const rawPt: { x: number; y: number } = raw(point('window', 1, 2));

// ── IPC contract phân biệt request và stream ────────────────────────────────
declare const api: RendererApi;
const settings: Promise<Settings> = api.invoke('settings:get');
// @ts-expect-error kênh chưa khai báo trong IPC
const badChannel = api.invoke('khong:ton:tai');
// @ts-expect-error ai:ask là kênh stream, không gọi được bằng invoke
const wrongKind = api.invoke('ai:ask', { intent: 'solve', prompt: 'x' });

export {
  box, rawBox, rawPt,
  uiLang, retries, thinking, excluded, badLang, badRetries, badKey,
  logical, physical, doubleConverted, settings, badChannel, wrongKind,
};
