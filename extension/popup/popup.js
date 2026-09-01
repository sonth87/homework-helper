/**
 * Action Popup — quick translator
 *
 * Clicking the toolbar icon opens this, not the chat side panel (see the
 * setPanelBehavior note in background/service-worker.js). The panel keeps its
 * own entry points: Alt+K / Cmd+K, the in-page floating button, and the AI Chat
 * widget below.
 */

import { Icons } from '../shared/icons.js';
import { Storage, SUPPORTED_LANGUAGES } from '../shared/storage.js';
import { getPopupI18n } from '../shared/i18n.js';
import { VISIBLE_FREE_ENGINES } from '../background/translate-engines.js';
import { renderAnswer } from '../shared/markdown-katex.js';
import { speak, isSpeechAvailable } from '../shared/tts.js';

document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);

  const els = {
    logo: $('popLogo'),
    btnOptions: $('popBtnOptions'),
    brandSub: $('popBrandSub'),
    langFrom: $('popLangFrom'),
    langTo: $('popLangTo'),
    btnSwap: $('popBtnSwap'),
    engineLabel: $('popEngineLabel'),
    engine: $('popEngine'),
    input: $('popInput'),
    btnClear: $('popBtnClear'),
    clipboardNote: $('popClipboardNote'),
    clipboardNoteText: $('popClipboardNoteText'),
    btnUndoClipboard: $('popBtnUndoClipboard'),
    btnTranslate: $('popBtnTranslate'),
    btnTranslateText: $('popBtnTranslateText'),
    iconTranslate: $('popIconTranslate'),
    resultBox: $('popResultBox'),
    resultMeta: $('popResultMeta'),
    result: $('popResult'),
    btnCopy: $('popBtnCopy'),
    btnSpeakSource: $('popBtnSpeakSource'),
    btnSpeakResult: $('popBtnSpeakResult'),
    error: $('popError'),
    keyStatus: $('popKeyStatus'),
  };

  // ---------- Icons ----------
  els.logo.innerHTML = Icons.appLogo(24);
  els.btnOptions.innerHTML = Icons.settings(16);
  els.btnSwap.innerHTML = Icons.refresh(14);
  els.btnClear.innerHTML = Icons.x(13);
  els.iconTranslate.innerHTML = Icons.languages(15);
  els.btnSpeakSource.innerHTML = Icons.volume2(13);
  els.btnSpeakResult.innerHTML = Icons.volume2(13);
  $('popIconChat').innerHTML = Icons.messageCircle(17);
  $('popIconCapture').innerHTML = Icons.scissors(17);
  $('popIconHover').innerHTML = Icons.bookOpen(17);
  $('popIconSettings').innerHTML = Icons.settings(17);
  $('popIconGear').innerHTML = Icons.settings(14);

  const settings = await Storage.get();
  const {
    apiConfigs = [],
    rotationStrategy,
    enableFormsAdapter = true,
    enableTextTooltip = true,
    enableHoverTranslate = false,
    popupTranslateEngine = 'bing',
    popupTranslateSource = 'auto',
    popupTranslateTarget = 'vi',
    popupAutoTranslateClipboard = true,
    popupClipboardMaxLength = 2000,
    uiLanguage = 'vi',
  } = settings;

  let dict = getPopupI18n(uiLanguage);

  const enabledKeys = apiConfigs.filter(
    (c) => c.isEnabled && (c.apiKey || c.provider === 'ollama' || c.provider === 'lmstudio' || c.provider === 'chrome-builtin')
  );

  // ---------- Selects ----------
  const langName = (id) => SUPPORTED_LANGUAGES.find((l) => l.id === id)?.name || id;
  const targetLangs = SUPPORTED_LANGUAGES.filter((l) => l.id !== 'auto');

  function buildLangSelects() {
    els.langFrom.innerHTML = [
      `<option value="auto">${dict.sourceAuto}</option>`,
      ...targetLangs.map((l) => `<option value="${l.id}">${l.name}</option>`),
    ].join('');
    els.langTo.innerHTML = targetLangs.map((l) => `<option value="${l.id}">${l.name}</option>`).join('');
    els.langFrom.value = popupTranslateSource;
    els.langTo.value = targetLangs.some((l) => l.id === popupTranslateTarget) ? popupTranslateTarget : 'vi';
  }

  function buildEngineSelect() {
    const free = VISIBLE_FREE_ENGINES.map(
      (e) => `<option value="${e.id}">${e.name}</option>`
    ).join('');
    // The AI option is offered even with no key configured: routingStrategy can
    // still reach Chrome's on-device Gemini Nano, and the failure message from
    // AiEngine is clearer than hiding the option would be.
    const aiLabel = enabledKeys.length > 0 ? `${dict.engineAi} (${enabledKeys.length})` : dict.engineAi;
    els.engine.innerHTML = `
      <optgroup label="${dict.engineGroupFree}">${free}</optgroup>
      <optgroup label="${dict.engineGroupAi}"><option value="ai">${aiLabel}</option></optgroup>
    `;
    const known = ['ai', ...VISIBLE_FREE_ENGINES.map((e) => e.id)];
    els.engine.value = known.includes(popupTranslateEngine) ? popupTranslateEngine : 'bing';
  }

  // ---------- i18n ----------
  function applyLanguage() {
    dict = getPopupI18n(uiLanguage);
    els.brandSub.textContent = dict.brandSub;
    els.engineLabel.textContent = dict.engineLabel;
    els.input.placeholder = dict.inputPlaceholder;
    els.btnTranslateText.textContent = dict.btnTranslate;
    els.btnCopy.textContent = dict.btnCopy;
    els.btnUndoClipboard.textContent = dict.clipboardUndo;
    els.btnSwap.title = dict.swapLang;
    els.btnClear.title = dict.btnClear;
    els.btnSpeakSource.title = dict.listen;
    els.btnSpeakResult.title = dict.listen;
    els.btnOptions.title = dict.widgetSettings;

    $('popWidgetChatText').textContent = dict.widgetChat;
    $('popWidgetCaptureText').textContent = dict.widgetCapture;
    $('popWidgetHoverText').textContent = dict.widgetHover;
    $('popWidgetSettingsText').textContent = dict.widgetSettings;

    $('popLabelForms').textContent = dict.formsAssistant;
    $('popLabelTooltip').textContent = dict.selectionTooltip;
    $('popLabelAutoClipboard').textContent = dict.autoClipboard;
    $('popConfigureBtnText').textContent = dict.configureBtn;

    const mode = rotationStrategy === 'random' ? dict.rotationRandom : dict.rotationRoundRobin;
    els.keyStatus.textContent = `${dict.keysPool} ${enabledKeys.length} · ${dict.rotationMode} ${mode}`;
  }

  applyLanguage();
  buildLangSelects();
  buildEngineSelect();

  // ---------- Toggles ----------
  const toggleForms = $('popToggleForms');
  const toggleTooltip = $('popToggleTooltip');
  const toggleAutoClipboard = $('popToggleAutoClipboard');

  toggleForms.checked = enableFormsAdapter;
  toggleTooltip.checked = enableTextTooltip;
  toggleAutoClipboard.checked = popupAutoTranslateClipboard;

  toggleForms.addEventListener('change', () => Storage.set({ enableFormsAdapter: toggleForms.checked }));
  toggleTooltip.addEventListener('change', () => Storage.set({ enableTextTooltip: toggleTooltip.checked }));
  toggleAutoClipboard.addEventListener('change', () =>
    Storage.set({ popupAutoTranslateClipboard: toggleAutoClipboard.checked })
  );

  // ---------- Translation ----------
  let busy = false;
  // Last language an engine reported detecting, normalized to SUPPORTED_LANGUAGES.
  // The swap button needs it to resolve an 'auto' source into a real target.
  let lastDetectedLang = null;
  // What the two listen buttons should pronounce. For a dictionary card these
  // are the headword and its primary translation, not the whole rendered card.
  let spoken = { source: '', target: '' };

  function showError(message) {
    els.error.textContent = message;
    els.error.hidden = false;
  }

  function clearError() {
    els.error.hidden = true;
    els.error.textContent = '';
  }

  function syncClearButton() {
    els.btnClear.hidden = els.input.value.length === 0;
  }

  /**
   * Swapping is only meaningful when the source resolves to a language that
   * differs from the target. While the source is 'auto' and nothing has been
   * translated yet there is nothing to resolve it to, so the button is disabled
   * rather than silently producing a same-language pair.
   */
  function syncSwapButton() {
    const from = els.langFrom.value === 'auto' ? lastDetectedLang : els.langFrom.value;
    els.btnSwap.disabled = !from || from === els.langTo.value || !targetLangs.some((l) => l.id === from);
  }

  /**
   * Show a listen button only when there is something to say and a voice able
   * to say it. Speech is unavailable in some builds and locked-down profiles,
   * where an always-visible button that does nothing would be worse than none.
   */
  function syncSpeakButtons() {
    const speechOk = isSpeechAvailable();
    els.btnSpeakSource.hidden = !speechOk || !spoken.source;
    els.btnSpeakResult.hidden = !speechOk || !spoken.target || els.resultBox.hidden;
  }

  function engineDisplayName(id) {
    if (id === 'ai') return dict.engineAi;
    return VISIBLE_FREE_ENGINES.find((e) => e.id === id)?.name || id;
  }

  async function runTranslate() {
    const text = els.input.value.trim();
    if (!text || busy) return;

    busy = true;
    clearError();
    els.btnTranslate.disabled = true;
    els.btnTranslateText.textContent = dict.btnTranslating;

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'TRANSLATE_TEXT',
        payload: {
          text,
          from: els.langFrom.value,
          to: els.langTo.value,
          engine: els.engine.value,
        },
      });

      if (!res?.success) throw new Error(res?.error || dict.errorTranslate);

      // An AI reply can be a dictionary-schema JSON object for a single word;
      // renderAnswer detects that shape and renders the card, otherwise it
      // formats the plain translation as markdown.
      els.result.innerHTML = renderAnswer(res.translation);
      els.resultBox.hidden = false;

      lastDetectedLang = targetLangs.some((l) => l.id === res.detectedLang) ? res.detectedLang : null;

      // A dictionary reply names what to pronounce; a plain one is spoken as-is.
      spoken = res.spoken || { source: text, target: els.result.textContent || '' };
      syncSpeakButtons();

      const parts = [];
      if (res.isAi && res.model) parts.push(res.model);
      else if (res.isDictionary) parts.push(dict.engineDictionary);
      else if (res.fellBack) parts.push(`${dict.engineFallback} ${engineDisplayName(res.engine)}`);
      else parts.push(engineDisplayName(res.engine));
      if (res.detectedLang && els.langFrom.value === 'auto') parts.push(langName(res.detectedLang));
      els.resultMeta.textContent = parts.join(' · ');
      syncSwapButton();
    } catch (err) {
      els.resultBox.hidden = true;
      showError(`${dict.errorTranslate} (${err.message})`);
    } finally {
      busy = false;
      els.btnTranslate.disabled = false;
      els.btnTranslateText.textContent = dict.btnTranslate;
    }
  }

  els.btnTranslate.addEventListener('click', runTranslate);

  // Ctrl/Cmd+Enter translates without leaving the textarea.
  els.input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runTranslate();
    }
  });

  els.input.addEventListener('input', () => {
    syncClearButton();
    els.clipboardNote.hidden = true;
  });

  els.btnClear.addEventListener('click', () => {
    els.input.value = '';
    els.resultBox.hidden = true;
    els.clipboardNote.hidden = true;
    clearError();
    syncClearButton();
    spoken = { source: '', target: '' };
    syncSpeakButtons();
    els.input.focus();
  });

  els.btnSwap.addEventListener('click', () => {
    const to = els.langTo.value;
    // The target side has no 'auto' entry, so swapping while the source is
    // 'auto' has to resolve it first — otherwise both sides land on the same
    // language and the next translation echoes its input back.
    const from = els.langFrom.value === 'auto' ? lastDetectedLang : els.langFrom.value;
    if (!from || from === to || !targetLangs.some((l) => l.id === from)) return;

    els.langFrom.value = to;
    els.langTo.value = from;

    // Send the translation back the other way rather than making the user
    // re-type it; its language is now the source language.
    const translated = els.result.textContent?.trim();
    if (translated && !els.resultBox.hidden) {
      els.input.value = translated;
      els.resultBox.hidden = true;
      syncClearButton();
    }
    spoken = { source: els.input.value, target: '' };
    syncSpeakButtons();
    lastDetectedLang = null;
    syncSwapButton();
    Storage.set({ popupTranslateSource: els.langFrom.value, popupTranslateTarget: els.langTo.value });
  });

  els.langFrom.addEventListener('change', () => {
    syncSwapButton();
    Storage.set({ popupTranslateSource: els.langFrom.value });
  });
  els.langTo.addEventListener('change', () => {
    syncSwapButton();
    Storage.set({ popupTranslateTarget: els.langTo.value });
  });
  els.engine.addEventListener('change', () => Storage.set({ popupTranslateEngine: els.engine.value }));

  els.btnSpeakSource.addEventListener('click', () => {
    speak(spoken.source, lastDetectedLang || els.langFrom.value);
  });

  els.btnSpeakResult.addEventListener('click', () => {
    speak(spoken.target, els.langTo.value);
  });

  els.btnCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(els.result.textContent || '');
      els.btnCopy.textContent = dict.btnCopied;
      setTimeout(() => { els.btnCopy.textContent = dict.btnCopy; }, 1400);
    } catch { /* clipboard write refused — nothing useful to show */ }
  });

  // ---------- Clipboard pickup ----------
  // Reading the clipboard needs the `clipboardRead` permission and a focused
  // document; the popup is focused the moment it opens. It still fails in some
  // contexts (no permission prompt is possible here), so every failure just
  // leaves the textarea empty for the user to paste into by hand.
  async function pickUpClipboard() {
    if (!popupAutoTranslateClipboard) return;
    let text = '';
    try {
      text = (await navigator.clipboard.readText())?.trim() || '';
    } catch {
      return;
    }
    if (!text) return;

    const { popupLastClipboard = '' } = await Storage.get(['popupLastClipboard']);
    // Re-translating the same clipboard on every open would be noise; the user
    // can still press Translate to force it.
    if (text === popupLastClipboard) return;

    els.input.value = text;
    syncClearButton();
    await Storage.set({ popupLastClipboard: text });

    if (text.length > popupClipboardMaxLength) {
      els.clipboardNoteText.textContent = dict.clipboardTooLong;
      els.btnUndoClipboard.hidden = false;
      els.clipboardNote.hidden = false;
      return;
    }

    els.clipboardNoteText.textContent = dict.clipboardPasted;
    els.btnUndoClipboard.hidden = false;
    els.clipboardNote.hidden = false;
    runTranslate();
  }

  els.btnUndoClipboard.addEventListener('click', () => {
    els.input.value = '';
    els.resultBox.hidden = true;
    els.clipboardNote.hidden = true;
    clearError();
    syncClearButton();
    els.input.focus();
  });

  // ---------- Quick actions ----------
  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  }

  $('popWidgetChat').addEventListener('click', async () => {
    const tab = await activeTab();
    if (tab && chrome.sidePanel) {
      await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
      window.close();
    }
  });

  $('popWidgetCapture').addEventListener('click', async () => {
    const tab = await activeTab();
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'START_CROP' }).catch(() => {});
      window.close();
    }
  });

  const widgetHover = $('popWidgetHover');
  widgetHover.dataset.active = String(enableHoverTranslate);
  widgetHover.addEventListener('click', async () => {
    const next = widgetHover.dataset.active !== 'true';
    widgetHover.dataset.active = String(next);
    await Storage.set({ enableHoverTranslate: next });
  });

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };
  $('popWidgetSettings').addEventListener('click', openOptions);
  els.btnOptions.addEventListener('click', openOptions);
  $('popBtnConfigure').addEventListener('click', openOptions);

  syncClearButton();
  syncSwapButton();
  syncSpeakButtons();
  pickUpClipboard();
});
