/**
 * Bản dịch tiếng Trung giản thể.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: '语言',
  groupAi: 'AI 与模型',
  groupPrivacy: '隐私',
  groupSystem: '系统',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: '界面语言',
  setUiLanguageDesc: '应用自身的语言——菜单、标签、提示信息。',
  setOutputLanguage: '回答语言',
  setOutputLanguageDesc: 'AI 撰写答案所用的语言，与界面语言相互独立。',
  setTranslateTarget: '翻译为',
  setTranslateTargetDesc: '悬停翻译时的默认目标语言。',
  setTranslateProviders: '翻译服务',
  setTranslateProvidersDesc: '悬停翻译时尝试的顺序——如果某个服务失败，会自动切换到下一个。',
  translateProviderGoogle: 'Google 翻译',
  translateProviderBing: '必应翻译',
  translateProviderMymemory: 'MyMemory',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: '自动检测',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: '路由策略',
  setRoutingStrategyDesc: '回答问题时优先使用哪种模型。',
  routingPreferConfig: '优先使用已配置的密钥',
  routingPreferLocal: '优先使用本地模型',
  routingLocalOnly: '仅使用本地模型',
  routingConfigOnly: '仅使用已配置的密钥',

  setRotationStrategy: '密钥轮换',
  setRotationStrategyDesc: '启用多个密钥时的选择方式。',
  rotationRoundRobin: '依次轮换',
  rotationRandom: '随机',
  rotationFallback: '仅在出错时切换',

  setRequestTimeout: '请求超时',
  setRequestTimeoutDesc: '推理模型在给出第一个字之前可能会长时间沉默。',
  setMaxRetries: '最大重试次数',
  setMaxRetriesDesc: '放弃前最多尝试多少个密钥。',
  setThinkingEnabled: '启用深度思考',
  setThinkingEnabledDesc: '让支持的模型先推理再作答。速度更慢，但更准确。',
  setMaxRequestsPerMinute: '每分钟请求上限',
  setMaxRequestsPerMinuteDesc: '防止意外费用的安全网。超出限制的请求会被拒绝。',
  setMonthlyTokenBudget: '每月 Token 预算',
  setMonthlyTokenBudgetDesc: '用量接近该数值时发出提醒。填 0 表示不限制。',
  setOllamaBaseUrl: 'Ollama 地址',
  setLmStudioBaseUrl: 'LM Studio 地址',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: '排除的应用',
  setExcludedAppsDesc: '这些程序处于前台时，本应用绝不读取屏幕。',
  setPauseWhenScreenSharing: '共享屏幕时暂停',
  setPauseWhenScreenSharingDesc: '在共享或录制屏幕期间隐藏所有浮层。',
  setPauseOnSensitiveApps: '敏感应用中暂停',
  setPauseOnSensitiveAppsDesc: '当密码管理器或银行应用处于前台时自动停止。',
  setLocalModelsOnly: '仅使用本地模型',
  setLocalModelsOnlyDesc: '绝不向云端发送任何文字或图像。没有任何内容离开这台设备。',
  setSaveHistory: '保存对话历史',
  setSaveHistoryDesc: '保留以往的提问与解答，便于随时回看。',
  setHistoryRetention: '历史保留天数',
  setHistoryRetentionDesc: '保留历史记录的天数。填 0 表示永久保留。',
  setTelemetry: '发送匿名使用数据',
  setTelemetryDesc: '帮助改进应用。绝不包含屏幕内容或您的提问。',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: '开机自动启动',
  setLaunchAtLoginDesc: '登录系统时自动启动本应用。',
  setHideFromDock: '隐藏程序坞图标',
  setHideFromDockDesc: '仅在菜单栏运行，不显示程序坞或任务栏图标。',
  setAutoUpdate: '自动更新',
  setAutoUpdateDesc: '在后台下载并安装新版本。',
  setUpdateChannel: '更新通道',
  setUpdateChannelDesc: 'Beta 通道更早获得新功能，但遇到问题的可能性更高。',
  channelStable: '稳定版', channelBeta: '测试版',
  setLogLevel: '日志级别',
  setLogLevelDesc: '反馈问题时调高此项，日志会记录更多细节。',
  logError: '仅错误', logWarn: '警告', logInfo: '常规', logDebug: '详细',
  setDebugOverlay: '调试浮层',
  setDebugOverlayDesc: '在识别到的文字周围绘制边框。反馈识别问题时很有用。',

  // ── Xin quyền hệ thống (onboarding) ────────────────────────────────────────
  onboardingTitle: '系统权限',
  onboardingIntro: 'Homework Helper 需要两项 macOS 权限才能在屏幕任意位置翻译和解题。两项都是必需的——缺少任何一项，应用都无法读取屏幕内容。',
  onboardingAccessibilityTitle: '辅助功能（Accessibility）',
  onboardingAccessibilityDesc: '让应用读取光标下的文字以立即翻译——大多数应用使用的快速路径。',
  onboardingScreenTitle: '屏幕录制（Screen Recording）',
  onboardingScreenDesc: '让应用截取屏幕——用于框选解题，以及在无法直接读取文字时作为备用方案（如 PDF、部分编辑器）。',
  onboardingGranted: '已授权',
  onboardingNotGranted: '未授权',
  onboardingOpenPane: '打开系统设置',
  onboardingNeedsRestart: '权限已授予。请重启应用以生效——macOS 不会将新权限应用到已在运行的进程。',
  onboardingRelaunch: '立即重启',
  onboardingSkip: '以后再说',
  onboardingReopenLabel: '系统权限',
  onboardingReopenDesc: '查看或重新授予 Homework Helper 所需的权限。',
  onboardingReopenButton: '查看',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: '翻译',
  intentSolve: '解题',
  intentSummarize: '总结',
  intentExplain: '讲解',
  intentRewrite: '改写',
  intentChat: '对话',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: '快捷键',
  setHotkeys: '全局快捷键',
  setHotkeysDesc: '在任何应用中都可使用的按键。留空即停用该快捷键。',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'AI 服务商与密钥',
  setApiConfigs: '已配置的模型',
  keysAdd: '添加模型',
  keysEmpty: '尚未配置任何模型。添加一个即可开始。',
  keysTest: '测试连接',
  keysTesting: '测试中…',
  keysOk: '已连接',
  keysRemove: '移除',
  keysKeySaved: '密钥已保存',
  keysKeyPlaceholder: '粘贴 API 密钥',
  keysGetKey: '获取密钥',
  keysNoKeyNeeded: '无需密钥 — 在你的设备上运行',
  keysModel: '模型',
  keysBaseUrl: '地址',
  keysLabel: '名称',
  keysEnabled: '启用',
  keysVision: '可读取图像',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: '任务',
  setStudyMode: '默认学习模式',
  setStudyModeDesc: 'AI 默认的回答方式。每次解答仍可单独更改。',
  modeStepByStep: '逐步解题',
  modeDirect: '仅给答案',
  modeHint: '只给提示',
  modeExplain: '深入讲解',
  modeTranslate: '学术翻译',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: '存储',
  setMaxConversations: '保留的对话数',
  setMaxConversationsDesc: '超出此上限时，较旧的对话会被删除。',
  setCacheTtl: '翻译缓存有效期',
  setCacheTtlDesc: '缓存的译文在重新获取前可用的天数。',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: '悬停翻译',
  setHoverEnabled: '启用悬停翻译',
  setHoverEnabledDesc: '将鼠标悬停在屏幕上任意文字时显示译文。',
  setClipboardWatcher: '启用剪贴板监听',
  setClipboardWatcherDesc: '每当你在屏幕任意位置复制文本时，显示浮动操作栏（翻译 / 摘要 / 解释 / 改写）。',
  setHoverDelay: '触发延迟',
  setHoverDelayDesc: '光标需静止多久才会查询译文。',
  setHoverTolerance: '移动容差',
  setHoverToleranceDesc: '此半径内的轻微抖动仍视为静止。',
  setHoverModifiers: '触发按键',
  setHoverModifiersDesc: '悬停时需按住的按键。留空则悬停即触发，无需按键。',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',

  // ── Mức chi tiết hover ────────────────────────────────────────────────────
  setHoverGranularity: '详细程度',
  setHoverGranularityDesc: '每次翻译多少文字。',
  granWord: '单词',
  granSentence: '句子',
  granParagraph: '段落',
} as const satisfies Dictionary;
