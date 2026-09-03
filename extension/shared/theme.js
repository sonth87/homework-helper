/**
 * Overlay dark-theme resolution — shared by every content-script surface
 * that isn't already covered by sidepanel.css's own `prefers-color-scheme`
 * handling (overlay.js's shadow DOM, cropper.js and selection-tooltip.js's
 * light-DOM injections, forms-adapter.js).
 *
 * `overlayTheme` in Storage is 'auto' | 'light' | 'dark' — the one setting
 * for the whole extension's theme (Appearance tab). 'auto' means "let the
 * @media (prefers-color-scheme) block in CSS decide" — callers apply that by
 * removing the data-theme/data-hw-theme attribute rather than setting one,
 * so this returns null for that case.
 *
 * popup/popup.js applies the identical override (an explicit light/dark sets
 * [data-theme] on <html>, winning over the OS setting; 'auto' sets nothing)
 * without calling this function — it already has `overlayTheme` in hand from
 * its own startup Storage.get(), so importing this would just cost a second,
 * redundant read of the same value.
 */
import { Storage } from './storage.js';

export async function getOverlayThemeAttr() {
  const { overlayTheme = 'auto' } = await Storage.get(['overlayTheme']);
  return overlayTheme === 'light' || overlayTheme === 'dark' ? overlayTheme : null;
}
