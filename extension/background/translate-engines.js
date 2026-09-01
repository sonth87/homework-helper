/**
 * Free Machine-Translation Engines
 *
 * A registry of public, keyless translation endpoints plus a fallback chain,
 * used by the action popup's quick translator and by hover-translate.
 *
 * Why several engines instead of one: the endpoint this extension used to rely
 * on alone — `translate.googleapis.com/translate_a/single` — is unauthenticated
 * and rate-limits per client IP, answering HTTP 429 with a CAPTCHA page once a
 * network has translated too much. A single engine therefore fails outright for
 * whole offices and campuses. Every engine below returns plain text for plain
 * text, so `translateText()` can walk the chain until one answers.
 *
 * None of these take an API key. AI-model translation is a separate path that
 * goes through the key pool (see `AiEngine`), not through this module.
 */

/**
 * Google's public translate-html endpoint, with the API key the Chrome/Edge
 * translate UIs themselves ship. Far more tolerant than `translate_a/single`:
 * it still answers 200 on IPs where the older endpoint already returns 429.
 */
const GOOGLE_PA_KEY = 'AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520';

/** Language codes some engines spell differently from our own catalogue. */
const BING_LANG = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  no: 'nb',
  pt: 'pt',
};

const VOLC_LANG = {
  'zh-CN': 'zh',
  'zh-TW': 'zh-Hant',
};

const MYMEMORY_LANG = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
};

/** Guard against a mis-detected source that would make an engine echo the input. */
function normalizeSource(from) {
  return !from || from === 'auto' ? '' : from;
}

/**
 * Engine-specific language codes mapped back onto SUPPORTED_LANGUAGES, so a
 * detected language can be shown in the UI and reused as a translation target.
 * A code with no entry here is returned as-is; a caller that needs a code it
 * can trust must still check it against its own catalogue.
 */
const DETECTED_LANG = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  zh: 'zh-CN',
  nb: 'no',
  'pt-PT': 'pt',
  'pt-BR': 'pt',
  fil: 'fil',
};

export function normalizeDetectedLang(code) {
  if (!code) return null;
  return DETECTED_LANG[code] || code;
}

async function fetchJson(url, options = {}, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // A rate-limited Google answers 200/429 with an HTML CAPTCHA page rather
    // than JSON — treat that as a failure so the chain moves to the next engine.
    if (text.trimStart().startsWith('<')) throw new Error('Blocked (HTML response)');
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Google Translate via the public `translate-pa` endpoint.
 * Body is protobuf-shaped JSON: [[[texts], sourceLang, targetLang], "te"].
 */
async function translateGoogle(text, from, to) {
  const src = normalizeSource(from) || 'auto';
  const data = await fetchJson('https://translate-pa.googleapis.com/v1/translateHtml', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json+protobuf',
      'X-Goog-API-Key': GOOGLE_PA_KEY,
    },
    body: JSON.stringify([[[text], src, to], 'te']),
  });
  const translation = data?.[0]?.[0];
  if (typeof translation !== 'string') throw new Error('Unexpected Google response');
  return { translation, detectedLang: data?.[1]?.[0] || null };
}

/**
 * Legacy Google endpoint. Kept as a distinct link in the chain because it
 * survives in some networks where `translate-pa` is blocked, and vice versa.
 */
async function translateGoogleLegacy(text, from, to) {
  const src = normalizeSource(from) || 'auto';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(src)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
  const data = await fetchJson(url);
  const translation = (data[0] || []).map((seg) => seg[0] || '').join('');
  if (!translation) throw new Error('Empty Google response');
  return { translation, detectedLang: data[2] || null };
}

/**
 * Microsoft Translator via the endpoint the Edge browser's own translate bar
 * uses. Keyless, and the most reliable of the four in practice.
 */
async function translateBing(text, from, to) {
  const src = BING_LANG[normalizeSource(from)] || normalizeSource(from);
  const target = BING_LANG[to] || to;
  const url = new URL('https://edge.microsoft.com/translate/translatetext');
  if (src) url.searchParams.set('from', src);
  url.searchParams.set('to', target);
  url.searchParams.set('isEnterpriseClient', 'false');

  const data = await fetchJson(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: '*/*' },
    body: JSON.stringify([text]),
    credentials: 'omit',
  });
  const translation = data?.[0]?.translations?.[0]?.text;
  if (typeof translation !== 'string') throw new Error('Unexpected Bing response');
  return { translation, detectedLang: data?.[0]?.detectedLanguage?.language || null };
}

/** ByteDance Volcano Engine's keyless browser-extension endpoint. */
async function translateVolc(text, from, to) {
  const src = VOLC_LANG[normalizeSource(from)] || normalizeSource(from) || 'detect';
  const data = await fetchJson('https://translate.volcengine.com/crx/translate/v1/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_language: src,
      target_language: VOLC_LANG[to] || to,
      text,
    }),
  });
  if (data?.base_resp?.status_code !== 0) {
    throw new Error(data?.base_resp?.status_message || 'Volc error');
  }
  if (typeof data.translation !== 'string') throw new Error('Unexpected Volc response');
  return { translation: data.translation, detectedLang: data.detected_language || null };
}

/**
 * MyMemory. Needs an explicit source language, so it can only serve as a
 * fallback once something upstream has detected one — it is last in the chain
 * and also has the tightest free quota.
 */
