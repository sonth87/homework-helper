/**
 * Content Script Unified Entrypoint (ES Module)
 * Initializes Overlay, Cropper, Selection Tooltip, and Google Forms Adapter.
 */

import { inPageOverlay } from './overlay.js';
import { screenCropper } from './cropper.js';
import { selectionTooltip } from './selection-tooltip.js';
import { hoverTranslate } from './hover-translate.js';
import { googleFormsAdapter } from './forms-adapter.js';

console.log('[HomeworkAI] Content scripts loaded and active.');

// Listen for custom start crop event
window.addEventListener('HOMEWORK_AI_START_CROP', () => {
  screenCropper.start();
});
