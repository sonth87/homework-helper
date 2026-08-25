/**
 * Options Page Coordinator (ES Module)
 * Orchestrates modular tab controllers and real-time i18n synchronization.
 */

import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';
import { getOptionsI18n, getSelectionTooltipI18n, getFloatingPopupI18n } from '../shared/i18n.js';
import { OptionsTooltips } from './options-tooltips.js';
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
    OptionsTooltips.init();
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
    } else if (window.location.hash === '#local-model-guide') {
      const guideCard = document.getElementById('optLocalGuideCard');
      if (guideCard) {
        guideCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        guideCard.style.transition = 'all 0.4s ease';
        guideCard.style.boxShadow = '0 0 0 4px rgba(22, 163, 74, 0.4)';
        setTimeout(() => {
          guideCard.style.boxShadow = '';
        }, 2500);
      }
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
    setInner('optIconThinking', Icons.sparkles(18));
    setInner('optIconStrategy', Icons.checkCircle(18, 'text-green-600'));
    setInner('optIconBuiltinNano', Icons.cpu(18));
    setInner('optIconCheckUpdates', Icons.refresh(14));
    setInner('optIconDownloadCore', Icons.download(14));
    setInner('optIconCorePackage', Icons.checkCircle(18, 'text-green-600'));
    setInner('optIconOcrExplain', Icons.helpCircle(18));

    // Local Model (Ollama / LM Studio) Panel & Guide Icons
    setInner('optIconServer', Icons.server(16));
    setInner('optIconLocalPanel', Icons.server(18));
    setInner('optLocalPanelHelp', Icons.helpCircle(15));
    setInner('optIconLocalClose', Icons.x(16));
    setInner('optIconLocalGuide', Icons.server(18));
    setInner('optLocalGuideChevron', Icons.chevronDown(16));
    setInner('optIconGuideOllama', Icons.cpu(15));
    setInner('optIconGuideLmstudio', Icons.cpu(15));
    for (let i = 1; i <= 4; i++) {
      setInner(`optIconGuideShot${i}`, Icons.camera(20));
    }

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
    const tooltipDict = getSelectionTooltipI18n(currentLang);
    const popupDict = getFloatingPopupI18n(currentLang);

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
    setText('optBtnAddLocalModelText', dict.btnAddLocalModel);
    setText('optLocalPanelTitle', dict.localPanelTitle);
    const localPanelHelp = document.getElementById('optLocalPanelHelp');
    if (localPanelHelp) {
      if (dict.localPanelHelpTitle) localPanelHelp.setAttribute('data-tooltip-title', dict.localPanelHelpTitle);
      if (dict.localPanelHelpDesc) localPanelHelp.setAttribute('data-tooltip-desc', dict.localPanelHelpDesc);
    }
    const pingBtn = document.getElementById('optLocalBtnPing');
    if (pingBtn && dict.localBtnPing) pingBtn.title = dict.localBtnPing;
    setText('optLocalBtnCancel', dict.localBtnCancel);
    setText('optLocalBtnAddSelected', dict.localBtnAddSelected);
    setText('optLocalGuideTitle', dict.localGuideTitle);
    setText('optLocalGuideDesc', dict.localGuideDesc);
    setText('optStrategyTitle', dict.strategyTitle);
    setText('optStrategyDesc', dict.strategyDesc);
    setText('optThinkingTitle', dict.thinkingTitle);
    setText('optThinkingDesc', dict.thinkingDesc);

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

    // Gemini Nano 5-step activation guide
    setText('optNanoGuideIntro', dict.guideNanoIntro);
    setHtml('optNanoStep1Pre', dict.guideNanoStep1Pre);
    setHtml('optNanoStep1Post', dict.guideNanoStep1Post);
    setHtml('optNanoStep2Pre', dict.guideNanoStep2Pre);
    setHtml('optNanoStep2Post', dict.guideNanoStep2Post);
    setHtml('optNanoStep3', dict.guideNanoStep3);
    setHtml('optNanoStep4Pre', dict.guideNanoStep4Pre);
    setHtml('optNanoStep4Post', dict.guideNanoStep4Post);
    setHtml('optNanoStep5', dict.guideNanoStep5);

    // Ollama local model guide
    setHtml('optOllamaStep1', dict.guideOllamaStep1);
    setHtml('optOllamaStep2', dict.guideOllamaStep2);
    setHtml('optOllamaStep3', dict.guideOllamaStep3);
    setHtml('optOllamaStep4', dict.guideOllamaStep4);
    setText('optOllamaCaption1', dict.guideOllamaCaption1);
    setText('optOllamaCaption2', dict.guideOllamaCaption2);
    setText('optOllamaCaption3', dict.guideOllamaCaption3);
    setText('optOllamaCaption4', dict.guideOllamaCaption4);

    // LM Studio local model guide
    setHtml('optLmstudioStep1', dict.guideLmstudioStep1);
    setHtml('optLmstudioStep2', dict.guideLmstudioStep2);
    setHtml('optLmstudioStep3', dict.guideLmstudioStep3);
    setHtml('optLmstudioStep4', dict.guideLmstudioStep4);
    setHtml('optLmstudioStep5', dict.guideLmstudioStep5);
    const lmImg2 = document.getElementById('optLmstudioImg2');
    if (lmImg2 && dict.guideLmstudioAlt2) lmImg2.alt = dict.guideLmstudioAlt2;
    const lmImg3 = document.getElementById('optLmstudioImg3');
    if (lmImg3 && dict.guideLmstudioAlt3) lmImg3.alt = dict.guideLmstudioAlt3;

    // OCR Tab
    setText('optHeadingOcr', dict.headingOcr);
    setText('optSubheadingOcr', dict.subheadingOcr);
    setText('optBtnCheckOcrUpdatesText', dict.btnCheckUpdates);
    setText('optBtnDownloadCoreOcrText', dict.btnDownloadCore);
    setText('optBtnDownloadCoreOcrSub', dict.btnDownloadCoreSub);
    setText('optOcrExplainTitle', dict.ocrExplainTitle);
    setHtml('optOcrExplainDesc', dict.ocrExplainDesc);
    setHtml('optOcrExplainWarning', dict.ocrExplainWarning);
    setText('optCorePackTitle', dict.corePackTitle);
    setText('optCorePackBadge', dict.corePackBadge);
    setText('optCorePackDesc', dict.corePackDesc);
    setText('optAllOcrTitle', dict.allOcrTitle);
    setText('optAllOcrSub', dict.allOcrSub);

    // Appearance Tab
    setText('optHeadingAppearance', dict.headingAppearance);
    setText('optSubheadingAppearance', dict.subheadingAppearance);
    setText('optCardOverlayThemeTitle', dict.cardOverlayThemeTitle);
    setText('optLabelOverlayTheme', dict.labelOverlayTheme);
    setText('optLabelOverlayThemeDesc', dict.labelOverlayThemeDesc);
    setText('optOverlayThemeOptAuto', dict.overlayThemeOptAuto);
    setText('optOverlayThemeOptLight', dict.overlayThemeOptLight);
    setText('optOverlayThemeOptDark', dict.overlayThemeOptDark);
    setText('optCardFabTitle', dict.cardFabTitle);
    setText('optLabelFabDisplay', dict.labelFabDisplay);
    setText('optLabelFabDisplayDesc', dict.labelFabDisplayDesc);
    setText('optLabelFabSize', dict.labelFabSize);
    setText('optLabelFabOpacity', dict.labelFabOpacity);
    setText('optLabelFabOpacityDesc', dict.labelFabOpacityDesc);
    setText('optCardToolbarTitle', dict.cardToolbarTitle);
    setText('optCardPopupTitle', dict.cardPopupTitle);
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

    // Appearance Tab - Select <option> labels
    setText('optFabOptTiny', dict.fabOptTiny);
    setText('optFabOptSmall', dict.fabOptSmall);
    setText('optFabOptNormal', dict.fabOptNormal);
    setText('optFabOptLarge', dict.fabOptLarge);
    setText('optThemeOptLight', dict.toolbarThemeOptLight);
    setText('optThemeOptDark', dict.toolbarThemeOptDark);
    setText('optThemeOptBlue', dict.toolbarThemeOptBlue);
    setText('optThemeOptGreen', dict.toolbarThemeOptGreen);
    setText('optThemeOptPurple', dict.toolbarThemeOptPurple);
    setText('optSizeOptCompact', dict.toolbarSizeOptCompact);
    setText('optSizeOptNormal', dict.toolbarSizeOptNormal);
    setText('optSizeOptLarge', dict.toolbarSizeOptLarge);

    // Appearance Tab - Live Preview demo content
    setText('prevDemoTitle', dict.previewDemoTitle);
    setText('prevDemoQuestion', dict.previewDemoQuestion);
    setText('prevDemoHighlight', dict.previewDemoHighlight);
    setText('prevDemoStep', dict.previewDemoStep);
    setText('prevTbLabelAnswer', tooltipDict.answer);
    setText('prevTbLabelCopy', tooltipDict.copy);
    setText('prevTbLabelSearch', tooltipDict.search);
    setText('prevTbLabelTranslate', tooltipDict.translate);
    setText('prevPopupTitle', popupDict.helperTitle);
    setText('prevPopupAnswerHeading', tooltipDict.answer);
    setText('prevPopupNextQuestion', popupDict.nextQuestion);
    setText('prevPopupCopy', popupDict.copy);

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
    setText('optCardLangTitle', dict.cardLangTitle);
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
