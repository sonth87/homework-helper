/**
 * Single-word dictionary lookup: input routing, JSON schema, prompts, and
 * tolerant parsing of the model's (possibly still-streaming) JSON reply.
 *
 * Why this exists: asking a model to emit an exact markdown layout and then
 * regex-parsing that prose back out was unreliable — small local models
 * (Gemma via Ollama/LM Studio, Chrome's Gemini Nano) routinely drop the
 * bold/italic markers, wrap whole sentences in backticks, or invent a
 * phonetic for the translated word, and each near-miss rendered as a
 * visibly different card. Structured output moves format compliance from
 * "please follow these instructions" to a hard guarantee: every provider
 * here supports constrained decoding against the schema below.
 *
 * Deliberately dependency-free so the service worker, the offscreen
 * document, and content scripts can all import it.
 */

// Whether the selection should be looked up as a dictionary word rather than
// simply translated. Deciding this in code (instead of asking the model to
// branch) keeps each prompt short — which markedly improves compliance on
// small models — and makes it impossible for a multi-word selection to come
// back as a per-word dictionary breakdown.
export function isSingleWord(text) {
  const t = (text || '').trim();
  if (!t) return false;
  if (/\s/.test(t)) return false;
  if (t.length > 40) return false;

  // Scripts written without spaces between words can't be tokenized by
  // whitespace at all, so fall back to a length cap on base characters
  // (combining vowel/tone marks add codepoints but not reader-visible
  // length). This is the roughest part of the heuristic — it errs toward
  // treating input as a phrase, which degrades to a plain translation
  // rather than a wrong dictionary card. CJK words run 1-3 chars; Thai longer.
  const baseLen = [...t.replace(/\p{M}/gu, '')].length;
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(t)) {
    return baseLen <= 4;
  }
  if (/[\u0e00-\u0e7f]/.test(t)) {
    return baseLen <= 10;
  }

  // Letters, optionally joined by a single apostrophe or hyphen ("don't",
  // "co-operate"). Anything carrying sentence punctuation or digits is a
  // phrase as far as this feature is concerned.
  return /^[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*$/u.test(t);
}

// Kept flat and small on purpose: every extra nested field is another thing a
// 2B-parameter model can get wrong, and constrained decoding costs tokens.
// All fields are required so providers running in strict mode accept it as-is;
// the model is told to use an empty string when it has nothing to put in one.
export const DICTIONARY_SCHEMA = {
  type: 'object',
  properties: {
    word: { type: 'string' },
    phonetic: { type: 'string' },
    translation: { type: 'string' },
    description: { type: 'string' },
    senses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pos: { type: 'string' },
          gloss: { type: 'string' },
          example: { type: 'string' },
          exampleHighlight: { type: 'string' },
          exampleTranslation: { type: 'string' },
          exampleTranslationHighlight: { type: 'string' },
        },
        required: ['pos', 'gloss', 'example', 'exampleHighlight', 'exampleTranslation', 'exampleTranslationHighlight'],
      },
    },
  },
  required: ['word', 'phonetic', 'translation', 'description', 'senses'],
};

export function buildWordLookupPrompt(word, targetLangName) {
  // Note the highlight fields: rather than asking the model to mark up the
  // example sentence itself (which is where whole-sentence highlighting kept
  // coming from), it just names the word to highlight and the renderer finds
  // and wraps that substring — and drops it if it isn't actually in there.
  return `You are a bilingual dictionary. Look up the single word below and return ONLY a JSON object matching the required schema. No preamble, no markdown, no code fences.

Field rules:
- "word": the original word exactly as given.
- "phonetic": IPA transcription of the ORIGINAL word, wrapped in slashes (e.g. /ˈkætəɡəri/). Never give a phonetic for the translation. Use "" if unknown.
- "senses": 1-2 items, most common meaning first.
  - "pos": part-of-speech abbreviation only ("n.", "v.", "adj.", "adv.").
  - "gloss": that meaning in ${targetLangName}, as a short term or phrase — NOT a sentence.
  - "example": ONE natural example sentence using the word, in the word's ORIGINAL language.
  - "exampleHighlight": the target word copied EXACTLY as it appears inside "example" — just that one word, never the whole sentence.
  - "exampleTranslation": that same sentence translated into ${targetLangName}.
  - "exampleTranslationHighlight": the word or short phrase inside "exampleTranslation" that corresponds to the target word, copied exactly.
- "translation": the single best translation of the word into ${targetLangName}, as a short term — not a sentence.
- "description": one short sentence in ${targetLangName} explaining what the word means.

Word to look up: ${word}`;
}

