/**
 * Per-element "liquid glass" refraction — the one glass implementation used
 * by every backdrop-filter surface across this extension (in-page overlay,
 * cropper, selection toolbar, hover-translate, and the Options/Popup/
 * SidePanel pages' own tooltips/toasts/previews). Superseded the older
 * single shared SVG filter (`shared/liquid-glass.js`, now deleted) that used
 * to sit behind every one of those via one `url(#hw-liquid-glass-filter)`
 * reference — this instead builds one small per-element displacement map
 * sized to that element's own box, which is what actually produces a visible
 * lensing/bulge effect (the old shared filter's single fixed-size noise
 * pattern never did, regardless of its Scale/Frequency settings).
 *
 * Vendored (not reimplemented from a paraphrase) from
 * https://github.com/deepika-builds/liquid-glass (MIT License, see below),
 * itself crediting https://aave.com/design/building-glass-for-the-web and
 * https://github.com/rizroze/liquid-glass. The displacement math, the 3-pass
 * chromatic-aberration blend, and color-interpolation handling are kept
 * byte-for-byte in spirit — only the module shape and the root/id plumbing
 * below were changed:
 *
 *   1. Converted from a `window.liquidGlass` IIFE global to an ES export,
 *      matching how every other module in this codebase is written.
 *   2. `ensureDefs()` now takes `root` and caches per-root (WeakMap) instead
 *      of a single module-level `document.body` singleton. The original
 *      always appended its shared <defs> to document.body — every glass
 *      surface in this extension lives inside one Shadow DOM instead, and a
 *      `url(#id)` reference cannot cross that boundary (a `<filter>` sitting
 *      in the outer page's light DOM is invisible to an element composed
 *      into the shadow tree, and this extension already hit exactly this
 *      class of bug once for the *other* shared filter — see
 *      shared/liquid-glass.js). attachLiquidGlassRefraction() below derives
 *      the correct root itself via `el.getRootNode()`, so callers never have
 *      to know or pass it.
 *   3. The returned handle also exposes `filterId` — the original had no
 *      caller ever need it (it manages its own `backdrop-filter` write
 *      internally), but .hw-solution-card's blur is independently
 *      reactive to the "Popup Blur" setting elsewhere in this codebase
 *      (see applyAppearanceSettings() in content/overlay.js), so that call
 *      site needs this element's *own* filter id to rebuild the
 *      backdrop-filter string on setting changes without clobbering this
 *      module's displacement map.
 *
 * MIT License — Copyright (c) deepika-builds/liquid-glass contributors.
 * Permission is hereby granted, free of charge, to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * subject to including this copyright notice in all copies or substantial
 * portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT
 * WARRANTY OF ANY KIND.
 */

let uid = 0;
const DEFS_BY_ROOT = new WeakMap();

// Scale/chroma are the two knobs exposed on the Options page's "Liquid Glass"
// card (see options/tabs/appearance-tab.js) — a single pair of values shared
// by every attached surface in this module's realm (one per page: options.html,
// popup.html, sidepanel.html, and the content-script's shared shadow root each
// get their own separate copy of this module, so each of those wires its own
// Storage.get()/storage.onChanged into setGlobalGlassParams() independently —
// see content/shadow-root.js and content/overlay.js for the content-script
// side). border/mapBlur/blur/saturate/radius stay per-call opts since those
// vary legitimately by surface (a toast wants different blur than a drawer).
let globalScale = -112;
let globalChroma = 6;
const scaleChromaListeners = new Set();

/**
 * Updates the shared Scale/Chroma knobs and immediately re-renders every
 * currently-attached surface with the new values. Either field can be
 * omitted to leave that one alone (mirrors chrome.storage.onChanged's
 * `changes` shape, where only the keys that actually changed are present).
 * @param {Object} [params]
 * @param {number} [params.scale]
 * @param {number} [params.chroma]
 */
export function setGlobalGlassParams({ scale, chroma } = {}) {
  if (scale != null) globalScale = scale;
  if (chroma != null) globalChroma = chroma;
  scaleChromaListeners.forEach((fn) => fn());
}

