/**
 * Pronunciation playback
 *
 * Uses the Web Speech API, which every Chrome install already carries: the
 * voices come from the operating system, so there is no API key to configure,
 * no model to download, nothing sent over the network, and no quota consumed.
 * All 13 interface languages resolve to a voice on a stock macOS/Windows
 * install; where one is missing, `speak()` reports it rather than failing
 * silently so the caller can hide its button.
 *
 * Only usable from a document — the MV3 service worker has no
 * `speechSynthesis`. Call it from the popup, the side panel, or a content
 * script.
 */

/** SUPPORTED_LANGUAGES ids mapped to the BCP-47 tags voices are tagged with. */
const VOICE_LANG = {
  vi: 'vi-VN',
  en: 'en-US',
  th: 'th-TH',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  ja: 'ja-JP',
  ko: 'ko-KR',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  id: 'id-ID',
  ru: 'ru-RU',
};

/**
 * Guess a language from the script the text is written in.
 *
 * Only used when the caller has no better answer — the source side of a
 * translation is often 'auto', and a word looked up in the in-page card
 * carries no language at all. Picking by script is coarse (it cannot tell
 * Spanish from French) but it is right about the thing that matters most for
 * pronunciation: never reading Japanese or Cyrillic with an English voice.
 *
 * `hint` breaks the one tie script alone cannot: a kanji-only Japanese word is
 * indistinguishable from Chinese. Pass the surrounding page's language
 * (`document.documentElement.lang`) and a Japanese page's text is read with a
 * Japanese voice. It is consulted only for Han text — every other script
 * identifies its language on its own.
 */
export function guessLang(text, hint = '') {
  const t = (text || '').trim();
  if (!t) return 'en';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(t)) return 'ja';   // kana settles Japanese vs Han
  if (/[\uac00-\ud7af\u1100-\u11ff]/.test(t)) return 'ko';
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(t)) {
    const h = String(hint).toLowerCase();
    if (h.startsWith('ja')) return 'ja';
    if (h.startsWith('ko')) return 'ko';
    if (h.startsWith('zh-tw') || h.includes('hant')) return 'zh-TW';
    return 'zh-CN';
  }
  if (/[\u0e00-\u0e7f]/.test(t)) return 'th';
  if (/[\u0400-\u04ff]/.test(t)) return 'ru';
  // Vietnamese is the only Latin-script language here using these marks.
  if (/[ăâđêôơưĂÂĐÊÔƠƯ]|[\u0300\u0301\u0303\u0309\u0323]/.test(t.normalize('NFD'))) return 'vi';
  return 'en';
}

export function isSpeechAvailable() {
  return typeof globalThis.speechSynthesis !== 'undefined'
    && typeof globalThis.SpeechSynthesisUtterance !== 'undefined';
}

/**
 * Voices load asynchronously on first use in a fresh document, and
 * getVoices() returns [] until they do. Resolve on the voiceschanged event,
 * with a short deadline so a browser that never fires it cannot hang a click.
 */
function loadVoices(timeout = 1200) {
  return new Promise((resolve) => {
    const existing = speechSynthesis.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(speechSynthesis.getVoices());
    };
    speechSynthesis.addEventListener('voiceschanged', finish);
    setTimeout(finish, timeout);
  });
}

/**
 * Pick the closest voice: an exact tag first, then any voice sharing the base
 * language, so `pt` still speaks with a pt-PT voice when pt-BR is absent.
 */
function pickVoice(voices, lang) {
  const tag = VOICE_LANG[lang] || lang;
  const base = String(tag).split('-')[0];
  const norm = (v) => String(v.lang || '').replace('_', '-');
  return voices.find((v) => norm(v) === tag)
    || voices.find((v) => norm(v).split('-')[0] === base)
    || null;
}

/**
 * Speak `text` in `lang`. Cancels whatever is already playing, so clicking a
 * second listen button interrupts the first instead of overlapping it.
 *
 * @returns {Promise<boolean>} false when speech is unavailable, the text is
 *   empty, or no voice matches the language — never throws.
 */
export async function speak(text, lang = 'en', hint = '') {
  const content = (text || '').trim();
  if (!content || !isSpeechAvailable()) return false;

  try {
    speechSynthesis.cancel();
    const voices = await loadVoices();
    const resolved = (!lang || lang === 'auto') ? guessLang(content, hint) : lang;
    const voice = pickVoice(voices, resolved);
    if (!voice) return false;

    const utterance = new SpeechSynthesisUtterance(content.slice(0, 500));
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  if (isSpeechAvailable()) {
    try { speechSynthesis.cancel(); } catch { /* nothing playing */ }
  }
}
