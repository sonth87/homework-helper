/**
 * Google Forms Smart Adapter (Content Script)
 * Deeply integrates with Google Forms DOM and serialized data-params.
 */

import { Icons } from '../shared/icons.js';

class GoogleFormsAdapter {
  constructor() {
    this.observer = null;
    if (window.location.href.includes('docs.google.com/forms')) {
      this.init();
    }
  }

  init() {
    console.log('[HomeworkAI] Google Forms Adapter initialized');
    this.scanAndInject();

    // Observe DOM mutations for dynamic question loading
    this.observer = new MutationObserver(() => {
      this.scanAndInject();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  scanAndInject() {
    const questionCards = document.querySelectorAll('div[role="listitem"], .Qr7Oae, form div:nth-child(2) > div');

    questionCards.forEach((card) => {
      if (card.querySelector('.hw-form-ai-btn')) return;

      // Extract question data
      const qData = this.extractQuestionData(card);
      if (!qData || !qData.title) return;

      // Inject floating helper button inside question card
      const btnWrapper = document.createElement('div');
      btnWrapper.className = 'hw-form-ai-wrapper';
      btnWrapper.style.cssText = `
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
        margin-bottom: 4px;
      `;

      const aiBtn = document.createElement('button');
      aiBtn.className = 'hw-form-ai-btn';
      aiBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        background: #3b82f6;
        color: #ffffff;
        border: none;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 2px 5px rgba(59, 130, 246, 0.3);
        transition: transform 0.1s ease, background 0.15s ease;
      `;
      aiBtn.innerHTML = `${Icons.sparkles(14)} AI Solve Question`;

      aiBtn.addEventListener('mouseenter', () => {
        aiBtn.style.background = '#2563eb';
        aiBtn.style.transform = 'translateY(-1px)';
      });
      aiBtn.addEventListener('mouseleave', () => {
        aiBtn.style.background = '#3b82f6';
        aiBtn.style.transform = 'translateY(0)';
      });

      aiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.solveQuestion(qData, card, aiBtn);
      });

      btnWrapper.appendChild(aiBtn);
      card.appendChild(btnWrapper);
    });
  }

  extractQuestionData(card) {
    try {
      // 1. Check for data-params serialized JSON
      const datasetElement = card.querySelector('[data-params]');
      if (datasetElement) {
        const rawParams = datasetElement.dataset.params;
        if (rawParams && rawParams.startsWith('%.@.')) {
          const parsed = JSON.parse('[' + rawParams.slice(4));
          const questionInfo = parsed[0];
          const id = questionInfo[0];
          const title = (questionInfo[1] || '') + ' ' + (questionInfo[2] || '');
          const type = questionInfo[3];
          const rawOptions = questionInfo[4]?.[0]?.[1] || [];
          const options = rawOptions.map((opt) => opt[0]).filter(Boolean);

          return { id, title: title.trim(), type, options };
        }
      }

      // 2. DOM fallback extraction
      const titleEl = card.querySelector('.M7eMe, [role="heading"], div[dir="auto"]');
      const title = titleEl ? titleEl.textContent.trim() : '';

      const optionEls = card.querySelectorAll('label, .docssharedWizToggleLabeledContainer, .aDTYNe');
      const options = [];
      optionEls.forEach((opt) => {
        const text = opt.textContent.trim();
        if (text && !options.includes(text)) {
          options.push(text);
        }
      });

      return { title, options };
    } catch (err) {
      console.warn('Error extracting question:', err);
      return null;
    }
  }

  async solveQuestion(qData, card, btn) {
    btn.innerHTML = `${Icons.refresh(14)} Solving...`;
    btn.disabled = true;

    let prompt = `Solve this Google Forms question and identify the single best option:\n\n**Question:** ${qData.title}\n\n`;
    if (qData.options && qData.options.length > 0) {
      prompt += `**Options:**\n` + qData.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
    }

    // Open side panel or overlay with solving prompt
    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_ASK', {
      detail: { prompt, studyMode: 'step-by-step' }
    }));

    setTimeout(() => {
      btn.innerHTML = `${Icons.check(14)} Sent to AI`;
      btn.disabled = false;
      setTimeout(() => {
        btn.innerHTML = `${Icons.sparkles(14)} AI Solve Question`;
      }, 3000);
    }, 800);
  }
}

export const googleFormsAdapter = new GoogleFormsAdapter();
