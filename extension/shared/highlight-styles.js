/**
 * Hover-translate highlight "styles" — the visual shape drawn over the
 * text being translated. One source of truth shared by:
 *   - content/hover-translate.js (real overlay boxes on the page, one per
 *     visual line — see mergeRectsByLine())
 *   - options/tabs/appearance-tab.js (the live preview + style-picker swatches)
 * so the Options preview is never an approximation of the real thing — it's
 * the exact same generated markup.
 *
 * Two families:
 *   - "easy" styles reuse the box's own rectangle geometry (CSS only).
 *   - "hard" styles are hand-drawn/organic: an inline SVG with a jittered
 *     path, regenerated fresh (seeded RNG) every time a highlight is shown
 *     so it never looks mechanically identical twice, like a real pen.
 *
 * Every generator receives the *unpadded* line-box size (width, height) and
 * returns { wrapperClass, pad, innerHTML }. `pad` tells the caller how much
 * to grow/shift the positioned wrapper box in each direction so organic
 * strokes can bleed slightly outside the plain text rectangle (a real
 * highlighter/pencil never stops exactly on the glyph edge). Color/opacity
 * are never baked into the generated markup — every fill/stroke references
 * the CSS custom properties (--hl-rgb/--hl-alpha/--hl-alpha-strong) set on
 * the wrapper by the caller, so recoloring or re-opacifying an existing
 * highlight (e.g. dragging the opacity slider in the live preview) never
 * needs the shape regenerated.
 */

export const HIGHLIGHT_STYLES = [
  { id: 'fill', group: 'easy' },
  { id: 'underline', group: 'easy' },
  { id: 'wavy-underline', group: 'easy' },
  { id: 'double-underline', group: 'easy' },
  { id: 'marker', group: 'hard' },
  { id: 'circle', group: 'hard' },
  { id: 'rectangle', group: 'hard' },
  { id: 'natural-underline', group: 'hard' },
  { id: 'pencil', group: 'hard' },
];

export const DEFAULT_HIGHLIGHT_STYLE = 'fill';

export function isValidHighlightStyle(id) {
  return HIGHLIGHT_STYLES.some((s) => s.id === id);
}

const ZERO_PAD = { left: 0, right: 0, top: 0, bottom: 0 };

// Deterministic per-call seed -> [0,1) generator (mulberry32). Deliberately
// not Math.random() at the call site: keeping the RNG threaded through one
// small function makes every generator below reproducible from its seed,
// which matters for the options-page preview (same seed while a slider is
// dragged should not make the hand-drawn wobble visibly "jump" every frame).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rand(rng, min, max) {
  return min + rng() * (max - min);
}

