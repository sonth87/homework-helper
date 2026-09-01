/**
 * Dựng system prompt và user prompt theo intent + chế độ học tập.
 *
 * Kế thừa tư tưởng từ extension (shared/study-prompt.js) nhưng viết lại: bản
 * desktop có ngữ cảnh ảnh chụp màn hình, extension có ngữ cảnh trang web. Hai
 * bản prompt ĐƯỢC PHÉP khác nhau — xem ADR-0001.
 */

import type { Intent, StudyMode } from '@shared/types/intent';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', vi: 'Vietnamese', th: 'Thai', 'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese', ja: 'Japanese', ko: 'Korean', es: 'Spanish',
  fr: 'French', de: 'German', pt: 'Portuguese', id: 'Indonesian', ru: 'Russian',
};

const BASE_ROLE = `You are an elite academic tutor helping a student with material captured from their screen. Write mathematics in LaTeX delimited by $...$ for inline and $$...$$ for display. Box the final answer.`;

const MODE_INSTRUCTIONS: Record<StudyMode, string> = {
  'step-by-step': `Give the final answer first, then the method and theorems used, then every transformation step in order.`,
  direct: `Output ONLY the final answer. No steps, no reasoning, no analysis. For multiple choice, output only the option letter and its text. Keep it under two lines.`,
  hint: `Do NOT reveal the final answer. Give the approach, the formulas needed, and guiding questions so the student can finish it themselves.`,
  explain: `Explain the underlying theory and intuition rather than only answering. Cover definitions, a worked example, and common pitfalls.`,
  translate: `Translate accurately into the target language. Preserve every mathematical symbol, formula, and structure exactly as written.`,
};

const INTENT_INSTRUCTIONS: Partial<Record<Intent, string>> = {
  summarize: `Summarize the content. Lead with the single most important point, then supporting details as a short list.`,
  explain: `Explain what this content means, assuming the reader is seeing it for the first time.`,
  rewrite: `Rewrite the text to be clearer and better organized. Preserve the original meaning exactly.`,
};

export type PromptParams = {
  intent: Intent;
  studyMode?: StudyMode;
  outputLanguage: string;
  userText: string;
  hasImage: boolean;
  /** Chưa cắt theo local/cloud — việc đó thuộc về ai.service.ts (biết config
   *  nào đang chạy), không phải nơi dựng prompt. Xem RequestContext.history. */
  history?: { role: 'user' | 'assistant'; content: string }[];
};

export function buildSystemPrompt(params: PromptParams): string {
  const language = LANGUAGE_NAMES[params.outputLanguage] ?? 'English';

  // Yêu cầu ngôn ngữ đặt TRƯỚC mọi thứ khác: model nhỏ và model local thường
  // quay về tiếng Anh khi chỉ thị ngôn ngữ bị chôn sau vài đoạn tiếng Anh khác.
  const directive = `[LANGUAGE — HIGHEST PRIORITY] Write your entire response in ${language}. This overrides every stylistic instruction below.`;

  const task = INTENT_INSTRUCTIONS[params.intent]
    ?? MODE_INSTRUCTIONS[params.studyMode ?? 'step-by-step'];

  const context = params.hasImage
    ? `The user captured a region of their screen. Read it carefully — it may contain a graph, diagram, chemical structure, or handwritten work, not just text.`
    : `The user selected text from their screen.`;

  return [directive, BASE_ROLE, context, task].join('\n\n');
}

export function buildUserPrompt(params: PromptParams): string {
  if (!params.userText.trim()) {
    return params.hasImage ? 'Handle the content in the attached image.' : '';
  }
  return params.userText;
}
