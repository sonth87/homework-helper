/**
 * Google Forms Smart Adapter (Content Script)
 * Deeply integrates with Google Forms DOM and serialized data-params.
 * Renders compact Liquid Glass buttons with icon-first & smooth slide-out text on hover.
 */

import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';

class GoogleFormsAdapter {
  constructor() {
    this.observer = null;
    this.uiLanguage = 'vi';

    if (window.location.href.includes('docs.google.com/forms')) {
      this.init();
    }
  }

  async init() {
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    this.uiLanguage = uiLanguage;

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.uiLanguage) {
          this.uiLanguage = changes.uiLanguage.newValue;
          this.updateAllButtonLabels();
        }
      });
    }

    this.scanAndInject();

    // Observe DOM mutations for multi-page or dynamic question rendering
    this.observer = new MutationObserver(() => {
      this.scanAndInject();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  getButtonText() {
    const labels = {
      vi: 'Giải bằng AI',
      en: 'AI Solve',
      th: 'เฉลยด้วย AI',
      'zh-CN': 'AI 解答',
      'zh-TW': 'AI 解答',
      ja: 'AIで解答',
      ko: 'AI 풀이',
      es: 'Resolver con IA',
      fr: 'Résoudre avec l\'IA',
      de: 'Mit KI lösen',
      pt: 'Resolver com IA',
      id: 'Selesaikan dg AI',
      ru: 'Решить с ИИ',
    };
    return labels[this.uiLanguage] || labels.en;
  }

  updateAllButtonLabels() {
    const label = this.getButtonText();
    document.querySelectorAll('.hw-form-btn-label').forEach((span) => {
      span.textContent = label;
    });
  }

  scanAndInject() {
    const questionCards = document.querySelectorAll('div[role="listitem"], .Qr7Oae, form div:nth-child(2) > div');

    questionCards.forEach((card) => {
      if (card.querySelector('.hw-form-ai-btn')) return;

      // Extract question data
      const qData = this.extractQuestionData(card);
      if (!qData || !qData.title) return;

      // Target the INNER white card container (.geS5n) so button stays INSIDE the question card
      const innerCard = card.querySelector('.geS5n, .I30Rdf, .m7w29c, .zfd2tb') || card.firstElementChild || card;

      // Inject compact Liquid Glass helper button inside question card
      const btnWrapper = document.createElement('div');
      btnWrapper.className = 'hw-form-ai-wrapper';
      btnWrapper.style.cssText = `
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 8px;
        margin-bottom: 0px;
        padding-top: 2px;
        width: 100%;
        box-sizing: border-box;
      `;

      const aiBtn = document.createElement('button');
      aiBtn.className = 'hw-form-ai-btn';
      aiBtn.type = 'button';
      aiBtn.title = this.getButtonText();
      aiBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 7px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        color: #0284c7;
        border: 1px solid rgba(2, 132, 199, 0.32);
        border-radius: 14px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.12), inset 0 1px 0.5px rgba(255, 255, 255, 0.95);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
        outline: none;
        overflow: hidden;
      `;
      aiBtn.innerHTML = `
        ${Icons.sparkles(13)}
        <span class="hw-form-btn-label" style="max-width: 0; opacity: 0; overflow: hidden; white-space: nowrap; margin-left: 0; transition: max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, margin-left 0.25s ease;">${this.getButtonText()}</span>
      `;

      const labelSpan = aiBtn.querySelector('.hw-form-btn-label');

      aiBtn.addEventListener('mouseenter', () => {
        aiBtn.style.background = 'rgba(2, 132, 199, 0.12)';
        aiBtn.style.borderColor = '#0284c7';
        aiBtn.style.color = '#0369a1';
        aiBtn.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.22), inset 0 1px 0.5px rgba(255, 255, 255, 0.95)';
        aiBtn.style.transform = 'translateY(-1px)';
        aiBtn.style.padding = '4px 10px';
        if (labelSpan) {
          labelSpan.style.maxWidth = '140px';
          labelSpan.style.opacity = '1';
          labelSpan.style.marginLeft = '4.5px';
        }
      });

      aiBtn.addEventListener('mouseleave', () => {
        if (aiBtn.disabled) return;
        aiBtn.style.background = 'rgba(255, 255, 255, 0.85)';
        aiBtn.style.borderColor = 'rgba(2, 132, 199, 0.32)';
        aiBtn.style.color = '#0284c7';
        aiBtn.style.boxShadow = '0 2px 6px rgba(2, 132, 199, 0.12), inset 0 1px 0.5px rgba(255, 255, 255, 0.95)';
        aiBtn.style.transform = 'translateY(0)';
        aiBtn.style.padding = '4px 7px';
        if (labelSpan) {
          labelSpan.style.maxWidth = '0';
          labelSpan.style.opacity = '0';
          labelSpan.style.marginLeft = '0';
        }
      });

      aiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.solveQuestion(qData, innerCard, aiBtn);
      });

      btnWrapper.appendChild(aiBtn);
      innerCard.appendChild(btnWrapper);
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

  async solveQuestion(qData, targetCard, btn) {
    const isVi = this.uiLanguage === 'vi';
    const solvingText = isVi ? 'Đang giải...' : 'Solving...';
    btn.innerHTML = `${Icons.refresh(12)} <span class="hw-form-btn-label" style="max-width: 140px; opacity: 1; margin-left: 4.5px;">${solvingText}</span>`;
    btn.disabled = true;
    btn.style.padding = '4px 10px';

    let prompt = `Solve this Google Forms question and identify the single best option:\n\n**Question:** ${qData.title}\n\n`;
    if (qData.options && qData.options.length > 0) {
      prompt += `**Options:**\n` + qData.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
    }

    const rect = targetCard.getBoundingClientRect();

    // Trigger in-page floating solution card right next to question
    window.dispatchEvent(new CustomEvent('HOMEWORK_AI_OPEN_POPUP', {
      detail: {
        type: 'answer',
        text: prompt,
        rect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        }
      }
    }));

    setTimeout(() => {
      const sentText = isVi ? 'Đã gửi' : 'Sent';
      btn.innerHTML = `${Icons.check(12)} <span class="hw-form-btn-label" style="max-width: 140px; opacity: 1; margin-left: 4.5px;">${sentText}</span>`;
      btn.disabled = false;
      setTimeout(() => {
        btn.innerHTML = `
          ${Icons.sparkles(13)}
          <span class="hw-form-btn-label" style="max-width: 0; opacity: 0; overflow: hidden; white-space: nowrap; margin-left: 0; transition: max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, margin-left 0.25s ease;">${this.getButtonText()}</span>
        `;
        btn.style.padding = '4px 7px';
      }, 2000);
    }, 600);
  }
}

export const googleFormsAdapter = new GoogleFormsAdapter();
