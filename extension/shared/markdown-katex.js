/**
 * Lightweight Markdown & LaTeX Math Parser
 * Converts Markdown and LaTeX math expressions to sanitized HTML using KaTeX.
 */

import { parseDictionaryEntry, looksLikeDictionaryJson } from './dictionary.js';

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

  // The dictionary-example prompt asks the model to backtick-highlight only
  // the single target word/term — some models (esp. weaker/local ones)
  // ignore that and wrap the whole example sentence instead, turning it
  // entirely blue/bold. A real highlight is a small fraction of the line; a
  // mis-wrapped whole sentence is roughly half of it or more — render that
  // case as plain text instead of visually shouting the entire sentence.
  const totalWords = text.trim().split(/\s+/).filter(Boolean).length;
  html = html.replace(/`([^`]+)`/g, (m, c) => {
    const wordCount = c.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 5 || (totalWords > 0 && wordCount / totalWords > 0.45)) return c;
    return `<code class="inline-code">${c}</code>`;
  });
  return html;
}

// Known part-of-speech abbreviations the translate prompt asks for — used to
// recognize a sense line even when a model drops the *italic* markers around
// it (weaker/local models frequently do), without also matching ordinary
// prose that happens to start with a short word + period ("A. " outlines, etc).
const POS_ABBR = 'n|v|adj|adv|prep|conj|pron|interj|num|art|det';
const LENIENT_SENSE_RE = new RegExp(`^(${POS_ABBR})\\.,?\\s*(.+)$`, 'i');

// Renders the closing description block of a dictionary entry. The prompt
// asks for a "**translated term**" heading line immediately followed by the
// description sentence (no blank line between them, same pairing convention
// as the part-of-speech + example lines above it) — pull that term out into
// its own styled heading when present, so the box reads like "người phát
// triển" / description rather than just a bare paragraph.
function formatDictDesc(paraText) {
  const lines = paraText.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return `<div class="hw-dict-desc">${formatInline(paraText.replace(/\n/g, ' '))}</div>`;
  }

  const boldWrap = lines[0].match(/^\*\*(.+)\*\*$/) || lines[0].match(/^\*(.+)\*$/);
  const term = (boldWrap ? boldWrap[1] : lines[0]).trim();
  // A real translated-term heading is a short label, not a full sentence —
  // guards against a model (esp. weaker/local ones) that skipped the bold
  // marker but still wrote a normal multi-line description paragraph.
  const looksLikeTerm = boldWrap || (term.length > 0 && term.length <= 40 && !/[.?!:;]$/.test(term));
  if (!looksLikeTerm) {
    return `<div class="hw-dict-desc">${formatInline(paraText.replace(/\n/g, ' '))}</div>`;
  }

  const rest = lines.slice(1).join(' ');
  return `<div class="hw-dict-desc"><div class="hw-dict-desc-term">${formatInline(term)}</div>${rest ? `<div class="hw-dict-desc-text">${formatInline(rest)}</div>` : ''}</div>`;
}

/**
 * Renders a single-word translate/dictionary result (see the 'translate'
 * studyMode prompt in study-prompt.js) into the two-column dictionary layout:
 * word /phonetic/, then one row per sense with the part-of-speech on the left
 * and the gloss + example on the right, then a plain description paragraph.
 * Falls back to the regular formatMarkdownAndMath() renderer whenever the
 * text doesn't actually match that structure (phrase/sentence translations,
 * a still-incomplete streaming chunk, or clearly not a single-word entry).
 *
 * The headword/sense matching is intentionally lenient — weaker or local
 * models (Gemini Nano, small Ollama/LM Studio checkpoints) often get the
 * gist right but drop the exact bold / italic markup the prompt asked for
 * (plain "Framework" instead of "**Framework**", "n., ..." instead of
 * "*n.* **...**"). Matching those near-misses still gets a clean structured
 * card instead of falling all the way back to raw, unstyled text.
 */
export function formatDictionaryEntry(text) {
  if (!text) return '';

  const paragraphs = text.trim().split(/\n\s*\n/).filter((p) => p.trim());
  if (paragraphs.length < 2) return formatMarkdownAndMath(text);

  // Headword: normally "**word** /phonetic/" on one line, but tolerate a
  // missing bold marker and/or the phonetic sitting on its own line right
  // after the word instead of the same line.
  const firstPara = paragraphs[0].trim();
  const firstParaLines = firstPara.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!firstParaLines.length) return formatMarkdownAndMath(text);

  const phoneticMatch = firstPara.match(/\/[^/\n]+\//);
  const phonetic = phoneticMatch ? phoneticMatch[0] : '';
  const wordLine = firstParaLines[0].replace(/\/[^/\n]+\/\s*$/, '').trim(); // strip a same-line trailing phonetic
  // Only unwrap a genuine matching pair of ** or * markers around the whole
  // line — a blind strip-from-both-ends would leave a stray trailing marker
  // behind whenever the phonetic (already removed above) sat right after it.
  const boldWrap = wordLine.match(/^\*\*(.+)\*\*$/) || wordLine.match(/^\*(.+)\*$/);
  const word = (boldWrap ? boldWrap[1] : wordLine).trim();

  // A real headword is a single token (no spaces) — a multi-word first line
  // means the model ignored the "single word only" rule (or this is actually
  // a phrase/sentence reply), so don't force a dictionary layout onto it.
  if (!word || /\s/.test(word)) return formatMarkdownAndMath(text);

  let html = `<div class="hw-dict-headword"><strong>${escapeHtml(word)}</strong>${phonetic ? ` <span class="hw-dict-phonetic">${escapeHtml(phonetic)}</span>` : ''}</div>`;

  const strictSenseRe = /^\*([^*\n]+?)\.?\*\s*\*\*([^*\n]+?)\*\*/;
  let senseCount = 0;
  let body = '';

  for (let i = 1; i < paragraphs.length; i++) {
    const lines = paragraphs[i].trim().split('\n');
    const firstLine = lines[0].trim();
    const strictMatch = firstLine.match(strictSenseRe);
    const lenientMatch = !strictMatch && firstLine.match(LENIENT_SENSE_RE);

    if (strictMatch || lenientMatch) {
      const [full, pos, gloss] = strictMatch || lenientMatch;
      senseCount++;
      const exampleParts = [];
      const restFirstLine = firstLine.slice(full.length).trim();
      if (restFirstLine) exampleParts.push(formatInline(restFirstLine));
      for (let j = 1; j < lines.length; j++) {
        const t = lines[j].trim();
        if (t) exampleParts.push(formatInline(t));
      }

      body += `<div class="hw-dict-sense">
        <div class="hw-dict-pos">${escapeHtml(pos.trim())}.</div>
        <div class="hw-dict-body">
          <div class="hw-dict-gloss">${formatInline(gloss.trim())}</div>
          ${exampleParts.length ? `<div class="hw-dict-example">${exampleParts.join('<br>')}</div>` : ''}
        </div>
      </div>`;
    } else {
      body += formatDictDesc(paragraphs[i].trim());
    }
  }

  // Zero recognized senses means this almost certainly isn't a dictionary
  // entry at all (e.g. a short phrase translation whose first line just
  // happened to be a single word) — plain rendering fits it better than a
  // headword box sitting over unrelated description-styled paragraphs.
  if (senseCount === 0) return formatMarkdownAndMath(text);

  return html + body;
}

/**
 * Wraps the target word inside an example sentence. The model supplies the
 * sentence and, separately, the word to highlight — it never marks up the
 * sentence itself, because that is precisely what used to produce whole
 * sentences rendered as one highlight. Anything that isn't genuinely a small
 * span inside the sentence is rendered plain rather than trusted.
 */
function renderExample(sentence, highlight) {
  if (!sentence) return '';
  const h = (highlight || '').trim();
  if (!h) return escapeHtml(sentence);

  const idx = sentence.toLowerCase().indexOf(h.toLowerCase());
  if (idx < 0) return escapeHtml(sentence);
  if (h.length / sentence.length > 0.6) return escapeHtml(sentence);

  return escapeHtml(sentence.slice(0, idx))
    + `<code class="inline-code">${escapeHtml(sentence.slice(idx, idx + h.length))}</code>`
    + escapeHtml(sentence.slice(idx + h.length));
}

/**
 * Renders a normalized dictionary entry (see shared/dictionary.js) to HTML.
 *
 * This is the single layout for a word lookup. Every field is optional at
 * render time because the entry may still be streaming in — a missing field
 * simply doesn't draw, so the card fills downward rather than switching
 * between different-looking layouts as it completes.
 */
export function renderDictionaryEntry(entry) {
  if (!entry || !entry.word) return '';

  let html = `<div class="hw-dict-headword"><strong>${escapeHtml(entry.word)}</strong>`;
  if (entry.phonetic) {
    html += ` <span class="hw-dict-phonetic">${escapeHtml(entry.phonetic)}</span>`;
  }
  html += '</div>';

  for (const sense of entry.senses || []) {
    const example = renderExample(sense.example, sense.exampleHighlight);
    const translated = renderExample(sense.exampleTranslation, sense.exampleTranslationHighlight);
    const exampleHtml = [example, translated].filter(Boolean).join('<br>');

    html += `<div class="hw-dict-sense">
      <div class="hw-dict-pos">${escapeHtml(sense.pos || '')}</div>
      <div class="hw-dict-body">
        ${sense.gloss ? `<div class="hw-dict-gloss">${escapeHtml(sense.gloss)}</div>` : ''}
        ${exampleHtml ? `<div class="hw-dict-example">${exampleHtml}</div>` : ''}
      </div>
    </div>`;
  }

  if (entry.translation || entry.description) {
    html += `<div class="hw-dict-desc">
      ${entry.translation ? `<div class="hw-dict-desc-term">${escapeHtml(entry.translation)}</div>` : ''}
      ${entry.description ? `<div class="hw-dict-desc-text">${escapeHtml(entry.description)}</div>` : ''}
    </div>`;
  }

  return html;
}

/**
 * The one entry point every surface should use to render an AI reply, so the
 * same content can never come out looking like two different things.
 *
 * A structured dictionary reply is detected by shape and rendered through the
 * deterministic layout above. `allowMarkdownDict` additionally permits the
 * legacy markdown-shaped dictionary parser, which stays available for
 * providers that rejected the schema — it is off by default so an ordinary
 * homework answer can never be coerced into a dictionary card.
 */
export function renderAnswer(text, { allowMarkdownDict = false } = {}) {
  const entry = parseDictionaryEntry(text);
  if (entry) return renderDictionaryEntry(entry);
  // A structured reply that hasn't yielded a usable entry yet — still
  // streaming its first field — must not fall through to the text renderers,
  // which would flash raw JSON at the user for a few frames.
  if (looksLikeDictionaryJson(text)) return '';
  return allowMarkdownDict ? formatDictionaryEntry(text) : formatMarkdownAndMath(text);
}
