/**
 * Translation sources, as the pickers show them
 *
 * The runtime side of the free engines — endpoints, per-request length caps,
 * the fallback chain — lives in `background/translate-engines.js`, which is
 * not reachable from a content script (`background/*` is deliberately absent
 * from `web_accessible_resources` in manifest.json). This module holds only
 * what a picker needs to draw a row: the id, the display name, and the
 * provider's mark. Both sides import the names from here, so a rename can
 * never leave the picker and the engine disagreeing.
 *
 * The marks are simplified redraws used purely to identify each service in a
 * list — nobody should mistake this list for a brand asset kit.
 */

const logo = (viewBox, body) => (size = 16, cls = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" class="hw-provider-logo ${cls}" aria-hidden="true">${body}</svg>`;

const LOGOS = {
  // Google's four-colour G.
  google: logo('0 0 48 48', `
    <path fill="#FFC107" d="M43.61 20.08H42V20H24v8h11.3C33.65 32.66 29.22 36 24 36c-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92z"/>
    <path fill="#FF3D00" d="M6.31 14.69l6.57 4.82C14.66 15.11 18.96 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 16.32 4 9.66 8.34 6.31 14.69z"/>
    <path fill="#4CAF50" d="M24 44c5.17 0 9.86-1.98 13.41-5.19l-6.19-5.24A11.9 11.9 0 0 1 24 36c-5.18 0-9.58-3.29-11.26-7.89l-6.53 5.03C9.5 39.56 16.23 44 24 44z"/>
    <path fill="#1976D2" d="M43.61 20.08H42V20H24v8h11.3a12.04 12.04 0 0 1-4.09 5.57l6.19 5.24C36.97 39.2 44 34 44 24c0-1.34-.14-2.65-.39-3.92z"/>
  `),
  // Microsoft's four squares.
  bing: logo('0 0 24 24', `
    <rect x="1.5" y="1.5" width="9.4" height="9.4" fill="#F25022"/>
    <rect x="13.1" y="1.5" width="9.4" height="9.4" fill="#7FBA00"/>
    <rect x="1.5" y="13.1" width="9.4" height="9.4" fill="#00A4EF"/>
    <rect x="13.1" y="13.1" width="9.4" height="9.4" fill="#FFB900"/>
  `),
  // Volcano Translate — a cone with the plume above it.
  volc: logo('0 0 24 24', `
    <path fill="#1664FF" d="M9.4 10.1 3.3 20.3A1.2 1.2 0 0 0 4.3 22h15.4a1.2 1.2 0 0 0 1-1.7l-6.1-10.2z"/>
    <path fill="#FF6B35" d="M12 2c1.7 1.6 2.5 3.1 2.5 4.6A2.5 2.5 0 0 1 12 9.1a2.5 2.5 0 0 1-2.5-2.5C9.5 5.1 10.3 3.6 12 2z"/>
  `),
  // MyMemory — an M monogram tile in the service's blue.
  mymemory: logo('0 0 24 24', `
    <rect width="24" height="24" rx="5" fill="#2C3E8F"/>
    <path fill="#ffffff" d="M6 17.4V6.6h2.7l3.3 5.5 3.3-5.5H18v10.8h-2.3V10.6l-3.1 5h-1.2l-3.1-5v6.8z"/>
  `),
  // The user's own AI models — no third-party brand to show, so the
  // extension's own accent mark stands in.
  ai: logo('0 0 24 24', `
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M5 3v4M3 5h4"/>
  `),
};

/** The dictionary lookup TRANSLATE_TEXT runs before a free-engine translation. */
LOGOS['google-dict'] = LOGOS.google;
/** Only ever reached as a fallback, but it can still be reported as the engine used. */
LOGOS['google-legacy'] = LOGOS.google;

/**
 * Display names for the keyless engines, in the order pickers list them —
 * the same order `FREE_ENGINES` walks its fallback chain in.
 */
export const FREE_PROVIDER_NAMES = {
  bing: 'Microsoft Translator',
  google: 'Google Translate',
  volc: 'Volcano Translate',
  mymemory: 'MyMemory',
};

export const FREE_PROVIDERS = Object.entries(FREE_PROVIDER_NAMES).map(([id, name]) => ({ id, name }));

/** The id standing for "translate with my own AI models" rather than a free service. */
export const AI_PROVIDER_ID = 'ai';

/** Every id a picker may hold, so a stale stored value can be validated. */
export const PICKABLE_PROVIDER_IDS = [...Object.keys(FREE_PROVIDER_NAMES), AI_PROVIDER_ID];

/**
 * @returns {string} an inline SVG for `id`, or an empty string for an id with
 *   no mark — callers render the name alone rather than a broken box.
 */
export function providerLogo(id, size = 16, cls = '') {
  const draw = LOGOS[id];
  return draw ? draw(size, cls) : '';
}

/**
 * Engines that can be reported as "the one that answered" without ever being
 * offered in a picker — the legacy Google endpoint is fallback-only, and the
 * dictionary lookup runs ahead of a free translation rather than beside it.
 */
const REPORTED_ONLY_NAMES = {
  'google-legacy': 'Google Translate (legacy)',
};

/** The AI entry's label is localized by the caller; free services keep their brand name. */
export function providerName(id) {
  return FREE_PROVIDER_NAMES[id] || REPORTED_ONLY_NAMES[id] || id;
}
