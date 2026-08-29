/**
 * Locale tham chiếu. Kiểu I18nKey được suy ra từ chính file này (keys.ts),
 * nên thiếu key ở locale khác là LỖI BIÊN DỊCH — không phải fallback im lặng.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Thêm key ở đây không áp dụng cho extension và ngược lại.
 */
export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'Language',
  groupAi: 'AI & Models',
  groupPrivacy: 'Privacy',
  groupSystem: 'System',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'Interface language',
  setUiLanguageDesc: 'Language of the app itself — menus, labels, messages.',
  setOutputLanguage: 'Answer language',
  setOutputLanguageDesc: 'Language the AI writes its answers in. Independent of the interface language.',
  setTranslateTarget: 'Translate into',
  setTranslateTargetDesc: 'Default target language for hover translation.',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'Auto-detect',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'Routing strategy',
  setRoutingStrategyDesc: 'Which model to reach for first when answering.',
  routingPreferConfig: 'Prefer configured keys',
  routingPreferLocal: 'Prefer local models',
  routingLocalOnly: 'Local models only',
  routingConfigOnly: 'Configured keys only',

  setRotationStrategy: 'Key rotation',
  setRotationStrategyDesc: 'How to pick among several enabled keys.',
  rotationRoundRobin: 'Round-robin',
  rotationRandom: 'Random',
  rotationFallback: 'Switch only on error',

  setRequestTimeout: 'Request timeout',
  setRequestTimeoutDesc: 'Reasoning models can stay silent for a long time before the first word arrives.',
  setMaxRetries: 'Max retries',
  setMaxRetriesDesc: 'How many keys to try before giving up.',
  setThinkingEnabled: 'Enable thinking',
  setThinkingEnabledDesc: 'Let models that support it reason before answering. Slower but more accurate.',
  setMaxRequestsPerMinute: 'Request limit per minute',
  setMaxRequestsPerMinuteDesc: 'Safety net against unexpected cost. Requests beyond the limit are refused.',
  setMonthlyTokenBudget: 'Monthly token budget',
  setMonthlyTokenBudgetDesc: 'Warn when usage approaches this number. 0 means no limit.',
  setOllamaBaseUrl: 'Ollama address',
  setLmStudioBaseUrl: 'LM Studio address',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'Excluded apps',
  setExcludedAppsDesc: 'The app never reads the screen while these applications are in focus.',
  setPauseWhenScreenSharing: 'Pause while sharing screen',
  setPauseWhenScreenSharingDesc: 'Hide every overlay during a screen share or recording.',
  setPauseOnSensitiveApps: 'Pause on sensitive apps',
  setPauseOnSensitiveAppsDesc: 'Automatically stop when a password manager or banking app is in focus.',
  setLocalModelsOnly: 'Local models only',
  setLocalModelsOnlyDesc: 'Never send text or images to a cloud service. Nothing leaves this machine.',
  setSaveHistory: 'Save conversation history',
  setSaveHistoryDesc: 'Keep past questions and answers so you can return to them.',
  setHistoryRetention: 'Delete history after',
  setHistoryRetentionDesc: 'Number of days to keep history. 0 means keep forever.',
  setTelemetry: 'Send anonymous usage data',
  setTelemetryDesc: 'Helps improve the app. Never includes screen content or your questions.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'Launch at login',
  setLaunchAtLoginDesc: 'Start the app automatically when you sign in.',
  setHideFromDock: 'Hide from Dock',
  setHideFromDockDesc: 'Run from the menu bar only, without a Dock or taskbar icon.',
  setAutoUpdate: 'Update automatically',
  setAutoUpdateDesc: 'Download and install new versions in the background.',
  setUpdateChannel: 'Update channel',
  setUpdateChannelDesc: 'Beta gets new features earlier, with a higher chance of bugs.',
  channelStable: 'Stable', channelBeta: 'Beta',
  setLogLevel: 'Log level',
  setLogLevelDesc: 'Raise this when reporting a problem so logs carry more detail.',
  logError: 'Errors only', logWarn: 'Warnings', logInfo: 'Normal', logDebug: 'Detailed',
  setDebugOverlay: 'Debug overlay',
  setDebugOverlayDesc: 'Draw boxes around detected text. Useful when reporting recognition problems.',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'Translate',
  intentSolve: 'Solve',
  intentSummarize: 'Summarize',
  intentExplain: 'Explain',
  intentRewrite: 'Rewrite',
  intentChat: 'Chat',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'Shortcuts',
  setHotkeys: 'Global shortcuts',
  setHotkeysDesc: 'Keys that work from any application. Leave empty to disable a shortcut.',
} as const;
