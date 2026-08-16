/**
 * Storage & Configuration Management Wrapper
 * Persists user models, API keys, rotation strategy, and preferences in chrome.storage.local
 */

export const DEFAULT_PROVIDERS = [
  {
    id: 'chrome-builtin',
    name: 'Chrome Built-in AI (Gemini Nano)',
    description: 'Mô hình cục bộ On-Device tích hợp sẵn trong Chrome (Miễn phí, Offline, Không cần Key)',
    models: [
      { id: 'gemini-nano', name: 'Gemini Nano (Local On-Device)' },
    ],
    defaultBaseUrl: '',
    requiresBaseUrl: false,
    requiresKey: false,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fastest & Multimodal)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Best Reasoning)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp' },
    ],
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresBaseUrl: false,
    authHeader: 'x-goog-api-key',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Vision & Math)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Ultra Fast)' },
      { id: 'o3-mini', name: 'o3 Mini (Deep Reasoning)' },
    ],
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresBaseUrl: false,
    authHeader: 'Bearer',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (State of the Art)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Lightning Fast)' },
    ],
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    requiresBaseUrl: false,
    authHeader: 'x-api-key',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Math & Reasoning)' },
    ],
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    requiresBaseUrl: false,
    authHeader: 'Bearer',
  },
  {
    id: 'groq',
    name: 'Groq',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    ],
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresBaseUrl: false,
    authHeader: 'Bearer',
  },
  {
    id: 'custom',
    name: 'Custom / OpenRouter / Local Endpoint',
    models: [
      { id: 'custom-model', name: 'Custom Model' },
    ],
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresBaseUrl: true,
    authHeader: 'Bearer',
  },
];

export const SUPPORTED_LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'vi', name: 'Tiếng Việt (Vietnamese)' },
  { id: 'th', name: 'ไทย (Thai)' },
  { id: 'es', name: 'Español (Spanish)' },
  { id: 'fr', name: 'Français (French)' },
  { id: 'de', name: 'Deutsch (German)' },
  { id: 'zh-CN', name: '简体中文 (Simplified Chinese)' },
  { id: 'zh-TW', name: '繁體中文 (Traditional Chinese)' },
  { id: 'ja', name: '日本語 (Japanese)' },
  { id: 'ko', name: '한국어 (Korean)' },
  { id: 'pt', name: 'Português (Portuguese)' },
  { id: 'id', name: 'Bahasa Indonesia' },
  { id: 'ru', name: 'Русский (Russian)' },
  { id: 'auto', name: 'Auto (Same as Question)' },
];

export const DEFAULT_SETTINGS = {
  // Array of configured model keys:
  // [{ id, provider, model, apiKey, baseUrl, isEnabled, priority, failureCount, cooldownUntil }]
  apiConfigs: [],
  activeConfigId: 'auto', // 'auto' (round-robin active) or specific config id
  rotationStrategy: 'round-robin', // 'round-robin' | 'random' | 'fallback-on-error'
  studyMode: 'step-by-step', // 'step-by-step' | 'direct' | 'hint' | 'explain' | 'translate'
  outputLanguage: 'en', // 'en' | 'vi' | 'es' | 'fr' | 'de' | 'zh-CN' | 'ja' | 'ko' | 'auto'
  systemPrompt: `You are an elite academic tutor and homework assistant AI.
Your goal is to help students understand complex concepts and solve homework questions step-by-step.
Always structure your answers with:
1. **Direct Answer / Conclusion** (Highlight final choice or result clearly).
2. **Step-by-Step Explanation** (Detailed mathematical/scientific reasoning).
3. **Key Formula / Concept Applied** (Use clear LaTeX for all math expressions: enclosed in $...$ for inline and $$...$$ for block formulas).
Ensure maximum pedagogical clarity. If an image contains multiple questions, ask the student which one to solve first, or solve the primary highlighted question.`,
  enableFormsAdapter: true,
  enableTextTooltip: true,
  enableFloatingButton: true,
  fabSize: 'normal', // 'small' | 'normal' | 'large'
  popupOpacity: 92, // 40 - 100% (Liquid Glass background alpha)
  popupBlur: 16, // 0 - 30px
  toolbarOpacity: 90, // 40 - 100%
  toolbarBlur: 14, // 0 - 30px
  toolbarShowText: true, // true: icon + label, false: icon only
  toolbarSize: 'normal', // 'compact' | 'normal' | 'large'
  toolbarTheme: 'glass-light', // 'glass-light' | 'glass-dark' | 'cyber-blue' | 'emerald' | 'purple'
  toolbarCustomColor: '#0284c7',
  disabledSites: [], // list of disabled hostnames
  theme: 'dark', // 'dark' | 'light' | 'system'
  chatHistory: [],
};

export const Storage = {
  async get(keys = null) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (res) => {
        if (!keys) {
          resolve({ ...DEFAULT_SETTINGS, ...res });
        } else {
          resolve(res);
        }
      });
    });
  },

  async set(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => resolve(true));
    });
  },

  async getApiConfigs() {
    const data = await this.get(['apiConfigs', 'activeConfigId', 'rotationStrategy']);
    return {
      apiConfigs: data.apiConfigs || [],
      activeConfigId: data.activeConfigId || 'auto',
      rotationStrategy: data.rotationStrategy || 'round-robin',
    };
  },

  async saveApiConfig(config) {
    const { apiConfigs = [] } = await this.get('apiConfigs');
    const existingIdx = apiConfigs.findIndex((c) => c.id === config.id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...apiConfigs];
      updated[existingIdx] = { ...updated[existingIdx], ...config };
    } else {
      updated = [...apiConfigs, { ...config, id: config.id || `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}` }];
    }
    await this.set({ apiConfigs: updated });
    return updated;
  },

  async removeApiConfig(id) {
    const { apiConfigs = [] } = await this.get('apiConfigs');
    const updated = apiConfigs.filter((c) => c.id !== id);
    await this.set({ apiConfigs: updated });
    return updated;
  },

  async getChatHistory() {
    const { chatHistory = [] } = await this.get('chatHistory');
    return chatHistory;
  },

  async addChatMessage(msg) {
    const { chatHistory = [] } = await this.get('chatHistory');
    // Keep max 50 recent messages to conserve memory
    const updated = [...chatHistory, { ...msg, timestamp: Date.now() }].slice(-50);
    await this.set({ chatHistory: updated });
    return updated;
  },

  async clearChatHistory() {
    await this.set({ chatHistory: [] });
  }
};
