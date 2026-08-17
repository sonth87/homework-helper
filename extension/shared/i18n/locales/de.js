export default {
  general: {
    brandTitle: "Homework Helper",
    placeholder: "Hausaufgabe oder Frage hier eingeben...",
    shiftEnterHint: "Enter zum Senden, Shift+Enter für Zeilenumbruch",
    askAiBtn: "KI fragen",
    captureBtn: "Aufnehmen",
    uploadBtn: "Bild anhängen",
    attachedLabel: "Bild angehängt",
    welcomeText:
      "Hallo! Ich bin dein Homework Helper Assistent. Welche Aufgabe lösen wir heute?",
    newChat: "Neuer Chat",
    historyTitle: "Chatverlauf",
    modelNanoReady: "Chrome Gemini Nano (Lokal bereit)",
    modelNanoSetup: "Chrome Gemini Nano (Einrichtung erforderlich)",
    modelNanoClick: "Klicken für Gemini Nano Aktivierungsanleitung",
    modelAutoRotate: "Automatische Rotation",
    emptyHistory: "Keine gespeicherten Verläufe.<br>Starte einen neuen Chat!",
    loadingHistory: "Lade Chatverlauf...",
    chips: [
      {
        label: "Quadratische Gleichung",
        query:
          "Löse die quadratische Gleichung ax^2 + bx + c = 0 Schritt für Schritt",
      },
      {
        label: "Newtons Gesetze",
        query: "Erkläre die 3 Newtonschen Bewegungsgesetze mit Beispielen",
      },
      {
        label: "Chemische Gleichung",
        query: "Wie gleicht man chemische Reaktionsgleichungen aus?",
      },
    ],
    modes: {
      "step-by-step": "Schritt für Schritt",
      direct: "Direkte Antwort",
      hint: "Hinweis & Führung",
      explain: "Vertiefte Erklärung",
      translate: "Übersetzen",
    },
    cardHeading: "Detaillierte Lösung",
    nextQuestion: "Nächste Frage",
    continueInChat: "Im Chat fortsetzen",
    copyBtn: "Kopieren",
    copiedBtn: "Kopiert!",
    retryBtn: "Wiederholen",
    imagePromptHeader:
      "Bitte löse und erkläre diese Hausaufgabe aus dem Bild Schritt für Schritt mit LaTeX-Formeln ($...$) und hebe die Antwort hervor:",
    captureSolveText: "Aufgabe aus dem Screenshot lösen",
    toastNewChat: "Neuer Chat gestartet",
    chatCleared: "Chat gelöscht. Stelle eine neue Frage!",
    thinking: "Denke nach & löse...",
    tooltips: {
      newChat: {
        title: "Neuer Chat",
        desc: "Starte eine neue Hausaufgaben-Sitzung.",
      },
      history: {
        title: "Chatverlauf",
        desc: "Gespeicherte Lösungen anzeigen.",
      },
      lang: {
        title: "KI-Antwortsprache",
        desc: "Sprache, in der die KI Aufgaben erklärt und löst.",
      },
      mode: {
        title: "Lösungsmodus",
        desc: "Antwortformat: Schrittweise, Direkt, Hinweise oder Theorie.",
      },
      capture: {
        title: "Bildschirmaufnahme (Alt+C)",
        desc: "Schneide eine Aufgabe auf dem Bildschirm aus, um sie sofort zu lösen.",
      },
      upload: {
        title: "Bild hochladen",
        desc: "Hänge ein Bild von deinem Computer an.",
      },
      settings: {
        title: "Modelle & API-Keys",
        desc: "Verwalte KI-Anbieter und automatische Lastverteilung.",
      },
      clear: {
        title: "Chat leeren",
        desc: "Löscht alle Nachrichten der aktuellen Sitzung.",
      },
      options: {
        title: "Vollständige Einstellungen",
        desc: "Öffnet die Einstellungsseite zur Schlüsselverwaltung und Anpassung.",
      },
      close: {
        title: "Panel schließen",
        desc: "Klappt das Panel an den Bildschirmrand ein.",
      },
      open: {
        title: "Chat-Panel öffnen (Alt+K)",
        desc: "Öffnet den KI-Assistenten zum Lösen von Hausaufgaben und Fragen.",
      },
    },
    modalConfigTitle: "Modelle & API-Schlüssel Konfiguration",
    modalConfigDesc:
      "Füge einen oder mehrere API-Schlüssel hinzu. Die Erweiterung verteilt Anfragen automatisch und wechselt bei Rate-Limits nahtlos.",
    modalNanoTitle: "Chrome Gemini Nano (Lokale On-Device KI)",
    modalNanoDesc:
      "On-Device-KI, die komplett offline läuft. Klicke auf die Links unten, um Flags direkt zu öffnen:",
    modalBtnFlagPrompt: "1. #prompt-api öffnen",
    modalBtnFlagOptGuide: "2. #optimization-guide öffnen",
    modalBtnComponents: "3. Komponenten öffnen",
    modalBtnAddKey: "Modell & Schlüssel hinzufügen",
    modalLinkGuide: "Kostenlosen API-Schlüssel Leitfaden anzeigen →",
    modalKeyPlaceholder: "API-Schlüssel eingeben (sk-... / AIza...)",
  },
  selectionTooltip: {
    answer: "Lösen",
    copy: "Kopieren",
    search: "Suchen",
    translate: "Übersetzen",
    more: "Mehr Optionen",
    explain: "Erklären",
    summarize: "Zusammenfassen",
    grammar: "Grammatikprüfung",
    disable: "Deaktivieren",
    disableSession: "Bis zum nächsten Besuch deaktivieren",
    disablePage: "Für diese Seite deaktivieren",
    disableSite: "Für diese Website deaktivieren",
    disableGlobal: "Global deaktivieren",
    disableFooter: "In den Einstellungen jederzeit reaktivierbar",
  },
  cropper: {
    tip: "Klicken und ziehen, um Formel oder Frage auszuwählen (ESC zum Abbrechen)",
    cancel: "Abbrechen",
    askAi: "KI fragen",
  },
  floatingPopup: {
    helperTitle: "Homework Helper Assistent",
    translateTitle: "Übersetzen",
    translateHeading: "Übersetzung",
    searchTitle: "Suchen & Hausaufgabenhilfe",
    searchHeading: "Ergebnisse & Lösung",
    explainTitle: "Vertiefte Erklärung",
    explainHeading: "Konzept-Erklärung",
    summarizeTitle: "Zusammenfassung",
    summarizeHeading: "Wichtige Punkte",
    grammarTitle: "Grammatikprüfung",
    grammarHeading: "Korrektur & Verfeinerung",
    answerHeading: "Detaillierte Lösung",
    nextQuestion: "Nächste Frage",
    continueInChat: "Im Chat fortsetzen",
    copy: "Kopieren",
    copied: "Kopiert!",
    retry: "Wiederholen",
    processing: "Anfrage wird verarbeitet...",
    solvingStepByStep: "Löse Schritt für Schritt mit KaTeX-Formeln...",
    scanningOcr: "Scanne Text & Formeln mit lokalem OCR...",
    autoDetect: "Automatisch erkennen",
    historyTitle: "Fragenverlauf",
    historyDesc: "Überprüfe kürzlich gelöste Aufgaben und Sitzungen.",
    closeTitle: "Fenster schließen",
    closeDesc: "Lösungs-Popup schließen",
    addConvTitle: "Neuer Chat",
    addConvDesc: "Starte eine neue Hausaufgaben-Konversation.",
    closeHistoryTitle: "Verlauf schließen",
    closeHistoryDesc: "Verlaufspanel schließen.",
    openInDrawerBtn: "Vollständig im Chat-Panel öffnen",
  },
  popup: {
    brandSub: "Akademische KI ohne Login",
    openSidePanel: "KI-Seitenleiste öffnen",
    openSidePanelDesc: "Arbeitsbereich neben jeder Webseite",
    cropSolve: "Ausschneiden & Lösen (Alt+C)",
    cropSolveDesc: "Formeln oder Diagramme auswählen",
    keysPool: "Aktive Schlüssel:",
    rotationMode: "Rotationsmodus:",
    formsAssistant: "Google Forms Assistent",
    selectionTooltip: "Auswahl-Symbolleiste",
    configureBtn: "Modelle & Keys konfigurieren",
  },
  options: {
    navProviders: "Modelle & API-Keys",
    navOcr: "Lokale OCR-Modelle",
    navAppearance: "Design & UI",
    navGuide: "Kostenloser Key-Leitfaden",
    navPrompt: "Systemanweisungen (Prompt)",
    navGeneral: "Allgemeine Einstellungen",
    brandDesc: "Akademische KI ohne Login",
    headingProviders: "KI-Modelle & API-Key-Pool",
    subheadingProviders:
      "Füge einen oder mehrere API-Keys hinzu. Die Erweiterung verteilt die Last und schaltet bei Limits automatisch um.",
    strategyTitle: "Rotationsstrategie",
    strategyDesc:
      "Wähle die Auswahlmethode der aktiven Schlüssel bei Anfragen.",
    statTotal: "Konfigurierte Schlüssel",
    statActive: "Bereit und nutzbar",
    statCooldown: "Pause (60s)",
    btnAddKey: "KI-Anbieter / Key hinzufügen",
    headingOcr: "Lokale OCR-Modellpakete (Offline)",
    subheadingOcr:
      "Lade Offline-Erkennungsmodelle für Formeln und Texte via Tesseract.js herunter.",
    btnCheckUpdates: "Nach Updates suchen",
    btnDownloadCore: "Kernpaket herunterladen (Deutsch + Englisch + Mathe)",
    corePackTitle: "Integriertes Kern-OCR-Paket",
    corePackBadge: "Empfohlen",
    corePackDesc:
      "Hohe Präzision für lateinische Zeichen, mathematische Formeln, Deutsch und Englisch.",
    allOcrTitle: "Alle Sprachpakete",
    allOcrSub: "Lade spezialisierte Offline-Sprachpakete nach Bedarf herunter.",
    headingAppearance: "Visuelle Anpassung",
    subheadingAppearance:
      "Passe schwebende Buttons (FAB), Auswahlleisten, Liquid Glass Transparenz und Unschärfe an.",
    cardFabTitle: "Schwebende Buttons (Floating FABs)",
    labelFabDisplay: "Schwebende Buttons auf Webseiten anzeigen",
    descFabDisplay:
      "Zeigt Schnellzugriff-Buttons am Bildschirmrand zum Öffnen von Chat und Screenshot.",
    labelFabSize: "Button-Größe",
    cardToolbarTitle: "Textauswahl-Symbolleiste (Selection Toolbar)",
    labelToolbarTheme: "Farbthema der Leiste",
    labelToolbarText: "Beschriftung neben Icons anzeigen",
    descToolbarText:
      "Zeigt Aktionsnamen (Lösen, Kopieren, Suchen, Übersetzen) neben den Symbolen.",
    labelToolbarSize: "Leistengröße",
    labelToolbarOpacity: "Transparenz der Leiste",
    labelToolbarBlur: "Hintergrundunschärfe (Backdrop Blur)",
    cardPopupTitle: "Schwebendes Lösungs- und Übersetzungspopup",
    labelPopupOpacity: "Popup-Transparenz",
    labelPopupBlur: "Hintergrundunschärfe (Blur)",
    livePreviewBadge: "Live-Vorschau",
    livePreviewSub:
      "Echtzeit-Simulation des Liquid Glass Designs mit deinen Einstellungen.",
    headingGuide: "Kostenlose API-Keys & Offizielle Portale",
    subheadingGuide:
      "100% offizielle und kostenlose Keys führender KI-Anbieter mit hohen Nutzungskontingenten.",
    guideWhyTitle: "Warum mehrere API-Keys hinzufügen?",
    guideWhy1:
      "Automatisches Failover: Erreicht ein Key das Limit (429), springt sofort der nächste ein.",
    guideWhy2:
      "Lastverteilung: Verteilt Anfragen gleichmäßig, um Drosselungen zu vermeiden.",
    guideWhy3:
      "Kostenlos: Kombiniere Gratis-Kontingente verschiedener Cloud-Anbieter.",
    guideHowTitle: "Wie funktioniert es?",
    guideHow1:
      "Hole dir Gratis-Keys von offiziellen Portalen (Google AI Studio, Groq, OpenRouter...).",
    guideHow2:
      'Füge sie im Tab "Modelle & API-Keys" ein und teste die Verbindung.',
    guideHow3:
      "Die Erweiterung regelt die Rotation im Hintergrund automatisch.",
    guideLinksTitle: "Offizielle Portale für Gratis-Keys",
    linkSubGemini: "Kostenlos 15 RPM, ultraschnell und exzellente Bildanalyse.",
    linkSubGroq:
      "Extrem schnelle Inferenz (500+ tokens/s), unterstützt Llama 3 & DeepSeek.",
    linkSubOpenAI: "Branchenstandard für akademische Logik und Argumentation.",
    linkSubDeepSeek: "Führendes Modell für Mathematik und Programmierung.",
    linkSubClaude: "Herausragendes Diagrammverständnis und klare Erklärungen.",
    headingPrompt: "System-Prompts & Lösungsstil",
    subheadingPrompt:
      "Passe maßgeschneiderte System-Prompts für Cloud- und On-Device-Modelle separat an.",
    cardCloudPromptTitle:
      "1. System-Prompt für Cloud-Modelle (Gemini, OpenAI, Claude, DeepSeek)",
    cardCloudPromptDesc:
      "Optimiert für Cloud-Modelle mit hunderten Milliarden Parametern, tiefe pädagogische Analyse, LaTeX und Bilderkennung.",
    cardNanoPromptTitle:
      "2. System-Prompt für Chrome Gemini Nano (On-Device Local AI)",
    cardNanoPromptDesc:
      "Speziell für das lokale ~3B-Modell in Chrome. Präzise, direkt und erzwingt Faktenprüfung vor der Antwortauswahl.",
    btnResetPrompt: "Standard wiederherstellen",
    btnSavePrompt: "Cloud-Prompt speichern",
    btnResetNanoPrompt: "Standard wiederherstellen",
    btnSaveNanoPrompt: "Nano-Prompt speichern",
    headingGeneral: "Allgemeine Einstellungen & Sprache",
    subheadingGeneral:
      "Verwalte Antwortsprache, Google Forms Assistent und Datensicherungen.",
    uiLangTitle: "Oberflächensprache (UI Language)",
    uiLangDesc:
      "Sprache aller Schaltflächen, Seitenleisten und Einstellungsmenüs.",
    respLangTitle: "KI-Antwortsprache",
    respLangDesc: "Sprache, in der die KI Aufgaben löst und erklärt.",
    formsTitle: "Google Forms Assistent",
    formsDesc:
      "Erkennt Fragen in Google Forms automatisch und bietet Ein-Klick-Lösungsbuttons.",
    tooltipTitle: "Textauswahl-Symbolleiste",
    tooltipDesc:
      "Zeigt die Aktionsleiste an, wenn du Text auf einer Webseite markierst.",
    disabledSitesTitle: "Deaktivierte Webseiten",
    disabledSitesDesc:
      "Auf diesen Domains bleibt die Erweiterung vollständig inaktiv.",
    noDisabledSites: "Keine deaktivierten Webseiten vorhanden.",
    backupTitle: "Sicherung & Datenverwaltung",
    backupDesc:
      "Exportiere die Konfiguration als JSON oder lösche den gespeicherten Chatverlauf.",
    btnExport: "JSON-Konfiguration exportieren",
    btnClearData: "Gesamten Chatverlauf löschen",
    aboutTitle: "Über & Versionsinfo",
    aboutDesc:
      "Homework Helper - KI-Assistent für Hausaufgaben und akademisches Lernen.",
    keyPlaceholder: "API-Key eingeben",
    deleteKey: "Diese Konfiguration löschen",
    toastLangUpdated: "Anzeigesprache erfolgreich aktualisiert!",
    toastPromptSaved: "Systemanweisungen erfolgreich gespeichert!",
    toastDataCleared: "Gesamter Chatverlauf wurde gelöscht!",
    stratPreferNanoTitle: "Gemini Nano bevorzugen (Empfohlen)",
    stratPreferNanoDesc:
      "Nutzt lokales Gemini Nano wenn verfügbar und wechselt bei komplexen Bildaufgaben nahtlos zu Cloud-APIs.",
    stratNanoOnlyTitle: "Nur Gemini Nano",
    stratNanoOnlyDesc:
      "100% kostenlos & offline, sendet keine Anfragen an externe Cloud-APIs.",
    stratConfigOnlyTitle: "Nur konfigurierte Cloud-APIs",
    stratConfigOnlyDesc:
      "Nutzt die unten hinterlegten Cloud-API-Schlüssel mit automatischer Lastverteilung.",
    builtinNanoTitle: "Chrome integrierte KI (Gemini Nano On-Device)",
    builtinNanoDesc:
      "Lokales KI-Modell, das 100% auf deinem Rechner läuft. Kein API-Schlüssel nötig, komplett kostenlos und offline-fähig.",
    btnOpenFlags: "chrome://flags öffnen",
    btnTestBuiltinAI: "Integriertes Modell testen",
    guideNanoStepsTitle:
      "So aktivierst du Chrome Gemini Nano (Klicke auf die Links, um Flags direkt zu öffnen):",
    guideNanoStep1:
      "Schritt 1: Öffne chrome://flags/#prompt-api-for-gemini-nano → Wähle Enabled (oder Enabled Multilingual).",
    guideNanoStep2:
      "Schritt 2 (Erforderlich): Öffne chrome://flags/#optimization-guide-on-device-model → Wähle Enabled BypassPerfRequirement.",
    guideNanoStep3:
      "Schritt 3: Klicke unten auf Relaunch (Neu starten), um Chrome neu zu laden.",
    guideNanoStep4:
      "Schritt 4 (Modell herunterladen): Öffne chrome://components → Suche Optimization Guide On Device Model und klicke auf Nach Updates suchen.",
    guideNanoStep5:
      'Schritt 5: Klicke oben auf "Integriertes Modell testen" zur Überprüfung.',
    testConnection: "Verbindung testen",
    testingConnection: "Teste...",
    keyValid: "Schlüssel gültig & funktionsfähig",
    keyInvalid: "Verbindungsfehler:",
    enterKeyFirst: "Bitte gib vor dem Testen einen API-Schlüssel ein",
    statusReady: "Status: Bereit",
    btnGetKeyGemini: "Gemini Schlüssel holen →",
    btnGetKeyGroq: "Groq Schlüssel holen →",
    btnGetKeyOpenAI: "OpenAI Schlüssel holen →",
    btnGetKeyDeepSeek: "DeepSeek Schlüssel holen →",
    btnGetKeyClaude: "Claude Schlüssel holen →",
  },
};
