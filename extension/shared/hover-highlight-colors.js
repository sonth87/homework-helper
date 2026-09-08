/**
 * Curated pastel swatches for Quick Hover Translate's text highlight
 * (hoverTranslateHighlightColor) — a fixed palette rather than a free color
 * picker, so every choice already reads as a soft "marker" tint instead of
 * needing the user to also fight with saturation/lightness themselves.
 * Actual intensity is a separate control (hoverTranslateHighlightOpacity).
 *
 * Shared between extension/options/tabs/appearance-tab.js (renders the
 * swatch picker) and extension/content/hover-translate.js (validates a
 * stored value still matches one of these before using it).
 */
export const HOVER_HIGHLIGHT_COLORS = [
  '#fef08a', // yellow (default)
  '#fde68a', // amber
  '#fed7aa', // orange
  '#fecdd3', // rose
  '#fbcfe8', // pink
  '#e9d5ff', // purple
  '#bfdbfe', // blue
  '#a5f3fc', // cyan
  '#99f6e4', // teal
  '#bbf7d0', // green
];

export const DEFAULT_HOVER_HIGHLIGHT_COLOR = HOVER_HIGHLIGHT_COLORS[0];
