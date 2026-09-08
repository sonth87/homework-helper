/**
 * Kiểm thử bộ dựng markdown + KaTeX.
 *
 * Chạy: npm run test
 *
 * Những trường hợp ở đây đều là lỗi ĐÃ XẢY RA THẬT, không phải giả định:
 * mã giữ chỗ sót lại giữa lời giải, và công thức bị markdown cắt nát.
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { renderMarkdown } from '../src/renderer/components/markdown/render';

test('công thức inline được dựng, không sót mã giữ chỗ', () => {
  const html = renderMarkdown('Rút gọn: $x = 2$');
  assert.match(html, /class="katex"/);
  assert.doesNotMatch(html, /KTXZ/, 'còn sót mã giữ chỗ trong đầu ra');
  assert.doesNotMatch(html, /\$/, 'còn sót dấu đô la chưa xử lý');
});

test('công thức ở CUỐI phần tử vẫn được thay', () => {
  // Đây là bug thật: mã giữ chỗ từng được đệm khoảng trắng, mà marked cắt bỏ
  // khoảng trắng cuối phần tử nên mã không khớp lại được.
  const html = renderMarkdown('1. Trừ hai vế\n2. Rút gọn: $x = 2$\n');
  assert.doesNotMatch(html, /KTXZ/);
  assert.equal((html.match(/class="katex"/g) ?? []).length, 1);
});

test('công thức khối dựng ở chế độ display', () => {
  const html = renderMarkdown('$$x + 2 = 4$$');
  assert.match(html, /katex-display/);
});

test('markdown KHÔNG cắt nát công thức chứa gạch dưới', () => {
  // Nếu marked chạy trước, `_1` và `_2` bị hiểu là cú pháp nhấn mạnh và thẻ
  // <em> chèn vào giữa công thức khiến KaTeX không parse được.
  const html = renderMarkdown('Cho $a_1 + a_2 = b$ thì...');
  assert.doesNotMatch(html, /<em>/);
  assert.match(html, /class="katex"/);
});

test('trên 10 công thức: mã giữ chỗ không khớp nhầm tiền tố', () => {
  // KTXZ1Z từng khớp nhầm vào phần đầu của KTXZ10Z khi thiếu ký tự kết thúc.
  const source = Array.from({ length: 12 }, (_, i) => `$x_{${i}}$`).join(' và ');
  const html = renderMarkdown(source);
  assert.doesNotMatch(html, /KTXZ/);
  assert.equal((html.match(/class="katex"/g) ?? []).length, 12);
});

test('công thức sai cú pháp không làm vỡ cả lời giải', () => {
  const html = renderMarkdown('Trước $\\frac{1}{$ sau');
  assert.match(html, /sau/, 'phần văn bản sau công thức hỏng phải còn nguyên');
});

test('markdown thường vẫn hoạt động', () => {
  const html = renderMarkdown('### Đáp án\n\n- một\n- hai');
  assert.match(html, /<h3>/);
  assert.equal((html.match(/<li>/g) ?? []).length, 2);
});
