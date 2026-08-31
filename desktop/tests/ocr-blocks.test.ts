import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { layoutBlocks, sortReadingOrder } from '../src/main/acquisition/ocr/blocks';
import { point, rect } from '../src/shared/types/geometry';
import type { TextBlock, TextWord } from '../src/shared/types/content';

/** Khối OCR trong hệ ảnh ĐÃ CẮT (gốc trên-trái), đúng như Vision trả về. */
const block = (
  text: string,
  b: { x: number; y: number; w: number; h: number },
  words: TextWord[] = [],
): TextBlock => ({
  text,
  bounds: rect('image', { x: b.x, y: b.y, width: b.w, height: b.h }),
  confidence: 0.9,
  words,
});

/** Khung một TỪ trong khối — đúng như `wordBoxes()` của main.swift trả về. */
const word = (text: string, startOffset: number, b: { x: number; y: number; w: number; h: number }): TextWord => ({
  text,
  startOffset,
  endOffset: startOffset + text.length,
  bounds: rect('image', { x: b.x, y: b.y, width: b.w, height: b.h }),
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

test('layoutBlocks: có khung từ thì hit-test CHÍNH XÁC, không nội suy', () => {
  // "one" rộng 40px (10-50), "two" rộng 130px (60-190) — nếu còn nội suy theo
  // tỉ lệ ký tự đều nhau (bỏ qua bề rộng thật), hover ở x=150 (giữa "two",
  // gần cuối khối) sẽ bị tính lệch sang gần cuối "two" hoặc quá "three". Có
  // khung từ thì phải luôn ra ĐÚNG "two" bất kể bề rộng từ chênh lệch thế nào.
  const blocks = [
    block('one two three', { x: 10, y: 10, w: 200, h: 16 }, [
      word('one', 0, { x: 10, y: 10, w: 40, h: 16 }),
      word('two', 4, { x: 60, y: 10, w: 130, h: 16 }), // từ RẤT rộng, phá nội suy nếu còn dùng
      word('three', 8, { x: 200, y: 10, w: 10, h: 16 }),
    ]),
  ];
  // x màn hình = 390 (gốc CAPTURE) + 150 (trong khối) = 540, giữa khung "two" (70..190)
  const layout = layoutBlocks(blocks, point('screen-logical', 540, 378), CAPTURE, SCALE);
  assert.equal(layout.charOffset, 4, `phải trúng đúng "two" (offset 4) nhờ khung từ thật, nhận ${layout.charOffset}`);
});

test('layoutBlocks: hover vào KHOẢNG TRẮNG giữa hai khung từ trả về từ GẦN NHẤT', () => {
  // Lỗi cùng loại đã sửa ở pickSegmentAtIndex: rơi vào khe không được lấy từ
  // đầu/cuối khối một cách tuỳ tiện, phải lấy từ có mép gần con trỏ nhất.
  const blocks = [
    block('alpha beta', { x: 10, y: 10, w: 200, h: 16 }, [
      word('alpha', 0, { x: 10, y: 10, w: 60, h: 16 }), // 10..70
      word('beta', 6, { x: 90, y: 10, w: 50, h: 16 }), // 90..140, khe 70..90
    ]),
  ];
  // x màn hình 390+75=465 — trong khe, gần "alpha" (cách 5px) hơn "beta" (cách 15px)
  const nearAlpha = layoutBlocks(blocks, point('screen-logical', 465, 378), CAPTURE, SCALE);
  assert.equal(nearAlpha.charOffset, 0, 'gần "alpha" hơn thì phải trả offset của "alpha"');

  // x màn hình 390+85=475 — gần "beta" (cách 5px) hơn "alpha" (cách 15px)
  const nearBeta = layoutBlocks(blocks, point('screen-logical', 475, 378), CAPTURE, SCALE);
  assert.equal(nearBeta.charOffset, 6, 'gần "beta" hơn thì phải trả offset của "beta"');
});

test('layoutBlocks: khối KHÔNG có khung từ thì lùi về nội suy như trước (không vỡ)', () => {
  const blocks = [block('one two three four', { x: 10, y: 10, w: 200, h: 16 })]; // words: []
  const left = layoutBlocks(blocks, point('screen-logical', 410, 378), CAPTURE, SCALE);
  const right = layoutBlocks(blocks, point('screen-logical', 590, 378), CAPTURE, SCALE);
  assert.ok(left.charOffset !== undefined && right.charOffset !== undefined && left.charOffset < right.charOffset);
});

test('layoutBlocks: danh sách khối rỗng không ném lỗi', () => {
  const layout = layoutBlocks([], point('screen-logical', 500, 400), CAPTURE, SCALE);
  assert.equal(layout.text, '');
  assert.equal(layout.charOffset, undefined);
});
