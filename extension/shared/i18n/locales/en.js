export default {
  general: {
    brandTitle: "Homework Helper",
    placeholder: "Enter your question or math problem here...",
    shiftEnterHint: "Enter to send, Shift+Enter for newline",
    askAiBtn: "Ask AI",
    captureBtn: "Capture",
    uploadBtn: "Attach image",
    attachedLabel: "Image attached",
    welcomeText:
      "Hello! I am Homework Helper AI. What homework problem do you want to solve today?",
    newChat: "New Chat",
    historyTitle: "Chat History",
    modelNanoReady: "Chrome Gemini Nano (Ready On-Device)",
    modelNanoSetup: "Chrome Gemini Nano (Setup Required)",
    modelNanoClick: "Click to view Gemini Nano activation guide in Settings",
    modelAutoRotate: "Auto-Rotate Keys",
    emptyHistory: "No conversations saved yet.<br>Start a new chat to begin!",
    loadingHistory: "Loading conversations...",
    chips: [
      {
        label: "Quadratic Equation",
        query: "Solve the quadratic equation ax^2 + bx + c = 0 step by step",
      },
      {
        label: "Newton Laws",
        query: "Explain Newton 3 laws of motion with real-world examples",
      },
      {
        label: "Chemical Equation",
        query: "How to balance chemical equations and calculate moles",
      },
    ],
    modes: {
      "step-by-step": "Step-by-Step",
      direct: "Direct Answer",
      hint: "Hints & Guidance",
      explain: "Deep Explanation",
      translate: "Translate",
    },
    cardHeading: "Step-by-Step Solution",
    nextQuestion: "Next Question",
    continueInChat: "Continue in Chat",
    copyBtn: "Copy",
    copiedBtn: "Copied!",
    retryBtn: "Retry",
    imagePromptHeader:
      "Please solve and explain this homework question from the image step-by-step with LaTeX formulas ($...$) and highlight the final answer:",
    captureSolveText: "Solve homework problem from captured image",
    toastNewChat: "Started a new chat session",
    chatCleared: "Chat cleared. Ask a new question!",
    thinking: "Thinking & solving...",
    modalConfigTitle: "AI Models & API Key Configuration",
    modalConfigDesc:
      "Add one or more API Keys. The extension automatically load-balances and falls back to backup keys when hitting rate limits.",
    modalNanoTitle: "Chrome Gemini Nano (Local AI)",
    modalNanoDesc:
      "On-Device AI running offline. Click links below to open flags directly:",
    modalBtnFlagPrompt: "1. Open #prompt-api",
    modalBtnFlagOptGuide: "2. Open #optimization-guide",
    modalBtnComponents: "3. Open components",
    modalBtnAddKey: "Add Model & Key",
    modalLinkGuide: "View free API key guide →",
    modalKeyPlaceholder: "Enter API Key (sk-... / AIza...)",
    tooltips: {
      newChat: {
        title: "New Chat",
        desc: "Start a new homework conversation session.",
      },
      history: {
        title: "Chat History",
        desc: "View list of saved problem-solving sessions.",
      },
      lang: {
        title: "Response Language",
        desc: "AI will solve, explain steps, and answer in this language.",
      },
      mode: {
        title: "Study Mode",
        desc: "Response format: Step-by-Step, Direct Answer, Hint, or Deep Theory.",
      },
      capture: {
        title: "Screen Capture (Alt+C)",
        desc: "Crop any problem or diagram on the screen to solve instantly.",
      },
      upload: {
        title: "Upload Image",
        desc: "Attach a problem image file from your computer.",
      },
      settings: {
        title: "Key & Model Settings",
        desc: "Manage API keys and smart load balancing rotation.",
      },
      clear: {
        title: "Clear Chat",
        desc: "Clear all messages in the current conversation.",
      },
      options: {
        title: "Settings & Customization",
        desc: "Open settings to manage API keys, enable local AI, and customize UI.",
      },
      close: {
        title: "Close Chat Panel",
        desc: "Collapse the side drawer to the screen edge (Alt+K).",
      },
      open: {
        title: "Open Chat Panel (Alt+K)",
        desc: "Open AI drawer assistant to solve homework and ask questions.",
      },
    },
  },
  selectionTooltip: {
    answer: "Answer",
    copy: "Copy",
    search: "Search",
    translate: "Translate",
    more: "More",
    explain: "Explain",
    summarize: "Summarize",
    grammar: "Grammar Checker",
    disable: "Disable Toolbar",
    disableSession: "Disable for this session",
    disablePage: "Disable on this page",
    disableSite: "Disable on this website",
    disableGlobal: "Disable globally",
    disableFooter: "Can be re-enabled in Settings",
  },
  cropper: {
    tip: "Click and drag to crop a problem or formula (ESC to cancel)",
    cancel: "Cancel",
    askAi: "Ask AI",
  },
  floatingPopup: {
    helperTitle: "Homework Helper",
    translateTitle: "Translation",
    translateHeading: "Translation",
    searchTitle: "Search & Solve",
    searchHeading: "Results & Answer",
    explainTitle: "Deep Explanation",
    explainHeading: "Concept Explanation",
    summarizeTitle: "Summarization",
    summarizeHeading: "Key Highlights",
    grammarTitle: "Grammar Checker",
    grammarHeading: "Corrections & Improvements",
    answerHeading: "Step-by-Step Solution",
    nextQuestion: "Next Question",
    continueInChat: "Continue in chat",
    copy: "Copy",
    copied: "Copied!",
    retry: "Retry",
    processing: "Processing request...",
    solvingStepByStep: "Solving step-by-step with KaTeX formulas...",
    scanningOcr: "Scanning text & formulas via Local OCR...",
    autoDetect: "Auto Detect",
    historyTitle: "Question History",
    historyDesc: "Review recent solved questions and homework sessions.",
    closeTitle: "Close Window",
    closeDesc: "Close solution popup",
    addConvTitle: "New Chat",
    addConvDesc: "Start a new homework conversation.",
    closeHistoryTitle: "Close History",
    closeHistoryDesc: "Close history panel.",
    openInDrawerBtn: "Open all in Chat Panel",
  },
  popup: {
    brandSub: "AI Homework Solver & Study Assistant",
    openSidePanel: "Open AI Side Panel",
    openSidePanelDesc: "Native workspace right next to your webpage",
    cropSolve: "Crop & Solve (Alt+C)",
    cropSolveDesc: "Capture formula or diagrams",
    keysPool: "API Keys Pool:",
    rotationMode: "Rotation Mode:",
    formsAssistant: "Google Forms Assistant",
    selectionTooltip: "Selection Toolbar",
    configureBtn: "Configure Models & Keys",
  },
  options: {
    navProviders: "AI Providers & Keys",
    navOcr: "Local OCR Models",
    navAppearance: "Appearance & UI Preview",
    navGuide: "Free API Keys Guide",
    navPrompt: "System Instructions",
    navGeneral: "General Settings",
    brandDesc: "AI Homework Solver & Study Assistant",
    headingProviders: "AI Models & API Key Pool",
    subheadingProviders:
      "Add one or more API Keys. The extension automatically load-balances and fails over to backup keys when hitting rate limits.",
    strategyTitle: "Smart Load Balancing & Fallback Strategy",
    strategyDesc:
      "The system automatically distributes questions across active keys (Round-Robin). If a key encounters Rate Limit (HTTP 429), it cools down for 60s and immediately rotates to the next key without interruption.",
    stratPreferNanoTitle: "Prefer Gemini Nano (Recommended)",
    stratPreferNanoDesc:
      "Use On-Device Gemini Nano when available, seamlessly fall back to Cloud APIs for complex vision or heavy tasks.",
    stratNanoOnlyTitle: "Gemini Nano Only",
    stratNanoOnlyDesc:
      "100% Free & Offline, never calls any external cloud APIs.",
    stratConfigOnlyTitle: "Cloud APIs Only",
    stratConfigOnlyDesc:
      "Use the configured Cloud API keys below with automated anti-throttling rotation.",
    builtinNanoTitle: "Chrome Built-in AI (Gemini Nano Local On-Device)",
    builtinNanoDesc:
      "Local on-device AI model running 100% on your machine. No API key required, completely free & works offline. The extension automatically routes to this model when no keys are configured.",
    btnOpenFlags: "Open chrome://flags",
    btnTestBuiltinAI: "Test Built-in Model",
    guideNanoStepsTitle:
      "How to activate Chrome Gemini Nano (Click links to open flag tabs directly):",
    guideNanoStep1:
      "Step 1: Open chrome://flags/#prompt-api-for-gemini-nano → Select Enabled (or Enabled Multilingual).",
    guideNanoStep2:
      "Step 2 (Required): Open chrome://flags/#optimization-guide-on-device-model → Select Enabled BypassPerfRequirement.",
    guideNanoStep3:
      "Step 3: Click Relaunch at the bottom of Chrome to apply changes.",
    guideNanoStep4:
      "Step 4 (Download model): Open chrome://components → Find Optimization Guide On Device Model and click Check for update until Up-to-date.",
    guideNanoStep5: 'Step 5: Click "Test Built-in Model" above to verify.',
    testConnection: "Test Connection",
    testingConnection: "Testing...",
    keyValid: "Key Valid & Working",
    keyInvalid: "Connection Failed:",
    enterKeyFirst: "Please enter an API Key before testing",
    deleteKey: "Delete Key",
    keyPlaceholder: "Enter API Key",
    statusReady: "Status: Ready",
    statTotal: "Total Saved Keys",
    statActive: "Active Keys",
    statCooldown: "Cooling Down (60s)",
    btnAddKey: "Add AI Provider / Key",
    headingOcr: "Local Offline OCR Packages",
    subheadingOcr:
      "Manage WebAssembly OCR models running 100% locally in your browser via Tesseract.js.",
    btnCheckUpdates: "Check for Updates",
    btnDownloadCore: "Download Core Pack (Vietnamese + English)",
    corePackTitle: "Bundled Core OCR Pack",
    corePackBadge: "Recommended",
    corePackDesc:
      "High-accuracy recognition for Latin script, mathematical symbols, English, and Vietnamese.",
    allOcrTitle: "All International Language Models",
    allOcrSub:
      "Download additional offline models stored securely in IndexedDB.",
    headingAppearance: "Liquid Glass Appearance & Live Preview",
    subheadingAppearance:
      "Customize floating buttons, selection toolbar, glass opacity, and backdrop blur with real-time simulator.",
    cardFabTitle: "In-Page Floating Buttons (FABs)",
    labelFabDisplay: "Show floating buttons on websites",
    descFabDisplay:
      "Display quick shortcut buttons at the screen edge to open chat drawer or crop homework.",
    labelFabSize: "Floating button size",
    cardToolbarTitle: "Selection Toolbar",
    labelToolbarTheme: "Toolbar color theme",
    labelToolbarText: "Show labels next to icons",
    descToolbarText:
      "Display action text (Answer, Copy, Search, Translate) beside icons.",
    labelToolbarSize: "Toolbar size",
    labelToolbarOpacity: "Toolbar background opacity",
    labelToolbarBlur: "Toolbar backdrop blur",
    cardPopupTitle: "Floating Solution Card",
    labelPopupOpacity: "Popup background opacity",
    labelPopupBlur: "Popup backdrop blur",
    livePreviewBadge: "Live Preview",
    livePreviewSub:
      "Real-time interactive simulation of your custom Liquid Glass parameters.",
    headingGuide: "Free API Keys Guide",
    subheadingGuide:
      "Official registration portals to acquire 100% free high-quota API keys from top AI providers.",
    guideWhyTitle: "Why configure multiple API keys?",
    guideWhy1:
      "Automatic Failover: If one key hits rate limits (HTTP 429), the extension seamlessly switches to the next.",
    guideWhy2:
      "Load Balancing: Distributes traffic evenly across keys to stay within free-tier limits.",
    guideWhy3:
      "Cost Saving: Combine generous free tiers across multiple official providers.",
    guideHowTitle: "How does it work?",
    guideHow1:
      "Get free API keys from official portals (Google AI Studio, Groq, OpenRouter...).",
    guideHow2:
      'Paste them into the "AI Providers & Keys" tab and test the connection.',
    guideHow3:
      "The extension automatically balances and routes requests on every question.",
    guideLinksTitle: "Official Free API Portals",
    linkSubGemini:
      "Free 15 RPM, ultra-fast with top-tier multimodal vision and math reasoning.",
    linkSubGroq: "Blazing speed (500+ tokens/s) hosting Llama 3 and DeepSeek.",
    linkSubOpenAI: "Gold standard academic accuracy and reasoning.",
    linkSubDeepSeek:
      "Specialized deep math reasoning and competitive programming models.",
    linkSubClaude:
      "Exceptional diagram interpretation and structured solution layout.",
    btnGetKeyGemini: "Get Gemini Key →",
    btnGetKeyGroq: "Get Groq Key →",
    btnGetKeyOpenAI: "Get OpenAI Key →",
    btnGetKeyDeepSeek: "Get DeepSeek Key →",
    btnGetKeyClaude: "Get Claude Key →",
    headingPrompt: "System Instructions & Academic Style",
    subheadingPrompt:
      "Customize tailored system prompts for massive Cloud Models and lightweight On-Device models.",
    cardCloudPromptTitle:
      "1. System Prompt for Cloud Models (Gemini, OpenAI, Claude, DeepSeek)",
    cardCloudPromptDesc:
      "Optimized for large 100B+ parameter cloud models with deep pedagogical analysis, LaTeX math, and multimodal vision.",
    cardNanoPromptTitle:
      "2. System Prompt for Chrome Gemini Nano (On-Device Local AI)",
    cardNanoPromptDesc:
      "Tailored specifically for the ~3B parameter on-device model. Concise, direct, and enforces factual fact-checking first.",
    btnResetPrompt: "Restore Default",
    btnSavePrompt: "Save Cloud Prompt",
    btnResetNanoPrompt: "Restore Default",
    btnSaveNanoPrompt: "Save Nano Prompt",
    headingGeneral: "General Settings & Language",
    subheadingGeneral:
      "Manage default response language, Google Forms assistant, and data backups.",
    uiLangTitle: "Extension UI Language",
    uiLangDesc:
      "Display language for buttons, sidepanel, toolbars, and options page.",
    respLangTitle: "AI Response Language",
    respLangDesc:
      "AI will automatically solve, explain, and output solutions in this language.",
    formsTitle: "Google Forms Deep Assistant",
    formsDesc:
      "Detect multiple-choice and open-ended questions on Google Forms with instant solve buttons.",
    tooltipTitle: "Text Selection Toolbar",
    tooltipDesc:
      "Automatically pop up a helper toolbar when highlighting text on web pages.",
    disabledSitesTitle: "Disabled Websites",
    disabledSitesDesc:
      "List of domains where in-page extension overlays and toolbars will not appear.",
    backupTitle: "Backup & Restore",
    backupDesc:
      "Export or clear your saved API keys, settings, and problem history.",
    btnExport: "Export Configuration (JSON)",
    btnClearData: "Clear Chat History",
    aboutTitle: "About Extension",
    aboutDesc:
      "Homework Helper Extension v2.5.0 - Intelligent academic AI pair tutor.",
    toastPromptSaved: "System prompt saved successfully!",
    toastLangUpdated: "Language settings updated!",
    toastDataCleared: "All chat history cleared!",
    noDisabledSites: "No disabled websites yet.",
  },
};