// Builds a smooth path through `points` (quadratic curve per segment, using
// each point as the control and the segment midpoint as the curve target —
// a cheap approximation of a Catmull-Rom spline that's enough to turn a
// jittered polyline into a flowing, hand-drawn-looking stroke instead of an
// angular zig-zag). `close` wraps the last point back into the first two so
// closed shapes (marker/circle/rectangle) loop seamlessly.
function smoothPath(points, close = false) {
  if (points.length < 2) return '';
  const n = points.length;
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  const upto = close ? n : n - 1;
  for (let i = 1; i < upto; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const mx = (px + cx) / 2;
    const my = (py + cy) / 2;
    d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  if (close) {
    const [lastX, lastY] = points[n - 1];
    const [firstX, firstY] = points[0];
    d += ` Q${lastX.toFixed(1)},${lastY.toFixed(1)} ${firstX.toFixed(1)},${firstY.toFixed(1)} Z`;
  } else {
    const [lastX, lastY] = points[n - 1];
    d += ` L${lastX.toFixed(1)},${lastY.toFixed(1)}`;
  }
  return d;
}

// left/top position the <svg> element itself within the wrapper box's own
// local coordinate space (wrapper-local (0,0) = the padded box's top-left
// corner). Full-box styles (marker/circle/...) leave these at the default
// 0,0 since their SVG spans the entire wrapper; underline-strip styles pass
// top = h so the strip starts right at the text box's own bottom edge
// rather than stretching (and distorting) across the whole padded height.
function svgWrap(w, h, inner, left = 0, top = 0) {
  return `<svg class="hw-hl-svg" style="left:${left.toFixed(1)}px;top:${top.toFixed(1)}px;" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}">${inner}</svg>`;
}

// ============================================================
// Easy group — plain rectangle geometry, no randomness needed
// ============================================================

function genFill() {
  return { wrapperClass: 'hw-style-fill', pad: ZERO_PAD, innerHTML: '' };
}

function genUnderline(w, h) {
  const pad = { left: 0, right: 0, top: 0, bottom: 6 };
  const thickness = Math.max(2, Math.min(4, h * 0.14));
  const y = h + 1;
  const html = `<div class="hw-hl-bar" style="left:0;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${thickness.toFixed(1)}px;"></div>`;
  return { wrapperClass: 'hw-style-underline', pad, innerHTML: html };
}

function genDoubleUnderline(w, h) {
  const pad = { left: 0, right: 0, top: 0, bottom: 9 };
  const thickness = 2;
  const y1 = h + 1;
  const y2 = h + 6;
  const bar = (y) => `<div class="hw-hl-bar" style="left:0;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${thickness}px;"></div>`;
  return { wrapperClass: 'hw-style-double-underline', pad, innerHTML: bar(y1) + bar(y2) };
}

// Regular, mathematically-even sine wave — deliberately NOT randomized, to
// stay visually distinct from the hand-drawn "natural-underline" below.
function genWavyUnderline(w, h) {
  const pad = { left: 2, right: 2, top: 0, bottom: 10 };
  const mid = pad.top + 4;
  const amp = 2.2;
  const wavelength = 9;
  const half = wavelength / 2;
  let d = `M${pad.left.toFixed(1)},${mid.toFixed(1)}`;
  let x = 0;
  let dir = 1;
  while (x < w) {
    const nx = Math.min(x + half, w);
    const cx = x + (nx - x) / 2;
    d += ` Q${(pad.left + cx).toFixed(1)},${(mid + amp * dir).toFixed(1)} ${(pad.left + nx).toFixed(1)},${mid.toFixed(1)}`;
    dir *= -1;
    x = nx;
  }
  const svgW = w + pad.left + pad.right;
  const stripH = 10;
  const inner = `<path d="${d}" fill="none" class="hw-hl-stroke" stroke-width="2" stroke-linecap="round"/>`;
  return { wrapperClass: 'hw-style-wavy-underline', pad, innerHTML: svgWrap(svgW, stripH, inner, 0, h) };
}

// ============================================================
// Hard group — organic/hand-drawn SVG, seeded per box
// ============================================================

// A sine wave (guaranteed amplitude — smoothPath() draws to the *midpoint*
// between consecutive points, so independent per-point noise alone tends to
// average itself back toward the baseline right where the curve passes)
// plus a smaller jitter on top for irregularity, faded out at both ends
// (envelope) so the edge blends cleanly into the rounded cap points instead
// of the wave still swinging right up to them.
function organicEdge(rng, N, w, padLeft, baseY, ampY) {
  // Fewer wave cycles on a narrow box (a short word, or a small preview
  // swatch) — a fixed cycle count that looks like a gentle highlighter
  // stroke across a full sentence reads as a busy, pinched scribble when
  // squeezed into a much shorter span.
  const widthFactor = Math.max(0.55, Math.min(1, w / 60));
  const freq = rand(rng, 1.2, 2.1) * widthFactor;
  const phase = rand(rng, 0, Math.PI * 2);
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = padLeft + t * w;
    const envelope = Math.sin(Math.PI * t);
    const wave = Math.sin(t * Math.PI * 2 * freq + phase) * ampY * 0.75;
    const jitter = rand(rng, -ampY * 0.35, ampY * 0.35);
    pts.push([x, baseY + (wave + jitter) * (0.3 + 0.7 * envelope)]);
  }
  return pts;
}