async function translateMyMemory(text, from, to) {
  const src = MYMEMORY_LANG[normalizeSource(from)] || normalizeSource(from) || 'en';
  const target = MYMEMORY_LANG[to] || to;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(target)}`;
  const data = await fetchJson(url);
  if (data?.responseStatus !== 200) throw new Error(data?.responseDetails || 'MyMemory error');
  const translation = data?.responseData?.translatedText;
  if (typeof translation !== 'string' || !translation) throw new Error('Empty MyMemory response');
  return { translation, detectedLang: src };
}

/**
 * Dictionary lookup for a single word, via the endpoint Chrome's own dictionary
 * extension uses. Returns phonetics, meanings grouped by part of speech, and
 * example sentences — the same data Google Translate's popup shows.
 *
 * Two things make this worth a separate function rather than another engine:
 * it only answers for single words (a phrase comes back with `dict` absent),
 * and `client=dict-chrome-ex` is not subject to the per-IP rate limit that
 * makes `client=gtx` return 429 — so a lookup keeps working on networks where
 * plain translation through the same host does not.
 *
 * `displayLang` sets the language of the labels *about* the word — the part of
 * speech ("verb" / "động từ" / "動詞"). Those are interface text, so they follow
 * the extension's own language setting, not the translation's target language.
 * Without it the service picks a language from the browser's Accept-Language
 * header, which has nothing to do with what the user chose here.
 *
 * @returns {Promise<object|null>} an entry in DICTIONARY_SCHEMA shape, or null
 *   when the input is a phrase or the service returned no dictionary data.
 */
export async function lookupWord({ word, from = 'auto', to = 'en', displayLang = 'en' }) {
  const term = (word || '').trim();
  if (!term) return null;

  const params = new URLSearchParams({
    client: 'dict-chrome-ex',
    sl: normalizeSource(from) || 'auto',
    tl: to,
    hl: displayLang,
    dj: '1',
    q: term,
  });
  // dt selects the data blocks: t=translation, bd=bilingual dictionary,
  // rm=romanization/phonetics, ex=example sentences.
  for (const dt of ['t', 'bd', 'rm', 'ex']) params.append('dt', dt);

  const data = await fetchJson(`https://clients5.google.com/translate_a/single?${params}`);

  const groups = Array.isArray(data?.dict) ? data.dict : [];
  // No part-of-speech groups means this was a phrase, not a word: let the
  // caller fall back to a plain translation rather than render an empty card.
  if (groups.length === 0) return null;

  const sentences = Array.isArray(data.sentences) ? data.sentences : [];
  const translation = sentences.find((x) => x?.trans)?.trans || '';
  const phonetic = sentences.find((x) => x?.src_translit)?.src_translit || '';

  // Google returns examples for the word as a whole, not per part of speech.
  // Handing each sense a different one keeps the card from repeating itself.
  const examples = ((data.examples?.example) || [])
    .map((e) => String(e?.text || '').replace(/<\/?b>/g, '').trim())
    .filter(Boolean);

  return {
    word: term,
    phonetic,
    translation,
    description: '',
    detectedLang: normalizeDetectedLang(data.src),
    senses: groups.map((g, i) => ({
      pos: g.pos || '',
      gloss: (g.terms || []).join(', '),
      example: examples[i] || '',
      exampleHighlight: term,
      exampleTranslation: '',
      exampleTranslationHighlight: '',
    })),
  };
}

/**
 * The keyless engines, in the order the fallback chain tries them.
 * `maxLength` is each service's practical per-request ceiling.
 */
export const FREE_ENGINES = [
  { id: 'bing', name: 'Microsoft Translator', maxLength: 1800, run: translateBing },
  { id: 'google', name: 'Google Translate', maxLength: 5000, run: translateGoogle },
  { id: 'google-legacy', name: 'Google Translate (legacy)', maxLength: 1500, run: translateGoogleLegacy, hidden: true },
  { id: 'volc', name: 'Volcano Translate', maxLength: 2000, run: translateVolc },
  { id: 'mymemory', name: 'MyMemory', maxLength: 500, run: translateMyMemory },
];

/** Engines offered in pickers — `google-legacy` only ever runs as a fallback. */
export const VISIBLE_FREE_ENGINES = FREE_ENGINES.filter((e) => !e.hidden);

export const DEFAULT_FREE_ENGINE = 'bing';

function engineById(id) {
  return FREE_ENGINES.find((e) => e.id === id) || null;
}

/**
 * Translate with `preferredEngine`, then walk the rest of the chain on failure.
 *
 * Engines whose `maxLength` the text exceeds are skipped rather than sent a
 * request that would be silently truncated — the same guard the desktop app
 * applies to MyMemory.
 *
 * @returns {Promise<{translation: string, detectedLang: string|null, engine: string, fellBack: boolean}>}
 */
export async function translateText({ text, from = 'auto', to = 'en', engine = DEFAULT_FREE_ENGINE }) {
  const trimmed = (text || '').trim();
  if (!trimmed) return { translation: '', detectedLang: null, engine, fellBack: false };

  const preferred = engineById(engine) || engineById(DEFAULT_FREE_ENGINE);
  const chain = [preferred, ...FREE_ENGINES.filter((e) => e.id !== preferred.id)];

  const errors = [];
  for (const candidate of chain) {
    if (trimmed.length > candidate.maxLength) {
      errors.push(`${candidate.id}: text too long (${trimmed.length} > ${candidate.maxLength})`);
      continue;
    }
    try {
      const result = await candidate.run(trimmed, from, to);
      return {
        ...result,
        detectedLang: normalizeDetectedLang(result.detectedLang),
        engine: candidate.id,
        fellBack: candidate.id !== preferred.id,
      };
    } catch (err) {
      errors.push(`${candidate.id}: ${err.message}`);
    }
  }

  throw new Error(`All translation engines failed — ${errors.join('; ')}`);
}
