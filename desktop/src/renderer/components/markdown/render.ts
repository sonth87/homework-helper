/**
 * Dựng markdown + LaTeX thành HTML.
 *
 * Thứ tự bắt buộc: TÁCH công thức ra TRƯỚC khi chạy markdown.
 * ------------------------------------------------------------
 * Nếu để marked chạy trước, nó sẽ hiểu dấu gạch dưới hoặc dấu sao bên trong
 * công thức là cú pháp nhấn mạnh và chèn thẻ <em> vào giữa — KaTeX sau đó
 * không parse được nữa. Đây chính là lỗi "công thức hiện thành mã lạ" mà người
 * dùng extension hay gặp.
 *
 * Cách làm: thay mỗi công thức bằng một mã giữ chỗ không chứa ký tự markdown,
 * chạy marked, rồi trả công thức đã dựng vào đúng chỗ.
 *
 * Hai chi tiết của mã giữ chỗ, cả hai đều đã gây lỗi thật:
 *   - KHÔNG đệm khoảng trắng quanh mã. marked cắt khoảng trắng ở cuối phần tử,
 *     nên mã có đệm sẽ không khớp lại được và người dùng thấy "KTX2" nguyên xi
 *     giữa lời giải.
 *   - Có ký tự kết thúc (chữ Z ở cuối). Không có nó thì với 10 công thức trở
 *     lên, mã KTXZ1Z sẽ khớp nhầm vào tiền tố của KTXZ10Z.
 */

import { marked } from 'marked';
import katex from 'katex';

marked.setOptions({ gfm: true, breaks: true });

type Placeholder = { token: string; html: string };

// Khối bao bằng hai dấu đô la phải khớp TRƯỚC khối một dấu, nếu không cặp đôi
// sẽ bị hiểu thành hai công thức rỗng.
const PATTERNS: { re: RegExp; display: boolean }[] = [
  { re: /\$\$([\s\S]+?)\$\$/g, display: true },
  { re: /\\\[([\s\S]+?)\\\]/g, display: true },
  { re: /\$([^$\n]+?)\$/g, display: false },
  { re: /\\\(([\s\S]+?)\\\)/g, display: false },
];

export function renderMarkdown(source: string): string {
  const holders: Placeholder[] = [];
  let text = source;

  for (const { re, display } of PATTERNS) {
    text = text.replace(re, (_match, tex: string) => {
      const token = `KTXZ${holders.length}Z`;
      holders.push({ token, html: renderTex(tex, display) });
      return token;
    });
  }

  let html = marked.parse(text) as string;
  // replaceAll: một công thức có thể xuất hiện nhiều lần sau khi marked xử lý
  // (ví dụ trong cả mục lục lẫn thân bài).
  for (const { token, html: tex } of holders) html = html.replaceAll(token, tex);
  return html;
}

function renderTex(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex.trim(), { displayMode, throwOnError: false, output: 'html' });
  } catch {
    // Công thức hỏng thì hiện nguyên văn còn hơn làm vỡ cả lời giải.
    return `<code>${escapeHtml(tex)}</code>`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}
