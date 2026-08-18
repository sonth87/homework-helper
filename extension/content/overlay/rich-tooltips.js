/**
 * Shadow DOM Rich Tooltips Engine
 */

export class OverlayRichTooltips {
  constructor(shadow) {
    this.shadow = shadow;
    this.init();
  }

  init() {
    let tooltipEl = this.shadow.getElementById('hwTooltipPopup');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'hwTooltipPopup';
      tooltipEl.className = 'hw-rich-tooltip';
      this.shadow.appendChild(tooltipEl);
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

    this.shadow.addEventListener('mouseover', (e) => {
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
