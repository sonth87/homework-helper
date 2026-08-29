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
} as const satisfies Dictionary;
