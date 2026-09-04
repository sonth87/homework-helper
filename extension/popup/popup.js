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
import { getPopupI18n, getOptionsI18n } from '../shared/i18n.js';
import { EnginePicker } from '../shared/engine-picker.js';
import { AI_PROVIDER_ID, PICKABLE_PROVIDER_IDS, providerName } from '../shared/translate-providers.js';
import { TranslateHistorySheet } from '../shared/translate-history-sheet.js';
import { renderAnswer } from '../shared/markdown-katex.js';
import { speak, isSpeechAvailable, bindSpeakButtons } from '../shared/tts.js';
import { PopupTooltips } from './popup-tooltips.js';

document.addEventListener('DOMContentLoaded', async () => {
  // navigator.clipboard.readText() (see pickUpClipboard() near the bottom)
  // throws "Document is not focused" unless this window actually holds OS
  // focus, not just DOM element focus. A toolbar-icon click normally grants
  // that immediately, but asking for it explicitly, this early — before any
  // of the setup below runs — costs nothing and closes the gap if it doesn't.
  window.focus();

  const $ = (id) => document.getElementById(id);

  const els = {
    logo: $('popLogo'),
    btnOptions: $('popBtnOptions'),
    btnHistory: $('popBtnHistory'),
    btnShortcuts: $('popBtnShortcuts'),
    brandSub: $('popBrandSub'),
    langFrom: $('popLangFrom'),
    langTo: $('popLangTo'),
    btnSwap: $('popBtnSwap'),
    engineLabel: $('popEngineLabel'),
    enginePicker: $('popEnginePicker'),
    input: $('popInput'),
    btnClear: $('popBtnClear'),
    inputHint: $('popInputHint'),
    clipboardNote: $('popClipboardNote'),
    clipboardNoteText: $('popClipboardNoteText'),
    btnTranslate: $('popBtnTranslate'),
    btnTranslateText: $('popBtnTranslateText'),
    iconTranslate: $('popIconTranslate'),
    resultBox: $('popResultBox'),
    resultMeta: $('popResultMeta'),
    result: $('popResult'),
    btnCopy: $('popBtnCopy'),
    btnFavorite: $('popBtnFavorite'),
    btnSpeakSource: $('popBtnSpeakSource'),
    btnSpeakResult: $('popBtnSpeakResult'),
    error: $('popError'),
    keyStatus: $('popKeyStatus'),
  };

  // ---------- Icons ----------
  els.logo.innerHTML = Icons.appLogo(24);
  els.btnOptions.innerHTML = Icons.settings(16);
  els.btnHistory.innerHTML = Icons.history(16);
  els.btnShortcuts.innerHTML = Icons.keyboard(16);
  els.btnFavorite.innerHTML = Icons.star(13);
  els.btnSwap.innerHTML = Icons.refresh(14);
  els.btnClear.innerHTML = Icons.x(13);
  $('popBtnCloseShortcuts').innerHTML = Icons.x(13);
  els.iconTranslate.innerHTML = Icons.languages(15);
  els.btnSpeakSource.innerHTML = Icons.volume2(13);
  els.btnSpeakResult.innerHTML = Icons.volume2(13);
  $('popIconChat').innerHTML = Icons.messageCircle(17);
  $('popIconCapture').innerHTML = Icons.scissors(17);
  $('popIconHover').innerHTML = Icons.mousePointer(17);
  $('popIconSettings').innerHTML = Icons.settings(17);
  $('popIconGear').innerHTML = Icons.settings(14);

  const settings = await Storage.get();
  const {
    apiConfigs = [],
    rotationStrategy,
    enableFormsAdapter = true,
    enableTextTooltip = true,
    enableHoverTranslate = false,
    hoverTranslateModifiers = ['alt'],
    popupTranslateEngine = 'bing',
    popupTranslateSource = 'auto',
    popupTranslateTarget = 'vi',
    popupAutoTranslateClipboard = true,
    popupClipboardMaxLength = 2000,
    uiLanguage = 'vi',
    overlayTheme = 'auto',
  } = settings;

  // 'auto' leaves it to the @media (prefers-color-scheme) block in popup.css;
  // an explicit light/dark choice is applied here so it wins regardless of
  // the OS setting — same override semantics as getOverlayThemeAttr() in
  // shared/theme.js, inlined rather than making a second Storage round trip
  // for a value already sitting in `settings`.
  if (overlayTheme === 'light' || overlayTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', overlayTheme);
  }

  let dict = getPopupI18n(uiLanguage);
  // Only for the 4 generic modifier-key names (Ctrl/Shift/Alt/Cmd) in the
  // Hover Translate tooltip below — reuses Options' own translations for
  // those instead of duplicating them into the popup block, same as
  // content/overlay.js's feature-guide panel already does for the same 4
  // strings (see its optDict.hoverModCtrl usage).
  const optDict = getOptionsI18n(uiLanguage);

  // Real, currently-bound accelerator for each declared command (manifest.json
  // 'commands') — not just the manifest's suggested_key. Chrome silently
  // leaves a suggested_key unbound when it collides with another extension or
  // a browser/OS shortcut, so reading the actual binding here is what lets
  // the tooltips below show the truth (including "not bound") instead of
  // repeating a suggestion that may never have taken effect.
  const commandShortcuts = await new Promise((resolve) => {
    chrome.commands.getAll((cmds) => resolve(Object.fromEntries((cmds || []).map((c) => [c.name, c.shortcut]))));
  });

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

  // Which service does the translating. Held here rather than read off a
  // <select>, because the picker is a custom dropdown — a native option list
  // cannot show each provider's mark, and the mark is what makes the list
  // scannable at a glance.
  let engineValue = PICKABLE_PROVIDER_IDS.includes(popupTranslateEngine) ? popupTranslateEngine : 'bing';
  let enginePicker = null;

  // The AI option is offered even with no key configured: routingStrategy can
  // still reach Chrome's on-device Gemini Nano, and the failure message from
  // AiEngine is clearer than hiding the option would be.
  function engineLabels() {
    return {
      groupFree: dict.engineGroupFree,
      groupAi: dict.engineGroupAi,
      ai: enabledKeys.length > 0 ? `${dict.engineAi} (${enabledKeys.length})` : dict.engineAi,
    };
  }

  function buildEnginePicker() {
    enginePicker = new EnginePicker(els.enginePicker, {
      value: engineValue,
      labels: engineLabels(),
      onChange: (id) => {
        engineValue = id;
        Storage.set({ popupTranslateEngine: id });
      },
    });
  }

  // Past translations, shared with the in-page card's translate mode (see
  // Storage.addTranslateHistory()) — never with the AI chat history. Mounted
  // into .pop-container itself so the sheet's position:absolute; inset:0
  // covers exactly the popup's own content area.
  const historySheet = new TranslateHistorySheet(document.querySelector('.pop-container'), {
    labels: historyLabels(),
    speakLabel: () => dict.listen,
    // A shown translation result can already make .pop-body taller than
    // Chrome's max popup size, so the popup document itself picks up a
    // native scrollbar — on top of the sheet's own .hw-th-list scroll,
    // giving two independently-scrollable regions stacked on each other.
    // Lock the outer document while the sheet covers it; see the option's
    // doc comment in translate-history-sheet.js for why this lives here
    // and not inside that shared module.
    onToggle: (isOpen) => document.body.classList.toggle('hw-th-sheet-open', isOpen),
  });

  function historyLabels() {
    return {
      title: dict.historyTitle,
      tabHistory: dict.historyTabHistory,
      tabFavorite: dict.historyTabFavorite,
      close: dict.historyClose,
      favorite: dict.historyFavorite,
      emptyHistory: dict.historyEmpty,
      emptyFavorite: dict.historyEmptyFavorite,
      clear: dict.historyClear,
      confirmClear: dict.historyConfirmClear,
      deleteAll: dict.historyDeleteAll,
      moreDeleteOptions: dict.historyMoreDeleteOptions,
      confirmClearAll: dict.historyConfirmClearAll,
      selectedCount: dict.historySelectedCount,
    };
  }

  // ---------- Tooltips ----------
  // Rich (non-native) tooltips for the 4 quick-action widgets and the 3
  // feature toggles below them — see popup-tooltips.js. Called from
  // applyLanguage() purely so it sits next to the rest of this popup's
  // one-time text setup, not because uiLanguage can change mid-session here.
  function setTooltip(el, title, desc, shortcut) {
    if (!el) return;
    el.setAttribute('data-tooltip-title', title);
    if (desc) el.setAttribute('data-tooltip-desc', desc);
    if (shortcut) el.setAttribute('data-tooltip-shortcut', shortcut);
  }

  function formatHoverModifierShortcut() {
    const modNames = {
      ctrl: optDict.hoverModCtrl,
      shift: optDict.hoverModShift,
      alt: optDict.hoverModAlt,
      meta: optDict.hoverModMeta,
    };
    const active = (hoverTranslateModifiers || []).map((m) => modNames[m]).filter(Boolean);
    return active.length > 0 ? `${dict.hoverShortcutHeld} ${active.join(' + ')}` : dict.hoverShortcutNone;
  }

  function applyTooltips() {
    setTooltip(
      $('popWidgetChat'),
      dict.widgetChat,
      dict.widgetChatDesc,
      commandShortcuts.chat || dict.shortcutNotSet
    );
    setTooltip(
      $('popWidgetCapture'),
      dict.widgetCapture,
      dict.widgetCaptureDesc,
      commandShortcuts.screenshot || dict.shortcutNotSet
    );
    setTooltip($('popWidgetHover'), dict.widgetHover, dict.widgetHoverDesc, formatHoverModifierShortcut());
    setTooltip($('popWidgetSettings'), dict.widgetSettings, dict.widgetSettingsDesc);

    // On the checkbox itself, not the whole row — hovering the label text
    // too felt cumbersome (e.g. it fought with clicking the text to toggle).
    setTooltip($('popToggleForms'), dict.formsAssistant, dict.formsAssistantDesc);
    setTooltip($('popToggleTooltip'), dict.selectionTooltip, dict.selectionTooltipDesc);
    setTooltip($('popToggleAutoClipboard'), dict.autoClipboard, dict.autoClipboardDesc);
  }

  // ---------- Keyboard Shortcuts panel ----------
  // Same 3 entries as the widget tooltips above (reuses their title/desc
  // strings) collected into one list — for "is any shortcut actually working"
  // to be answerable at a glance instead of hovering each button in turn.
  function renderShortcutsList() {
    const rows = [
      { title: dict.widgetChat, desc: dict.widgetChatDesc, key: commandShortcuts.chat },
      { title: dict.widgetCapture, desc: dict.widgetCaptureDesc, key: commandShortcuts.screenshot },
      { title: dict.widgetHover, desc: dict.widgetHoverDesc, key: formatHoverModifierShortcut(), alwaysSet: true },
    ];
    $('popShortcutsList').innerHTML = rows.map((r) => {
      // Only the two real chrome.commands entries can come back unbound
      // (Chrome silently drops a suggested_key that collides with another
      // extension or the OS/browser) — the hover-modifier "shortcut" is a
      // Storage setting, always has a value, never needs the warning style.
      const isUnset = !r.alwaysSet && !r.key;
      const keyLabel = isUnset ? dict.shortcutNotSet : r.key;
      return `
        <div class="pop-shortcut-row">
          <div class="pop-shortcut-info">
            <div class="pop-shortcut-title">${r.title}</div>
            <div class="pop-shortcut-desc">${r.desc}</div>
          </div>
          <span class="pop-shortcut-key${isUnset ? ' is-unset' : ''}">${keyLabel}</span>
        </div>
      `;
    }).join('');
  }

  function openShortcutsPanel() {
    renderShortcutsList();
    const headerRect = document.querySelector('.pop-header').getBoundingClientRect();
    $('popShortcutsPanel').style.top = `${headerRect.bottom}px`;
    $('popShortcutsPanel').hidden = false;
    $('popShortcutsBackdrop').hidden = false;
  }

  function closeShortcutsPanel() {
    $('popShortcutsPanel').hidden = true;
    $('popShortcutsBackdrop').hidden = true;
  }

  els.btnShortcuts.addEventListener('click', () => {
    if ($('popShortcutsPanel').hidden) openShortcutsPanel();
    else closeShortcutsPanel();
  });
  $('popBtnCloseShortcuts').addEventListener('click', closeShortcutsPanel);
  $('popShortcutsBackdrop').addEventListener('click', closeShortcutsPanel);

  // ---------- i18n ----------
  function applyLanguage() {
    dict = getPopupI18n(uiLanguage);
    els.brandSub.textContent = dict.brandSub;
    els.engineLabel.textContent = dict.engineLabel;
    els.input.placeholder = dict.inputPlaceholder;
    els.btnTranslateText.textContent = dict.btnTranslate;
    els.btnCopy.textContent = dict.btnCopy;
    els.btnSwap.title = dict.swapLang;
    els.inputHint.textContent = dict.inputHint;
    enginePicker?.setLabels(engineLabels());
    els.btnClear.title = dict.btnClear;
    els.btnShortcuts.title = dict.shortcutsPanelTitle;
    $('popShortcutsTitle').textContent = dict.shortcutsPanelTitle;
    els.btnSpeakSource.title = dict.listen;
    els.btnSpeakResult.title = dict.listen;
    els.btnOptions.title = dict.widgetSettings;
    els.btnHistory.title = dict.historyBtn;
    els.btnFavorite.title = dict.historyFavorite;
    historySheet.setLabels(historyLabels());

    $('popWidgetChatText').textContent = dict.widgetChat;
    $('popWidgetCaptureText').textContent = dict.widgetCapture;
    $('popWidgetHoverText').textContent = dict.widgetHover;
    $('popWidgetSettingsText').textContent = dict.widgetSettings;

    $('popLabelForms').textContent = dict.formsAssistant;
    $('popLabelTooltip').textContent = dict.selectionTooltip;
    $('popLabelAutoClipboard').textContent = dict.autoClipboard;
    $('popConfigureBtnText').textContent = dict.configureBtn;

    applyTooltips();

    const mode = rotationStrategy === 'random' ? dict.rotationRandom : dict.rotationRoundRobin;
    els.keyStatus.textContent = `${dict.keysPool} ${enabledKeys.length} · ${dict.rotationMode} ${mode}`;
  }

  PopupTooltips.init();
  applyLanguage();
  buildLangSelects();
  buildEnginePicker();
  bindSpeakButtons(document);

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
  // The Storage.translateHistory entry the currently displayed result was
  // recorded as — null until a translation succeeds, so the favorite button
  // (which needs an id to toggle) knows there's nothing to favorite yet.
  let currentHistoryEntryId = null;

  /**
   * Only meaningful once a translation has actually been recorded in
   * history — an always-visible star with nothing to attach to would be
   * worse than none, same reasoning as the Listen buttons.
   */
  function syncFavoriteButton(isFavorite) {
    els.btnFavorite.hidden = !currentHistoryEntryId;
    els.btnFavorite.classList.toggle('is-active', !!isFavorite);
  }

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
   * The popup exists to translate something, and the only thing it needs from
   * the user is the text — so the caret starts there, ready for a paste or a
   * first keystroke without a click. The caret goes to the end rather than
   * selecting everything: text picked up from the clipboard is usually what
   * the user wants, and a select-all would have the next keystroke wipe it.
   */
  function focusInput() {
    els.input.focus();
    const end = els.input.value.length;
    try { els.input.setSelectionRange(end, end); } catch { /* not focusable yet */ }
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
    // A dictionary reply draws its own listen buttons — one beside the
    // phonetic, one beside the translation (shared/markdown-katex.js). Where
    // those are on screen, this pair would be a second control for exactly
    // the same two sounds, so it steps aside.
    const showingResult = !els.resultBox.hidden;
    const inlineSource = showingResult && !!els.result.querySelector('.hw-dict-headword [data-hw-speak]');
    const inlineTarget = showingResult && !!els.result.querySelector('.hw-dict-desc [data-hw-speak]');
    els.btnSpeakSource.hidden = !speechOk || !spoken.source || inlineSource;
    els.btnSpeakResult.hidden = !speechOk || !spoken.target || !showingResult || inlineTarget;
  }

  function engineDisplayName(id) {
    return id === AI_PROVIDER_ID ? dict.engineAi : providerName(id);
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
          engine: engineValue,
        },
      });

      if (!res?.success) throw new Error(res?.error || dict.errorTranslate);

      // An AI reply can be a dictionary-schema JSON object for a single word;
      // renderAnswer detects that shape and renders the card, otherwise it
      // formats the plain translation as markdown.
      els.result.innerHTML = renderAnswer(res.translation, {
        speakLabel: dict.listen,
        targetLang: els.langTo.value,
      });
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

      const historyEntry = await Storage.addTranslateHistory({
        sourceText: text,
        translatedRaw: res.translation,
        sourceLang: res.detectedLang || els.langFrom.value,
        targetLang: els.langTo.value,
      });
      currentHistoryEntryId = historyEntry?.id || null;
      syncFavoriteButton(historyEntry?.isFavorite);
      historySheet.refresh();
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

  // Enter translates; a new line needs Shift+Enter. The box is a scratch pad
  // for a phrase to look up, not a place to compose in, so the key pressed
  // after typing it should do the one thing the popup exists for.
  // `isComposing` keeps the Enter that commits an IME candidate — Vietnamese
  // telex, Chinese/Japanese/Korean input — from firing a translation of the
  // half-typed word instead.
  els.input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    runTranslate();
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
    currentHistoryEntryId = null;
    syncFavoriteButton(false);
    els.input.focus();
  });

  els.btnHistory.addEventListener('click', () => historySheet.toggle());

  els.btnFavorite.addEventListener('click', async () => {
    if (!currentHistoryEntryId) return;
    const updated = await Storage.toggleTranslateFavorite(currentHistoryEntryId);
    syncFavoriteButton(updated?.isFavorite);
    historySheet.refresh();
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
  /**
   * navigator.clipboard.readText() throws "Document is not focused" unless
   * document.hasFocus() is genuinely true — confirmed via a real
   * NotAllowedError report, not just a guess. Opening the popup requests
   * that focus (window.focus() above), but the browser doesn't always
   * finish handing it over by the time this async chain of Storage.get()
   * calls and DOM setup gets here. Wait for the real 'focus' event rather
   * than assuming it already landed, with a timeout in case it never fires
   * at all (some window states never do).
   */
  function waitForFocus(timeout = 250) {
    if (document.hasFocus()) return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('focus', finish);
        resolve();
      };
      window.addEventListener('focus', finish);
      setTimeout(finish, timeout);
    });
  }

  /**
   * A single retry wasn't enough in practice: the 'focus' event (and even
   * document.hasFocus() reporting true) can fire before Chrome has *fully*
   * committed focus internally, so readText() keeps losing the race for
   * longer than one 150ms gap on a loaded machine. Retry several times with
   * a growing delay instead — cheap when focus already landed (first
   * attempt succeeds immediately, loop exits), resilient when it hasn't.
   */
  async function readClipboardText() {
    const maxAttempts = 6;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await waitForFocus();
      try {
        return (await navigator.clipboard.readText())?.trim() || '';
      } catch (err) {
        if (attempt === maxAttempts - 1 || err?.name !== 'NotAllowedError') {
          // Every failure here used to be silently swallowed — no permission
          // prompt is possible from inside a popup, so there was never
          // anything actionable to show the user, but that also meant a
          // genuine failure (focus lost, permission revoked) was
          // indistinguishable from "nothing to paste" with no way to tell
          // them apart from DevTools. Logging it costs nothing and turns "it
          // just doesn't work" into a diagnosable error name/message.
          console.warn('[HomeworkAI] Could not read clipboard for auto-translate:', err?.name, err?.message);
          return '';
        }
        await new Promise((r) => setTimeout(r, 100 + attempt * 100));
      }
    }
    return '';
  }

  async function pickUpClipboard() {
    if (!popupAutoTranslateClipboard) return;
    const text = await readClipboardText();
    if (!text) return;
    // readClipboardText()'s retry loop can take up to ~1.7s in the worst
    // case. If the user already started typing during that wait, don't yank
    // it out from under them with clipboard text they didn't ask for.
    if (els.input.value.trim() !== '') return;

    const { popupLastClipboard = '' } = await Storage.get(['popupLastClipboard']);
    // Re-translating the same clipboard on every open would be noise; the user
    // can still press Translate to force it.
    if (text === popupLastClipboard) return;

    els.input.value = text;
    syncClearButton();
    focusInput();
    await Storage.set({ popupLastClipboard: text });

    if (text.length > popupClipboardMaxLength) {
      els.clipboardNoteText.textContent = dict.clipboardTooLong;
      els.clipboardNote.hidden = false;
      return;
    }

    els.clipboardNoteText.textContent = dict.clipboardPasted;
    els.clipboardNote.hidden = false;
    runTranslate();
  }

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
  focusInput();
  pickUpClipboard();
});
