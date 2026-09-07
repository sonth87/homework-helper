/**
 * "Liquid Glass" backdrop refraction filter, shared by every glass-look
 * surface across both apps' UI (Selection Toolbar, Quick Hover Translate
 * tooltip, Homework Helper popup card, the Minimize circle/popup, rich
 * tooltips, toasts...).
 *
 * The plain `backdrop-filter: blur(...) saturate(180%)` this extension used
 * everywhere only softens the page behind the glass — it never actually
 * bends/refracts it, which is the part that reads as "glass" rather than
 * "frosted plastic". This chains in an SVG filter (feTurbulence +
 * feDisplacementMap) that distorts the backdrop through a fixed noise
 * pattern before it's blurred, the same technique this issue's reference
 * (https://github.com/sonth87/liquid-glass) uses. `backdrop-filter` accepts
 * a space-separated chain of filter functions, so existing declarations
 * just gain `url(#hw-liquid-glass-filter)` alongside their own blur() —
 * nothing about the existing blur/opacity/theme values needs to change.
 *
 * SVG filters are DOM elements, not a CSS-only construct, so this still
 * needs one `<svg>` injected per root (once per shadow root or per page
 * document — the filter is referenced by a fixed id from any stylesheet
 * loaded into that same root/document).
 */

const INJECTED_ROOTS = new WeakSet();

export const LIQUID_GLASS_FILTER_ID = 'hw-liquid-glass-filter';

// A soft radial vignette (pure SVG, no bitmap asset) used to fade the noise's
// effective displacement toward zero near the center and full strength near
// the edges — real glass bends light most where the surface curves away
// (its edges), staying essentially flat through the middle. Deliberately not
// shape-specific (unlike a hand-drawn bitmap mask, which only looks right on
// the one aspect ratio/corner radius it was drawn for): a centered radial
// gradient degrades gracefully across this extension's very different glass
// shapes (a wide pill toolbar, a near-square card, a tall drawer, a small
// circle) without needing a separate asset per shape family.
const EDGE_MASK_SVG = "<svg xmlns='http://www.w3.org/2000/svg'>"
  + "<defs><radialGradient id='g' cx='50%' cy='50%' r='70%'>"
  + "<stop offset='45%' stop-color='black'/>"
  + "<stop offset='100%' stop-color='white'/>"
  + "</radialGradient></defs>"
  + "<rect width='100%' height='100%' fill='url(#g)'/>"
  + '</svg>';
const EDGE_MASK_DATA_URI = `data:image/svg+xml,${encodeURIComponent(EDGE_MASK_SVG)}`;

/**
 * Injects the shared SVG filter definition into `root` (a Document or a
 * ShadowRoot) if it isn't already there. Safe to call multiple times per
 * root — only the first call actually adds anything.
 */
export function ensureLiquidGlassFilter(root) {
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
        <feImage x="0%" y="0%" width="100%" height="100%" href="${EDGE_MASK_DATA_URI}" result="edgemask"></feImage>
        <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="2" seed="7" result="noise"></feTurbulence>
        <!-- Arithmetic composite: result = mask*noise - 0.5*mask + 0.5. At
             mask=1 (edge) this is just the raw noise; at mask=0 (center) it
             collapses to a flat 0.5 (mid-gray) in every channel, which
             feDisplacementMap below reads as *zero* displacement — the
             thing that actually produces the "flat in the middle" look,
             not just a dimmer version of the same warp everywhere. -->
        <feComposite in="noise" in2="edgemask" operator="arithmetic" k1="1" k2="0" k3="-0.5" k4="0.5" result="edgeNoise"></feComposite>
        <feDisplacementMap in="SourceGraphic" in2="edgeNoise" scale="70" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
      </filter>
    </defs>
  `;

  const target = root.body || root; // documents need <body>; a ShadowRoot can take the element directly
  target.appendChild(svg);
}
