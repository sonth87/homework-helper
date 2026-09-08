/**
 * Solid-colour theme RGB triples for the Selection Toolbar / Quick Hover
 * Translate tooltip ('toolbarTheme' setting — see content/styles/tooltip.css's
 * own .theme-X rules, which this mirrors). One source of truth so adding a
 * new theme means adding one entry here instead of touching every consumer
 * separately. 'glass-light' (the default), 'auto', and 'glass-dark' are
 * intentionally absent — none of them has a single accent colour of their
 * own, only a light/dark glass background.
 */
export const TOOLBAR_THEME_COLORS = {
  'cyber-blue': '2, 132, 199',
  emerald: '5, 150, 105',
  purple: '124, 58, 237',
  rose: '225, 29, 72',
  amber: '217, 119, 6',
  indigo: '79, 70, 229',
};

// Used wherever a themed accent is needed but the current toolbarTheme has
// no colour of its own (glass-light/glass-dark/auto) — the same blue as the
// 'cyber-blue' theme, since it's this extension's own long-standing default
// accent everywhere else (buttons, links, focus rings).
export const DEFAULT_THEME_COLOR_RGB = '2, 132, 199';

export function resolveThemeColorRgb(toolbarTheme) {
  return TOOLBAR_THEME_COLORS[toolbarTheme] || DEFAULT_THEME_COLOR_RGB;
}
