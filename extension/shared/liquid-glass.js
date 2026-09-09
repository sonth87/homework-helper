/**
 * "Liquid Glass" backdrop refraction filter, shared by every glass-look
 * surface across the UI (Selection Toolbar, Quick Hover Translate tooltip,
 * Homework Helper popup card, the Minimize circle/popup, rich tooltips,
 * toasts...).
 *
 * The plain `backdrop-filter: blur(...) saturate(180%)` this extension used
 * everywhere only softens the page behind the glass — it never actually
 * bends/refracts it, which is the part that reads as "glass" rather than
 * "frosted plastic". This chains in an SVG filter (feTurbulence +
 * feDisplacementMap) that distorts the backdrop, the same two primitives —
 * and only those two — that the reference implementation
 * (https://github.com/sonth87/liquid-glass, src/components/Glass.tsx) uses.
 * `backdrop-filter` accepts a space-separated chain of filter functions, so
 * existing declarations just gain `url(#hw-liquid-glass-filter)` alongside
 * their own blur() — nothing about the existing blur/opacity/theme values
 * needs to change.
 *
 * ── Do not reintroduce an edge mask here ──
 * An earlier version chained feImage (a radial black→white vignette, as a
 * data: URI) + feComposite ahead of the displacement, meaning to keep the
 * warp strong at the edges and flat in the middle. It silently disabled the
 * whole effect instead:
 *
 *   feComposite arithmetic is  result = k1·i1·i2 + k2·i1 + k3·i2 + k4
 *   with k1=1, k2=0, k3=-0.5, k4=0.5  →  result = noise·mask − 0.5·mask + 0.5
 *
 * feDisplacementMap moves each pixel by `scale × (channel − 0.5)`, so a
 * channel value of exactly 0.5 means *zero* displacement. Wherever the mask
 * was black (the entire middle of every surface) the composite collapsed to
 * a flat 0.5 → no displacement at all. And because Chromium's support for
 * feImage pointing at a data: URI inside a filter used by `backdrop-filter`
 * is unreliable, the mask commonly resolved to transparent black *
 * everywhere* — which made the composite 0.5 everywhere, i.e. the filter
 * did nothing at any scale or frequency. Keep the graph to the two
 * primitives below.
 *
 * SVG filters are DOM elements, not a CSS-only construct, so this still
 * needs one `<svg>` injected per root (once per shadow root or per page
 * document — the filter is referenced by a fixed id from any stylesheet
 * loaded into that same root/document).
 */

const INJECTED_ROOTS = new WeakSet();

export const LIQUID_GLASS_FILTER_ID = 'hw-liquid-glass-filter';

// Same defaults as the reference implementation's own Glass component, and
// the same ranges its config panel exposes: scale 0-200, baseFrequency
// 0.001-0.1. The values this filter shipped with before (scale 70,
// frequency 0.14 — the latter above the reference's whole range) were tuned
// against the broken edge-mask graph above, where nothing was actually being
// displaced, so they are not a baseline worth preserving.
export const LIQUID_GLASS_DEFAULTS = { scale: 30, frequency: 0.02 };

// Documents need <body> (it may not exist yet at call time in theory, but
// every call site here runs after DOM/shadow setup); a ShadowRoot can take
// the element directly.
function filterHost(root) {
  return root.body || root;
}

/**
 * Injects the shared SVG filter definition into `root` (a Document or a
 * ShadowRoot) if it isn't already there. Safe to call multiple times per
 * root — only the first call actually adds anything. `scale`/`frequency`
 * seed the initial look (Options > Appearance > Liquid Glass); a later
 * settings change updates the already-injected filter in place via
 * updateLiquidGlassFilter() instead of re-injecting.
 */
export function ensureLiquidGlassFilter(root, { scale = LIQUID_GLASS_DEFAULTS.scale, frequency = LIQUID_GLASS_DEFAULTS.frequency } = {}) {
  if (!root || INJECTED_ROOTS.has(root)) return;
  INJECTED_ROOTS.add(root);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'fixed';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.style.pointerEvents = 'none';
  svg.innerHTML = `
    <defs>
      <filter id="${LIQUID_GLASS_FILTER_ID}" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3" result="noise"></feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="displaced"></feDisplacementMap>
      </filter>
    </defs>
  `;

  filterHost(root).appendChild(svg);
}

/**
 * Live-updates an already-injected filter's Scale/Frequency in place — the
 * SVG attributes re-render immediately, no re-injection needed. Called from
 * each context's own chrome.storage.onChanged reaction. A no-op if
 * ensureLiquidGlassFilter() hasn't run for this root yet.
 */
export function updateLiquidGlassFilter(root, { scale, frequency } = {}) {
  if (!root) return;
  const filterEl = filterHost(root).querySelector(`#${LIQUID_GLASS_FILTER_ID}`);
  if (!filterEl) return;
  if (scale !== undefined) filterEl.querySelector('feDisplacementMap')?.setAttribute('scale', scale);
  if (frequency !== undefined) filterEl.querySelector('feTurbulence')?.setAttribute('baseFrequency', frequency);
}
