/**
 * Bản dịch tiếng Nga.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'Язык',
  groupAi: 'ИИ и модели',
  groupPrivacy: 'Конфиденциальность',
  groupSystem: 'Система',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'Язык интерфейса',
  setUiLanguageDesc: 'Язык самого приложения — меню, подписи, сообщения.',
  setOutputLanguage: 'Язык ответов',
  setOutputLanguageDesc: 'Язык, на котором ИИ пишет ответы. Не связан с языком интерфейса.',
  setTranslateTarget: 'Переводить на',
  setTranslateTargetDesc: 'Язык перевода по умолчанию при наведении курсора.',
  setTranslateProviders: 'Сервисы перевода',
  setTranslateProvidersDesc: 'Порядок использования при переводе наведением курсора — при сбое одного сервиса автоматически переключается на следующий.',
  translateProviderGoogle: 'Google Переводчик',
  translateProviderBing: 'Bing Переводчик',
  translateProviderMymemory: 'MyMemory',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'Определять автоматически',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'Стратегия маршрутизации',
  setRoutingStrategyDesc: 'Какую модель использовать в первую очередь при ответе.',
  routingPreferConfig: 'Сначала настроенные ключи',
  routingPreferLocal: 'Сначала локальные модели',
  routingLocalOnly: 'Только локальные модели',
  routingConfigOnly: 'Только настроенные ключи',

  setRotationStrategy: 'Чередование ключей',
  setRotationStrategyDesc: 'Как выбирать среди нескольких активных ключей.',
  rotationRoundRobin: 'По очереди',
  rotationRandom: 'Случайно',
  rotationFallback: 'Переключаться только при ошибке',

  setRequestTimeout: 'Время ожидания',
  setRequestTimeoutDesc: 'Рассуждающие модели могут долго молчать, прежде чем выдать первое слово.',
  setMaxRetries: 'Максимум повторов',
  setMaxRetriesDesc: 'Сколько ключей перебрать, прежде чем сдаться.',
  setThinkingEnabled: 'Включить рассуждение',
  setThinkingEnabledDesc: 'Позволяет подходящим моделям подумать перед ответом. Медленнее, но точнее.',
  setMaxRequestsPerMinute: 'Лимит запросов в минуту',
  setMaxRequestsPerMinuteDesc: 'Страховка от непредвиденных расходов. Запросы сверх лимита отклоняются.',
  setMonthlyTokenBudget: 'Месячный лимит токенов',
  setMonthlyTokenBudgetDesc: 'Предупреждать при приближении к этому значению. 0 — без ограничений.',
  setOllamaBaseUrl: 'Адрес Ollama',
  setLmStudioBaseUrl: 'Адрес LM Studio',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'Исключённые программы',
  setExcludedAppsDesc: 'Пока эти программы активны, приложение никогда не считывает экран.',
  setPauseWhenScreenSharing: 'Приостановить при показе экрана',
  setPauseWhenScreenSharingDesc: 'Скрывает все наложения во время демонстрации или записи экрана.',
  setPauseOnSensitiveApps: 'Приостановить в чувствительных программах',
  setPauseOnSensitiveAppsDesc: 'Автоматически останавливается, когда активен менеджер паролей или банковское приложение.',
  setLocalModelsOnly: 'Только локальные модели',
  setLocalModelsOnlyDesc: 'Никогда не отправляет текст или изображения в облако. Ничто не покидает это устройство.',
  setSaveHistory: 'Сохранять историю бесед',
  setSaveHistoryDesc: 'Хранит прошлые вопросы и ответы, чтобы к ним можно было вернуться.',
  setHistoryRetention: 'Удалять историю через',
  setHistoryRetentionDesc: 'Сколько дней хранить историю. 0 — хранить бессрочно.',
  setTelemetry: 'Отправлять анонимные данные об использовании',
  setTelemetryDesc: 'Помогает улучшать приложение. Никогда не включает содержимое экрана или ваши вопросы.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'Запускать при входе в систему',
  setLaunchAtLoginDesc: 'Автоматически запускает приложение при входе в систему.',
  setHideFromDock: 'Скрыть из Dock',
  setHideFromDockDesc: 'Работает только в строке меню, без значка в Dock или на панели задач.',
  setAutoUpdate: 'Обновлять автоматически',
  setAutoUpdateDesc: 'Загружает и устанавливает новые версии в фоновом режиме.',
  setUpdateChannel: 'Канал обновлений',
  setUpdateChannelDesc: 'Бета-канал получает новинки раньше, но вероятность ошибок выше.',
  channelStable: 'Стабильный', channelBeta: 'Бета',
  setLogLevel: 'Уровень журнала',
  setLogLevelDesc: 'Повысьте при обращении в поддержку, чтобы журнал содержал больше подробностей.',
  logError: 'Только ошибки', logWarn: 'Предупреждения', logInfo: 'Обычный', logDebug: 'Подробный',
  setDebugOverlay: 'Отладочное наложение',
  setDebugOverlayDesc: 'Рисует рамки вокруг распознанного текста. Полезно при сообщении о проблемах распознавания.',

  // ── Xin quyền hệ thống (onboarding) ────────────────────────────────────────
  onboardingTitle: 'Системные разрешения',
  onboardingIntro: 'Homework Helper требуются два разрешения macOS, чтобы переводить и решать задачи в любом месте экрана. Оба обязательны — без любого из них приложение не сможет читать содержимое экрана.',
  onboardingAccessibilityTitle: 'Универсальный доступ (Accessibility)',
  onboardingAccessibilityDesc: 'Позволяет приложению читать текст под курсором и мгновенно переводить его — быстрый путь, используемый большинством приложений.',
  onboardingScreenTitle: 'Запись экрана (Screen Recording)',
  onboardingScreenDesc: 'Позволяет приложению захватывать экран — используется для функции «Выделить и решить», а также как запасной вариант, когда текст нельзя прочитать напрямую (PDF, некоторые редакторы).',
  onboardingGranted: 'Предоставлено',
  onboardingNotGranted: 'Не предоставлено',
  onboardingOpenPane: 'Открыть Системные настройки',
  onboardingNeedsRestart: 'Разрешения предоставлены. Перезапустите приложение, чтобы применить их — macOS не применяет новые разрешения к уже запущенному процессу.',
  onboardingRelaunch: 'Перезапустить сейчас',
  onboardingSkip: 'Позже',
  onboardingReopenLabel: 'Системные разрешения',
  onboardingReopenDesc: 'Просмотрите или предоставьте заново разрешения, необходимые Homework Helper.',
  onboardingReopenButton: 'Просмотреть',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'Перевести',
  intentSolve: 'Решить задачу',
  intentSummarize: 'Кратко изложить',
  intentExplain: 'Объяснить',
  intentRewrite: 'Переписать',
  intentChat: 'Чат',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'Горячие клавиши',
  setHotkeys: 'Глобальные горячие клавиши',
  setHotkeysDesc: 'Клавиши, работающие из любого приложения. Оставьте пустым, чтобы отключить сочетание.',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'Поставщики ИИ и ключи',
  setApiConfigs: 'Настроенные модели',
  keysAdd: 'Добавить модель',
  keysEmpty: 'Модели ещё не настроены. Добавьте одну, чтобы начать.',
  keysTest: 'Проверить подключение',
  keysTesting: 'Проверка…',
  keysOk: 'Подключено',
  keysRemove: 'Удалить',
  keysKeySaved: 'Ключ сохранён',
  keysKeyPlaceholder: 'Вставьте API-ключ',
  keysGetKey: 'Получить ключ',
  keysNoKeyNeeded: 'Ключ не нужен — работает на вашем устройстве',
  keysModel: 'Модель',
  keysBaseUrl: 'Адрес',
  keysLabel: 'Название',
  keysEnabled: 'Включено',
  keysVision: 'Читает изображения',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: 'Задачи',
  setStudyMode: 'Режим обучения по умолчанию',
  setStudyModeDesc: 'Как ИИ отвечает по умолчанию. Можно менять для каждого ответа.',
  modeStepByStep: 'По шагам',
  modeDirect: 'Только ответ',
  modeHint: 'Только подсказки',
  modeExplain: 'Подробное объяснение',
  modeTranslate: 'Академический перевод',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: 'Хранилище',
  setMaxConversations: 'Сколько бесед хранить',
  setMaxConversationsDesc: 'При превышении лимита старые беседы удаляются.',
  setCacheTtl: 'Срок жизни кеша переводов',
  setCacheTtlDesc: 'Сколько дней сохранённый перевод остаётся действительным.',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: 'Перевод при наведении',
  setHoverEnabled: 'Включить перевод при наведении',
  setHoverEnabledDesc: 'Показывать перевод при наведении курсора на текст на экране.',
  setClipboardWatcher: 'Включить отслеживание буфера обмена',
  setClipboardWatcherDesc: 'Показывать плавающую панель действий (Перевести / Кратко / Объяснить / Переписать) при копировании текста в любом месте экрана.',
  setHoverDelay: 'Задержка срабатывания',
  setHoverDelayDesc: 'Сколько курсор должен оставаться неподвижным перед поиском перевода.',
  setHoverTolerance: 'Допуск движения',
  setHoverToleranceDesc: 'Небольшое дрожание в этом радиусе всё ещё считается неподвижностью.',
  setHoverModifiers: 'Клавиши активации',
  setHoverModifiersDesc: 'Клавиши, которые нужно удерживать при наведении. Оставьте пустым, чтобы срабатывало просто при наведении.',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',

  // ── Mức chi tiết hover ────────────────────────────────────────────────────
  setHoverGranularity: 'Уровень детализации',
  setHoverGranularityDesc: 'Сколько текста переводить за раз.',
  granWord: 'Слово',
  granSentence: 'Предложение',
  granParagraph: 'Абзац',
} as const satisfies Dictionary;
