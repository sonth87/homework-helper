import { Icons } from '../../shared/icons.js';

export class GuideTab {
  constructor(optionsController) {
    this.controller = optionsController;
  }

  async init() {
    this.renderIcons();
  }

  renderIcons() {
    const whyEl = document.getElementById('guideIconWhy');
    if (whyEl) whyEl.innerHTML = Icons.sparkles(16);
    const howEl = document.getElementById('guideIconHow');
    if (howEl) howEl.innerHTML = Icons.refresh(16);

    const linkGemini = document.getElementById('linkIconGemini');
    if (linkGemini) linkGemini.innerHTML = Icons.externalLink(12);
    const linkGroq = document.getElementById('linkIconGroq');
    if (linkGroq) linkGroq.innerHTML = Icons.externalLink(12);
    const linkOpenAI = document.getElementById('linkIconOpenAI');
    if (linkOpenAI) linkOpenAI.innerHTML = Icons.externalLink(12);
    const linkDeepSeek = document.getElementById('linkIconDeepSeek');
    if (linkDeepSeek) linkDeepSeek.innerHTML = Icons.externalLink(12);
    const linkClaude = document.getElementById('linkIconClaude');
    if (linkClaude) linkClaude.innerHTML = Icons.externalLink(12);
  }
}