// Chromium can apply SVG filters via backdrop-filter; Safari and Firefox
// silently no-op, so they get the frosted fallback instead. This extension
// only ever runs under Chromium (MV3 `chrome.*` APIs), so in practice this
// always resolves true — kept as-written so a future non-Chromium build
// target degrades instead of breaking.
const supported = (() => {
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  if (isSafari || isFirefox) return false;
  if (!CSS.supports('backdrop-filter', 'url(#lg)')) return false;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 4;
    c.getContext('2d').getImageData(0, 0, 1, 1);
    return true;
  } catch (_) {
    return false;
  }
})();

function ensureDefs(root) {
  const existing = DEFS_BY_ROOT.get(root);
  if (existing) return existing;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  // width/height 0 keeps it renderable (display:none would break feImage)
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);
  (root.body || root).appendChild(svg);
  DEFS_BY_ROOT.set(root, defs);
  return defs;
}

// Displacement map, gradient-difference method: a red left->right ramp
// encodes X displacement, a blue top->bottom ramp encodes Y ("difference"
// keeps both since the channels are disjoint). A blurred, inset 50%-gray
// rounded rect neutralizes the interior, confining the refraction bulge to
// an edge band whose curvature is set by the blur radius.
function makeMap(w, h, radius, border, mapBlur) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const gx = ctx.createLinearGradient(0, 0, w, 0);
  gx.addColorStop(0, 'rgb(0,0,0)');
  gx.addColorStop(1, 'rgb(255,0,0)');
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, w, h);

  const gy = ctx.createLinearGradient(0, 0, 0, h);
  gy.addColorStop(0, 'rgb(0,0,0)');
  gy.addColorStop(1, 'rgb(0,0,255)');
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = gy;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'source-over';
  const inset = border * Math.min(w, h);
  ctx.filter = 'blur(' + mapBlur + 'px)';
  ctx.fillStyle = 'rgba(128,128,128,0.93)';
  ctx.beginPath();
  ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, Math.max(radius - inset, 2));
  ctx.fill();
  ctx.filter = 'none';
  return canvas.toDataURL();
}

// Three displacement passes at staggered scales (R strongest), channels
// isolated with feColorMatrix and recombined with screen blends — the
// faint prism fringe at the rim.
function buildFilter(root, id, scales) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');
  // Load-bearing: filters default to linearRGB, which re-maps the map's
  // neutral gray 128 to ~0.216 and injects a constant phantom displacement.
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const feImage = document.createElementNS(SVG_NS, 'feImage');
  feImage.setAttribute('x', '0');
  feImage.setAttribute('y', '0');
  feImage.setAttribute('result', 'map');
  feImage.setAttribute('preserveAspectRatio', 'none');
  filter.appendChild(feImage);

  const keep = [
    '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
    '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
    '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
  ];
  const channels = [];
  const disps = [];
  for (let i = 0; i < 3; i++) {
    const disp = document.createElementNS(SVG_NS, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'map');
    disp.setAttribute('scale', scales[i]);
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'B');
    disp.setAttribute('result', 'd' + i);
    filter.appendChild(disp);
    disps.push(disp);

    const cm = document.createElementNS(SVG_NS, 'feColorMatrix');
    cm.setAttribute('in', 'd' + i);
    cm.setAttribute('type', 'matrix');
    cm.setAttribute('values', keep[i]);
    cm.setAttribute('result', 'c' + i);
    filter.appendChild(cm);
    channels.push('c' + i);
  }

  const blend1 = document.createElementNS(SVG_NS, 'feBlend');
  blend1.setAttribute('in', channels[0]);
  blend1.setAttribute('in2', channels[1]);
  blend1.setAttribute('mode', 'screen');
  blend1.setAttribute('result', 'c01');
  filter.appendChild(blend1);

  const blend2 = document.createElementNS(SVG_NS, 'feBlend');
  blend2.setAttribute('in', 'c01');
  blend2.setAttribute('in2', channels[2]);
  blend2.setAttribute('mode', 'screen');
  filter.appendChild(blend2);

  ensureDefs(root).appendChild(filter);
  return { filter, feImage, disps };
}

