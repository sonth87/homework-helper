import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { layoutBlocks, sortReadingOrder } from '../src/main/acquisition/ocr/blocks';
import { point, rect } from '../src/shared/types/geometry';
import type { TextBlock } from '../src/shared/types/content';

/** Khối OCR trong hệ ảnh ĐÃ CẮT (gốc trên-trái), đúng như Vision trả về. */
const block = (text: string, b: { x: number; y: number; w: number; h: number }): TextBlock => ({
  text,
  bounds: rect('image', { x: b.x, y: b.y, width: b.w, height: b.h }),
  confidence: 0.9,
});

// Vùng chụp 500×80 lấy con trỏ (640, 400) làm tâm — đúng cấu tạo của tryOcr().
const CAPTURE = rect('screen-logical', { x: 390, y: 360, width: 500, height: 80 });
const SCALE = 1;

test('sortReadingOrder: sắp xếp trên→dưới rồi trái→phải, không phụ thuộc thứ tự Vision trả về', () => {
  // Cố tình đưa vào lộn xộn: dòng dưới trước, phải trước trái.
  const messy = [
    block('thế giới', { x: 120, y: 40, w: 80, h: 16 }),
    block('Xin chào', { x: 10, y: 40, w: 90, h: 16 }),
    block('dòng trên', { x: 10, y: 10, w: 90, h: 16 }),
  ];
  assert.deepEqual(sortReadingOrder(messy).map((b) => b.text), ['dòng trên', 'Xin chào', 'thế giới']);
});

test('sortReadingOrder: khối lệch nhẹ theo chiều dọc vẫn được coi là cùng một dòng', () => {
  // Baseline OCR hiếm khi thẳng hàng tuyệt đối — lệch 3px trên khối cao 16px.
  const blocks = [block('phải', { x: 120, y: 43, w: 60, h: 16 }), block('trái', { x: 10, y: 40, w: 60, h: 16 })];
  assert.deepEqual(sortReadingOrder(blocks).map((b) => b.text), ['trái', 'phải']);
});

test('layoutBlocks: ghép text theo thứ tự đọc bằng ký tự xuống dòng', () => {
  const layout = layoutBlocks(
    [block('dòng hai', { x: 10, y: 40, w: 90, h: 16 }), block('dòng một', { x: 10, y: 10, w: 90, h: 16 })],
    point('screen-logical', 0, 0), // con trỏ ngoài mọi khối
    CAPTURE,
    SCALE,
  );
  assert.equal(layout.text, 'dòng một\ndòng hai');
  assert.equal(layout.charOffset, undefined, 'không trúng khối nào thì không được đoán offset');
  assert.equal(layout.hitBounds, undefined);
});

test('layoutBlocks: con trỏ ở DÒNG NÀO thì offset rơi vào đúng dòng đó', () => {
  const blocks = [
    block('alpha bravo', { x: 10, y: 10, w: 200, h: 16 }), // screen-logical y 370..386
    block('charlie delta', { x: 10, y: 40, w: 200, h: 16 }), // screen-logical y 400..416
  ];
  // CAPTURE gốc (390, 360) nên khối 1 nằm ở x 400..600, y 370..386
  const onFirst = layoutBlocks(blocks, point('screen-logical', 500, 378), CAPTURE, SCALE);
  const onSecond = layoutBlocks(blocks, point('screen-logical', 500, 408), CAPTURE, SCALE);

  assert.ok(onFirst.charOffset !== undefined && onFirst.charOffset < 'alpha bravo'.length,
    `dòng 1 phải cho offset trong dòng 1, nhận ${onFirst.charOffset}`);
  assert.ok(onSecond.charOffset !== undefined && onSecond.charOffset > 'alpha bravo'.length,
    `dòng 2 phải cho offset trong dòng 2, nhận ${onSecond.charOffset}`);
});

test('layoutBlocks: trong cùng một dòng, offset đổi theo vị trí X của con trỏ', () => {
  const blocks = [block('one two three four', { x: 10, y: 10, w: 200, h: 16 })]; // x 400..600
  const left = layoutBlocks(blocks, point('screen-logical', 410, 378), CAPTURE, SCALE);
  const right = layoutBlocks(blocks, point('screen-logical', 590, 378), CAPTURE, SCALE);

  assert.ok(left.charOffset !== undefined && right.charOffset !== undefined);
  assert.ok(left.charOffset < right.charOffset,
    `hover trái phải cho offset nhỏ hơn hover phải, nhận ${left.charOffset} và ${right.charOffset}`);
});

test('layoutBlocks: hitBounds neo vào khối trúng, không phải khung chụp', () => {
  const blocks = [block('mục tiêu', { x: 10, y: 10, w: 200, h: 16 })];
  const layout = layoutBlocks(blocks, point('screen-logical', 500, 378), CAPTURE, SCALE);

  assert.ok(layout.hitBounds, 'phải có hitBounds khi trúng khối');
  assert.equal(layout.hitBounds.width, 200, 'là khung khối chữ, không phải khung chụp 500px');
  assert.equal(layout.hitBounds.x, 400);
});

test('layoutBlocks: màn hình Retina — khung khối quy đổi đúng theo hệ số DPI', () => {
  // Vision làm việc trên pixel VẬT LÝ, nên trên máy scale 2 khối rộng 200px
  // ảnh chỉ tương ứng 100 điểm logic. Sai chỗ này thì overlay lệch trên Retina
  // mà hoàn toàn vô hình khi phát triển trên màn 1×.
  const blocks = [block('retina', { x: 20, y: 20, w: 200, h: 32 })];
  const layout = layoutBlocks(blocks, point('screen-logical', 450, 380), CAPTURE, 2);

  assert.ok(layout.hitBounds);
  assert.equal(layout.hitBounds.width, 100, '200 pixel vật lý = 100 điểm logic ở scale 2');
  assert.equal(layout.hitBounds.x, 400, 'gốc 390 + 20/2 = 400');
});

test('layoutBlocks: danh sách khối rỗng không ném lỗi', () => {
  const layout = layoutBlocks([], point('screen-logical', 500, 400), CAPTURE, SCALE);
  assert.equal(layout.text, '');
  assert.equal(layout.charOffset, undefined);
});
