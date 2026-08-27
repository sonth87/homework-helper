/**
 * Storage & Configuration Management Wrapper
 * Persists user models, API keys, rotation strategy, and preferences in chrome.storage.local
 */

import { isSingleWord, buildWordLookupPrompt, buildSentenceTranslatePrompt, DICTIONARY_SCHEMA } from './dictionary.js';

export const DEFAULT_PROVIDERS = [
  {
    id: "chrome-builtin",
    name: "Chrome Built-in AI (Gemini Nano)",
    description:
      "Mô hình cục bộ On-Device tích hợp sẵn trong Chrome (Miễn phí, Offline, Không cần Key)",
    models: [{ id: "gemini-nano", name: "Gemini Nano" }],
    defaultBaseUrl: "",
    requiresBaseUrl: false,
    requiresKey: false,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    models: [
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash" },
      { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro" },
      { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    ],
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    requiresBaseUrl: false,
    authHeader: "x-goog-api-key",
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-5.6-sol", name: "GPT-5.6 Sol" },
      { id: "gpt-5.6-terra", name: "GPT-5.6 Terra" },
      { id: "gpt-5.6-luna", name: "GPT-5.6 Luna" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "o3-mini", name: "o3 Mini" },
      { id: "o1", name: "o1" },
    ],
    defaultBaseUrl: "https://api.openai.com/v1",
    requiresBaseUrl: false,
    authHeader: "Bearer",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    models: [
      { id: "claude-fable-5", name: "Claude Fable 5" },
      { id: "claude-opus-5", name: "Claude Opus 5" },
      { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
    ],
    defaultBaseUrl: "https://api.anthropic.com/v1",
    requiresBaseUrl: false,
    authHeader: "x-api-key",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
      { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" },
      { id: "deepseek-chat", name: "DeepSeek V3" },
      { id: "deepseek-reasoner", name: "DeepSeek R1" },
    ],
    defaultBaseUrl: "https://api.deepseek.com/v1",
    requiresBaseUrl: false,
    authHeader: "Bearer",
  },
  {
    id: "groq",
    name: "Groq",
    models: [
      { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B" },
      { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B" },
      { id: "qwen/qwen3.6-27b", name: "Qwen 3.6 27B" },
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
    ],
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    requiresBaseUrl: false,
    authHeader: "Bearer",
  },
  {
    id: "ollama",
    name: "Ollama (Local AI)",
    description: "Chạy mô hình cục bộ trên máy tính qua Ollama (Offline, Miễn phí, Không cần Key)",
    models: [
      { id: "llama3.3", name: "Llama 3.3 (8B / 70B)" },
      { id: "deepseek-r1:8b", name: "DeepSeek R1 (8B - Reasoning)" },
      { id: "deepseek-r1:14b", name: "DeepSeek R1 (14B)" },
      { id: "qwen2.5:7b", name: "Qwen 2.5 (7B)" },
      { id: "qwen2.5-coder:7b", name: "Qwen 2.5 Coder (7B)" },
      { id: "gemma2:9b", name: "Gemma 2 (9B)" },
      { id: "mistral", name: "Mistral (7B)" },
      { id: "phi4", name: "Phi-4" },
    ],
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    requiresBaseUrl: true,
    requiresKey: false,
    authHeader: "Bearer",
  },
  {
    id: "lmstudio",
    name: "LM Studio (Local AI)",
    description: "Chạy mô hình cục bộ qua Local Server của LM Studio (OpenAI-compatible)",
    models: [
      { id: "loaded-model", name: "Mô hình đang nạp trong LM Studio" },
      { id: "local-model", name: "Local Model" },
    ],
    defaultBaseUrl: "http://127.0.0.1:1234/v1",
    requiresBaseUrl: true,
    requiresKey: false,
    authHeader: "Bearer",
  },
  {
    id: "custom",
    name: "Custom / OpenRouter / Local Endpoint",
    models: [
      { id: "custom-model", name: "Custom Model" },
      { id: "google/gemini-3.7-flash", name: "google/gemini-3.7-flash (OpenRouter)" },
      { id: "openai/gpt-5.6-sol", name: "openai/gpt-5.6-sol (OpenRouter)" },
      { id: "anthropic/claude-sonnet-5", name: "anthropic/claude-sonnet-5 (OpenRouter)" },
      { id: "deepseek/deepseek-v4-pro", name: "deepseek/deepseek-v4-pro (OpenRouter)" },
    ],
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    requiresBaseUrl: true,
    authHeader: "Bearer",
  },
];

export const SUPPORTED_LANGUAGES = [
  { id: "vi", name: "Tiếng Việt" },
  { id: "en", name: "English" },
  { id: "th", name: "ไทย" },
  { id: "zh-CN", name: "简体中文" },
  { id: "zh-TW", name: "繁體中文" },
  { id: "ja", name: "日本語" },
  { id: "ko", name: "한국어" },
  { id: "es", name: "Español" },
  { id: "fr", name: "Français" },
  { id: "de", name: "Deutsch" },
  { id: "pt", name: "Português" },
  { id: "id", name: "Bahasa Indonesia" },
  { id: "ru", name: "Русский" },
  { id: "auto", name: "Auto" },
];

export const DEFAULT_SYSTEM_PROMPT = `You are an elite academic tutor and homework assistant AI.
Your goal is to solve academic exercises, quizzes, exams, and homework questions with extreme mathematical rigor and maximum pedagogical clarity.

Core Guidelines:
1. Always analyze the full context of the problem, including text, math formulas, and any attached images or diagrams.
2. For multiple-choice questions: Identify the single correct answer letter (A, B, C, or D), clearly display it, and provide rigorous step-by-step reasoning explaining why it is correct and why other options are incorrect.
3. For mathematical & scientific equations: Format all mathematical notations, equations, variables, and expressions using standard LaTeX syntax enclosed in single dollar signs for inline math ($x^2 + y^2 = r^2$) and double dollar signs for block math ($$\\int f(x) dx$$).
4. For step-by-step solutions: Break down the explanation logically into numbered steps (Step 1, Step 2, ...). Highlight key definitions, formulas applied, intermediate results, and the final boxed/bolded answer.
5. Tone & Style: Be encouraging, precise, intellectually rigorous, and crystal clear. Avoid unnecessary fluff.`;

export const DEFAULT_NANO_SYSTEM_PROMPT = `You are a helpful, precise academic tutor AI.
Your task is to solve homework questions and quizzes clearly and accurately.

Instructions:
1. For multiple-choice questions: Identify the correct option and give a concise step-by-step explanation.
2. For math & science problems: Show step-by-step reasoning with formulas in LaTeX ($...$) and clearly state the final answer.
3. Keep explanations structured, concise, and easy to understand.`;

export function buildNanoPrompts(studyMode = 'step-by-step', prompt = '', ocrText = '', targetLangName = 'Vietnamese', customSysPrompt = '') {
  const contentText = (ocrText && ocrText.trim())
    ? (prompt && prompt.trim() ? `${prompt.trim()}\n\n[Question content & options from image]:\n${ocrText.trim()}` : ocrText.trim())
    : prompt.trim();

  let sysPrompt = customSysPrompt || DEFAULT_NANO_SYSTEM_PROMPT;
  let userPrompt = '';
  let responseConstraint = null;

  if (studyMode === 'direct') {
    sysPrompt = `You are a precise, concise direct-answer AI for quizzes and homework.
CRITICAL RULES:
1. MULTIPLE-CHOICE QUESTIONS: If the question contains options/choices (e.g. A, B, C, D or choices like 2, NaN, 0, 1):
   - You MUST pick and output ONLY the single correct matching option from the provided choices.
   - DO NOT answer outside the given options if a matching option exists.
   - Format: "Answer: [answer content]" (e.g. "Answer: NaN" or "Answer: B. NaN"), with the "Answer:" label itself translated into ${targetLangName}.
2. OPEN QUESTIONS (no choices): Output ONLY the final numeric or short phrase answer.
3. STRICTLY FORBIDDEN: DO NOT write explanations, steps, definitions, formulas, or analysis. Keep output to 1 line only.`;
    userPrompt = `[Question & options]:\n${contentText}\n\n[STRICT REQUIREMENT]: Pick exactly 1 option from the choices above. Output only the chosen answer, with absolutely no explanation.\n[Language]: ${targetLangName}`;
  } else if (studyMode === 'hint') {
    sysPrompt = `You are a pedagogical tutor AI. Do NOT give the final answer. Provide hints, key formulas, and guiding questions in ${targetLangName}.`;
    userPrompt = `[Question]:\n${contentText}\n\n[REQUIREMENT]: Give hints and guidance to help the student work out the problem themselves — do not give the final answer.\n[Language]: ${targetLangName}`;
  } else if (studyMode === 'explain') {
    sysPrompt = `You are an educator AI. Explain the underlying scientific/mathematical theory and principles clearly in ${targetLangName}.`;
    userPrompt = `[Question]:\n${contentText}\n\n[REQUIREMENT]: Explain in depth the underlying theory and knowledge behind this problem.\n[Language]: ${targetLangName}`;
  } else if (studyMode === 'summarize') {
    // Selection-toolbar tools. Without a branch of their own both of these
    // fell into the step-by-step homework solver at the bottom, which
    // answered the text instead of summarizing/proofreading it.
    sysPrompt = `You are a summarizer. Condense what you are given; never solve, answer, or add to it. Reply in ${targetLangName}.`;
    userPrompt = `[Content]:\n${contentText}\n\n[REQUIREMENT]: Give a 1-2 sentence overview, then the key points as short bullets. Stay much shorter than the original and add nothing that is not in the text.\n[Language]: ${targetLangName}`;
  } else if (studyMode === 'grammar') {
    sysPrompt = `You are a proofreader. Treat the input strictly as writing to correct, never as a question to answer. Keep the corrected text in its original language; write your notes in ${targetLangName}.`;
    userPrompt = `[Text]:\n${contentText}\n\n[REQUIREMENT]: Output (1) the full corrected text, (2) a short list of the corrections with a one-line reason each, (3) one closing line on tone/clarity.\n[Language for notes]: ${targetLangName}`;
  } else if (studyMode === 'translate') {
    // Same word-vs-phrase routing as formatStudyPrompt (the cloud path) so
    // the on-device model gets an identically shaped task; for a word lookup
    // the schema below is handed to the Prompt API as a responseConstraint.
    sysPrompt = `You are a translation tool and bilingual dictionary, not a homework-solving assistant. No preamble, no restating the request, no explaining the task — go straight to the requested content.`;
    if (isSingleWord(contentText)) {
      userPrompt = buildWordLookupPrompt(contentText.trim(), targetLangName);
      responseConstraint = DICTIONARY_SCHEMA;
    } else {
      userPrompt = buildSentenceTranslatePrompt(contentText, targetLangName);
    }
  } else {
    // step-by-step
    sysPrompt = `${sysPrompt}\n\n[MULTIPLE-CHOICE RULE]: If options are present, clearly conclude with the selected option from the list.\n[STRICT LANGUAGE]: You MUST reply and explain in ${targetLangName}.`;
    userPrompt = `[Homework content]:\n${contentText}\n\n[Requirement]: Solve the problem with detailed step-by-step reasoning (Step 1, Step 2...), present formulas using LaTeX ($...$), and select the correct option among the choices.\n[Language]: ${targetLangName}`;
  }

  const finalSysPrompt = `${sysPrompt}\n\n[LANGUAGE REQUIREMENT]: Reply in ${targetLangName}.`.trim();
  return { sysPrompt: finalSysPrompt, userPrompt, responseConstraint };
}

export const DEFAULT_SETTINGS = {
  // Array of configured model keys:
  // [{ id, provider, model, apiKey, baseUrl, isEnabled, priority, failureCount, cooldownUntil }]
  apiConfigs: [],
  activeConfigId: "auto", // 'auto' (round-robin active) or specific config id
  rotationStrategy: "round-robin", // 'round-robin' | 'random' | 'fallback-on-error'
  studyMode: "step-by-step", // 'step-by-step' | 'direct' | 'hint' | 'explain' | 'translate'
  uiLanguage: "vi", // 'vi' | 'en' | 'th' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt' | 'id' | 'ru'
  outputLanguage: "en", // 'en' | 'vi' | 'es' | 'fr' | 'de' | 'zh-CN' | 'ja' | 'ko' | 'auto'
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  nanoSystemPrompt: DEFAULT_NANO_SYSTEM_PROMPT,
  enableFormsAdapter: true,
  enableTextTooltip: true,
  enableFloatingButton: true,
  overlayTheme: "auto", // 'auto' (follow system) | 'light' | 'dark'
  fabSize: "normal", // 'tiny' | 'small' | 'normal' | 'large'
  fabOpacity: 90, // 30 - 100% (Liquid Glass background alpha)
  fabPosition: null, // null (default docked position) | { dock: 'left' | 'right', top: number(px) } — set by dragging the FAB cluster
  popupOpacity: 92, // 40 - 100% (Liquid Glass background alpha)
  popupBlur: 16, // 0 - 30px
  popupCardSize: "normal", // 'normal' | 'compact' (compact hides secondary buttons until hover, tighter padding)
  toolbarOpacity: 90, // 40 - 100%
  toolbarBlur: 16,
  toolbarShowText: true, // true: icon + label, false: icon only
  toolbarSize: "normal", // 'compact' | 'normal' | 'large'
  toolbarTheme: "glass-light", // 'glass-light' | 'glass-dark' | 'cyber-blue' | 'emerald' | 'purple'
  toolbarCustomColor: "#0284c7",
  routingStrategy: "prefer_config", // 'prefer_config' (recommended) | 'prefer_nano' | 'nano_only' | 'config_only'
  installedOcrModels: {
    vie: {
      lang: "vie",
      name: "Tiếng Việt",
      size: "1.9 MB",
      version: "1.0.0",
      isBundled: true,
      isInstalled: true,
    },
    eng: {
      lang: "eng",
      name: "English",
      size: "4.1 MB",
      version: "1.0.0",
      isBundled: true,
      isInstalled: true,
    },
    equ: {
      lang: "equ",
      name: "Toán học & Ký hiệu",
      size: "2.3 MB",
      version: "1.0.0",
      isBundled: true,
      isInstalled: true,
    },
  },
  chatHistory: [],
  conversations: [], // [{ id, title, createdAt, updatedAt, thumbnail, messages: [] }]
  activeConversationId: null,
};

export const Storage = {
  async get(keys = null) {
    return new Promise((resolve) => {
      // chrome.runtime.id reads as undefined once the extension is reloaded/updated
      // while this script is still injected in an old tab — bail out before touching
      // any chrome.* API to avoid the synchronous "Extension context invalidated" throw.
      if (typeof chrome === "undefined" || !chrome.storage?.local || !chrome.runtime?.id) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      try {
        chrome.storage.local.get(keys, (res) => {
          const merged = { ...DEFAULT_SETTINGS, ...(res || {}) };
          if (!keys) {
            resolve(merged);
          } else if (Array.isArray(keys)) {
            const filtered = {};
            keys.forEach((k) => {
              filtered[k] = merged[k];
            });
            resolve(filtered);
          } else if (typeof keys === "string") {
            resolve({ [keys]: merged[keys] });
          } else {
            resolve(merged);
          }
        });
      } catch (e) {
        // Context was invalidated in the gap between the check above and this call.
        resolve({ ...DEFAULT_SETTINGS });
      }
    });
  },

  async set(data) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage?.local || !chrome.runtime?.id) {
        resolve(false);
        return;
      }
      try {
        chrome.storage.local.set(data, () => resolve(true));
      } catch (e) {
        resolve(false);
      }
    });
  },

  async getApiConfigs() {
    const data = await this.get([
      "apiConfigs",
      "activeConfigId",
      "rotationStrategy",
    ]);
    return {
      apiConfigs: data.apiConfigs || [],
      activeConfigId: data.activeConfigId || "auto",
      rotationStrategy: data.rotationStrategy || "round-robin",
    };
  },

  async saveApiConfig(config) {
    const { apiConfigs = [] } = await this.get("apiConfigs");
    const existingIdx = apiConfigs.findIndex((c) => c.id === config.id);
    let updated;
    if (existingIdx >= 0) {
      updated = [...apiConfigs];
      updated[existingIdx] = { ...updated[existingIdx], ...config };
    } else {
      updated = [
        ...apiConfigs,
        {
          ...config,
          id:
            config.id ||
            `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        },
      ];
    }
    await this.set({ apiConfigs: updated });
    return updated;
  },

  async removeApiConfig(id) {
    const { apiConfigs = [] } = await this.get("apiConfigs");
    const updated = apiConfigs.filter((c) => c.id !== id);
    await this.set({ apiConfigs: updated });
    return updated;
  },

  // =======================================================
  // Multi-Session Conversation Management
  // =======================================================
  async getConversations() {
    const { conversations = [], chatHistory = [] } = await this.get([
      "conversations",
      "chatHistory",
    ]);
    if (conversations.length === 0 && chatHistory.length > 0) {
      // Automatic migration from flat chatHistory to first conversation
      const firstUserMsg = chatHistory.find((m) => m.role === "user");
      const conv = {
        id: `conv_${Date.now()}`,
        title: firstUserMsg?.content
          ? firstUserMsg.content.slice(0, 50)
          : "Cuộc trò chuyện trước",
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
    const { activeConversationId } = await this.get(["activeConversationId"]);
    if (activeConversationId) {
      const found = conversations.find((c) => c.id === activeConversationId);
      if (found) return found;
    }
    if (conversations.length > 0) {
      return conversations[conversations.length - 1];
    }
    return null;
  },

  async createNewConversation(title = "Đoạn chat mới") {
    const conversations = await this.getConversations();
    const { activeConversationId } = await this.get(["activeConversationId"]);
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
      chatHistory: active ? active.messages || [] : [],
    });
    return active;
  },

  async deleteConversation(convId) {
    const conversations = await this.getConversations();
    const updated = conversations.filter((c) => c.id !== convId);
    const { activeConversationId } = await this.get(["activeConversationId"]);
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
    const { activeConversationId } = await this.get(["activeConversationId"]);
    let activeConv = conversations.find((c) => c.id === activeConversationId);

    const messageWithTime = { ...msg, timestamp: Date.now() };

    if (!activeConv) {
      activeConv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: msg.content
          ? msg.content.slice(0, 50)
          : msg.image
            ? "Giải bài tập qua ảnh"
            : "Bài tập mới",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        thumbnail: msg.image || null,
        messages: [messageWithTime],
      };
      conversations.push(activeConv);
    } else {
      activeConv.messages = [...activeConv.messages, messageWithTime].slice(
        -50,
      );
      activeConv.updatedAt = Date.now();
      if (activeConv.messages.length <= 2 && msg.role === "user") {
        activeConv.title = msg.content
          ? msg.content.slice(0, 50)
          : msg.image
            ? "Giải bài tập qua ảnh"
            : activeConv.title;
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
    const { activeConversationId } = await this.get(["activeConversationId"]);
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
    const { routingStrategy = "prefer_nano" } = await this.get([
      "routingStrategy",
    ]);
    return routingStrategy;
  },

  async setRoutingStrategy(strategy) {
    await this.set({ routingStrategy: strategy });
    return strategy;
  },

  // Single global toggle (not per-key): when off, requests to models with a
  // known reasoning/thinking control (see shared/thinking-control.js) ask
  // for the lowest level that model allows, to cut latency. Models with no
  // known control, custom-typed models, and local providers are unaffected.
  async getThinkingEnabled() {
    const { thinkingEnabled = true } = await this.get(["thinkingEnabled"]);
    return thinkingEnabled;
  },

  async setThinkingEnabled(enabled) {
    await this.set({ thinkingEnabled: enabled });
    return enabled;
  },

  async getInstalledOcrModels() {
    const { installedOcrModels = DEFAULT_SETTINGS.installedOcrModels } =
      await this.get(["installedOcrModels"]);
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
      updated[lang] = {
        ...DEFAULT_SETTINGS.installedOcrModels[lang],
        isInstalled: true,
      };
    } else {
      delete updated[lang];
    }
    await this.set({ installedOcrModels: updated });
    return updated;
  },
};
