/**
 * Rich Tooltips Engine for the Toolbar Popup
 */

export class PopupTooltips {
  static init() {
    let tooltipEl = document.getElementById('popGlobalTooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'popGlobalTooltip';
      tooltipEl.className = 'pop-tooltip-popup';
      document.body.appendChild(tooltipEl);
    }

    let hideTimeout = null;

    const showTooltip = (target) => {
      const title = target.getAttribute('data-tooltip-title');
      const desc = target.getAttribute('data-tooltip-desc');
      const shortcut = target.getAttribute('data-tooltip-shortcut');
      if (!title) return;

      clearTimeout(hideTimeout);
      tooltipEl.innerHTML = `
        <div class="pop-tooltip-title">${title}</div>
        ${desc ? `<div class="pop-tooltip-desc">${desc}</div>` : ''}
        ${shortcut ? `<div class="pop-tooltip-shortcut">${shortcut}</div>` : ''}
      `;

      const rect = target.getBoundingClientRect();
      tooltipEl.style.display = 'block';
      // Measure at full size first — offsetHeight while display:none would
      // read 0, and the below/above flip decision needs the real box height.
      const tipHeight = tooltipEl.offsetHeight;
      const tipWidth = tooltipEl.offsetWidth;

      // The popup is a short, fixed-height Chrome extension window (not a
      // scrollable page), so a tooltip that would spill past the bottom edge
      // has nowhere to be scrolled into view — flip it above the target
      // instead. Every other tooltip engine in this repo (options/sidepanel)
      // only ever renders below, which is fine there since both live in a
      // tall, normally-scrolled page.
      const overflowsBottom = rect.bottom + 6 + tipHeight > window.innerHeight - 8;
      let top = overflowsBottom ? rect.top - tipHeight - 6 : rect.bottom + 6;
      if (top < 8) top = 8;

      let left = rect.left + (rect.width / 2) - (tipWidth / 2);
      if (left < 8) left = 8;
      if (left + tipWidth > window.innerWidth - 8) left = window.innerWidth - tipWidth - 8;

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