function resolveRadius(el, w, h, override) {
  if (override != null) return override;
  const raw = getComputedStyle(el).borderTopLeftRadius || '0px';
  const v = parseFloat(raw) || 0;
  return raw.trim().endsWith('%') ? (v / 100) * Math.min(w, h) : v;
}

/**
 * Apply liquid glass refraction to one element, scoped to whichever
 * document/shadow root it's actually composed into.
 *
 * Displacement strength/chroma are NOT per-call options — they come from the
 * shared Scale/Chroma knobs (see setGlobalGlassParams() above) so every
 * surface in a realm stays in lockstep with the Options page's single
 * "Liquid Glass" card, the same way the old shared SVG filter's Scale/
 * Frequency sliders used to apply to the whole extension at once.
 *
 * @param {Element} el
 * @param {Object} [opts]
 * @param {number} [opts.border=0.07]    Neutral inset as a fraction of the smaller side.
 * @param {number} [opts.mapBlur=12]     Edge-curvature softness (px) of the map's gray inset.
 * @param {number} [opts.blur=3]         Backdrop blur (px) behind the glass interior.
 * @param {number} [opts.saturate=1.5]   Backdrop saturation boost.
 * @param {number} [opts.radius]         Corner radius override (px); default reads border-radius.
 * @param {number} [opts.fallbackBlur=16] Frosted blur (px) where refraction is unsupported.
 * @returns {{supported: boolean, filterId: ?string, refresh: Function, destroy: Function}}
 */
export function attachLiquidGlassRefraction(el, opts) {
  const o = Object.assign(
    { border: 0.07, mapBlur: 12, blur: 3, saturate: 1.5, radius: null, fallbackBlur: 16 },
    opts
  );

  if (!supported) {
    const frosted = 'blur(' + o.fallbackBlur + 'px) saturate(' + o.saturate + ')';
    el.style.backdropFilter = frosted;
    el.style.webkitBackdropFilter = frosted;
    el.classList.add('lg-fallback');
    return {
      supported: false,
      filterId: null,
      refresh: function () {},
      destroy: function () {
        el.style.backdropFilter = '';
        el.style.webkitBackdropFilter = '';
        el.classList.remove('lg-fallback');
      },
    };
  }

  const root = el.getRootNode();
  const id = 'hw-lg-filter-' + ++uid;
  const scales = [globalScale, globalScale + globalChroma, globalScale + 2 * globalChroma];
  const parts = buildFilter(root, id, scales);

  function refresh() {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;
    const radius = resolveRadius(el, w, h, o.radius);
    parts.feImage.setAttribute('href', makeMap(w, h, radius, o.border, o.mapBlur));
    parts.feImage.setAttribute('width', w);
    parts.feImage.setAttribute('height', h);
  }

  function applyScaleChroma() {
    const s = [globalScale, globalScale + globalChroma, globalScale + 2 * globalChroma];
    parts.disps.forEach((disp, i) => disp.setAttribute('scale', s[i]));
  }
  scaleChromaListeners.add(applyScaleChroma);

  refresh();
  const backdrop = 'url(#' + id + ') blur(' + o.blur + 'px) saturate(' + o.saturate + ')';
  el.style.backdropFilter = backdrop;
  el.style.webkitBackdropFilter = backdrop;

  let timer = null;
  const ro = new ResizeObserver(function () {
    clearTimeout(timer);
    timer = setTimeout(refresh, 120);
  });
  ro.observe(el);

  return {
    supported: true,
    filterId: id,
    refresh: refresh,
    destroy: function () {
      ro.disconnect();
      clearTimeout(timer);
      scaleChromaListeners.delete(applyScaleChroma);
      parts.filter.remove();
      el.style.backdropFilter = '';
      el.style.webkitBackdropFilter = '';
    },
  };
}
