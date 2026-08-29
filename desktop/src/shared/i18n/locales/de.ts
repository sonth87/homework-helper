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
} as const satisfies Dictionary;
