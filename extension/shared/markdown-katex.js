/**
 * Lightweight Markdown & LaTeX Math Parser
 * Converts Markdown and LaTeX math expressions to sanitized HTML using KaTeX.
 */

// Escape HTML utility
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render LaTeX math expression via KaTeX
 */
function renderMath(formula, displayMode = false) {
  if (typeof window !== 'undefined' && window.katex) {
    try {
      return window.katex.renderToString(formula, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return `<code class="math-error">${escapeHtml(formula)}</code>`;
    }
  }
  return `<code class="math-fallback">${escapeHtml(formula)}</code>`;
}

/**
 * Format markdown text and LaTeX math into HTML
 */
export function formatMarkdownAndMath(text) {
  if (!text) return '';

  let html = text;

  // 0. Auto-wrap isolated LaTeX commands not enclosed in $...$
  html = html.replace(/(^|[\s(])(\\(?:infty|boxed\{[^}\n]+\}|frac\{[^}\n]+\}\{[^}\n]+\}|sqrt\{[^}\n]+\}|alpha|beta|gamma|theta|pi|pm|times|div|ne|le|ge))(?=[\s),.!?]|$)/g, '$1$$$2$$');

  // 1. Extract and protect Display Math: $$...$$ or \[...\]
  const mathBlocks = [];
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, code) => {
    const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
    mathBlocks.push({ code: code.trim(), display: true });
    return placeholder;
  });

  html = html.replace(/\\\[([\s\S]+?)\\\]/g, (match, code) => {
    const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
    mathBlocks.push({ code: code.trim(), display: true });
    return placeholder;
  });

  // 2. Extract and protect Inline Math: $...$ or \(...\)
  html = html.replace(/\$([^\$\n]+?)\$/g, (match, code) => {
    const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
    mathBlocks.push({ code: code.trim(), display: false });
    return placeholder;
  });

  html = html.replace(/\\\(([\s\S]+?)\\\)/g, (match, code) => {
    const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
    mathBlocks.push({ code: code.trim(), display: false });
    return placeholder;
  });

  // 3. Extract and protect Code Blocks: ```lang ... ```
  const codeBlocks = [];
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]+?)```/g, (match, lang, code) => {
    const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
    codeBlocks.push({ lang: lang || 'text', code: escapeHtml(code.trim()) });
    return placeholder;
  });

  // 4. Basic Markdown formatting
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Inline Code
  html = html.replace(/`([^`]+)`/g, (m, c) => `<code class="inline-code">${escapeHtml(c)}</code>`);

  // Lists
  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li class="md-li">$1</li>');
  html = html.replace(/(<li class="md-li">.*<\/li>)/gim, '<ul class="md-ul">$1</ul>');
  // Clean duplicate UL wrappers
  html = html.replace(/<\/ul>\s*<ul class="md-ul">/g, '');

  // Ordered lists
  html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li class="md-oli">$2</li>');
  html = html.replace(/(<li class="md-oli">.*<\/li>)/gim, '<ol class="md-ol">$1</ol>');
  html = html.replace(/<\/ol>\s*<ol class="md-ol">/g, '');

  // Line breaks & Paragraphs
  html = html.replace(/\n\n/g, '<p class="md-p"></p>');
  html = html.replace(/\n/g, '<br>');

  // 5. Restore Code Blocks
  codeBlocks.forEach((cb, idx) => {
    const rendered = `<div class="code-block-wrapper">
      <div class="code-header">
        <span class="code-lang">${cb.lang}</span>
        <button class="copy-code-btn" data-code="${encodeURIComponent(cb.code)}">Copy</button>
      </div>
      <pre><code class="language-${cb.lang}">${cb.code}</code></pre>
    </div>`;
    html = html.replace(`___CODE_BLOCK_${idx}___`, rendered);
  });

  // 6. Restore Math Blocks via KaTeX
  mathBlocks.forEach((mb, idx) => {
    const rendered = renderMath(mb.code, mb.display);
    html = html.replace(`___MATH_BLOCK_${idx}___`, rendered);
  });

  return html;
}