function genMarker(w, h, rng) {
  // Amplitude scales with line height (a highlighter's wobble is a fraction
  // of the stroke's own width, not a fixed pixel count) so this still reads
  // as "hand-drawn" at both a small hover tooltip's font size and a large
  // heading, instead of vanishing into a near-straight edge on tall lines.
  const ampY = Math.max(2.4, Math.min(7, h * 0.24));
  const capBulge = Math.max(3, Math.min(6, h * 0.22));
  const pad = {
    left: Math.ceil(capBulge + 2),
    right: Math.ceil(capBulge + 2),
    top: Math.ceil(ampY + 3),
    bottom: Math.ceil(ampY + 3),
  };
  const N = 10;
  const midY = pad.top + h / 2;
  const top = organicEdge(rng, N, w, pad.left, pad.top, ampY);
  const bottomRaw = organicEdge(rng, N, w, pad.left, pad.top + h, ampY);
  // Top and bottom are randomized independently, so on a short/narrow box
  // they can occasionally swing toward each other at the same x and pinch
  // the stroke to a point (or cross entirely) instead of reading as a band.
  // Enforce a minimum visible thickness by pushing both edges apart
  // wherever they'd get closer than that.
  const minGap = Math.max(4, h * 0.35);
  for (let i = 0; i < top.length; i++) {
    const gap = bottomRaw[i][1] - top[i][1];
    if (gap < minGap) {
      const push = (minGap - gap) / 2;
      top[i][1] -= push;
      bottomRaw[i][1] += push;
    }
  }
  const bottom = bottomRaw.reverse();
  // A single extra point beyond each end, roughly at mid-height, rounds off
  // the stroke into a highlighter-style cap instead of a hard right-angle
  // corner where the top and bottom edges would otherwise meet.
  const rightCap = [pad.left + w + capBulge, midY + rand(rng, -ampY * 0.3, ampY * 0.3)];
  const leftCap = [pad.left - capBulge, midY + rand(rng, -ampY * 0.3, ampY * 0.3)];
  const d = smoothPath([...top, rightCap, ...bottom, leftCap], true);
  const svgW = w + pad.left + pad.right;
  const svgH = h + pad.top + pad.bottom;
  // Second, fainter pass along the same outline mimics a real marker's
  // double-stroke edge (the darker overlap line you get where a highlighter
  // tip re-crosses its own stroke).
  const inner = `<path d="${d}" class="hw-hl-marker-fill"/><path d="${d}" class="hw-hl-marker-edge" fill="none"/>`;
  return { wrapperClass: 'hw-style-marker', pad, innerHTML: svgWrap(svgW, svgH, inner) };
}

function genCircle(w, h, rng) {
  // marginX/marginY are how far the *unjittered* oval sits beyond the text
  // box; jitterPx is then a small, constant wobble on top of that — both
  // fixed pixel amounts (not proportional to w/h), so padding needs stay
  // predictable regardless of how long the highlighted line is.
  const marginX = 14;
  const marginY = 9;
  const jitterPx = 3;
  const pad = {
    left: marginX + jitterPx + 2,
    right: marginX + jitterPx + 2,
    top: marginY + jitterPx + 2,
    bottom: marginY + jitterPx + 2,
  };
  const cx = pad.left + w / 2;
  const cy = pad.top + h / 2;
  const rx = w / 2 + marginX;
  const ry = h / 2 + marginY;
  const N = 16;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const theta = (i / N) * Math.PI * 2;
    pts.push([
      cx + Math.cos(theta) * rx + rand(rng, -jitterPx, jitterPx),
      cy + Math.sin(theta) * ry + rand(rng, -jitterPx, jitterPx),
    ]);
  }
  const d = smoothPath(pts, true);
  const svgW = w + pad.left + pad.right;
  const svgH = h + pad.top + pad.bottom;
  const inner = `<path d="${d}" fill="none" class="hw-hl-outline"/>`;
  return { wrapperClass: 'hw-style-circle', pad, innerHTML: svgWrap(svgW, svgH, inner) };
}

function genRectangle(w, h, rng) {
  const marginX = 10;
  const marginY = 7;
  const jitterPx = 2.4;
  const pad = {
    left: marginX + jitterPx + 1,
    right: marginX + jitterPx + 1,
    top: marginY + jitterPx + 1,
    bottom: marginY + jitterPx + 1,
  };
  const x0 = pad.left - marginX;
  const y0 = pad.top - marginY;
  const x1 = pad.left + w + marginX;
  const y1 = pad.top + h + marginY;
  const j = () => rand(rng, -jitterPx, jitterPx);
  // Two points per side (corner + midpoint), each jittered — a plain
  // 4-corner rect would smooth into a perfect rounded rect; the midpoints
  // let each side bow slightly, which reads as "drawn", not "generated".
  const pts = [
    [x0 + j(), y0 + j()],
    [x0 + (x1 - x0) * 0.5 + j(), y0 + j()],
    [x1 + j(), y0 + j()],
    [x1 + j(), y0 + (y1 - y0) * 0.5 + j()],
    [x1 + j(), y1 + j()],
    [x1 - (x1 - x0) * 0.5 + j(), y1 + j()],
    [x0 + j(), y1 + j()],
    [x0 + j(), y0 + (y1 - y0) * 0.5 + j()],
  ];
  const d = smoothPath(pts, true);
  const svgW = w + pad.left + pad.right;
  const svgH = h + pad.top + pad.bottom;
  const inner = `<path d="${d}" fill="none" class="hw-hl-outline"/>`;
  return { wrapperClass: 'hw-style-rectangle', pad, innerHTML: svgWrap(svgW, svgH, inner) };
}

