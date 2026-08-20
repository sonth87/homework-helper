/**
 * Rich Tooltips Engine for Options Page
 */

export class OptionsTooltips {
  static init() {
    let tooltipEl = document.getElementById('optGlobalTooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'optGlobalTooltip';
      tooltipEl.className = 'opt-tooltip-popup';
      document.body.appendChild(tooltipEl);
    }

    let hideTimeout = null;

    const showTooltip = (target) => {
      const title = target.getAttribute('data-tooltip-title');
      const desc = target.getAttribute('data-tooltip-desc');
      if (!title) return;

      clearTimeout(hideTimeout);
      tooltipEl.innerHTML = `
        <div class="opt-tooltip-title">${title}</div>
        ${desc ? `<div class="opt-tooltip-desc">${desc}</div>` : ''}
      `;

      const rect = target.getBoundingClientRect();
      tooltipEl.style.display = 'block';

      // Position tooltip directly below target
      let top = rect.bottom + 6;
      let left = rect.left + (rect.width / 2) - 130;

      // Bound within window
      if (left < 8) left = 8;
      if (left + 270 > window.innerWidth) left = window.innerWidth - 275;

      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.left = `${left}px`;
      tooltipEl.classList.add('visible');
    };

    const hideTooltip = () => {
      tooltipEl.classList.remove('visible');
      hideTimeout = setTimeout(() => {
        tooltipEl.style.display = 'none';
      }, 150);
    };

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip-title]');
      if (target) {
        showTooltip(target);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip-title]');
      if (target) {
        hideTooltip();
      }
    });
  }
}
