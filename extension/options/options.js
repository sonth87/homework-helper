/**
 * Options Page Coordinator (ES Module)
 * Orchestrates modular tab controllers and real-time i18n synchronization.
 */

import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';
import { getOptionsI18n } from '../shared/i18n.js';
import { KeysTab } from './tabs/keys-tab.js';
import { OcrTab } from './tabs/ocr-tab.js';
import { AppearanceTab } from './tabs/appearance-tab.js';
import { GuideTab } from './tabs/guide-tab.js';
import { PromptTab } from './tabs/prompt-tab.js';
import { GeneralTab } from './tabs/general-tab.js';

export class OptionsController {
  constructor() {
    this.keysTab = new KeysTab(this);
    this.ocrTab = new OcrTab(this);
    this.appearanceTab = new AppearanceTab(this);
    this.guideTab = new GuideTab(this);
    this.promptTab = new PromptTab(this);
    this.generalTab = new GeneralTab(this);

    this.init();
  }

  async init() {
    this.renderIcons();
    this.setupNavigation();
    await this.applyLanguageI18n();

    await this.keysTab.init();
    await this.ocrTab.init();
    await this.appearanceTab.init();
    await this.guideTab.init();
    await this.promptTab.init();
    await this.generalTab.init();

    // Listen to real-time storage changes
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.uiLanguage) {
          this.applyLanguageI18n(changes.uiLanguage.newValue);
        }
      });
    }

    // Check URL hash for direct navigation
    if (window.location.hash === '#builtin-nano') {
      const nanoCard = document.getElementById('builtinNanoCard');
      if (nanoCard) {
        nanoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nanoCard.style.transition = 'all 0.4s ease';
        nanoCard.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.4)';
        setTimeout(() => {
          nanoCard.style.boxShadow = '';
        }, 2500);
      }
    } else if (window.location.hash === '#ocr') {
      const ocrNav = document.querySelector('[data-tab="ocr"]');
      if (ocrNav) ocrNav.click();
    }
  }

  renderIcons() {
    const setInner = (id, iconHtml) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = iconHtml;
    };

    setInner('optLogo', Icons.appLogo(28));
    setInner('navIconProviders', Icons.layers(16));
    setInner('navIconOcr', Icons.scan(16));
    setInner('navIconAppearance', Icons.settings(16));
    setInner('navIconGuide', Icons.helpCircle(16));
    setInner('navIconPrompt', Icons.fileText(16));
    setInner('navIconGeneral', Icons.settings(16));
    setInner('optIconPlus', Icons.plus(16));
    setInner('optIconRouting', Icons.cpu(18));
    setInner('optIconStrategy', Icons.checkCircle(18, 'text-green-600'));
    setInner('optIconBuiltinNano', Icons.cpu(18));
    setInner('optIconCheckUpdates', Icons.refresh(14));
    setInner('optIconDownloadCore', Icons.download(14));
    setInner('optIconCorePackage', Icons.checkCircle(18, 'text-green-600'));

    // Live Preview Icons
    setInner('prevTbLogo', Icons.appLogo(16));
    setInner('prevIconAnswer', Icons.messageCircle(13));
    setInner('prevIconCopy', Icons.copy(13));
    setInner('prevIconSearch', Icons.globe(13));
    setInner('prevIconTranslate', Icons.languages(13));
    setInner('prevIconMore', Icons.chevronUp(13));

    setInner('prevIconSparkles', Icons.appLogo(16));
    setInner('prevIconClose', Icons.x(13));
    setInner('prevIconScissors', Icons.scissors(13));
    setInner('prevIconCardCopy', Icons.copy(12));

    setInner('prevFabCrop', Icons.scissors(14));
    setInner('prevFabToggle', Icons.sparkles(15));
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.opt-nav-item');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        navButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.opt-section').forEach((sec) => sec.classList.remove('active'));
        if (tab === 'providers') document.getElementById('tabProviders')?.classList.add('active');
        if (tab === 'ocr') document.getElementById('tabOcr')?.classList.add('active');
        if (tab === 'appearance') document.getElementById('tabAppearance')?.classList.add('active');
        if (tab === 'guide') document.getElementById('tabGuide')?.classList.add('active');
        if (tab === 'prompt') document.getElementById('tabPrompt')?.classList.add('active');
        if (tab === 'general') document.getElementById('tabGeneral')?.classList.add('active');
      });
    });
  }

  showToast(msg) {
    const toast = document.getElementById('optToast');
    if (!toast) return;
    toast.innerHTML = `<span style="display:flex;align-items:center;gap:8px;">${Icons.checkCircle(16)} <span>${msg}</span></span>`;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  async applyLanguageI18n(lang = null) {
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const currentLang = lang || uiLanguage;
    const dict = getOptionsI18n(currentLang);

    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el && text !== undefined) el.textContent = text;
    };
    const setHtml = (id, html) => {
      const el = document.getElementById(id);
      if (el && html !== undefined) el.innerHTML = html;
    };

    // Sidebar Nav
    setText('navTextProviders', dict.navProviders);
    setText('navTextOcr', dict.navOcr);
    setText('navTextAppearance', dict.navAppearance);
    setText('navTextGuide', dict.navGuide);
    setText('navTextPrompt', dict.navPrompt);
    setText('navTextGeneral', dict.navGeneral);

    const brandDesc = document.querySelector('.opt-brand-desc');
    if (brandDesc) brandDesc.textContent = dict.brandDesc;

    // Providers Tab - Heading & Strategy
    setText('optHeadingProviders', dict.headingProviders);
    setText('optSubheadingProviders', dict.subheadingProviders);
    setText('optBtnAddKeyText', dict.btnAddKey);
    setText('optStrategyTitle', dict.strategyTitle);
    setText('optStrategyDesc', dict.strategyDesc);

    // Strategy Options
    setText('optRoutingOpt1Title', dict.stratPreferNanoTitle);
    setText('optRoutingOpt1Desc', dict.stratPreferNanoDesc);
    setText('optRoutingOpt2Title', dict.stratPreferConfigTitle);
    setText('optRoutingOpt2Desc', dict.stratPreferConfigDesc);
    setText('optRoutingOpt3Title', dict.stratNanoOnlyTitle);
    setText('optRoutingOpt3Desc', dict.stratNanoOnlyDesc);
    setText('optRoutingOpt4Title', dict.stratConfigOnlyTitle);
    setText('optRoutingOpt4Desc', dict.stratConfigOnlyDesc);

    // Chrome Built-in AI Card
    setText('builtinNanoTitle', dict.builtinNanoTitle);
    setText('builtinNanoDesc', dict.builtinNanoDesc);
    setText('btnOpenFlagsFromOptions', dict.btnOpenFlags);
    setText('btnTestBuiltinAI', dict.btnTestBuiltinAI);

    // OCR Tab
    setText('optHeadingOcr', dict.headingOcr);
    setText('optSubheadingOcr', dict.subheadingOcr);
    setText('optBtnCheckOcrUpdatesText', dict.btnCheckUpdates);
    setText('optBtnDownloadCoreOcrText', dict.btnDownloadCore);
    setText('optCorePackTitle', dict.corePackTitle);
    setText('optCorePackBadge', dict.corePackBadge);
    setText('optCorePackDesc', dict.corePackDesc);
    setText('optAllOcrTitle', dict.allOcrTitle);
    setText('optAllOcrSub', dict.allOcrSub);

    // Appearance Tab
    setText('optHeadingAppearance', dict.headingAppearance);
    setText('optSubheadingAppearance', dict.subheadingAppearance);
    setText('optCardFabTitle', dict.cardFabTitle);
    setText('optLabelFabDisplay', dict.labelFabDisplay);
    setText('optLabelFabDisplayDesc', dict.labelFabDisplayDesc);
    setText('optLabelFabSize', dict.labelFabSize);
    setText('optCardToolbarTitle', dict.cardToolbarTitle);
    setText('optLabelToolbarTheme', dict.labelToolbarTheme);
    setText('optLabelToolbarThemeDesc', dict.labelToolbarThemeDesc);
    setText('optLabelToolbarText', dict.labelToolbarText);
    setText('optLabelToolbarTextDesc', dict.labelToolbarTextDesc);
    setText('optLabelToolbarSize', dict.labelToolbarSize);
    setText('optLabelToolbarOpacity', dict.labelToolbarOpacity);
    setText('optLabelToolbarOpacityDesc', dict.labelToolbarOpacityDesc);
    setText('optLabelToolbarBlur', dict.labelToolbarBlur);
    setText('optLabelToolbarBlurDesc', dict.labelToolbarBlurDesc);
    setText('optCardPopupTitle', dict.cardPopupTitle);
    setText('optLabelPopupOpacity', dict.labelPopupOpacity);
    setText('optLabelPopupOpacityDesc', dict.labelPopupOpacityDesc);
    setText('optLabelPopupBlur', dict.labelPopupBlur);
    setText('optLabelPopupBlurDesc', dict.labelPopupBlurDesc);
    setText('optLivePreviewBadge', dict.livePreviewBadge);
    setText('optLivePreviewSub', dict.livePreviewSub);

    // Guide Tab
    setText('optHeadingGuide', dict.headingGuide);
    setText('optSubheadingGuide', dict.subheadingGuide);
    setText('optGuideWhyTitle', dict.guideWhyTitle);
    setHtml('optGuideWhyItem1', dict.guideWhy1);
    setHtml('optGuideWhyItem2', dict.guideWhy2);
    setHtml('optGuideWhyItem3', dict.guideWhy3);
    setText('optGuideHowTitle', dict.guideHowTitle);
    setHtml('optGuideHowItem1', dict.guideHow1);
    setHtml('optGuideHowItem2', dict.guideHow2);
    setHtml('optGuideHowItem3', dict.guideHow3);
    setText('optGuideLinksTitle', dict.guideLinksTitle);
    setText('optLinkSubGemini', dict.linkSubGemini);
    setText('optLinkSubGroq', dict.linkSubGroq);
    setText('optLinkSubOpenAI', dict.linkSubOpenAI);
    setText('optLinkSubDeepSeek', dict.linkSubDeepSeek);
    setText('optLinkSubClaude', dict.linkSubClaude);

    // Get Key buttons in Guide Tab
    const setBtnText = (id, text, iconFunc) => {
      const el = document.getElementById(id);
      if (el && text) {
        el.innerHTML = `<span>${text}</span> <span>${iconFunc(12)}</span>`;
      }
    };
    setBtnText('optLinkBtnGemini', dict.btnGetKeyGemini, Icons.externalLink);
    setBtnText('optLinkBtnGroq', dict.btnGetKeyGroq, Icons.externalLink);
    setBtnText('optLinkBtnOpenAI', dict.btnGetKeyOpenAI, Icons.externalLink);
    setBtnText('optLinkBtnDeepSeek', dict.btnGetKeyDeepSeek, Icons.externalLink);
    setBtnText('optLinkBtnClaude', dict.btnGetKeyClaude, Icons.externalLink);

    // Prompt Tab
    setText('optHeadingPrompt', dict.headingPrompt);
    setText('optSubheadingPrompt', dict.subheadingPrompt);
    setText('optCardCloudPromptTitle', dict.cardCloudPromptTitle);
    setText('optCardCloudPromptDesc', dict.cardCloudPromptDesc);
    setText('optBtnResetPrompt', dict.btnResetPrompt);
    setText('optBtnSavePrompt', dict.btnSavePrompt);
    setText('optCardNanoPromptTitle', dict.cardNanoPromptTitle);
    setText('optCardNanoPromptDesc', dict.cardNanoPromptDesc);
    setText('optBtnResetNanoPrompt', dict.btnResetNanoPrompt);
    setText('optBtnSaveNanoPrompt', dict.btnSaveNanoPrompt);

    // General Tab
    setText('optHeadingGeneral', dict.headingGeneral);
    setText('optSubheadingGeneral', dict.subheadingGeneral);
    setText('optUiLangTitle', dict.uiLangTitle);
    setText('optUiLangDesc', dict.uiLangDesc);
    setText('optRespLangTitle', dict.respLangTitle);
    setText('optRespLangDesc', dict.respLangDesc);
    setText('optFormsTitle', dict.formsTitle);
    setText('optFormsDesc', dict.formsDesc);
    setText('optTooltipTitle', dict.tooltipTitle);
    setText('optTooltipDesc', dict.tooltipDesc);
    setText('optDisabledSitesTitle', dict.disabledSitesTitle);
    setText('optDisabledSitesDesc', dict.disabledSitesDesc);
    setText('optBackupTitle', dict.backupTitle);
    setText('optBackupDesc', dict.backupDesc);
    setText('optBtnExport', dict.btnExport);
    setText('optBtnClearData', dict.btnClearData);
    setText('optAboutTitle', dict.aboutTitle);
    setText('optAboutDesc', dict.aboutDesc);

    // Refresh dynamic sub-lists
    await this.keysTab.loadProvidersAndKeys();
    await this.ocrTab.loadOcrModelsManager();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
