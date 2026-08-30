import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { normalizeWhitespace, pickFirstSegment, segmentText } from '../src/shared/utils/text-segment';

test('cắt câu tiếng Anh cơ bản', () => {
  const segs = segmentText('Hello world. How are you?', 'sentence');
  assert.equal(segs.length, 2);
  assert.equal(segs[0]?.text.trim(), 'Hello world.');
  assert.equal(segs[1]?.text.trim(), 'How are you?');
});

test('cắt từ bỏ qua khoảng trắng và dấu câu', () => {
  const segs = segmentText('Hello, world!', 'word');
  assert.deepEqual(segs.map((s) => s.text), ['Hello', 'world']);
});

test('Intl.Segmenter cắt đúng tiếng Việt — không tách vỡ dấu câu Latin regex sẽ hỏng', () => {
  // Locale 'vi' quan trọng: dấu chấm trong "T.P" hay số thập phân không nên
  // bị coi là ranh giới câu một cách ngây thơ.
  const segs = segmentText('Đây là câu một. Đây là câu hai.', 'sentence', 'vi');
  assert.equal(segs.length, 2);
});

test('cắt câu tiếng Trung — không dựa vào dấu chấm/khoảng trắng kiểu Latin', () => {
  // Intl.Segmenter nhận diện ranh giới câu qua dấu 。 kể cả không có khoảng trắng.
  const segs = segmentText('你好世界。这是第二句。', 'sentence', 'zh');
  assert.equal(segs.length, 2);
});

test('cắt từ tiếng Nhật không có khoảng trắng giữa các từ', () => {
  // Đây là điểm mà regex \s hay split(' ') của bản Latin-centric sẽ hỏng hoàn
  // toàn — tiếng Nhật không dùng khoảng trắng phân từ.
  const segs = segmentText('東京は日本の首都です', 'word', 'ja');
  assert.ok(segs.length > 1, 'phải tách được nhiều hơn 1 từ dù không có khoảng trắng');
});

test('đoạn tách theo dòng trống, giữ nguyên câu bên trong', () => {
  const segs = segmentText('Đoạn một có hai câu. Vẫn đoạn một.\n\nĐoạn hai.', 'paragraph');
  assert.equal(segs.length, 2);
  assert.match(segs[0]?.text ?? '', /Đoạn một/);
  assert.match(segs[1]?.text ?? '', /Đoạn hai/);
});

test('pickFirstSegment: văn bản một câu trả nguyên văn (trường hợp phổ biến nhất từ AX)', () => {
  const result = pickFirstSegment('Visual Studio Code', 'sentence');
  assert.equal(result, 'Visual Studio Code');
});

test('pickFirstSegment: văn bản rỗng trả về null, không ném lỗi', () => {
  assert.equal(pickFirstSegment('   ', 'sentence'), null);
  assert.equal(pickFirstSegment('', 'word'), null);
});

test('normalizeWhitespace gộp khoảng trắng liên tiếp, không đổi nội dung chữ', () => {
  assert.equal(normalizeWhitespace('  a   b\tc  '), 'a b c');
  assert.equal(normalizeWhitespace('dòng 1\n\n\n\ndòng 2'), 'dòng 1\n\ndòng 2');
});
