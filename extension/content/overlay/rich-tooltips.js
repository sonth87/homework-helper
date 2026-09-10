/**
 * Shadow DOM Rich Tooltips Engine
 */

import { attachLiquidGlassRefraction } from '../../shared/liquid-glass-refraction.js';

export class OverlayRichTooltips {
  constructor(shadow) {
    this.shadow = shadow;
    this.suppressed = false;
    this.init();
  }

  // Called while dragging the FAB cluster so the tooltip doesn't stay pinned
  // to a button that's sliding across the screen underneath the cursor.
  suppress(value) {
    this.suppressed = value;
    if (value) this.hideTooltip?.();
  }

  init() {
    let tooltipEl = this.shadow.getElementById('hwTooltipPopup');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'hwTooltipPopup';
      tooltipEl.className = 'hw-rich-tooltip';
      this.shadow.appendChild(tooltipEl);
      // Created once and reused for every tooltip shown after this (see the
      // (!tooltipEl) guard above) — no destroy() needed, it never leaves the DOM.
      attachLiquidGlassRefraction(tooltipEl, { blur: 6, saturate: 1.8 });
    }

    const showTooltip = (el) => {
      const title = el.getAttribute('data-tooltip-title') || el.getAttribute('title');
      const desc = el.getAttribute('data-tooltip-desc') || '';
      if (!title && !desc) return;

      tooltipEl.innerHTML = `
        ${title ? `<div class="hw-tooltip-title">${title}</div>` : ''}
        ${desc ? `<div class="hw-tooltip-desc">${desc}</div>` : ''}
      `;

      tooltipEl.style.display = 'block';
      tooltipEl.style.visibility = 'hidden';
      tooltipEl.classList.remove('show');

      const tooltipHeight = tooltipEl.offsetHeight || 44;
      const tooltipWidth = Math.min(260, Math.max(160, tooltipEl.offsetWidth || 180));

      const rect = el.getBoundingClientRect();
      let top;
      if (rect.top < 90) {
        top = rect.bottom + 8;
      } else {
        top = rect.top - tooltipHeight - 8;
      }

      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      if (left + tooltipWidth > window.innerWidth - 12) {
        left = window.innerWidth - tooltipWidth - 12;
      }
      if (left < 8) {
        left = 8;
      }

      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.visibility = 'visible';
      tooltipEl.classList.add('show');
    };

    const hideTooltip = () => {
      tooltipEl.classList.remove('show');
    };
    this.hideTooltip = hideTooltip;

    this.shadow.addEventListener('mouseover', (e) => {
      if (this.suppressed) return;
      const target = e.target.closest('[data-tooltip-title]');
      if (target) {
        showTooltip(target);
      }
    });

    this.shadow.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip-title]');
      const related = e.relatedTarget ? e.relatedTarget.closest('[data-tooltip-title]') : null;
      if (target && target !== related) {
        hideTooltip();
      }
    });
  }
}
