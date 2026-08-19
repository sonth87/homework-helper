/**
 * Hardcoded per-model "disable thinking" mapping, used by the global
 * "Thinking" toggle. Each provider's reasoning-control API is shaped
 * differently, and not every model supports it — only models listed here
 * get a value applied when the toggle is off. Anything else (unlisted
 * model, custom-typed model, local providers) is left untouched, i.e.
 * behaves exactly like the toggle being on (model's own default).
 *
 * Values are the lowest tier confirmed to work per provider, verified
 * 2026-08 against live Gemini calls and current provider docs:
 *  - Gemini: generationConfig.thinkingConfig.thinkingLevel (numeric
 *    thinkingBudget:0 is rejected by 3.x models; "low" is the safe floor).
 *  - OpenAI / Groq (OpenAI-compatible): flat `reasoning_effort` field.
 *  - Claude: top-level `effort` field (adaptive thinking, replaces the
 *    deprecated budget_tokens approach on the 5-series).
 *  - DeepSeek V4: reasoning_effort only accepts "high"/"max" server-side
 *    (lower values are silently coerced back to "high"), so disabling
 *    requires the separate `thinking: {type: "disabled"}` field instead —
 *    hence `true` rather than a level string.
 */
export const THINKING_DISABLE_MAP = {
  gemini: {
    'gemini-3.7-flash': 'low',
    'gemini-3.6-flash': 'low',
    'gemini-3.5-flash': 'low',
    'gemini-3.5-flash-lite': 'low',
    'gemini-3.1-pro-preview': 'low',
  },
  openai: {
    'gpt-5.6-sol': 'none',
    'gpt-5.6-terra': 'none',
    'gpt-5.6-luna': 'none',
  },
  claude: {
    'claude-fable-5': 'low',
    'claude-opus-5': 'low',
    'claude-sonnet-5': 'low',
  },
  deepseek: {
    'deepseek-v4-pro': true,
    'deepseek-v4-flash': true,
  },
  groq: {
    'openai/gpt-oss-120b': 'low',
    'openai/gpt-oss-20b': 'low',
    'qwen/qwen3.6-27b': 'none',
  },
};

/**
 * @param {string} provider
 * @param {string} model
 * @returns {string|true|null} the disable value to apply, or null if this
 *   provider/model combination has no known thinking control.
 */
export function getThinkingDisableValue(provider, model) {
  return THINKING_DISABLE_MAP[provider]?.[model] ?? null;
}
