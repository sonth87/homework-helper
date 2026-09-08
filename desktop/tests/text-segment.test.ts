import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  normalizeWhitespace,
  pickSegmentAtIndex,
  pickSegmentAtOffset,
  segmentText,
} from '../src/shared/utils/text-segment';

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

test('pickSegmentAtOffset: văn bản một câu trả nguyên văn bất kể offset (trường hợp phổ biến nhất từ AX)', () => {
  assert.equal(pickSegmentAtOffset('Visual Studio Code', 0, 'sentence'), 'Visual Studio Code');
  assert.equal(pickSegmentAtOffset('Visual Studio Code', 0.9, 'sentence'), 'Visual Studio Code');
});

test('pickSegmentAtOffset: văn bản rỗng trả về null, không ném lỗi', () => {
  assert.equal(pickSegmentAtOffset('   ', 0, 'sentence'), null);
  assert.equal(pickSegmentAtOffset('', 0.5, 'word'), null);
});

test('pickSegmentAtOffset: granularity "word" — hover đầu/giữa/cuối câu ra đúng từ khác nhau', () => {
  // Đây là bài kiểm chứng trực tiếp cho lỗi đã sửa: trước đây luôn trả từ đầu
  // tiên bất kể offset, khiến dịch theo từ vô nghĩa (hover từ nào cũng ra
  // cùng một kết quả). Giờ offset khác nhau phải cho từ khác nhau.
  const text = 'The quick brown fox jumps';
  assert.equal(pickSegmentAtOffset(text, 0, 'word'), 'The');
  assert.equal(pickSegmentAtOffset(text, 1, 'word'), 'jumps');
  const middle = pickSegmentAtOffset(text, 0.5, 'word');
  assert.ok(middle && !['The', 'jumps'].includes(middle), `từ giữa câu phải khác đầu/cuối, nhận "${middle}"`);
});

test('pickSegmentAtOffset: offset ngoài [0,1] được ghim lại thay vì lỗi', () => {
  const text = 'one two three';
  assert.equal(pickSegmentAtOffset(text, -5, 'word'), 'one');
  assert.equal(pickSegmentAtOffset(text, 5, 'word'), 'three');
});

test('pickSegmentAtIndex: chỉ số chính xác trả đúng từ tại chỉ số đó', () => {
  const text = 'The quick brown fox jumps';
  assert.equal(pickSegmentAtIndex(text, 0, 'word'), 'The');
  assert.equal(pickSegmentAtIndex(text, 5, 'word'), 'quick');
  assert.equal(pickSegmentAtIndex(text, 11, 'word'), 'brown');
  assert.equal(pickSegmentAtIndex(text, 22, 'word'), 'jumps');
});

test('pickSegmentAtIndex: rơi vào KHOẢNG TRẮNG trả từ KỀ BÊN, không phải từ cuối', () => {
  // Lỗi đã sửa: trước đây fallback lấy segments[length-1], nên hover vào
  // khoảng trắng ở ĐẦU câu lại trả về từ CUỐI câu. Xảy ra ở ~1/6 vị trí hover.
  const text = 'The quick brown fox jumps over the lazy dog';
  assert.equal(pickSegmentAtIndex(text, 3, 'word'), 'The', 'khoảng trắng sau "The" phải ra từ kề, không phải "dog"');
  assert.equal(pickSegmentAtIndex(text, 9, 'word'), 'quick');
  assert.equal(pickSegmentAtIndex(text, 15, 'word'), 'brown');
});

test('pickSegmentAtIndex: KHÔNG chuẩn hoá trước khi tra cứu — chỉ số không bị dịch', () => {
  // normalizeWhitespace() gộp khoảng trắng, làm DỊCH mọi chỉ số ký tự. Nếu
  // chuẩn hoá trước rồi mới tra theo offset thô của native thì tra nhầm chỗ.
  const text = 'alpha     beta     gamma';   // nhiều khoảng trắng liên tiếp
  assert.equal(pickSegmentAtIndex(text, 10, 'word'), 'beta', 'chỉ số 10 nằm trong "beta" của chuỗi THÔ');
  assert.equal(pickSegmentAtIndex(text, 19, 'word'), 'gamma');
});

test('pickSegmentAtIndex: chỉ số ngoài phạm vi được ghim, không ném lỗi', () => {
  assert.equal(pickSegmentAtIndex('one two three', -10, 'word'), 'one');
  assert.equal(pickSegmentAtIndex('one two three', 999, 'word'), 'three');
  assert.equal(pickSegmentAtIndex('   ', 0, 'word'), null);
});

test('pickSegmentAtIndex: câu trong đoạn nhiều câu — chỉ số quyết định, không phải thứ tự', () => {
  const text = 'Câu một ở đây. Câu hai ở giữa. Câu ba cuối cùng.';
  assert.match(pickSegmentAtIndex(text, 2, 'sentence') ?? '', /một/);
  assert.match(pickSegmentAtIndex(text, 20, 'sentence') ?? '', /hai/);
  assert.match(pickSegmentAtIndex(text, 40, 'sentence') ?? '', /ba/);
});

test('normalizeWhitespace gộp khoảng trắng liên tiếp, không đổi nội dung chữ', () => {
  assert.equal(normalizeWhitespace('  a   b\tc  '), 'a b c');
  assert.equal(normalizeWhitespace('dòng 1\n\n\n\ndòng 2'), 'dòng 1\n\ndòng 2');
});
