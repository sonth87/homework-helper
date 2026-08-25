/**
 * Study-mode prompt formatting, shared between the service worker (Gemini
 * Nano on-device path) and the offscreen document (cloud provider paths) so
 * both sides build the exact same instructions for a given study mode.
 */
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
    return `You are a translation tool and bilingual dictionary. Your ONLY task is to process the content below following these rules — no preamble, no restating the request, no explaining the task:

- If the content is a SINGLE STANDALONE WORD (exactly 1 word, not a multi-word phrase), reply in EXACTLY this structure and nothing else (each part below is its own paragraph, separated from the next by ONE blank line):

**<word>** /<IPA phonetic transcription>/

*<part-of-speech abbreviation, e.g. n., v., adj., adv.>* **<short gloss of that meaning, written in ${targetLangName}>**
<one example sentence in the original language, wrapping ONLY the target word (or its inflected form) in backticks, e.g. \`word\`> — <its translation into ${targetLangName}, wrapping ONLY the corresponding translated word/phrase in backticks>

<repeat the paragraph above ONLY if the word has a second distinct common meaning/part of speech (max 2 total); otherwise skip straight to the last paragraph>

<one short overall description/definition of the word, written in ${targetLangName}, as a plain sentence with no bold or backticks>

Formatting rules: the part-of-speech tag and its example sentence go on two consecutive lines with NO blank line between them; every other part (headword, each meaning+example pair, the final description) is separated by exactly one blank line.

- If the content is a PHRASE (2 or more words), a sentence, a paragraph, or longer text, reply with ONLY the accurate translation into ${targetLangName} and nothing else. Do NOT add IPA phonetics, do NOT add examples, do NOT use bold/backticks formatting, no explanation, no analysis, no notes — no matter how short the term, proper noun, or phrase is.

Content to process:
${prompt}`;
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
          body = `[MODE: IN-DEPTH EXPLANATION]\nGoal: Explain the underlying scientific/mathematical theory, related principles, and real-world intuition behind this problem in an easy-to-understand way:\n\nQuestion:\n${prompt}`;
          break;
        case 'step-by-step':
        default:
          body = `[MODE: DETAILED STEP-BY-STEP SOLUTION]\nGoal: Solve the following problem with clear steps (Step 1, Step 2...), rigorous mathematical reasoning, LaTeX formulas ($...$), and box the final answer:\n\nQuestion:\n${prompt}`;
      }
    }
  }

  return `${langPrefix}${body}${langSuffix}`;
}
