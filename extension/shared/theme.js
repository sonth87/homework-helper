/**
 * Overlay dark-theme resolution — shared by every content-script surface
 * that isn't already covered by sidepanel.css/options.css's own
 * `prefers-color-scheme` handling (overlay.js's shadow DOM, cropper.js and
 * selection-tooltip.js's light-DOM injections, forms-adapter.js).
 *
 * `overlayTheme` in Storage is 'auto' | 'light' | 'dark'. 'auto' means "let
 * the @media (prefers-color-scheme) block in CSS decide" — callers apply
 * that by removing the data-theme/data-hw-theme attribute rather than
 * setting one, so this returns null for that case.
 */
import { Storage } from './storage.js';

export async function getOverlayThemeAttr() {
  const { overlayTheme = 'auto' } = await Storage.get(['overlayTheme']);
  return overlayTheme === 'light' || overlayTheme === 'dark' ? overlayTheme : null;
}
