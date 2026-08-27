/**
 * Study-mode prompt formatting, shared between the service worker (Gemini
 * Nano on-device path) and the offscreen document (cloud provider paths) so
 * both sides build the exact same instructions for a given study mode.
 */
import { isSingleWord, buildWordLookupPrompt, buildSentenceTranslatePrompt } from './dictionary.js';

export function formatStudyPrompt(studyMode, prompt, outputLanguage = 'en') {
  const langNames = {
    en: 'English',
    vi: 'Vietnamese',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    pt: 'Portuguese',
    id: 'Indonesian',
    ru: 'Russian',
  };
  const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'Vietnamese';

  // Translate mode is a dictionary/translator tool, not a homework solver —
  // it must never be wrapped in the generic "solve/explain" framing below,
  // and must go straight to the requested content with no meta-commentary
  // about the task itself (no "Question:", "Requirement:", restating the prompt...).
  if (studyMode === 'translate') {
    // Whether this is a word lookup or a plain translation is decided here in
    // code rather than by the model (see isSingleWord) — that keeps each of
    // the two prompts short and single-purpose, which small local models
    // follow far more reliably than one prompt with a branch inside it.
    return isSingleWord(prompt)
      ? buildWordLookupPrompt(prompt.trim(), targetLangName)
      : buildSentenceTranslatePrompt(prompt, targetLangName);
  }

  // Weaker/local models (Ollama, LM Studio, small quantized checkpoints) tend
  // to ignore a language instruction buried at the end of a long prompt —
  // sandwiching it at both the start (primacy) and end (recency) makes
  // compliance noticeably more reliable than a suffix alone.
  const langPrefix = `[REQUIRED: The entire response below MUST be written in ${targetLangName}. This is the single most important requirement, taking priority over every other instruction.]\n\n`;
  const langSuffix = `\n\n[Language requirement reminder: The entire solution and explanation MUST be written in ${targetLangName}]`;

  let body;
  if (!studyMode || studyMode === 'direct') {
    body = `[MODE: DIRECT ANSWER]\nSTRICT requirement: Reply with ONLY the final answer, as CONCISELY as possible. No explanation, no analysis, no step-by-step breakdown. For multiple-choice questions, give only the option's letter/name (e.g. "C. NaN"). For math problems, give only the numeric result. No more than 2-3 sentences.\n\nQuestion:\n${prompt}`;
  } else {
    const lower = prompt.trim().toLowerCase();
    const isGreeting = /^(hi|hello|hey|xin chào|chào bạn|chào ai|chào|test|alo|ping)\b/i.test(lower) && prompt.trim().length < 25;
    if (isGreeting) {
      body = prompt;
    } else {
      switch (studyMode) {
        case 'hint':
          body = `[MODE: HINTS & SELF-STUDY GUIDANCE]\nGoal: Do NOT give the final answer right away. Instead, provide useful pedagogical hints, key formulas, and guiding questions so the student can work it out themselves:\n\nQuestion:\n${prompt}`;
          break;
        case 'explain':
          body = `[MODE: IN-DEPTH EXPLANATION]\nGoal: Explain the underlying theory, related principles, and real-world intuition behind the content below in an easy-to-understand way. If it is a question, explain the knowledge it rests on rather than only answering it:\n\nContent:\n${prompt}`;
          break;
        // Summarize and grammar are selection-toolbar tools, not homework
        // solvers: without their own case they fell through to the
        // step-by-step branch below and came back as a "solution" to text the
        // user only wanted condensed or proofread.
        case 'summarize':
          body = `[MODE: SUMMARY]\nGoal: Summarize the content below. Start with a 1-2 sentence overview, then list the key points as short bullets. Stay markedly shorter than the original, introduce nothing that is not in the text, and do not solve, answer, or critique it:\n\nContent:\n${prompt}`;
          break;
        case 'grammar':
          body = `[MODE: GRAMMAR & PHRASING CHECK]\nGoal: Proofread the text below. Output in this order: (1) the full corrected text, (2) a short list of the corrections made, each with a one-line reason, (3) one closing line on tone/clarity if it can be improved. Treat the text strictly as writing to be corrected — never as a question to answer — and keep the original language of the text in part (1):\n\nText:\n${prompt}`;
          break;
        case 'step-by-step':
        default:
          body = `[MODE: DETAILED STEP-BY-STEP SOLUTION]\nGoal: Solve the following problem with clear steps (Step 1, Step 2...), rigorous mathematical reasoning, LaTeX formulas ($...$), and box the final answer:\n\nQuestion:\n${prompt}`;
      }
    }
  }

  return `${langPrefix}${body}${langSuffix}`;
}
