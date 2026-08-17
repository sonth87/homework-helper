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
  { id: 'vi', name: 'Tiếng Việt' },
  { id: 'en', name: 'English' },
  { id: 'th', name: 'ไทย' },
  { id: 'zh-CN', name: '简体中文' },
  { id: 'zh-TW', name: '繁體中文' },
  { id: 'ja', name: '日本語' },
  { id: 'ko', name: '한국어' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
  { id: 'de', name: 'Deutsch' },
  { id: 'pt', name: 'Português' },
  { id: 'id', name: 'Bahasa Indonesia' },
  { id: 'ru', name: 'Русский' },
  { id: 'auto', name: 'Auto' },
];

export const DEFAULT_SETTINGS = {
  // Array of configured model keys:
  // [{ id, provider, model, apiKey, baseUrl, isEnabled, priority, failureCount, cooldownUntil }]
  apiConfigs: [],
  activeConfigId: 'auto', // 'auto' (round-robin active) or specific config id
  rotationStrategy: 'round-robin', // 'round-robin' | 'random' | 'fallback-on-error'
  studyMode: 'step-by-step', // 'step-by-step' | 'direct' | 'hint' | 'explain' | 'translate'
  uiLanguage: 'vi', // 'vi' | 'en' | 'th' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt' | 'id' | 'ru'
  outputLanguage: 'en', // 'en' | 'vi' | 'es' | 'fr' | 'de' | 'zh-CN' | 'ja' | 'ko' | 'auto'
  systemPrompt: `You are an elite academic tutor and homework assistant AI.
Your goal is to help students understand complex concepts and solve homework questions step-by-step.
Always provide crystal clear, pedagogically sound, and mathematically rigorous explanations.
Use LaTeX math formulas ($...$ for inline, $$...$$ for block formulas) wherever appropriate.
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
  routingStrategy: 'prefer_nano', // 'prefer_nano' | 'prefer_config' | 'nano_only' | 'config_only'
  installedOcrModels: {
    vie: { lang: 'vie', name: 'Tiếng Việt', size: '1.9 MB', version: '1.0.0', isBundled: true, isInstalled: true },
    eng: { lang: 'eng', name: 'English', size: '4.1 MB', version: '1.0.0', isBundled: true, isInstalled: true },
    equ: { lang: 'equ', name: 'Toán học & Ký hiệu', size: '2.3 MB', version: '1.0.0', isBundled: true, isInstalled: true },
  },
  chatHistory: [],
  conversations: [], // [{ id, title, createdAt, updatedAt, thumbnail, messages: [] }]
  activeConversationId: null,
};

export const Storage = {
  async get(keys = null) {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      chrome.storage.local.get(keys, (res) => {
        const merged = { ...DEFAULT_SETTINGS, ...res };
        if (!keys) {
          resolve(merged);
        } else if (Array.isArray(keys)) {
          const filtered = {};
          keys.forEach((k) => {
            filtered[k] = merged[k];
          });
          resolve(filtered);
        } else if (typeof keys === 'string') {
          resolve({ [keys]: merged[keys] });
        } else {
          resolve(merged);
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

  // =======================================================
  // Multi-Session Conversation Management
  // =======================================================
  async getConversations() {
    const { conversations = [], chatHistory = [] } = await this.get(['conversations', 'chatHistory']);
    if (conversations.length === 0 && chatHistory.length > 0) {
      // Automatic migration from flat chatHistory to first conversation
      const firstUserMsg = chatHistory.find((m) => m.role === 'user');
      const conv = {
        id: `conv_${Date.now()}`,
        title: firstUserMsg?.content ? firstUserMsg.content.slice(0, 50) : 'Cuộc trò chuyện trước',
        createdAt: firstUserMsg?.timestamp || Date.now(),
        updatedAt: Date.now(),
        thumbnail: chatHistory.find((m) => m.image)?.image || null,
        messages: chatHistory,
      };
      await this.set({ conversations: [conv], activeConversationId: conv.id });
      return [conv];
    }
    return conversations;
  },

  async getActiveConversation() {
    const conversations = await this.getConversations();
    const { activeConversationId } = await this.get(['activeConversationId']);
    if (activeConversationId) {
      const found = conversations.find((c) => c.id === activeConversationId);
      if (found) return found;
    }
    if (conversations.length > 0) {
      return conversations[conversations.length - 1];
    }
    return null;
  },

  async createNewConversation(title = 'Đoạn chat mới') {
    const conversations = await this.getConversations();
    const { activeConversationId } = await this.get(['activeConversationId']);
    const active = conversations.find((c) => c.id === activeConversationId);

    // If current active conversation is already empty, reuse it
    if (active && (!active.messages || active.messages.length === 0)) {
      active.title = title;
      active.updatedAt = Date.now();
      await this.set({
        conversations: [...conversations],
        activeConversationId: active.id,
        chatHistory: [],
      });
      return active;
    }

    const newConv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      thumbnail: null,
      messages: [],
    };
    const updated = [...conversations, newConv];
    await this.set({
      conversations: updated,
      activeConversationId: newConv.id,
      chatHistory: [],
    });
    return newConv;
  },

  async switchConversation(convId) {
    const conversations = await this.getConversations();
    const active = conversations.find((c) => c.id === convId) || null;
    await this.set({
      activeConversationId: convId,
      chatHistory: active ? (active.messages || []) : [],
    });
    return active;
  },

  async deleteConversation(convId) {
    const conversations = await this.getConversations();
    const updated = conversations.filter((c) => c.id !== convId);
    const { activeConversationId } = await this.get(['activeConversationId']);
    let nextActiveId = activeConversationId;
    let nextMessages = [];

    if (activeConversationId === convId) {
      if (updated.length > 0) {
        nextActiveId = updated[updated.length - 1].id;
        nextMessages = updated[updated.length - 1].messages;
      } else {
        nextActiveId = null;
        nextMessages = [];
      }
    } else {
      const active = updated.find((c) => c.id === activeConversationId);
      nextMessages = active ? active.messages : [];
    }

    await this.set({
      conversations: updated,
      activeConversationId: nextActiveId,
      chatHistory: nextMessages,
    });
    return updated;
  },

  async getChatHistory() {
    const activeConv = await this.getActiveConversation();
    return activeConv ? activeConv.messages : [];
  },

  async addChatMessage(msg) {
    const conversations = await this.getConversations();
    const { activeConversationId } = await this.get(['activeConversationId']);
    let activeConv = conversations.find((c) => c.id === activeConversationId);

    const messageWithTime = { ...msg, timestamp: Date.now() };

    if (!activeConv) {
      activeConv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: msg.content ? msg.content.slice(0, 50) : (msg.image ? 'Giải bài tập qua ảnh' : 'Bài tập mới'),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        thumbnail: msg.image || null,
        messages: [messageWithTime],
      };
      conversations.push(activeConv);
    } else {
      activeConv.messages = [...activeConv.messages, messageWithTime].slice(-50);
      activeConv.updatedAt = Date.now();
      if (activeConv.messages.length <= 2 && msg.role === 'user') {
        activeConv.title = msg.content ? msg.content.slice(0, 50) : (msg.image ? 'Giải bài tập qua ảnh' : activeConv.title);
      }
      if (msg.image && !activeConv.thumbnail) {
        activeConv.thumbnail = msg.image;
      }
    }

    // Keep max 50 recent conversations to maintain high performance
    const finalConversations = conversations.slice(-50);

    await this.set({
      conversations: finalConversations,
      activeConversationId: activeConv.id,
      chatHistory: activeConv.messages,
    });
    return activeConv.messages;
  },

  async clearChatHistory() {
    const { activeConversationId } = await this.get(['activeConversationId']);
    if (activeConversationId) {
      await this.deleteConversation(activeConversationId);
    } else {
      await this.set({ chatHistory: [], conversations: [] });
    }
  },

  // =======================================================
  // AI Routing Strategy & OCR Models Management
  // =======================================================
  async getRoutingStrategy() {
    const { routingStrategy = 'prefer_nano' } = await this.get(['routingStrategy']);
    return routingStrategy;
  },

  async setRoutingStrategy(strategy) {
    await this.set({ routingStrategy: strategy });
    return strategy;
  },

  async getInstalledOcrModels() {
    const { installedOcrModels = DEFAULT_SETTINGS.installedOcrModels } = await this.get(['installedOcrModels']);
    return installedOcrModels;
  },

  async saveOcrModel(modelInfo) {
    const models = await this.getInstalledOcrModels();
    const updated = {
      ...models,
      [modelInfo.lang]: {
        ...modelInfo,
        updatedAt: Date.now(),
      },
    };
    await this.set({ installedOcrModels: updated });
    return updated;
  },

  async removeOcrModel(lang) {
    const models = await this.getInstalledOcrModels();
    const updated = { ...models };
    if (updated[lang]?.isBundled) {
      // If bundled, reset version and mark as not custom updated
      updated[lang] = { ...DEFAULT_SETTINGS.installedOcrModels[lang], isInstalled: true };
    } else {
      delete updated[lang];
    }
    await this.set({ installedOcrModels: updated });
    return updated;
  }
};
