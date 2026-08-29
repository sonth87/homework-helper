/**
 * Shared Shadow DOM Host for In-Page UI (Content Script)
 *
 * All page-injected UI — the main overlay's FAB/drawer/solution card
 * (overlay.js), the screen cropper (cropper.js), the selection toolbar
 * (selection-tooltip.js), and the hover-translate tooltip (hover-translate.js)
 * — renders inside this one ShadowRoot instead of the page's own light DOM.
 * The host page's CSS cannot cross into a shadow tree, and overlay.css's
 * `:host { all: initial; ... }` reset cuts inheritance off the other way, so
 * neither side's fonts, colors, or resets bleed into the other.
 */

let shadowRoot = null;

export function getSharedShadowRoot() {
  if (shadowRoot) return shadowRoot;

  const host = document.createElement('div');
  host.id = 'homework-ai-root';
  host.style.position = 'absolute';
  host.style.top = '0';
  host.style.left = '0';
  // Every direct UI piece inside (FAB, drawer, toolbar, tooltip...) is itself
  // position:fixed/absolute, so none of them contribute to this div's own
  // auto height/width — it would otherwise collapse to 0x0. That's harmless
  // for height (nothing needs it), but width:auto makes this the *containing
  // block* for any absolute descendant with width:auto (e.g. the hover
  // translate tooltip's max-width text box): shrink-to-fit then clamps
  // against a 0px containing block instead of that max-width, collapsing the
  // text to one word per line. Pinning width restores the same available
  // width the elements had back when they lived in document.body.
  //
  // Deliberately 100% and not 100vw: 100vw is the viewport width *including*
  // the vertical scrollbar gutter, so on any page tall enough to scroll, a
  // left:0-positioned 100vw box juts out past the real (scrollbar-excluded)
  // content edge and forces a page-wide horizontal scrollbar. This div's
  // containing block is the initial containing block (nothing else here is
  // positioned), which resolves percentages against the scrollbar-excluded
  // content width — same as document.body's own width — so 100% doesn't.
  //
  // Height stays auto (0px) on purpose so this div never covers, and never
  // intercepts clicks on, the rest of the page.
  host.style.width = '100%';
  host.style.zIndex = '2147483640';
  document.documentElement.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });
  return shadowRoot;
}

/**
 * Appends a <link rel="stylesheet"> for `href` into the shared shadow root,
 * unless one is already there — several modules load the same sheet
 * (selection-tooltip.js and hover-translate.js both need tooltip.css).
 * Returns the <link> element so callers can hook `.sheet`/`load`/`error`.
 */
export function ensureStylesheet(href) {
  const root = getSharedShadowRoot();
  const url = chrome.runtime.getURL(href);
  const existing = root.querySelector(`link[href="${url}"]`);
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  root.appendChild(link);
  return link;
}
