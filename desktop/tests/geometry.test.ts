import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { estimateTextOffsetFraction, point, rect } from '../src/shared/types/geometry';

test('estimateTextOffsetFraction: khối một dòng — rút gọn đúng về suy luận theo trục X', () => {
  const bounds = rect('screen-logical', { x: 100, y: 100, width: 200, height: 16 });
  const lineHeight = 20; // height (16) < lineHeight → ước lượng 1 dòng

  const left = point('screen-logical', 100, 108);
  const mid = point('screen-logical', 200, 108);
  const right = point('screen-logical', 300, 108);

  assert.equal(estimateTextOffsetFraction(left, bounds, lineHeight), 0);
  assert.equal(estimateTextOffsetFraction(mid, bounds, lineHeight), 0.5);
  assert.equal(estimateTextOffsetFraction(right, bounds, lineHeight), 1);
});

test('estimateTextOffsetFraction: khối nhiều dòng — con trỏ ở dòng dưới phải ra fraction lớn hơn dòng trên, dù cùng X', () => {
  // 3 dòng ước lượng (height 60 / lineHeight 20 = 3).
  const bounds = rect('screen-logical', { x: 0, y: 0, width: 300, height: 60 });
  const lineHeight = 20;

  const sameX = 150; // giữa dòng theo X ở cả 3 trường hợp
  const row1 = estimateTextOffsetFraction(point('screen-logical', sameX, 5), bounds, lineHeight);
  const row2 = estimateTextOffsetFraction(point('screen-logical', sameX, 25), bounds, lineHeight);
  const row3 = estimateTextOffsetFraction(point('screen-logical', sameX, 45), bounds, lineHeight);

  assert.ok(row1 < row2 && row2 < row3, `phải tăng dần theo dòng, nhận ${row1}, ${row2}, ${row3}`);
});

test('estimateTextOffsetFraction: điểm ngoài khung được ghim về [0, 1], không lỗi', () => {
  const bounds = rect('screen-logical', { x: 100, y: 100, width: 200, height: 20 });
  const farBefore = point('screen-logical', -500, -500);
  const farAfter = point('screen-logical', 5000, 5000);

  assert.equal(estimateTextOffsetFraction(farBefore, bounds, 20), 0);
  assert.equal(estimateTextOffsetFraction(farAfter, bounds, 20), 1);
});

test('estimateTextOffsetFraction: khung suy biến (width hoặc height = 0) trả 0 thay vì NaN/Infinity', () => {
  const zeroWidth = rect('screen-logical', { x: 0, y: 0, width: 0, height: 20 });
  const zeroHeight = rect('screen-logical', { x: 0, y: 0, width: 20, height: 0 });
  const p = point('screen-logical', 10, 10);

  assert.equal(estimateTextOffsetFraction(p, zeroWidth, 20), 0);
  assert.equal(estimateTextOffsetFraction(p, zeroHeight, 20), 0);
});
