/**
 * Bản dịch tiếng Trung phồn thể.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: '語言',
  groupAi: 'AI 與模型',
  groupPrivacy: '隱私',
  groupSystem: '系統',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: '介面語言',
  setUiLanguageDesc: '應用程式本身的語言——選單、標籤、提示訊息。',
  setOutputLanguage: '回答語言',
  setOutputLanguageDesc: 'AI 撰寫答案所用的語言，與介面語言互相獨立。',
  setTranslateTarget: '翻譯為',
  setTranslateTargetDesc: '滑鼠停留翻譯時的預設目標語言。',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: '自動偵測',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: '路由策略',
  setRoutingStrategyDesc: '回答問題時優先使用哪種模型。',
  routingPreferConfig: '優先使用已設定的金鑰',
  routingPreferLocal: '優先使用本機模型',
  routingLocalOnly: '僅使用本機模型',
  routingConfigOnly: '僅使用已設定的金鑰',

  setRotationStrategy: '金鑰輪替',
  setRotationStrategyDesc: '啟用多組金鑰時的挑選方式。',
  rotationRoundRobin: '依序輪替',
  rotationRandom: '隨機',
  rotationFallback: '僅在出錯時切換',

  setRequestTimeout: '請求逾時',
  setRequestTimeoutDesc: '推理模型在給出第一個字之前可能會沉默很久。',
  setMaxRetries: '最大重試次數',
  setMaxRetriesDesc: '放棄前最多嘗試幾組金鑰。',
  setThinkingEnabled: '啟用深度思考',
  setThinkingEnabledDesc: '讓支援的模型先推理再作答。較慢但更準確。',
  setMaxRequestsPerMinute: '每分鐘請求上限',
  setMaxRequestsPerMinuteDesc: '防止意外費用的安全網。超出限制的請求會被拒絕。',
  setMonthlyTokenBudget: '每月 Token 預算',
  setMonthlyTokenBudgetDesc: '用量接近此數值時發出提醒。填 0 表示不限制。',
  setOllamaBaseUrl: 'Ollama 位址',
  setLmStudioBaseUrl: 'LM Studio 位址',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: '排除的應用程式',
  setExcludedAppsDesc: '這些程式位於前景時，本應用程式絕不讀取螢幕。',
  setPauseWhenScreenSharing: '分享螢幕時暫停',
  setPauseWhenScreenSharingDesc: '在分享或錄製螢幕期間隱藏所有浮層。',
  setPauseOnSensitiveApps: '敏感應用程式中暫停',
  setPauseOnSensitiveAppsDesc: '當密碼管理器或銀行應用程式位於前景時自動停止。',
  setLocalModelsOnly: '僅使用本機模型',
  setLocalModelsOnlyDesc: '絕不向雲端傳送任何文字或影像。沒有任何內容離開這台裝置。',
  setSaveHistory: '儲存對話紀錄',
  setSaveHistoryDesc: '保留過往的提問與解答，方便隨時回顧。',
  setHistoryRetention: '紀錄保留天數',
  setHistoryRetentionDesc: '保留紀錄的天數。填 0 表示永久保留。',
  setTelemetry: '傳送匿名使用數據',
  setTelemetryDesc: '協助改善應用程式。絕不包含螢幕內容或您的提問。',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: '開機自動啟動',
  setLaunchAtLoginDesc: '登入系統時自動啟動本應用程式。',
  setHideFromDock: '隱藏 Dock 圖示',
  setHideFromDockDesc: '僅在選單列執行，不顯示 Dock 或工作列圖示。',
  setAutoUpdate: '自動更新',
  setAutoUpdateDesc: '在背景下載並安裝新版本。',
  setUpdateChannel: '更新頻道',
  setUpdateChannelDesc: 'Beta 頻道更早取得新功能，但遇到問題的機率較高。',
  channelStable: '穩定版', channelBeta: '測試版',
  setLogLevel: '日誌等級',
  setLogLevelDesc: '回報問題時調高此項，日誌會記錄更多細節。',
  logError: '僅錯誤', logWarn: '警告', logInfo: '一般', logDebug: '詳細',
  setDebugOverlay: '偵錯浮層',
  setDebugOverlayDesc: '在辨識到的文字周圍繪製邊框。回報辨識問題時很有用。',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: '翻譯',
  intentSolve: '解題',
  intentSummarize: '摘要',
  intentExplain: '講解',
  intentRewrite: '改寫',
  intentChat: '對話',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: '快速鍵',
  setHotkeys: '全域快速鍵',
  setHotkeysDesc: '在任何應用程式中都可使用的按鍵。留空即停用該快速鍵。',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'AI 服務商與金鑰',
  setApiConfigs: '已設定的模型',
  keysAdd: '新增模型',
  keysEmpty: '尚未設定任何模型。新增一個即可開始。',
  keysTest: '測試連線',
  keysTesting: '測試中…',
  keysOk: '已連線',
  keysRemove: '移除',
  keysKeySaved: '金鑰已儲存',
  keysKeyPlaceholder: '貼上 API 金鑰',
  keysGetKey: '取得金鑰',
  keysNoKeyNeeded: '不需金鑰 — 在你的裝置上執行',
  keysModel: '模型',
  keysBaseUrl: '位址',
  keysLabel: '名稱',
  keysEnabled: '啟用',
  keysVision: '可讀取影像',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: '任務',
  setStudyMode: '預設學習模式',
  setStudyModeDesc: 'AI 預設的回答方式。每次解答仍可單獨變更。',
  modeStepByStep: '逐步解題',
  modeDirect: '僅給答案',
  modeHint: '只給提示',
  modeExplain: '深入講解',
  modeTranslate: '學術翻譯',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: '儲存',
  setMaxConversations: '保留的對話數',
  setMaxConversationsDesc: '超出此上限時，較舊的對話會被刪除。',
  setCacheTtl: '翻譯快取有效期',
  setCacheTtlDesc: '快取的譯文在重新取得前可用的天數。',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: '懸停翻譯',
  setHoverEnabled: '啟用懸停翻譯',
  setHoverEnabledDesc: '將滑鼠懸停在螢幕上任意文字時顯示譯文。',
  setHoverDelay: '觸發延遲',
  setHoverDelayDesc: '游標需靜止多久才會查詢譯文。',
  setHoverTolerance: '移動容差',
  setHoverToleranceDesc: '此半徑內的輕微抖動仍視為靜止。',
  setHoverModifiers: '觸發按鍵',
  setHoverModifiersDesc: '懸停時需按住的按鍵。留空則懸停即觸發，不需按鍵。',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',
} as const satisfies Dictionary;