export function buildSentenceTranslatePrompt(text, targetLangName) {
  return `Translate the content below into ${targetLangName}.
Output ONLY the translation itself — no preamble, no notes, no explanation, no quotes, no formatting, and no phonetics or dictionary information, no matter how short the content is.

Content:
${text}`;
}

/**
 * JSON.parse that tolerates a reply that is still streaming in: closes an
 * unterminated string, drops a half-written key, and closes whatever objects
 * and arrays are still open. Lets the card fill in progressively instead of
 * showing a spinner until the last byte lands — which matters most on slow
 * local models, exactly where responses take longest.
 */
export function parsePartialJson(text) {
  if (!text) return null;

  let s = String(text).trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = s.indexOf('{');
  if (start < 0) return null;
  s = s.slice(start);

  try {
    return JSON.parse(s);
  } catch {
    // fall through to repair
  }

  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }

  let repaired = s;
  if (inString) repaired += '"';
  // Drop a trailing key that has no value yet ({"a":1,"b"  or  {"a":1,"b":),
  // then any comma left dangling by that removal.
  repaired = repaired.replace(/,\s*"[^"]*"\s*:?\s*$/, '');
  repaired = repaired.replace(/"[^"]*"\s*:\s*$/, '');
  repaired = repaired.replace(/,\s*$/, '');
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === '{' ? '}' : ']';
  }

  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Turns raw (possibly partial, possibly sloppy) model JSON into the exact
 * shape the renderer expects. Structured output guarantees the shape of the
 * data but not its sanity, so the content-level checks stay here: a highlight
 * that isn't actually inside its sentence, or that covers most of it, is
 * dropped rather than rendered.
 */
export function normalizeDictionaryEntry(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const word = cleanString(raw.word);
  if (!word) return null;

  let phonetic = cleanString(raw.phonetic);
  if (phonetic && !/^\/.*\/$/.test(phonetic)) {
    phonetic = `/${phonetic.replace(/^\/+|\/+$/g, '')}/`;
  }

  const senses = Array.isArray(raw.senses)
    ? raw.senses
        .filter((s) => s && typeof s === 'object')
        .map((s) => {
          // "noun." / "verb." follows the English dictionary convention of
          // marking a clipped word-class label with a dot. It only reads that
          // way for a single Latin word: a dot on 名詞, гла��ол or the two-word
          // "động từ" reads as a typo, not an abbreviation.
          let pos = cleanString(s.pos);
          if (pos && !pos.endsWith('.') && /^[\p{Script=Latin}\p{M}-]+$/u.test(pos)) pos += '.';
          return {
            pos,
            gloss: cleanString(s.gloss),
            example: cleanString(s.example),
            exampleHighlight: cleanString(s.exampleHighlight),
            exampleTranslation: cleanString(s.exampleTranslation),
            exampleTranslationHighlight: cleanString(s.exampleTranslationHighlight),
          };
        })
        .filter((s) => s.pos || s.gloss || s.example)
    : [];

  return {
    word,
    phonetic,
    translation: cleanString(raw.translation),
    description: cleanString(raw.description),
    senses,
  };
}

// True once the text looks like it is meant to be a dictionary JSON reply —
// used to pick the renderer, and to suppress output entirely while the reply
// is too incomplete to parse, so a half-streamed '{"word": "ca' never
// reaches the user as raw JSON.
//
// Deliberately narrow: an ordinary answer can legitimately begin with a brace
// (a set like "{1, 2, 3}", an object literal being explained), and treating
// those as a broken dictionary reply would blank them out.
export function looksLikeDictionaryJson(text) {
  if (!text) return false;
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, '').trimStart();
  if (!t.startsWith('{')) return false;
  if (/"word"/.test(t)) return true;
  // The opening of a streaming object, before its first key has finished
  // arriving ('{', '{"', '{"wo'...) — nothing else can still match this.
  return /^\{\s*"?[a-z]*$/i.test(t);
}

export function parseDictionaryEntry(text) {
  if (!looksLikeDictionaryJson(text)) return null;
  return normalizeDictionaryEntry(parsePartialJson(text));
}
