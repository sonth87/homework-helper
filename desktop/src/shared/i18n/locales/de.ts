/**
 * Bản dịch tiếng Đức.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'Sprache',
  groupAi: 'KI und Modelle',
  groupPrivacy: 'Privatsphäre',
  groupSystem: 'System',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'Sprache der Oberfläche',
  setUiLanguageDesc: 'Sprache der App selbst – Menüs, Beschriftungen, Meldungen.',
  setOutputLanguage: 'Sprache der Antworten',
  setOutputLanguageDesc: 'Sprache, in der die KI ihre Antworten schreibt. Unabhängig von der Oberflächensprache.',
  setTranslateTarget: 'Übersetzen nach',
  setTranslateTargetDesc: 'Standard-Zielsprache beim Übersetzen per Mauszeiger.',
  setTranslateProviders: 'Übersetzungsdienste',
  setTranslateProvidersDesc: 'Reihenfolge beim Übersetzen per Mauszeiger — wechselt automatisch zum nächsten, wenn einer fehlschlägt.',
  translateProviderGoogle: 'Google Übersetzer',
  translateProviderBing: 'Bing Übersetzer',
  translateProviderMymemory: 'MyMemory',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'Automatisch erkennen',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'Routing-Strategie',
  setRoutingStrategyDesc: 'Welches Modell beim Antworten zuerst verwendet wird.',
  routingPreferConfig: 'Eingerichtete Schlüssel bevorzugen',
  routingPreferLocal: 'Lokale Modelle bevorzugen',
  routingLocalOnly: 'Nur lokale Modelle',
  routingConfigOnly: 'Nur eingerichtete Schlüssel',

  setRotationStrategy: 'Schlüsselwechsel',
  setRotationStrategyDesc: 'Wie zwischen mehreren aktiven Schlüsseln gewählt wird.',
  rotationRoundRobin: 'Der Reihe nach',
  rotationRandom: 'Zufällig',
  rotationFallback: 'Nur bei Fehler wechseln',

  setRequestTimeout: 'Zeitlimit',
  setRequestTimeoutDesc: 'Denkende Modelle bleiben oft lange still, bevor das erste Wort kommt.',
  setMaxRetries: 'Maximale Wiederholungen',
  setMaxRetriesDesc: 'Wie viele Schlüssel versucht werden, bevor aufgegeben wird.',
  setThinkingEnabled: 'Denkmodus aktivieren',
  setThinkingEnabledDesc: 'Lässt geeignete Modelle vor der Antwort nachdenken. Langsamer, aber genauer.',
  setMaxRequestsPerMinute: 'Anfragen pro Minute',
  setMaxRequestsPerMinuteDesc: 'Sicherheitsnetz gegen unerwartete Kosten. Anfragen über dem Limit werden abgelehnt.',
  setMonthlyTokenBudget: 'Monatliches Token-Budget',
  setMonthlyTokenBudgetDesc: 'Warnt, wenn sich die Nutzung diesem Wert nähert. 0 bedeutet unbegrenzt.',
  setOllamaBaseUrl: 'Ollama-Adresse',
  setLmStudioBaseUrl: 'LM-Studio-Adresse',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'Ausgeschlossene Programme',
  setExcludedAppsDesc: 'Solange diese Programme im Vordergrund sind, wird der Bildschirm nie gelesen.',
  setPauseWhenScreenSharing: 'Bei Bildschirmfreigabe pausieren',
  setPauseWhenScreenSharingDesc: 'Blendet während Freigabe oder Aufnahme alle Overlays aus.',
  setPauseOnSensitiveApps: 'Bei sensiblen Programmen pausieren',
  setPauseOnSensitiveAppsDesc: 'Stoppt automatisch, wenn ein Passwortmanager oder eine Banking-App im Vordergrund ist.',
  setLocalModelsOnly: 'Nur lokale Modelle',
  setLocalModelsOnlyDesc: 'Sendet weder Text noch Bilder in die Cloud. Nichts verlässt dieses Gerät.',
  setSaveHistory: 'Gesprächsverlauf speichern',
  setSaveHistoryDesc: 'Bewahrt frühere Fragen und Antworten zum Nachschlagen auf.',
  setHistoryRetention: 'Verlauf löschen nach',
  setHistoryRetentionDesc: 'Anzahl Tage, die der Verlauf aufbewahrt wird. 0 bedeutet dauerhaft.',
  setTelemetry: 'Anonyme Nutzungsdaten senden',
  setTelemetryDesc: 'Hilft, die App zu verbessern. Enthält nie Bildschirminhalte oder Ihre Fragen.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'Beim Anmelden starten',
  setLaunchAtLoginDesc: 'Startet die App automatisch bei der Anmeldung.',
  setHideFromDock: 'Im Dock ausblenden',
  setHideFromDockDesc: 'Läuft nur in der Menüleiste, ohne Symbol im Dock oder in der Taskleiste.',
  setAutoUpdate: 'Automatisch aktualisieren',
  setAutoUpdateDesc: 'Lädt neue Versionen im Hintergrund herunter und installiert sie.',
  setUpdateChannel: 'Update-Kanal',
  setUpdateChannelDesc: 'Beta erhält Neuerungen früher, mit höherer Fehlerwahrscheinlichkeit.',
  channelStable: 'Stabil', channelBeta: 'Beta',
  setLogLevel: 'Protokollstufe',
  setLogLevelDesc: 'Erhöhen Sie diese beim Melden eines Problems, damit die Protokolle mehr Details enthalten.',
  logError: 'Nur Fehler', logWarn: 'Warnungen', logInfo: 'Normal', logDebug: 'Ausführlich',
  setDebugOverlay: 'Debug-Overlay',
  setDebugOverlayDesc: 'Zeichnet Rahmen um erkannten Text. Hilfreich beim Melden von Erkennungsproblemen.',

  // ── Xin quyền hệ thống (onboarding) ────────────────────────────────────────
  onboardingTitle: 'Systemberechtigungen',
  onboardingIntro: 'Homework Helper benötigt zwei macOS-Berechtigungen, um überall auf dem Bildschirm zu übersetzen und Aufgaben zu lösen. Beide sind erforderlich — fehlt eine davon, kann die App den Bildschirminhalt nicht lesen.',
  onboardingAccessibilityTitle: 'Bedienungshilfen (Accessibility)',
  onboardingAccessibilityDesc: 'Ermöglicht der App, Text unter dem Mauszeiger zu lesen und sofort zu übersetzen — der schnelle Weg für die meisten Apps.',
  onboardingScreenTitle: 'Bildschirmaufnahme (Screen Recording)',
  onboardingScreenDesc: 'Ermöglicht der App, den Bildschirm aufzunehmen — genutzt für Ausschnitt & Lösen sowie als Alternative, wenn Text nicht direkt gelesen werden kann (PDFs, manche Editoren).',
  onboardingGranted: 'Erteilt',
  onboardingNotGranted: 'Nicht erteilt',
  onboardingOpenPane: 'Systemeinstellungen öffnen',
  onboardingNeedsRestart: 'Berechtigungen erteilt. Starte die App neu, damit dies wirksam wird — macOS wendet neue Berechtigungen nicht auf einen bereits laufenden Prozess an.',
  onboardingRelaunch: 'Jetzt neu starten',
  onboardingSkip: 'Später',
  onboardingReopenLabel: 'Systemberechtigungen',
  onboardingReopenDesc: 'Die von Homework Helper benötigten Berechtigungen prüfen oder erneut erteilen.',
  onboardingReopenButton: 'Prüfen',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'Übersetzen',
  intentSolve: 'Aufgabe lösen',
  intentSummarize: 'Zusammenfassen',
  intentExplain: 'Erklären',
  intentRewrite: 'Umformulieren',
  intentChat: 'Chat',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'Tastenkürzel',
  setHotkeys: 'Globale Tastenkürzel',
  setHotkeysDesc: 'Tasten, die aus jeder Anwendung heraus funktionieren. Leer lassen, um ein Kürzel zu deaktivieren.',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'KI-Anbieter und Schlüssel',
  setApiConfigs: 'Eingerichtete Modelle',
  keysAdd: 'Modell hinzufügen',
  keysEmpty: 'Noch keine Modelle eingerichtet. Fügen Sie eines hinzu.',
  keysTest: 'Verbindung testen',
  keysTesting: 'Wird getestet…',
  keysOk: 'Verbunden',
  keysRemove: 'Entfernen',
  keysKeySaved: 'Schlüssel gespeichert',
  keysKeyPlaceholder: 'API-Schlüssel einfügen',
  keysGetKey: 'Schlüssel holen',
  keysNoKeyNeeded: 'Kein Schlüssel nötig — läuft auf Ihrem Gerät',
  keysModel: 'Modell',
  keysBaseUrl: 'Adresse',
  keysLabel: 'Name',
  keysEnabled: 'Aktiv',
  keysVision: 'Liest Bilder',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: 'Aufgaben',
  setStudyMode: 'Standard-Lernmodus',
  setStudyModeDesc: 'Wie die KI standardmäßig antwortet. Pro Antwort änderbar.',
  modeStepByStep: 'Schritt für Schritt',
  modeDirect: 'Nur die Antwort',
  modeHint: 'Nur Hinweise',
  modeExplain: 'Ausführliche Erklärung',
  modeTranslate: 'Wissenschaftliche Übersetzung',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: 'Speicher',
  setMaxConversations: 'Aufzubewahrende Gespräche',
  setMaxConversationsDesc: 'Ältere Gespräche werden gelöscht, sobald dieses Limit überschritten ist.',
  setCacheTtl: 'Gültigkeit des Übersetzungs-Caches',
  setCacheTtlDesc: 'Tage, die eine zwischengespeicherte Übersetzung gültig bleibt.',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: 'Übersetzung beim Überfahren',
  setHoverEnabled: 'Übersetzung beim Überfahren aktivieren',
  setHoverEnabledDesc: 'Zeigt eine Übersetzung, wenn Sie mit dem Mauszeiger über Text fahren.',
  setClipboardWatcher: 'Zwischenablage-Überwachung aktivieren',
  setClipboardWatcherDesc: 'Zeigt eine schwebende Aktionsleiste (Übersetzen / Zusammenfassen / Erklären / Umschreiben), sobald Sie irgendwo auf dem Bildschirm Text kopieren.',
  setHoverDelay: 'Auslöseverzögerung',
  setHoverDelayDesc: 'Wie lange der Zeiger stillstehen muss, bevor eine Übersetzung gesucht wird.',
  setHoverTolerance: 'Bewegungstoleranz',
  setHoverToleranceDesc: 'Leichtes Zittern innerhalb dieses Radius zählt weiterhin als still.',
  setHoverModifiers: 'Auslösetasten',
  setHoverModifiersDesc: 'Tasten, die beim Überfahren gehalten werden müssen. Leer lassen, um allein durch Überfahren auszulösen.',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',

  // ── Mức chi tiết hover ────────────────────────────────────────────────────
  setHoverGranularity: 'Detailgrad',
  setHoverGranularityDesc: 'Wie viel Text auf einmal übersetzt wird.',
  granWord: 'Wort',
  granSentence: 'Satz',
  granParagraph: 'Absatz',
} as const satisfies Dictionary;
