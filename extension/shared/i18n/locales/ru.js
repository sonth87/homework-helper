export default {
  general: {
    brandTitle: "Homework Helper",
    placeholder: "Введите ваш вопрос или формулу здесь...",
    shiftEnterHint: "Enter для отправки, Shift+Enter для новой строки",
    askAiBtn: "Спросить ИИ",
    captureBtn: "Скриншот",
    uploadBtn: "Прикрепить изображение",
    attachedLabel: "Изображение прикреплено",
    welcomeText:
      "Здравствуйте! Я ваш помощник Homework Helper. Какое задание решим сегодня?",
    newChat: "Новый чат",
    historyTitle: "История чатов",
    modelNanoReady: "Chrome Gemini Nano (Локально готов)",
    modelNanoSetup: "Chrome Gemini Nano (Требуется настройка)",
    modelNanoClick:
      "Нажмите, чтобы открыть руководство по активации Gemini Nano",
    modelAutoRotate: "Авторотация ключей",
    emptyHistory:
      "Нет сохраненных диалогов.<br>Начните новый чат для решения задач!",
    loadingHistory: "Загрузка истории...",
    chips: [
      {
        label: "Квадратное уравнение",
        query: "Реши квадратное уравнение ax^2 + bx + c = 0 пошагово",
      },
      {
        label: "Законы Ньютона",
        query: "Объясни 3 закона движения Ньютона с реальными примерами",
      },
      {
        label: "Химическое уравнение",
        query: "Как уравнивать химические реакции и рассчитывать моли?",
      },
    ],
    modes: {
      "step-by-step": "Пошаговое решение",
      direct: "Прямой ответ",
      hint: "Подсказка и ход мысли",
      explain: "Глубокое объяснение",
      translate: "Перевод",
    },
    cardHeading: "Подробное решение",
    nextQuestion: "Следующий вопрос",
    continueInChat: "Продолжить в чате",
    copyBtn: "Копировать",
    copiedBtn: "Скопировано!",
    retryBtn: "Повторить",
    imagePromptHeader:
      "Пожалуйста, решите и объясните это задание с изображения пошагово с формулами LaTeX ($...$) и выделите ответ:",
    captureSolveText: "Решить задание со снимка экрана",
    toastNewChat: "Начат новый диалог",
    chatCleared: "Чат очищен. Задайте новый вопрос!",
    thinking: "Думаю & решаю...",
    tooltips: {
      newChat: {
        title: "Новый чат",
        desc: "Начать новую сессию решения задач.",
      },
      history: {
        title: "История",
        desc: "Просмотреть сохраненные решения.",
      },
      lang: {
        title: "Язык ответа ИИ",
        desc: "ИИ будет отвечать и объяснять на этом языке.",
      },
      mode: {
        title: "Режим решения",
        desc: "Формат: Пошагово, Прямой ответ, Подсказка или Теория.",
      },
      capture: {
        title: "Снимок экрана (Alt+C)",
        desc: "Выделите задачу или график на экране для мгновенного решения.",
      },
      upload: {
        title: "Загрузить картинку",
        desc: "Прикрепите изображение задачи с компьютера.",
      },
      settings: {
        title: "Модели и ключи API",
        desc: "Управление провайдерами ИИ и автобалансировкой ключей.",
      },
      clear: {
        title: "Очистить чат",
        desc: "Удалить все сообщения текущей сессии.",
      },
      options: {
        title: "Полные настройки",
        desc: "Открыть страницу управления API-ключами и кастомизации интерфейса.",
      },
      close: {
        title: "Закрыть панель",
        desc: "Свернуть панель к краю экрана.",
      },
      open: {
        title: "Открыть панель чата (Alt+K)",
        desc: "Открыть ИИ-репетитора для решения задач и вопросов.",
      },
    },
    modalConfigTitle: "Настройка моделей ИИ и API-ключей",
    modalConfigDesc:
      "Добавьте один или несколько API-ключей. Расширение автоматически распределяет нагрузку и переключается на резервные ключи.",
    modalNanoTitle: "Chrome Gemini Nano (Локальный ИИ на устройстве)",
    modalNanoDesc:
      "Локальный ИИ, работающий на 100% оффлайн. Нажмите на ссылки ниже, чтобы сразу открыть флаги:",
    modalBtnFlagPrompt: "1. Открыть #prompt-api",
    modalBtnFlagOptGuide: "2. Открыть #optimization-guide",
    modalBtnComponents: "3. Открыть компоненты",
    modalBtnAddKey: "Добавить модель и ключ",
    modalLinkGuide: "Гайд по бесплатным API-ключам →",
    modalKeyPlaceholder: "Введите API-ключ (sk-... / AIza...)",
  },
  selectionTooltip: {
    answer: "Решить",
    copy: "Копировать",
    search: "Поиск",
    translate: "Перевести",
    more: "Дополнительно",
    explain: "Объяснить",
    summarize: "Кратко",
    grammar: "Проверка грамматики",
    disable: "Отключить",
    disableSession: "Отключить до следующего визита",
    disablePage: "Отключить для этой страницы",
    disableSite: "Отключить для этого сайта",
    disableGlobal: "Отключить везде",
    disableFooter: "Можно включить обратно в Настройках",
  },
  cropper: {
    tip: "Нажмите и потяните, чтобы выделить задачу или формулу (ESC для отмены)",
    cancel: "Отмена",
    askAi: "Спросить ИИ",
  },
  floatingPopup: {
    helperTitle: "Помощник Homework Helper",
    translateTitle: "Перевод",
    translateHeading: "Результат перевода",
    searchTitle: "Поиск и решение",
    searchHeading: "Результаты и ответ",
    explainTitle: "Глубокое объяснение",
    explainHeading: "Разбор концепции",
    summarizeTitle: "Краткое резюме",
    summarizeHeading: "Главные тезисы",
    grammarTitle: "Проверка грамматики",
    grammarHeading: "Исправления и улучшения",
    answerHeading: "Подробное решение",
    nextQuestion: "Следующий вопрос",
    continueInChat: "Продолжить в чате",
    copy: "Копировать",
    copied: "Скопировано!",
    retry: "Повторить",
    processing: "Обработка запроса...",
    solvingStepByStep: "Решаю пошагово с формулами KaTeX...",
    scanningOcr: "Сканирую текст и формулы локальным OCR...",
    autoDetect: "Автоопределение",
    historyTitle: "История вопросов",
    historyDesc: "Просмотрите недавно решенные задачи и учебные сессии.",
    closeTitle: "Закрыть окно",
    closeDesc: "Закрыть окно с решением",
    addConvTitle: "Новый чат",
    addConvDesc: "Начать новую сессию решения задач.",
    closeHistoryTitle: "Закрыть историю",
    closeHistoryDesc: "Закрыть панель истории.",
    openInDrawerBtn: "Открыть полностью в панели чата",
  },
  popup: {
    brandSub: "Академический ИИ без входа",
    openSidePanel: "Открыть боковую панель ИИ",
    openSidePanelDesc: "Рабочая область рядом с любой страницей",
    cropSolve: "Вырезать и решить (Alt+C)",
    cropSolveDesc: "Выделите формулы или чертежи",
    keysPool: "Активные ключи:",
    rotationMode: "Режим ротации:",
    formsAssistant: "Помощник Google Forms",
    selectionTooltip: "Панель выделения текста",
    configureBtn: "Настроить модели и ключи",
  },
  options: {
    navProviders: "Модели и ключи API",
    navOcr: "Локальные модели OCR",
    navAppearance: "Внешний вид и интерфейс",
    navGuide: "Гайд по бесплатным ключам",
    navPrompt: "Системные инструкции (Prompt)",
    navGeneral: "Общие настройки",
    brandDesc: "Академический ИИ без входа",
    headingProviders: "Модели ИИ и пул ключей API",
    subheadingProviders:
      "Добавьте один или несколько API-ключей. Расширение распределяет нагрузку и переключается на резервные ключи при лимитах.",
    strategyTitle: "Стратегия ротации ключей",
    strategyDesc:
      "Выберите метод распределения активных ключей при отправке запросов.",
    statTotal: "Всего ключей",
    statActive: "Готовы к работе",
    statCooldown: "На паузе (60с)",
    btnAddKey: "Добавить провайдера / Ключ",
    headingOcr: "Локальные пакеты моделей OCR (Офлайн)",
    subheadingOcr:
      "Загружайте офлайн-модели распознавания текста и формул через Tesseract.js.",
    btnCheckUpdates: "Проверить обновления",
    btnDownloadCore:
      "Скачать базовый пакет (Русский + Английский + Математика)",
    corePackTitle: "Встроенный базовый пакет OCR",
    corePackBadge: "Рекомендуется",
    corePackDesc:
      "Высокая точность для латиницы, кириллицы, формул и английского языка.",
    allOcrTitle: "Все языковые пакеты",
    allOcrSub:
      "Загружайте специальные офлайн-пакеты языков по мере необходимости.",
    headingAppearance: "Настройка внешнего вида и интерфейса",
    subheadingAppearance:
      "Настройте плавающие кнопки (FAB), панель выделения, темы, прозрачность и размытие.",
    cardFabTitle: "Плавающие кнопки на странице (FAB)",
    labelFabDisplay: "Показывать кнопки на веб-страницах",
    descFabDisplay:
      "Отображает быстрые кнопки у края экрана для открытия чата и скриншотов.",
    labelFabSize: "Размер плавающих кнопок",
    cardToolbarTitle: "Плавающая панель выделения текста (Selection Toolbar)",
    labelToolbarTheme: "Цветовая тема панели",
    labelToolbarText: "Показывать текст рядом с иконками",
    descToolbarText:
      "Отображать названия действий (Решить, Копировать, Поиск, Перевод).",
    labelToolbarSize: "Размер панели",
    labelToolbarOpacity: "Прозрачность панели",
    labelToolbarBlur: "Размытие фона (Backdrop Blur)",
    cardPopupTitle: "Плавающее окно решения и перевода (Floating Card)",
    labelPopupOpacity: "Прозрачность окна",
    labelPopupBlur: "Размытие фона (Blur)",
    livePreviewBadge: "Живой симулятор",
    livePreviewSub:
      "Мгновенный предпросмотр стиля Liquid Glass с вашими параметрами.",
    headingGuide: "Гайд по бесплатным API-ключам и порталам",
    subheadingGuide:
      "100% официальные бесплатные ключи от ведущих ИИ-провайдеров с большими квотами.",
    guideWhyTitle: "Зачем добавлять несколько API-ключей?",
    guideWhy1:
      "Автопереключение: Если ключ исчерпал лимит (429), система сразу переходит к следующему.",
    guideWhy2:
      "Балансировка нагрузки: Равномерно распределяет запросы во избежание ограничений.",
    guideWhy3:
      "Без затрат: Объединяйте бесплатные квоты различных облачных сервисов.",
    guideHowTitle: "Как это работает?",
    guideHow1:
      "Получите бесплатные ключи на официальных порталах (Google AI Studio, Groq, OpenRouter...).",
    guideHow2:
      "Вставьте их во вкладку «Модели и ключи API» и протестируйте подключение.",
    guideHow3: "Расширение автоматически управляет ротацией в фоновом режиме.",
    guideLinksTitle: "Официальные порталы бесплатных ключей",
    linkSubGemini:
      "Бесплатно 15 RPM, сверхбыстрая скорость и отличный разбор изображений задач.",
    linkSubGroq:
      "Рекордная скорость (500+ токенов/с), поддержка Llama 3 и DeepSeek.",
    linkSubOpenAI: "Золотой стандарт для строгого академического анализа.",
    linkSubDeepSeek: "Лидирующая модель для математики и открытого кода.",
    linkSubClaude:
      "Превосходное понимание диаграмм и понятное пошаговое объяснение.",
    headingPrompt: "Системные инструкции и стиль решения",
    subheadingPrompt:
      "Настройте отдельные системные промпты для больших облачных моделей и локальных моделей на устройстве.",
    cardCloudPromptTitle:
      "1. Системный промпт для облачных моделей (Gemini, OpenAI, Claude, DeepSeek)",
    cardCloudPromptDesc:
      "Оптимизирован для моделей с сотнями миллиардов параметров, глубокого педагогического анализа, LaTeX и изображений.",
    cardNanoPromptTitle:
      "2. Системный промпт для Chrome Gemini Nano (On-Device Local AI)",
    cardNanoPromptDesc:
      "Специально для локальной модели ~3B параметров в Chrome. Лаконичный, прямой и обязывает проверять факты перед выбором варианта.",
    btnResetPrompt: "Сбросить по умолчанию",
    btnSavePrompt: "Сохранить промпт Cloud",
    btnResetNanoPrompt: "Сбросить по умолчанию",
    btnSaveNanoPrompt: "Сохранить промпт Nano",
    headingGeneral: "Общие настройки и язык",
    subheadingGeneral:
      "Управление языком ответов, помощником Google Forms и резервным копированием.",
    uiLangTitle: "Язык интерфейса (UI Language)",
    uiLangDesc: "Язык всех кнопок, боковых панелей, тулбаров и меню настроек.",
    respLangTitle: "Язык ответов ИИ",
    respLangDesc: "Язык, на котором ИИ будет решать и объяснять задачи.",
    formsTitle: "Помощник Google Forms",
    formsDesc:
      "Автоматически определяет вопросы в Google Forms и добавляет кнопку решения в один клик.",
    tooltipTitle: "Плавающая панель выделения текста",
    tooltipDesc:
      "Показывает панель действий при выделении текста на любой странице.",
    disabledSitesTitle: "Список отключенных сайтов",
    disabledSitesDesc: "Расширение будет полностью отключено на этих доменах.",
    noDisabledSites: "Отключенных сайтов пока нет.",
    backupTitle: "Резервное копирование и данные",
    backupDesc:
      "Экспорт конфигурации в JSON или очистка сохраненной истории чатов.",
    btnExport: "Экспорт JSON конфигурации",
    btnClearData: "Очистить всю историю чатов",
    aboutTitle: "О расширении",
    aboutDesc:
      "Homework Helper - Умный ИИ-помощник для решения домашних заданий и учебы.",
    keyPlaceholder: "Введите API-ключ",
    deleteKey: "Удалить эту конфигурацию",
    toastLangUpdated: "Язык интерфейса успешно обновлен!",
    toastPromptSaved: "Системные инструкции успешно сохранены!",
    toastDataCleared: "Вся история чатов была удалена!",
    stratPreferNanoTitle: "Предпочитать Gemini Nano (Рекомендуется)",
    stratPreferNanoDesc:
      "Использовать локальный Gemini Nano, когда он доступен, и плавно переключаться на Cloud API для сложных визуальных задач.",
    stratNanoOnlyTitle: "Только Gemini Nano",
    stratNanoOnlyDesc:
      "100% бесплатно и оффлайн, никогда не обращается к внешним облачным API.",
    stratConfigOnlyTitle: "Только настроенные Cloud API",
    stratConfigOnlyDesc:
      "Использовать настроенные ниже API-ключи с автоматической ротацией.",
    builtinNanoTitle: "Встроенный ИИ Chrome (Gemini Nano On-Device)",
    builtinNanoDesc:
      "Локальная модель ИИ, работающая на 100% на вашем компьютере. Не требует API-ключа, полностью бесплатна и работает без интернета.",
    btnOpenFlags: "Открыть chrome://flags",
    btnTestBuiltinAI: "Проверить встроенную модель",
    guideNanoStepsTitle:
      "Как активировать Chrome Gemini Nano (Нажмите на ссылки, чтобы открыть флаги напрямую):",
    guideNanoStep1:
      "Шаг 1: Откройте chrome://flags/#prompt-api-for-gemini-nano → Выберите Enabled (или Enabled Multilingual).",
    guideNanoStep2:
      "Шаг 2 (Обязательно): Откройте chrome://flags/#optimization-guide-on-device-model → Выберите Enabled BypassPerfRequirement.",
    guideNanoStep3:
      "Шаг 3: Нажмите Relaunch (Перезапустить) внизу Chrome для применения изменений.",
    guideNanoStep4:
      "Шаг 4 (Скачать модель): Откройте chrome://components → Найдите Optimization Guide On Device Model и нажмите «Проверить обновления».",
    guideNanoStep5:
      "Шаг 5: Нажмите «Проверить встроенную модель» выше для проверки.",
    testConnection: "Проверить соединение",
    testingConnection: "Проверка...",
    keyValid: "Ключ действителен и работает",
    keyInvalid: "Ошибка подключения:",
    enterKeyFirst: "Пожалуйста, введите API-ключ перед проверкой",
    statusReady: "Статус: Готов",
    btnGetKeyGemini: "Получить ключ Gemini →",
    btnGetKeyGroq: "Получить ключ Groq →",
    btnGetKeyOpenAI: "Получить ключ OpenAI →",
    btnGetKeyDeepSeek: "Получить ключ DeepSeek →",
    btnGetKeyClaude: "Получить ключ Claude →",
  },
};