// Irregular hand-drawn wobble — random per-point jitter (no periodic
// pattern), unlike genWavyUnderline()'s even sine. This is what makes the
// two "underline" styles look genuinely different rather than the same
// wave at two amplitudes.
function genNaturalUnderline(w, h, rng) {
  const pad = { left: 2, right: 2, top: 0, bottom: 10 };
  const stripH = 10;
  const baseY = 4;
  const N = Math.max(4, Math.round(w / 14));
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = pad.left + (i / N) * w;
    pts.push([x, baseY + rand(rng, -2.2, 2.2)]);
  }
  const d = smoothPath(pts, false);
  const svgW = w + pad.left + pad.right;
  const inner = `<path d="${d}" fill="none" class="hw-hl-stroke" stroke-width="2.2" stroke-linecap="round"/>`;
  return { wrapperClass: 'hw-style-natural-underline', pad, innerHTML: svgWrap(svgW, stripH, inner, 0, h) };
}

let pencilUid = 0;

// Colored-pencil shading: a faint flat wash (so the color still reads at a
// glance) plus a diagonal cross-hatch pattern layered on top — the "grain"
// that's the whole point of this style vs. the smooth marker wash.
function genPencil(w, h, rng) {
  const pad = { left: 4, right: 4, top: 3, bottom: 3 };
  const N = 6;
  const top = [];
  const bottom = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = pad.left + t * w;
    top.push([x, pad.top + rand(rng, -1.2, 1.2)]);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    const x = pad.left + t * w;
    bottom.push([x, pad.top + h + rand(rng, -1.2, 1.2)]);
  }
  const d = smoothPath([...top, ...bottom], true);
  const angle = rand(rng, 38, 52) * (rng() < 0.5 ? 1 : -1);
  const spacing = rand(rng, 2.6, 3.2);
  const uid = `hwhlp${++pencilUid}`;
  const uid2 = `hwhlp2${pencilUid}`;
  const svgW = w + pad.left + pad.right;
  const svgH = h + pad.top + pad.bottom;
  // Two hatch directions (the second wider-spaced, fainter, angled ~90deg
  // off the first) rather than one — a single direction alone still read
  // too close to a flat wash; crossing strokes are what actually sells
  // "colored pencil" texture instead of a subtly-dithered fill.
  const inner = `<defs>` +
    `<pattern id="${uid}" patternUnits="userSpaceOnUse" width="${spacing.toFixed(2)}" height="${spacing.toFixed(2)}" patternTransform="rotate(${angle.toFixed(1)})"><line x1="0" y1="0" x2="0" y2="${spacing.toFixed(2)}" class="hw-hl-hatch-line"/></pattern>` +
    `<pattern id="${uid2}" patternUnits="userSpaceOnUse" width="${(spacing * 1.8).toFixed(2)}" height="${(spacing * 1.8).toFixed(2)}" patternTransform="rotate(${(angle + 94).toFixed(1)})"><line x1="0" y1="0" x2="0" y2="${(spacing * 1.8).toFixed(2)}" class="hw-hl-hatch-line-2"/></pattern>` +
    `</defs>` +
    `<path d="${d}" class="hw-hl-pencil-wash"/>` +
    `<path d="${d}" fill="url(#${uid})"/>` +
    `<path d="${d}" fill="url(#${uid2})"/>`;
  return { wrapperClass: 'hw-style-pencil', pad, innerHTML: svgWrap(svgW, svgH, inner) };
}

const GENERATORS = {
  fill: genFill,
  underline: genUnderline,
  'wavy-underline': genWavyUnderline,
  'double-underline': genDoubleUnderline,
  marker: genMarker,
  circle: genCircle,
  rectangle: genRectangle,
  'natural-underline': genNaturalUnderline,
  pencil: genPencil,
};

// width/height: the plain text-line box's own size (CSS px), no padding.
// seed: any integer — pass a fresh one per box per render for the hard
// styles to look freshly hand-drawn every time text is hovered again.
export function buildHighlight(styleId, width, height, seed = Date.now()) {
  const gen = GENERATORS[styleId] || GENERATORS.fill;
  return gen(width, height, mulberry32(seed | 0));
}
