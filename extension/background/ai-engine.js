/**
 * Multi-Provider AI Streaming Client
 * Connects directly to Google Gemini, OpenAI, Claude, DeepSeek, Groq, and Custom endpoints.
 * Handles multimodal vision (images) and text streaming with automatic failover.
 */

import { keyRotator } from './key-rotator.js';

export class AiEngine {
  /**
   * Main entrypoint to ask AI with text and optional image
   * @param {Object} params
   * @param {string} params.prompt - Text question / instructions
   * @param {string} [params.imageBase64] - Optional base64 image (with or without data URL prefix)
   * @param {string} [params.studyMode] - 'step-by-step' | 'direct' | 'hint' | 'explain' | 'translate'
   * @param {string} [params.preferredConfigId] - Specific config ID or null for auto-rotation
   * @param {Function} onChunk - Callback for incremental text chunks: onChunk(text, metadata)
   * @param {AbortSignal} [signal] - Abort signal
   */
  static async ask({ prompt, imageBase64, studyMode, preferredConfigId, systemPrompt, outputLanguage = 'en' }, onChunk, signal) {
    const { routingStrategy = 'prefer_nano', apiConfigs = [] } = await Storage.get(['routingStrategy', 'apiConfigs']);
    const enabledKeys = (apiConfigs || []).filter((c) => c.isEnabled && c.apiKey);

    const langNames = {
      en: 'English',
      vi: 'Tiếng Việt (Vietnamese)',
      es: 'Español (Spanish)',
      fr: 'Français (French)',
      de: 'Deutsch (German)',
      'zh-CN': 'Simplified Chinese (简体中文)',
      'zh-TW': 'Traditional Chinese (繁體中文)',
      ja: 'Japanese (日本語)',
      ko: 'Korean (한국어)',
      pt: 'Portuguese (Português)',
      id: 'Bahasa Indonesia',
      ru: 'Russian (Русский)',
    };
    const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'Tiếng Việt (Vietnamese)';
    const finalSystemPrompt = `${systemPrompt || ''}\n\n[STRICT LANGUAGE REQUIREMENT]: You MUST provide your entire solution, explanations, step-by-step reasoning, and answer in ${targetLangName}. Do NOT use any other language unless explicitly requested.`.trim();

    // 1. nano_only Strategy: 100% On-Device execution
    if (routingStrategy === 'nano_only') {
      onChunk('', { status: 'connecting', model: 'Gemini Nano (On-Device)', provider: 'chrome-builtin' });
      await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt }, onChunk, signal);
      return;
    }

    // 2. prefer_nano Strategy (When text-only and no preferred external config, run Gemini Nano directly)
    if (routingStrategy === 'prefer_nano' && !imageBase64 && !preferredConfigId) {
      try {
        onChunk('', { status: 'connecting', model: 'Gemini Nano (On-Device)', provider: 'chrome-builtin' });
        await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt }, onChunk, signal);
        return;
      } catch (nanoErr) {
        if (enabledKeys.length === 0) throw nanoErr;
        onChunk(`\n\n> *[Thông báo] Gemini Nano không khả dụng, tự động chuyển sang mô hình Cloud Vision API...*\n\n`, {
          status: 'switching',
          error: nanoErr.message,
        });
      }
    }

    // 3. API Config Pool Execution (used for prefer_config, config_only, or prefer_nano fallback/multimodal)
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const { config, strategy, totalAvailable } = await keyRotator.getHealthyConfigs(preferredConfigId);

      if (!config) {
        // Fallback to Gemini Nano if prefer_config is set
        if (routingStrategy === 'prefer_config' || routingStrategy === 'prefer_nano') {
          onChunk(`\n\n> *[Thông báo] Không có API Key khả dụng, tự động chuyển về Gemini Nano On-Device...*\n\n`, {
            status: 'switching',
          });
          await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt }, onChunk, signal);
          return;
        }
        throw new Error('Chưa có API Key nào được kích hoạt trong Cài đặt.');
      }

      try {
        onChunk('', { status: 'connecting', model: config.model, provider: config.provider, attempt: attempts });

        if (config.provider === 'chrome-builtin') {
          await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt }, onChunk, signal);
        } else if (config.provider === 'gemini') {
          await this.streamGemini(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt }, onChunk, signal);
        } else if (config.provider === 'claude') {
          await this.streamClaude(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt }, onChunk, signal);
        } else {
          // OpenAI, DeepSeek, Groq, OpenRouter, Custom (all use OpenAI chat completions format)
          await this.streamOpenAiCompatible(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt }, onChunk, signal);
        }

        // Successfully completed
        await keyRotator.reportSuccess(config.id);
        return;
      } catch (err) {
        if (signal?.aborted) {
          throw err;
        }

        console.warn(`[AiEngine] Attempt ${attempts} failed on model ${config.model}:`, err);
        const statusCode = err.status || 500;
        await keyRotator.reportFailure(config.id, statusCode);

        if (attempts >= maxAttempts || totalAvailable <= 1) {
          // Last resort fallback to Gemini Nano if prefer_config
          if (routingStrategy === 'prefer_config' || routingStrategy === 'prefer_nano') {
            onChunk(`\n\n> *[Thông báo] Tất cả API Key đều bận, tự động chuyển về Gemini Nano On-Device...*\n\n`, {
              status: 'switching',
            });
            await this.streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt: finalSystemPrompt }, onChunk, signal);
            return;
          }
          throw err;
        }

        // Notify UI about failover
        onChunk(`\n\n> *[Thông báo] Key ${config.model} gặp giới hạn, tự động xoay sang key dự phòng...*\n\n`, {
          status: 'switching',
          error: err.message,
        });
      }
    }
  }

  static formatStudyPrompt(studyMode, prompt, outputLanguage = 'en') {
    const langNames = {
      en: 'English',
      vi: 'Tiếng Việt (Vietnamese)',
      es: 'Español (Spanish)',
      fr: 'Français (French)',
      de: 'Deutsch (German)',
      'zh-CN': 'Simplified Chinese (简体中文)',
      'zh-TW': 'Traditional Chinese (繁體中文)',
      ja: 'Japanese (日本語)',
      ko: 'Korean (한국어)',
      pt: 'Portuguese (Português)',
      id: 'Bahasa Indonesia',
      ru: 'Russian (Русский)',
    };
    const targetLangName = (outputLanguage && outputLanguage !== 'auto') ? (langNames[outputLanguage] || outputLanguage) : 'Tiếng Việt (Vietnamese)';
    const langSuffix = `\n\n[Yêu cầu ngôn ngữ: Toàn bộ lời giải và giải thích PHẢI viết bằng ${targetLangName}]`;

    if (!studyMode || studyMode === 'direct') return `${prompt}${langSuffix}`;

    const lower = prompt.trim().toLowerCase();
    const isGreeting = /^(hi|hello|hey|xin chào|chào bạn|chào ai|chào|test|alo|ping)\b/i.test(lower) && prompt.trim().length < 25;
    if (isGreeting) return `${prompt}${langSuffix}`;

    switch (studyMode) {
      case 'hint':
        return `[MODE: GỢI Ý & HƯỚNG DẪN TỰ HỌC]\nMục tiêu: KHÔNG đưa ra đáp án cuối cùng ngay lập tức. Thay vào đó, hãy đưa ra gợi ý sư phạm hữu ích, công thức then chốt và các câu hỏi dẫn dắt để học sinh tự giải:\n\nCâu hỏi:\n${prompt}${langSuffix}`;
      case 'explain':
        return `[MODE: GIẢI THÍCH CHUYÊN SÂU]\nMục tiêu: Giải thích bản chất lý thuyết khoa học/toán học, các định luật liên quan và trực quan thực tế đằng sau bài toán này một cách dễ hiểu:\n\nCâu hỏi:\n${prompt}${langSuffix}`;
      case 'translate':
        return `[MODE: DỊCH THUẬT & DIỄN GIẢI]\nMục tiêu: Dịch chính xác đề bài và nội dung sau sang ${targetLangName}:\n\n${prompt}${langSuffix}`;
      case 'step-by-step':
      default:
        return `[MODE: GIẢI CHI TIẾT TỪNG BƯỚC]\nMục tiêu: Giải bài tập sau với các bước rõ ràng (Bước 1, Bước 2...), lập luận toán học chặt chẽ, công thức LaTeX ($...$) và đóng khung đáp án cuối cùng:\n\nCâu hỏi:\n${prompt}${langSuffix}`;
    }
  }

  /**
   * Google Gemini SSE Stream
   */
  static async streamGemini(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt }, onChunk, signal) {
    const baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const model = config.model || 'gemini-2.5-flash';
    const url = `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

    const parts = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const mimeType = imageBase64.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/jpeg';
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64,
        },
      });
    }

    const fullPrompt = this.formatStudyPrompt(studyMode, prompt, outputLanguage);
    parts.push({ text: fullPrompt });

    const payload = {
      contents: [{ role: 'user', parts }],
      system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`Gemini API Error (${response.status}): ${errText}`);
      err.status = response.status;
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr) {
            try {
              const data = JSON.parse(jsonStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                onChunk(text, { status: 'streaming', model });
              }
            } catch (e) {
              // ignore partial chunk
            }
          }
        }
      }
    }
  }

  /**
   * OpenAI / DeepSeek / Groq / OpenRouter / Custom Streaming
   */
  static async streamOpenAiCompatible(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt }, onChunk, signal) {
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    const model = config.model || 'gpt-4o';
    const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const userContent = [];
    if (imageBase64) {
      const formattedUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
      userContent.push({
        type: 'image_url',
        image_url: { url: formattedUrl },
      });
    }

    const fullPrompt = this.formatStudyPrompt(studyMode, prompt, outputLanguage);
    userContent.push({ type: 'text', text: fullPrompt });

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userContent.length === 1 ? fullPrompt : userContent });

    const payload = {
      model,
      messages,
      stream: true,
      temperature: 0.4,
      max_tokens: 4096,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`${config.provider.toUpperCase()} API Error (${response.status}): ${errText}`);
      err.status = response.status;
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const data = JSON.parse(jsonStr);
            const text = data.choices?.[0]?.delta?.content;
            if (text) {
              onChunk(text, { status: 'streaming', model });
            }
          } catch (e) {
            // ignore partial JSON
          }
        }
      }
    }
  }

  /**
   * Anthropic Claude Streaming
   */
  static async streamClaude(config, { prompt, imageBase64, studyMode, outputLanguage, systemPrompt }, onChunk, signal) {
    const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    const model = config.model || 'claude-3-5-sonnet-20241022';
    const url = `${baseUrl.replace(/\/+$/, '')}/messages`;

    const content = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const mediaType = imageBase64.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/jpeg';
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: cleanBase64,
        },
      });
    }

    const fullPrompt = this.formatStudyPrompt(studyMode, prompt, outputLanguage);
    content.push({ type: 'text', text: fullPrompt });

    const payload = {
      model,
      max_tokens: 4096,
      system: systemPrompt || undefined,
      messages: [{ role: 'user', content }],
      stream: true,
      temperature: 0.4,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`Claude API Error (${response.status}): ${errText}`);
      err.status = response.status;
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6).trim();
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'content_block_delta' && data.delta?.text) {
              onChunk(data.delta.text, { status: 'streaming', model });
            }
          } catch (e) {
            // ignore partial JSON
          }
        }
      }
    }
  }

  /**
   * Chrome Built-in AI (Gemini Nano On-Device Prompt API)
   */
  static async streamChromeBuiltin({ prompt, imageBase64, studyMode, outputLanguage, systemPrompt }, onChunk, signal) {
    if (imageBase64) {
      onChunk(
        `> *Lưu ý: Chrome Gemini Nano On-Device hiện tại chuyên về xử lý văn bản. Để phân tích hình ảnh và đồ thị, bạn có thể thêm API Key Google Gemini (Miễn phí) trong Cài đặt.* \n\n`,
        { status: 'streaming', model: 'gemini-nano', isBuiltin: true }
      );
    }

    const fullPrompt = this.formatStudyPrompt(studyMode, prompt, outputLanguage);
    const getAi = () => {
      if (typeof chrome !== 'undefined' && chrome.aiOriginTrial?.languageModel) {
        return chrome.aiOriginTrial.languageModel;
      }
      if (typeof ai !== 'undefined' && ai?.languageModel) {
        return ai.languageModel;
      }
      const g = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {});
      return g.ai?.languageModel || g.ai?.assistant || g.LanguageModel || null;
    };
    const aiModel = getAi();

    if (aiModel && typeof aiModel.create === 'function') {
      const session = await aiModel.create({
        systemPrompt: systemPrompt || undefined,
        temperature: 0.4,
        topK: 3,
      });

      if (typeof session.promptStreaming === 'function') {
        const stream = session.promptStreaming(fullPrompt, { signal });
        let accumulated = '';
        for await (const chunk of stream) {
          let delta = '';
          if (typeof chunk === 'string') {
            if (chunk.startsWith(accumulated)) {
              delta = chunk.slice(accumulated.length);
              accumulated = chunk;
            } else {
              delta = chunk;
              accumulated += chunk;
            }
          }
          if (delta) {
            onChunk(delta, { status: 'streaming', model: 'Gemini Nano (On-Device)', isBuiltin: true });
          }
        }
        chrome.storage?.local?.set?.({ isNanoReady: true });
        return;
      } else {
        const reply = await session.prompt(fullPrompt);
        onChunk(reply, { status: 'streaming', model: 'Gemini Nano (On-Device)', isBuiltin: true });
        chrome.storage?.local?.set?.({ isNanoReady: true });
        return;
      }
    }

    // Fallback: Run via active web tab where window.ai is directly exposed by Chrome
    let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    let targetTab = tabs && tabs[0]?.url && tabs[0].url.startsWith('http') ? tabs[0] : null;

    if (!targetTab) {
      const allWebTabs = await chrome.tabs.query({ url: ['https://*/*', 'http://*/*'] });
      targetTab = allWebTabs && allWebTabs.length > 0 ? allWebTabs[0] : null;
    }

    if (!targetTab?.id) {
      throw new Error(
        'Chrome Built-in AI cần ít nhất 1 tab web thông thường (https://) đang mở để kết nối. Bạn hãy mở một tab web (như https://google.com) rồi thử lại nhé.'
      );
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      world: 'MAIN',
      func: async (promptText, sysPrompt) => {
        const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
        const m = g.ai?.languageModel || g.ai?.assistant || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null);
        if (!m) throw new Error('Trình duyệt chưa sẵn sàng window.ai trên tab web.');
        const session = await m.create({ systemPrompt: sysPrompt || undefined });
        return await session.prompt(promptText);
      },
      args: [fullPrompt, systemPrompt || ''],
    });

    const reply = results?.[0]?.result;
    if (reply) {
      onChunk(reply, { status: 'streaming', model: 'Gemini Nano (On-Device)', isBuiltin: true });
      chrome.storage?.local?.set?.({ isNanoReady: true });
    } else {
      throw new Error('Không nhận được phản hồi từ Gemini Nano.');
    }
  }
}

