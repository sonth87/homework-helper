/**
 * Storage & Configuration Management Wrapper
 * Persists user models, API keys, rotation strategy, and preferences in chrome.storage.local
 */

import { isSingleWord, buildWordLookupPrompt, buildSentenceTranslatePrompt, DICTIONARY_SCHEMA } from './dictionary.js';
import { DEFAULT_TOOLBAR_LAYOUT } from './toolbar-items.js';
import { CASUAL_CHAT_NOTE } from './study-prompt.js';

export const DEFAULT_PROVIDERS = [
  {
    id: "chrome-builtin",
    name: "Chrome Built-in AI (Gemini Nano)",
    description:
      "Mô hình cục bộ On-Device tích hợp sẵn trong Chrome (Miễn phí, Offline, Không cần Key)",
    models: [{ id: "gemini-nano", name: "Gemini Nano" }],
    defaultBaseUrl: "",
    requiresBaseUrl: false,
    requiresKey: false,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    models: [
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash" },
      { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro" },
      { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    ],
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    requiresBaseUrl: false,
    authHeader: "x-goog-api-key",
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-5.6-sol", name: "GPT-5.6 Sol" },
      { id: "gpt-5.6-terra", name: "GPT-5.6 Terra" },
      { id: "gpt-5.6-luna", name: "GPT-5.6 Luna" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "o3-mini", name: "o3 Mini" },
      { id: "o1", name: "o1" },
    ],
    defaultBaseUrl: "https://api.openai.com/v1",
    requiresBaseUrl: false,
    authHeader: "Bearer",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    models: [
      { id: "claude-fable-5", name: "Claude Fable 5" },
      { id: "claude-opus-5", name: "Claude Opus 5" },
      { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
    ],
    defaultBaseUrl: "https://api.anthropic.com/v1",
    requiresBaseUrl: false,
    authHeader: "x-api-key",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
      { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" },
      { id: "deepseek-chat", name: "DeepSeek V3" },
      { id: "deepseek-reasoner", name: "DeepSeek R1" },
    ],
    defaultBaseUrl: "https://api.deepseek.com/v1",
    requiresBaseUrl: false,
    authHeader: "Bearer",
  },
  {
    id: "groq",
    name: "Groq",
    models: [
      { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B" },
      { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B" },
      { id: "qwen/qwen3.6-27b", name: "Qwen 3.6 27B" },
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
    ],
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    requiresBaseUrl: false,
    authHeader: "Bearer",
  },
  {
    id: "ollama",
    name: "Ollama (Local AI)",
    description: "Chạy mô hình cục bộ trên máy tính qua Ollama (Offline, Miễn phí, Không cần Key)",
    models: [
      { id: "llama3.3", name: "Llama 3.3 (8B / 70B)" },
      { id: "deepseek-r1:8b", name: "DeepSeek R1 (8B - Reasoning)" },
      { id: "deepseek-r1:14b", name: "DeepSeek R1 (14B)" },
      { id: "qwen2.5:7b", name: "Qwen 2.5 (7B)" },
      { id: "qwen2.5-coder:7b", name: "Qwen 2.5 Coder (7B)" },
      { id: "gemma2:9b", name: "Gemma 2 (9B)" },
      { id: "mistral", name: "Mistral (7B)" },
      { id: "phi4", name: "Phi-4" },
    ],
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    requiresBaseUrl: true,
    requiresKey: false,
    authHeader: "Bearer",
  },
  {
    id: "lmstudio",
    name: "LM Studio (Local AI)",
    description: "Chạy mô hình cục bộ qua Local Server của LM Studio (OpenAI-compatible)",
    models: [
      { id: "loaded-model", name: "Mô hình đang nạp trong LM Studio" },
      { id: "local-model", name: "Local Model" },
    ],
    defaultBaseUrl: "http://127.0.0.1:1234/v1",
    requiresBaseUrl: true,
    requiresKey: false,
    authHeader: "Bearer",
  },
  {
    id: "custom",
    name: "Custom / OpenRouter / Local Endpoint",
    models: [
      { id: "custom-model", name: "Custom Model" },
      { id: "google/gemini-3.7-flash", name: "google/gemini-3.7-flash (OpenRouter)" },
      { id: "openai/gpt-5.6-sol", name: "openai/gpt-5.6-sol (OpenRouter)" },
      { id: "anthropic/claude-sonnet-5", name: "anthropic/claude-sonnet-5 (OpenRouter)" },
      { id: "deepseek/deepseek-v4-pro", name: "deepseek/deepseek-v4-pro (OpenRouter)" },
    ],
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    requiresBaseUrl: true,
    authHeader: "Bearer",
  },
];

export const SUPPORTED_LANGUAGES = [
  { id: "vi", name: "Tiếng Việt" },
  { id: "en", name: "English" },
  { id: "th", name: "ไทย" },
  { id: "zh-CN", name: "简体中文" },
  { id: "zh-TW", name: "繁體中文" },
  { id: "ja", name: "日本語" },
  { id: "ko", name: "한국어" },
  { id: "es", name: "Español" },
  { id: "fr", name: "Français" },
  { id: "de", name: "Deutsch" },
  { id: "pt", name: "Português" },
  { id: "id", name: "Bahasa Indonesia" },
  { id: "ru", name: "Русский" },
  { id: "auto", name: "Auto" },
];

export const DEFAULT_SYSTEM_PROMPT = `You are an elite academic tutor and homework assistant AI.
Your goal is to solve academic exercises, quizzes, exams, and homework questions with extreme mathematical rigor and maximum pedagogical clarity.

Core Guidelines:
1. Always analyze the full context of the problem, including text, math formulas, and any attached images or diagrams.
2. For multiple-choice questions: Identify the single correct answer letter (A, B, C, or D), clearly display it, and provide rigorous step-by-step reasoning explaining why it is correct and why other options are incorrect.
3. For mathematical & scientific equations: Format all mathematical notations, equations, variables, and expressions using standard LaTeX syntax enclosed in single dollar signs for inline math ($x^2 + y^2 = r^2$) and double dollar signs for block math ($$\\int f(x) dx$$).
4. For step-by-step solutions: Break down the explanation logically into numbered steps (Step 1, Step 2, ...). Highlight key definitions, formulas applied, intermediate results, and the final boxed/bolded answer.
5. Tone & Style: Be encouraging, precise, intellectually rigorous, and crystal clear. Avoid unnecessary fluff.`;

export const DEFAULT_NANO_SYSTEM_PROMPT = `You are a helpful, precise academic tutor AI.
Your task is to solve homework questions and quizzes clearly and accurately.

Instructions:
1. For multiple-choice questions: Identify the correct option and give a concise step-by-step explanation.
2. For math & science problems: Show step-by-step reasoning with formulas in LaTeX ($...$) and clearly state the final answer.
3. Keep explanations structured, concise, and easy to understand.`;

/**
 * Replaces the base system prompt entirely when Direct Answer mode is on,
 * rather than being appended after it. DEFAULT_SYSTEM_PROMPT and
 * DEFAULT_NANO_SYSTEM_PROMPT both *mandate* step-by-step explanations, so
 * bolting a "do not write steps" note onto the end of them handed the model
 * two contradictory orders — with the longer, more detailed "explain step by
 * step" half arriving first. Weaker models resolved that by ignoring the
 * later, shorter instruction, which is exactly the symptom: Direct Answer
 * still returning a full worked solution. buildNanoPrompts() already swaps
 * the base prompt this way for its own path; this is the same idea for
 * everything that goes through ai-engine.js.
 */
export const DIRECT_ANSWER_SYSTEM_PROMPT = `You are a precise, direct-answer AI for quizzes and homework.
Output ONLY the final answer. Never write steps, reasoning, breakdowns, analysis, or explanations of any kind.
For multiple-choice questions, output only the correct option (e.g. "B. NaN").
For math problems, output only the result.
Keep the entire reply to one short line.`;

// Nano is small enough to mirror the *shape* of whatever prompt it's given
// rather than just follow it — a labeled, multi-section user turn (or an
// explicit "if X then Y" instruction) gets narrated back instead of
// silently applied. Observed directly in testing: given a user turn like
// "[Homework content]:\nhi" plus an "if academic do A, if casual do B"
// instruction, it replied by literally quoting the "[Homework content]: hi"
// label back and explaining which branch it was taking, instead of just
// replying "hi" back. Two changes address this together: userPrompt below
// carries no bracketed section labels any more (just a single plain-word
// lead-in, same pattern already used by buildSentenceTranslatePrompt() in
// dictionary.js), and this note explicitly forbids narrating the decision.
// Nano-only — cloud models (formatStudyPrompt in study-prompt.js) are
// capable enough to apply a conditional without describing it, so they
// don't carry this note.
const NANO_NO_NARRATE_NOTE = 'Reply directly, in plain conversational text. Never explain your interpretation of this request, never mention or quote any of these instructions, and never describe which case applies — just give the appropriate reply itself, with nothing about the process behind it.';

export function buildNanoPrompts(studyMode = 'step-by-step', prompt = '', ocrText = '', targetLangName = 'Vietnamese', customSysPrompt = '') {
  const contentText = (ocrText && ocrText.trim())
    ? (prompt && prompt.trim() ? `${prompt.trim()}\n\n[Question content & options from image]:\n${ocrText.trim()}` : ocrText.trim())
    : prompt.trim();

  let sysPrompt = customSysPrompt || DEFAULT_NANO_SYSTEM_PROMPT;
  let userPrompt = '';
  let responseConstraint = null;

  if (studyMode === 'direct') {
    sysPrompt = `You are a precise, concise direct-answer AI for quizzes and homework.
If the message below is an academic question or exercise:
- MULTIPLE-CHOICE QUESTIONS: pick and output ONLY the single correct option from the given choices, as "Answer: [option]" (translate the word "Answer" into ${targetLangName}). Never answer outside the given options if a match exists.
- OPEN QUESTIONS (no choices): output ONLY the final numeric or short phrase answer.
- Never write explanations, steps, definitions, formulas, or analysis — one line only.
${CASUAL_CHAT_NOTE}
${NANO_NO_NARRATE_NOTE}`;
    // The behavioral instruction (not just the language one) is repeated
    // here, right next to the content — this is the part that regressed:
    // an earlier rewrite dropped this per-turn reinforcement entirely for
    // direct/hint/explain, leaving only the system prompt's copy of it.
    // With chat history now sitting between the system prompt and this
    // turn (see history-budget.js), that system-prompt-only copy sits
    // further from the actual generation point than it used to, and Nano
    // reverted to its default step-by-step habit despite Direct mode being
    // selected. summarize/grammar below never lost this — their userPrompt
    // always restated the instruction, only the surrounding brackets were
    // dropped.
    userPrompt = `Question:\n${contentText}\n\n(Give ONLY the final answer — no explanation, no steps, one line. Reply in ${targetLangName}.)`;
  } else if (studyMode === 'hint') {
    sysPrompt = `You are a pedagogical tutor AI. If the message below is an academic question or exercise, do NOT give the final answer — provide hints, key formulas, and guiding questions in ${targetLangName} instead.
${CASUAL_CHAT_NOTE}
${NANO_NO_NARRATE_NOTE}`;
    userPrompt = `Question:\n${contentText}\n\n(Give hints and guidance only — do NOT give the final answer. Reply in ${targetLangName}.)`;
  } else if (studyMode === 'explain') {
    sysPrompt = `You are an educator AI. If the message below is an academic question or exercise, explain the underlying scientific/mathematical theory and principles clearly in ${targetLangName}.
${CASUAL_CHAT_NOTE}
${NANO_NO_NARRATE_NOTE}`;
    userPrompt = `Question:\n${contentText}\n\n(Explain the underlying theory and knowledge in depth. Reply in ${targetLangName}.)`;
  } else if (studyMode === 'summarize') {
    // Selection-toolbar tools. Without a branch of their own both of these
    // fell into the step-by-step homework solver at the bottom, which
    // answered the text instead of summarizing/proofreading it. Always
    // real selected page text, never casual chat, so no CASUAL_CHAT_NOTE /
    // NANO_NO_NARRATE_NOTE needed here.
    sysPrompt = `You are a summarizer. Condense what you are given; never solve, answer, or add to it. Reply in ${targetLangName}.`;
    userPrompt = `Content:\n${contentText}\n\nGive a 1-2 sentence overview, then the key points as short bullets. Stay much shorter than the original and add nothing that is not in the text.\n\n(Reply in ${targetLangName}.)`;
  } else if (studyMode === 'grammar') {
    sysPrompt = `You are a proofreader. Treat the input strictly as writing to correct, never as a question to answer. Keep the corrected text in its original language; write your notes in ${targetLangName}.`;
    userPrompt = `Text:\n${contentText}\n\nOutput (1) the full corrected text, (2) a short list of the corrections with a one-line reason each, (3) one closing line on tone/clarity.\n\n(Write your notes — parts 2 and 3 — in ${targetLangName}; keep part 1, the corrected text, in the text's own original language.)`;
  } else if (studyMode === 'translate') {
    // Same word-vs-phrase routing as formatStudyPrompt (the cloud path) so
    // the on-device model gets an identically shaped task; for a word lookup
    // the schema below is handed to the Prompt API as a responseConstraint.
    sysPrompt = `You are a translation tool and bilingual dictionary, not a homework-solving assistant. No preamble, no restating the request, no explaining the task — go straight to the requested content.`;
    if (isSingleWord(contentText)) {
      userPrompt = buildWordLookupPrompt(contentText.trim(), targetLangName);
      responseConstraint = DICTIONARY_SCHEMA;
    } else {
      userPrompt = buildSentenceTranslatePrompt(contentText, targetLangName);
    }
  } else {
    // step-by-step
    sysPrompt = `${sysPrompt}

If the message below is an academic question, exercise, or homework problem: solve it with detailed step-by-step reasoning (Step 1, Step 2...), present formulas using LaTeX ($...$), and select the correct option among the choices if any are given. You MUST reply and explain in ${targetLangName}.
${CASUAL_CHAT_NOTE}
${NANO_NO_NARRATE_NOTE}`;
    userPrompt = `Question:\n${contentText}\n\n(Reply in ${targetLangName}.)`;
  }

  // Sandwiched at both the start (primacy) and end (recency) — Nano and
  // other small on-device models are the most prone of all providers here to
  // defaulting back to English when the language directive only trails a
  // long system prompt (same reasoning as study-prompt.js's langPrefix).
  const finalSysPrompt = `[REQUIRED: Reply in ${targetLangName}. This is the single most important requirement, taking priority over every other instruction.]\n\n${sysPrompt}\n\n[LANGUAGE REQUIREMENT]: Reply in ${targetLangName}.`.trim();
  return { sysPrompt: finalSysPrompt, userPrompt, responseConstraint };
}

export const DEFAULT_SETTINGS = {
  // Array of configured model keys:
  // [{ id, provider, model, apiKey, baseUrl, isEnabled, priority, failureCount, cooldownUntil }]
  apiConfigs: [],
  activeConfigId: "auto", // 'auto' (round-robin active) or specific config id
  rotationStrategy: "round-robin", // 'round-robin' | 'random' | 'fallback-on-error'
  studyMode: "step-by-step", // 'step-by-step' | 'direct' | 'hint' | 'explain' | 'translate'
  uiLanguage: "vi", // 'vi' | 'en' | 'th' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt' | 'id' | 'ru'
  outputLanguage: "en", // 'en' | 'vi' | 'es' | 'fr' | 'de' | 'zh-CN' | 'ja' | 'ko' | 'auto'
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  nanoSystemPrompt: DEFAULT_NANO_SYSTEM_PROMPT,
  enableFormsAdapter: true,
  enableTextTooltip: true,
  enableFloatingButton: true,
  overlayTheme: "auto", // 'auto' (follow system) | 'light' | 'dark'
  fabSize: "normal", // 'tiny' | 'small' | 'normal' | 'large'
  fabOpacity: 90, // 30 - 100% (Liquid Glass background alpha)
  fabPosition: null, // null (default docked position) | { dock: 'left' | 'right', top: number(px) } — set by dragging the FAB cluster
  drawerWidth: null, // null (default 480px from CSS) | number(px) — set by dragging the drawer's left-edge resize handle
  popupOpacity: 60, // 0 - 100% (Liquid Glass background alpha)
  popupBlur: 10, // 0 - 30px
  popupCardSize: "normal", // 'normal' | 'compact' (compact hides secondary buttons until hover, tighter padding) | 'minimize'
  popupCardTheme: "auto", // 'auto' (default blue accent, dark-mode aware) | 'glass-light' | 'glass-dark' | 'cyber-blue' | 'emerald' | 'purple' | 'rose' | 'amber' | 'indigo'
  toolbarOpacity: 25, // 0 - 100%
  toolbarBlur: 6,
  toolbarShowText: true, // true: icon + label, false: icon only
  toolbarSize: "normal", // 'compact' | 'normal' | 'large'
  toolbarTheme: "auto", // 'auto' (follows OS light/dark) | 'glass-light' | 'glass-dark' | 'cyber-blue' | 'emerald' | 'purple' | 'rose' | 'amber' | 'indigo'
  toolbarCustomColor: "#0284c7",
  toolbarLayout: DEFAULT_TOOLBAR_LAYOUT, // ordered [{ id, area: 'main' | 'dropdown' }] — see shared/toolbar-items.js
  // Action-popup quick translator (popup/popup.js). Kept separate from
  // outputLanguage, which governs what language the AI *answers homework* in —
  // a user can want solutions in English while translating pages into
  // Vietnamese, so the two must not share one value.
  popupTranslateEngine: "bing", // free engine id from background/translate-engines.js, or 'ai' for the key pool
  popupTranslateSource: "auto", // 'auto' or a SUPPORTED_LANGUAGES id
  popupTranslateTarget: "vi", // a SUPPORTED_LANGUAGES id (never 'auto')
  popupAutoTranslateClipboard: true, // on open, read the clipboard and translate it unprompted
  popupClipboardMaxLength: 2000, // clipboard longer than this is never auto-translated, only offered
  enableHoverTranslate: true, // hover-to-translate on any webpage text (see content/hover-translate.js)
  hoverTranslateModifiers: ["ctrl"], // subset of ['ctrl','shift','alt','meta']; [] = fires on hover alone, no key needed
  hoverTranslateGranularity: "sentence", // 'word' | 'sentence' | 'paragraph'
  hoverTranslateDelay: 350, // ms the pointer must stay still before a lookup fires
  hoverTranslateOpacity: 60, // 0 - 100%
  hoverTranslateBlur: 10, // 0 - 30px
  hoverTranslateFontSize: 13, // 11 - 16px
  hoverTranslateMaxWidth: 300, // 220 - 420px
  hoverTranslateTheme: "auto", // 'auto' (follows OS light/dark) | 'glass-light' | 'glass-dark' | 'cyber-blue' | 'emerald' | 'purple' | 'rose' | 'amber' | 'indigo'
  hoverTranslateHighlight: true, // marker-style background tint over the word/sentence/paragraph being translated
  hoverTranslateHighlightColor: "#fef08a", // one of HOVER_HIGHLIGHT_COLORS (shared/hover-highlight-colors.js) — not a free color picker, a curated pastel swatch
  hoverTranslateHighlightOpacity: 30, // 20 - 80% — tint strength for hoverTranslateHighlight + the 'draw'/'pulse' animations (see content/styles/tooltip.css's --hl-alpha)
  hoverTranslateHighlightStyle: "marker", // one of HIGHLIGHT_STYLES (shared/highlight-styles.js) — shape drawn over the highlighted text
  hoverTranslateAnimation: "draw", // 'none' | 'pulse' | 'glow' | 'sweep' | 'draw' — effect played on that text while holding the trigger key
  routingStrategy: "prefer_config", // 'prefer_config' (recommended) | 'prefer_nano' | 'nano_only' | 'config_only'
  nanoDownloadState: { inProgress: false, percent: null, updatedAt: 0 }, // shared cross-tab flag: is Gemini Nano's on-device model actively downloading right now
  installedOcrModels: {
    vie: {
      lang: "vie",
      name: "Tiếng Việt",
      size: "1.9 MB",
      version: "1.0.0",
      isBundled: true,
      isInstalled: true,
    },
    eng: {
      lang: "eng",
      name: "English",
      size: "4.1 MB",
      version: "1.0.0",
      isBundled: true,
      isInstalled: true,
    },
    equ: {
      lang: "equ",
      name: "Toán học & Ký hiệu",
      size: "2.3 MB",
      version: "1.0.0",
      isBundled: true,
      isInstalled: true,
    },
  },
  chatHistory: [],
  conversations: [], // [{ id, title, createdAt, updatedAt, thumbnail, messages: [], titleCustom }]
  activeConversationId: null,
  // Set by chrome.runtime.onStartup / onInstalled('update') in service-worker.js
  // — consumed (and cleared) by the next addChatMessage() or switchConversation()
  // call. See addChatMessage()'s doc comment for the full session-boundary rule.
  pendingNewSession: false,
  // Shared between the two translate surfaces — the in-page card (opened
  // from the selection toolbar) and the toolbar popup — never the AI chat
  // history above, which is a separate concept entirely. See
  // Storage.addTranslateHistory().
  // [{ id, key, sourceText, translatedRaw, sourceLang, targetLang, isFavorite, updatedAt }]
  translateHistory: [],
};

/**
 * Two entries with the same source text translated to the same target
 * language are the same lookup re-run — addTranslateHistory() uses this to
 * update that entry in place (and bump it back to the top) rather than
 * growing a duplicate every time a word gets looked up again.
 */
function translateHistoryKey(sourceText, targetLang) {
  return `${sourceText.trim()}::${targetLang || ''}`;
}

// Plenty for a text-only list (no images, unlike chatHistory's 50-message
// cap) while still keeping chrome.storage.local's per-item write cheap.
const TRANSLATE_HISTORY_LIMIT = 300;

// The conversation methods below (addChatMessage, createNewConversation, ...)
// are all read-the-whole-array -> mutate -> write-the-whole-array against the
// same `conversations` key, with no locking of their own. Two calls that
// overlap (e.g. floating-card.js writes the user's captured-image turn, then
// the AI's answer finishes and drawer.js writes the assistant turn a moment
// later, neither call awaited by its caller) can both read the *same* stale
// array before either write lands — whichever write finishes last then wins
// outright, silently discarding the other call's message. This queue forces
// every conversation read-modify-write in this module to run one at a time,
// so a later call always sees the previous call's result. `_conversationQueue`
// itself must never reject (a broken chain would wedge every future call), so
// failures are absorbed by the `.then(noop, noop)` before being handed to the
// next waiter.
// A conversation left idle this long (or one from before the current
// browser session — see pendingNewSession) doesn't get reused for the next
// message; a fresh conversation starts instead. Compared against a
// conversation's own `updatedAt`, which every message send AND every
// explicit switchConversation() call bumps to "now" — so this is "24h since
// the user last touched this conversation", not a fixed clock from creation.
const SESSION_IDLE_MS = 24 * 60 * 60 * 1000;

let _conversationQueue = Promise.resolve();
function withConversationLock(fn) {
  const run = _conversationQueue.then(fn, fn);
  _conversationQueue = run.then(() => {}, () => {});
  return run;
}

export const Storage = {
  async get(keys = null) {
    return new Promise((resolve) => {
      // chrome.runtime.id reads as undefined once the extension is reloaded/updated
      // while this script is still injected in an old tab — bail out before touching
      // any chrome.* API to avoid the synchronous "Extension context invalidated" throw.
      if (typeof chrome === "undefined" || !chrome.storage?.local || !chrome.runtime?.id) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      try {
        chrome.storage.local.get(keys, (res) => {
          const merged = { ...DEFAULT_SETTINGS, ...(res || {}) };
          if (!keys) {
            resolve(merged);
          } else if (Array.isArray(keys)) {
            const filtered = {};
            keys.forEach((k) => {
              filtered[k] = merged[k];
            });
            resolve(filtered);
          } else if (typeof keys === "string") {
            resolve({ [keys]: merged[keys] });
          } else {
            resolve(merged);
          }
        });
      } catch (e) {
        // Context was invalidated in the gap between the check above and this call.
        resolve({ ...DEFAULT_SETTINGS });
      }
    });
  },

  async set(data) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage?.local || !chrome.runtime?.id) {
        resolve(false);
        return;
      }
      try {
        chrome.storage.local.set(data, () => resolve(true));
      } catch (e) {
        resolve(false);
      }
    });
  },

  async getApiConfigs() {
    const data = await this.get([
      "apiConfigs",
      "activeConfigId",
      "rotationStrategy",
    ]);
    return {
      apiConfigs: data.apiConfigs || [],
      activeConfigId: data.activeConfigId || "auto",
      rotationStrategy: data.rotationStrategy || "round-robin",
    };
  },

  async saveApiConfig(config) {
    const { apiConfigs = [] } = await this.get("apiConfigs");
    const existingIdx = apiConfigs.findIndex((c) => c.id === config.id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...apiConfigs];
      updated[existingIdx] = { ...updated[existingIdx], ...config };
    } else {
      updated = [
        ...apiConfigs,
        {
          ...config,
          id:
            config.id ||
            `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        },
      ];
    }
    await this.set({ apiConfigs: updated });
    return updated;
  },

  async removeApiConfig(id) {
    const { apiConfigs = [] } = await this.get("apiConfigs");
    const updated = apiConfigs.filter((c) => c.id !== id);
    await this.set({ apiConfigs: updated });
    return updated;
  },

  // =======================================================
  // Multi-Session Conversation Management
  // =======================================================
  // Internal — no locking of its own. Only call this from within a function
  // already running inside withConversationLock() (or accept the race); the
  // public getConversations() below is the locked entry point for everyone
  // else. Calling the public, locked method from in here would deadlock —
  // see withConversationLock()'s comment.
  async _getConversationsRaw() {
    const { conversations = [], chatHistory = [] } = await this.get([
      "conversations",
      "chatHistory",
    ]);
    if (conversations.length === 0 && chatHistory.length > 0) {
      // Automatic migration from flat chatHistory to first conversation
      const firstUserMsg = chatHistory.find((m) => m.role === "user");
      const conv = {
        id: `conv_${Date.now()}`,
        title: firstUserMsg?.content
          ? firstUserMsg.content.slice(0, 50)
          : "Cuộc trò chuyện trước",
        createdAt: firstUserMsg?.timestamp || Date.now(),
        updatedAt: Date.now(),
        thumbnail: chatHistory.find((m) => m.image)?.image || null,
        messages: chatHistory,
      };
      await this.set({ conversations: [conv], activeConversationId: conv.id });
      return [conv];
    }
    return conversations;
  },

  async getConversations() {
    return withConversationLock(() => this._getConversationsRaw());
  },

  async getActiveConversation() {
    const conversations = await this.getConversations();
    const { activeConversationId } = await this.get(["activeConversationId"]);
    if (activeConversationId) {
      const found = conversations.find((c) => c.id === activeConversationId);
      if (found) return found;
    }
    if (conversations.length > 0) {
      return conversations[conversations.length - 1];
    }
    return null;
  },

  async createNewConversation(title = "Đoạn chat mới") {
    return withConversationLock(async () => {
      const conversations = await this._getConversationsRaw();
      const { activeConversationId } = await this.get(["activeConversationId"]);
      const active = conversations.find((c) => c.id === activeConversationId);

      // If current active conversation is already empty, reuse it
      if (active && (!active.messages || active.messages.length === 0)) {
        active.title = title;
        active.updatedAt = Date.now();
        await this.set({
          conversations: [...conversations],
          activeConversationId: active.id,
          chatHistory: [],
        });
        return active;
      }

      const newConv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        thumbnail: null,
        messages: [],
      };
      const updated = [...conversations, newConv];
      await this.set({
        conversations: updated,
        activeConversationId: newConv.id,
        chatHistory: [],
      });
      return newConv;
    });
  },

  async switchConversation(convId) {
    return withConversationLock(async () => {
      const conversations = await this._getConversationsRaw();
      const active = conversations.find((c) => c.id === convId) || null;
      if (active) {
        // Explicitly opening a conversation counts as touching it — resets
        // the 24h idle clock (see SESSION_IDLE_MS) so continuing to chat in
        // an old conversation the user just deliberately picked doesn't get
        // forked into a new one on the very next message.
        active.updatedAt = Date.now();
      }
      await this.set({
        activeConversationId: convId,
        chatHistory: active ? active.messages || [] : [],
        conversations: active ? [...conversations] : conversations,
        // The user has now explicitly chosen which conversation this
        // session continues in — the "start fresh on browser restart"
        // default no longer applies (see addChatMessage()'s doc comment).
        pendingNewSession: false,
      });
      return active;
    });
  },

  // Internal counterpart to deleteConversation() — see _getConversationsRaw()'s
  // comment on why clearChatHistory() below must call this instead of the
  // public, locked deleteConversation().
  async _deleteConversationRaw(convId) {
    const conversations = await this._getConversationsRaw();
    const updated = conversations.filter((c) => c.id !== convId);
    const { activeConversationId } = await this.get(["activeConversationId"]);

    if (activeConversationId === convId) {
      // Deleting the conversation you're currently in always lands you on a
      // brand new one — jumping into whichever old conversation happens to
      // be most recent (the previous behavior) looks indistinguishable from
      // "delete didn't work" once the screen fills with unrelated old
      // messages the user didn't choose to see.
      const newConv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: "Đoạn chat mới",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        thumbnail: null,
        messages: [],
      };
      const finalConversations = [...updated, newConv];
      await this.set({
        conversations: finalConversations,
        activeConversationId: newConv.id,
        chatHistory: [],
        pendingNewSession: false,
      });
      return finalConversations;
    }

    await this.set({ conversations: updated });
    return updated;
  },

  async deleteConversation(convId) {
    return withConversationLock(() => this._deleteConversationRaw(convId));
  },

  /** User-driven rename from the history panel — marks titleCustom so the
   * next message sent doesn't overwrite it with an auto-derived title
   * (see addChatMessage()). */
  async renameConversation(convId, newTitle) {
    return withConversationLock(async () => {
      const conversations = await this._getConversationsRaw();
      const conv = conversations.find((c) => c.id === convId);
      if (!conv) return null;
      const trimmed = (newTitle || "").trim();
      if (trimmed) {
        conv.title = trimmed.slice(0, 80);
        conv.titleCustom = true;
        await this.set({ conversations: [...conversations] });
      }
      return conv;
    });
  },

  async getChatHistory() {
    const activeConv = await this.getActiveConversation();
    return activeConv ? activeConv.messages : [];
  },

  /**
   * @param {object} msg - { role, content, image? }
   * @param {string|null} [targetConvId] - Append to this exact conversation,
   *   bypassing the session-boundary resolution below entirely. For the
   *   assistant reply to a request that was started against a specific
   *   conversation — the user may have switched to viewing a different one
   *   by the time the reply finishes streaming, and it must still land in
   *   the conversation it was actually asked in (see drawer.js/sidepanel.js's
   *   activeRequestConversationId). Omitted for a fresh user message, which
   *   goes through the session logic below to decide where it belongs.
   */
  async addChatMessage(msg, targetConvId = null) {
    return withConversationLock(async () => {
      const conversations = await this._getConversationsRaw();
      const { activeConversationId, pendingNewSession } = await this.get(["activeConversationId", "pendingNewSession"]);

      let activeConv;
      if (targetConvId) {
        activeConv = conversations.find((c) => c.id === targetConvId);
      } else {
        const current = conversations.find((c) => c.id === activeConversationId);
        const isStale = current && Date.now() - (current.updatedAt || 0) > SESSION_IDLE_MS;
        // A new browser session (pendingNewSession — set by onStartup /
        // onInstalled('update') in service-worker.js) or 24h+ of inactivity
        // starts a fresh conversation instead of continuing the old one —
        // UNLESS that old one is itself still empty, in which case there's
        // nothing to "continue" and reusing it avoids piling up throwaway
        // empty conversations. Both flags are consumed (cleared) below;
        // switchConversation() is the other place pendingNewSession is
        // consumed, when the user explicitly picks an old conversation from
        // history before sending anything.
        const startFresh = (pendingNewSession || isStale) && !(current && (!current.messages || current.messages.length === 0));
        activeConv = startFresh ? null : current;
      }

      const messageWithTime = { ...msg, timestamp: Date.now() };

      if (!activeConv) {
        activeConv = {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: msg.content
            ? msg.content.slice(0, 50)
            : msg.image
              ? "Giải bài tập qua ảnh"
              : "Bài tập mới",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          thumbnail: msg.image || null,
          messages: [messageWithTime],
        };
        conversations.push(activeConv);
      } else {
        activeConv.messages = [...activeConv.messages, messageWithTime].slice(
          -50,
        );
        activeConv.updatedAt = Date.now();
        // titleCustom: the user renamed this conversation by hand (see the
        // history panel's rename action) — don't clobber that with an
        // auto-derived title from the next message sent.
        if (activeConv.messages.length <= 2 && msg.role === "user" && !activeConv.titleCustom) {
          activeConv.title = msg.content
            ? msg.content.slice(0, 50)
            : msg.image
              ? "Giải bài tập qua ảnh"
              : activeConv.title;
        }
        if (msg.image && !activeConv.thumbnail) {
          activeConv.thumbnail = msg.image;
        }
      }

      // Keep max 50 recent conversations to maintain high performance
      const finalConversations = conversations.slice(-50);

      await this.set({
        conversations: finalConversations,
        activeConversationId: activeConv.id,
        chatHistory: activeConv.messages,
        pendingNewSession: false,
      });
      return activeConv;
    });
  },

  async clearChatHistory() {
    return withConversationLock(async () => {
      const { activeConversationId } = await this.get(["activeConversationId"]);
      if (activeConversationId) {
        await this._deleteConversationRaw(activeConversationId);
      } else {
        await this.set({ chatHistory: [], conversations: [] });
      }
    });
  },

  // =======================================================
  // AI Routing Strategy & OCR Models Management
  // =======================================================
  async getRoutingStrategy() {
    const { routingStrategy = "prefer_nano" } = await this.get([
      "routingStrategy",
    ]);
    return routingStrategy;
  },

  async setRoutingStrategy(strategy) {
    await this.set({ routingStrategy: strategy });
    return strategy;
  },

  // Single global toggle (not per-key): when off, requests to models with a
  // known reasoning/thinking control (see shared/thinking-control.js) ask
  // for the lowest level that model allows, to cut latency. Models with no
  // known control, custom-typed models, and local providers are unaffected.
  async getThinkingEnabled() {
    const { thinkingEnabled = true } = await this.get(["thinkingEnabled"]);
    return thinkingEnabled;
  },

  async setThinkingEnabled(enabled) {
    await this.set({ thinkingEnabled: enabled });
    return enabled;
  },

  async getInstalledOcrModels() {
    const { installedOcrModels = DEFAULT_SETTINGS.installedOcrModels } =
      await this.get(["installedOcrModels"]);
    return installedOcrModels;
  },

  async saveOcrModel(modelInfo) {
    const models = await this.getInstalledOcrModels();
    const updated = {
      ...models,
      [modelInfo.lang]: {
        ...modelInfo,
        updatedAt: Date.now(),
      },
    };
    await this.set({ installedOcrModels: updated });
    return updated;
  },

  async removeOcrModel(lang) {
    const models = await this.getInstalledOcrModels();
    const updated = { ...models };
    if (updated[lang]?.isBundled) {
      // If bundled, reset version and mark as not custom updated
      updated[lang] = {
        ...DEFAULT_SETTINGS.installedOcrModels[lang],
        isInstalled: true,
      };
    } else {
      delete updated[lang];
    }
    await this.set({ installedOcrModels: updated });
    return updated;
  },

  // =======================================================
  // Translate History — shared by the in-page card's translate mode and the
  // toolbar popup, never by AI chat (see DEFAULT_SETTINGS.translateHistory)
  // =======================================================
  async getTranslateHistory() {
    const { translateHistory = [] } = await this.get(["translateHistory"]);
    return translateHistory;
  },

  /**
   * Record one completed translation, or refresh it if the same text was
   * already looked up in the same target language — re-running a lookup
   * updates that entry in place and moves it back to the front instead of
   * piling up a duplicate.
   *
   * `translatedRaw` is stored exactly as the translate engine returned it —
   * a dictionary-schema JSON string for a single word, plain text otherwise
   * — so the history sheet can render it through the same renderAnswer()
   * path a fresh translation uses, word card and all.
   *
   * @returns {Promise<object|null>} the stored entry, or null for empty input.
   */
  async addTranslateHistory({ sourceText, translatedRaw, sourceLang = "auto", targetLang }) {
    const text = (sourceText || "").trim();
    if (!text || !translatedRaw) return null;

    const history = await this.getTranslateHistory();
    const key = translateHistoryKey(text, targetLang);
    const existing = history.find((h) => h.key === key);

    const entry = {
      id: existing?.id || `th_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      key,
      sourceText: text,
      translatedRaw,
      sourceLang,
      targetLang,
      isFavorite: existing?.isFavorite || false,
      updatedAt: Date.now(),
    };

    const updated = [entry, ...history.filter((h) => h.key !== key)].slice(0, TRANSLATE_HISTORY_LIMIT);
    await this.set({ translateHistory: updated });
    return entry;
  },

  async toggleTranslateFavorite(id) {
    const history = await this.getTranslateHistory();
    const updated = history.map((h) => (h.id === id ? { ...h, isFavorite: !h.isFavorite } : h));
    await this.set({ translateHistory: updated });
    return updated.find((h) => h.id === id) || null;
  },

  /** Bulk delete — the history sheet's checkbox + Clear flow. */
  async removeTranslateHistory(ids) {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    const history = await this.getTranslateHistory();
    const updated = history.filter((h) => !idSet.has(h.id));
    await this.set({ translateHistory: updated });
    return updated;
  },
};
