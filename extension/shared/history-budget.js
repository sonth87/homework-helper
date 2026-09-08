/**
 * How many prior turns of an ongoing conversation get sent alongside a new
 * chat message, split by how expensive context is for that tier to process.
 *
 * Shared between the background service worker (cloud + Ollama/LM Studio,
 * via ai-engine.js) and the content-script's direct Gemini Nano path
 * (main-world-bridge.js has no chrome.* / module access, so drawer.js and
 * floating-card.js truncate here before dispatching HOMEWORK_AI_NANO_EXEC).
 *
 * Numbers are reasoned estimates, not measured — see roadmap/known-issues.md
 * mục 1. 'nano' sits below 'local' (Ollama/LM Studio): Gemini Nano is the
 * weakest model here and the only one with a hard input quota, so it gets
 * the smallest slice even though both run on-device.
 */
export const HISTORY_TURNS = {
  nano: 4,
  local: 6,
  cloud: 20,
};

/**
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {'nano'|'local'|'cloud'} tier
 */
export function truncateHistory(history, tier) {
  if (!history || !history.length) return [];
  const max = HISTORY_TURNS[tier] ?? HISTORY_TURNS.cloud;
  return history.slice(-max);
}
