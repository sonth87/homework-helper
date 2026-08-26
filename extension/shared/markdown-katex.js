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
        // Vietnamese diacritics inside \text{...} labels (e.g. \text{Tổng})
        // render correctly via the browser's own font, but KaTeX's strict
        // mode still logs a console warning per character since they're
        // outside its built-in Unicode symbol table — silence that here.
        strict: false,
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return `<code class="math-error">${escapeHtml(formula)}</code>`;
    }
  }
  return `<code class="math-fallback">${escapeHtml(formula)}</code>`;
}

// Vietnamese diacritics essentially never appear inside real LaTeX math,
// UNLESS they're wrapped in a text-mode command like \text{...} — a
// standard, valid way to embed Vietnamese labels ("\text{Đáp án: B}") inside
// a math expression. A $...$/$$...$$ span with diacritics OUTSIDE any such
// wrapper is almost always a stray `$` (currency, a mismatched delimiter)
// that swallowed ordinary prose rather than an actual formula — feeding
// that to KaTeX just produces console warning spam and garbled output for
// characters it has no glyph metrics for. Skip those and leave the original
// text untouched instead of misrendering it as math.
const VIETNAMESE_DIACRITICS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;
const TEXT_MODE_COMMAND = /\\(?:text|mathrm|textrm|operatorname)\{[^{}]*\}/g;

function looksLikeMath(code) {
  const withoutTextSpans = code.replace(TEXT_MODE_COMMAND, '');
  return !VIETNAMESE_DIACRITICS.test(withoutTextSpans);
}

/**
 * Format markdown text and LaTeX math into HTML
 */
export function formatMarkdownAndMath(text) {
  if (!text) return '';

  let html = text;
  const mathBlocks = [];

  // 1. Extract and protect Display Math: $$...$$ or \[...\]
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, code) => {
    if (!looksLikeMath(code)) return match;
    const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
    mathBlocks.push({ code: code.trim(), display: true });
    return placeholder;
  });

  html = html.replace(/\\\[([\s\S]+?)\\\]/g, (match, code) => {
    if (!looksLikeMath(code)) return match;
    const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
    mathBlocks.push({ code: code.trim(), display: true });
    return placeholder;
  });

  // 1b. Some responses emit LaTeX alignment/matrix environments
  // (\begin{aligned}...\end{aligned}) without wrapping them in $$...$$ at
  // all. Catch those bare environments here — before the auto-wrap step
  // below, which would otherwise reach inside the (still unrecognized)
  // environment and inject a stray $...$ around any \frac{}{} it finds,
  // corrupting the block.
  html = html.replace(/\\begin\{(aligned|align\*?|cases|matrix|pmatrix|bmatrix|vmatrix|array)\}[\s\S]+?\\end\{\1\}/g, (match) => {
    if (!looksLikeMath(match)) return match;
    const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
    mathBlocks.push({ code: match.trim(), display: true });
    return placeholder;
  });

  // 0. Auto-wrap isolated LaTeX commands not enclosed in $...$
  html = html.replace(/(^|[\s(])(\\(?:infty|boxed\{[^}\n]+\}|frac\{[^}\n]+\}\{[^}\n]+\}|sqrt\{[^}\n]+\}|alpha|beta|gamma|theta|pi|pm|times|div|ne|le|ge))(?=[\s),.!?]|$)/g, '$1$$$2$$');

  // 2. Extract and protect Inline Math: $...$ or \(...\)
  html = html.replace(/\$([^\$\n]+?)\$/g, (match, code) => {
    if (!looksLikeMath(code)) return match;
    const placeholder = `___MATH_BLOCK_${mathBlocks.length}___`;
    mathBlocks.push({ code: code.trim(), display: false });
    return placeholder;
  });

  html = html.replace(/\\\(([\s\S]+?)\\\)/g, (match, code) => {
    if (!looksLikeMath(code)) return match;
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

// Inline-only markdown (bold/italic/inline-code), with the source text HTML-escaped
// first — used by formatDictionaryEntry() below, which builds its own block-level
// HTML (headword/sense/example divs) around these already-escaped inline fragments.
function formatInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  return html;
}

/**
 * Renders a single-word translate/dictionary result (see the 'translate'
 * studyMode prompt in study-prompt.js) into the two-column dictionary layout:
 * **word** /phonetic/, then one row per sense with *pos.* on the left and the
 * bolded gloss + example on the right, then a plain description paragraph.
 * Falls back to the regular formatMarkdownAndMath() renderer whenever the
 * text doesn't actually match that structure (phrase/sentence translations,
 * a model that ignored the format, or a still-incomplete streaming chunk).
 */
export function formatDictionaryEntry(text) {
  if (!text) return '';

  const paragraphs = text.trim().split(/\n\s*\n/).filter((p) => p.trim());
  if (paragraphs.length < 2) return formatMarkdownAndMath(text);

  const headwordMatch = paragraphs[0].trim().match(/^\*\*(.+?)\*\*\s*(\/[^/\n]+\/)?/);
  if (!headwordMatch) return formatMarkdownAndMath(text);

  const [, word, phonetic] = headwordMatch;
  let html = `<div class="hw-dict-headword"><strong>${escapeHtml(word.trim())}</strong>${phonetic ? ` <span class="hw-dict-phonetic">${escapeHtml(phonetic)}</span>` : ''}</div>`;

  const senseRe = /^\*([^*\n]+?)\.?\*\s*\*\*([^*\n]+?)\*\*/;

  for (let i = 1; i < paragraphs.length; i++) {
    const lines = paragraphs[i].trim().split('\n');
    const firstLine = lines[0].trim();
    const senseMatch = firstLine.match(senseRe);

    if (senseMatch) {
      const [full, pos, gloss] = senseMatch;
      const exampleParts = [];
      const restFirstLine = firstLine.slice(full.length).trim();
      if (restFirstLine) exampleParts.push(formatInline(restFirstLine));
      for (let j = 1; j < lines.length; j++) {
        const t = lines[j].trim();
        if (t) exampleParts.push(formatInline(t));
      }

      html += `<div class="hw-dict-sense">
        <div class="hw-dict-pos">${escapeHtml(pos.trim())}.</div>
        <div class="hw-dict-body">
          <div class="hw-dict-gloss">${formatInline(gloss.trim())}</div>
          ${exampleParts.length ? `<div class="hw-dict-example">${exampleParts.join('<br>')}</div>` : ''}
        </div>
      </div>`;
    } else {
      html += `<div class="hw-dict-desc">${formatInline(paragraphs[i].trim())}</div>`;
    }
  }

  return html;
}
