/**
 * Kiểm thử HoverDebouncer bằng timestamp và toạ độ giả — không Electron,
 * không chuột thật, không setTimeout thật. Chạy: npm run test
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { HoverDebouncer } from '../src/main/acquisition/mouse/debounce';
import { point } from '../src/shared/types/geometry';

const P = (x: number, y: number) => point('screen-logical', x, y);
const TOLERANCE = 6;
const DELAY = 350;

test('chưa đứng yên đủ lâu thì không kích hoạt', () => {
  const d = new HoverDebouncer();
  assert.equal(d.update(P(100, 100), 0, TOLERANCE, DELAY), null);
  assert.equal(d.update(P(100, 100), 200, TOLERANCE, DELAY), null); // mới 200ms, chưa đủ 350ms
});

test('đứng yên đủ lâu thì kích hoạt đúng điểm mốc', () => {
  const d = new HoverDebouncer();
  d.update(P(100, 100), 0, TOLERANCE, DELAY);
  const result = d.update(P(100, 100), 400, TOLERANCE, DELAY);
  assert.deepEqual(result, P(100, 100));
});

test('di chuyển liên tục thì không bao giờ kích hoạt', () => {
  const d = new HoverDebouncer();
  d.update(P(100, 100), 0, TOLERANCE, DELAY);
  d.update(P(120, 100), 200, TOLERANCE, DELAY); // nhảy ra ngoài dung sai -> đặt lại mốc
  const result = d.update(P(120, 100), 400, TOLERANCE, DELAY); // mới 200ms kể từ mốc mới
  assert.equal(result, null);
});

test('rung tay nhỏ trong dung sai vẫn tính là đứng yên', () => {
  const d = new HoverDebouncer();
  d.update(P(100, 100), 0, TOLERANCE, DELAY);
  d.update(P(102, 101), 100, TOLERANCE, DELAY); // lệch ~2.2px, trong dung sai 6px
  d.update(P(99, 103), 200, TOLERANCE, DELAY); // lệch ~3.2px từ mốc gốc
  const result = d.update(P(101, 100), 400, TOLERANCE, DELAY);
  assert.notEqual(result, null, 'rung nhẹ không được đặt lại mốc thời gian');
});

test('đứng yên rồi không tra lại liên tục tại cùng một chỗ', () => {
  const d = new HoverDebouncer();
  d.update(P(100, 100), 0, TOLERANCE, DELAY);
  const first = d.update(P(100, 100), 400, TOLERANCE, DELAY);
  assert.notEqual(first, null);

  const second = d.update(P(100, 100), 600, TOLERANCE, DELAY);
  assert.equal(second, null, 'đã tra đúng chỗ này rồi, không tra lại');
});

test('đứng yên ở chỗ mới sau khi đã tra chỗ cũ thì kích hoạt lại', () => {
  const d = new HoverDebouncer();
  d.update(P(100, 100), 0, TOLERANCE, DELAY);
  d.update(P(100, 100), 400, TOLERANCE, DELAY); // kích hoạt lần 1

  d.update(P(300, 300), 500, TOLERANCE, DELAY); // di chuyển xa hẳn
  const result = d.update(P(300, 300), 900, TOLERANCE, DELAY);
  assert.deepEqual(result, P(300, 300));
});

test('reset() xoá trạng thái, coi như bắt đầu lại từ đầu', () => {
  const d = new HoverDebouncer();
  d.update(P(100, 100), 0, TOLERANCE, DELAY);
  d.reset();
  const result = d.update(P(100, 100), 10, TOLERANCE, DELAY);
  assert.equal(result, null, 'sau reset phải tính lại từ đầu, không được nhớ mốc cũ');
});

test('đúng ranh giới dung sai — chạm mép vẫn tính là trong vùng', () => {
  const d = new HoverDebouncer();
  d.update(P(0, 0), 0, TOLERANCE, DELAY);
  // Điểm cách đúng 6.0px — bằng tolerance, so sánh dùng `>` nên vẫn trong vùng.
  const result = d.update(P(6, 0), DELAY, TOLERANCE, DELAY);
  assert.notEqual(result, null);
});
