/**
 * Study-mode prompt formatting, shared between the service worker (Gemini
 * Nano on-device path) and the offscreen document (cloud provider paths) so
 * both sides build the exact same instructions for a given study mode.
 */
export function formatStudyPrompt(studyMode, prompt, outputLanguage = 'en') {
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
  // Weaker/local models (Ollama, LM Studio, small quantized checkpoints) tend
  // to ignore a language instruction buried at the end of a long prompt —
  // sandwiching it at both the start (primacy) and end (recency) makes
  // compliance noticeably more reliable than a suffix alone.
  const langPrefix = `[BẮT BUỘC: Toàn bộ câu trả lời bên dưới PHẢI viết bằng ${targetLangName}. Đây là yêu cầu quan trọng nhất, được ưu tiên hơn mọi hướng dẫn khác.]\n\n`;
  const langSuffix = `\n\n[Nhắc lại yêu cầu ngôn ngữ: Toàn bộ lời giải và giải thích PHẢI viết bằng ${targetLangName}]`;

  let body;
  if (!studyMode || studyMode === 'direct') {
    body = `[MODE: ĐÁP ÁN TRỰC TIẾP]\nYêu cầu NGHIÊM NGẶT: Chỉ trả lời đáp án cuối cùng một cách CỰC KỲ NGẮN GỌN. Không giải thích, không phân tích, không trình bày các bước. Nếu là câu hỏi trắc nghiệm thì chỉ ghi tên đáp án và ký hiệu (ví dụ: "C. NaN"). Nếu là bài toán thì chỉ ghi kết quả số. Không quá 2-3 câu.\n\nCâu hỏi:\n${prompt}`;
  } else {
    const lower = prompt.trim().toLowerCase();
    const isGreeting = /^(hi|hello|hey|xin chào|chào bạn|chào ai|chào|test|alo|ping)\b/i.test(lower) && prompt.trim().length < 25;
    if (isGreeting) {
      body = prompt;
    } else {
      switch (studyMode) {
        case 'hint':
          body = `[MODE: GỢI Ý & HƯỚNG DẪN TỰ HỌC]\nMục tiêu: KHÔNG đưa ra đáp án cuối cùng ngay lập tức. Thay vào đó, hãy đưa ra gợi ý sư phạm hữu ích, công thức then chốt và các câu hỏi dẫn dắt để học sinh tự giải:\n\nCâu hỏi:\n${prompt}`;
          break;
        case 'explain':
          body = `[MODE: GIẢI THÍCH CHUYÊN SÂU]\nMục tiêu: Giải thích bản chất lý thuyết khoa học/toán học, các định luật liên quan và trực quan thực tế đằng sau bài toán này một cách dễ hiểu:\n\nCâu hỏi:\n${prompt}`;
          break;
        case 'translate':
          body = `[MODE: DỊCH THUẬT & DIỄN GIẢI]\nMục tiêu: Dịch chính xác đề bài và nội dung sau sang ${targetLangName}:\n\n${prompt}`;
          break;
        case 'step-by-step':
        default:
          body = `[MODE: GIẢI CHI TIẾT TỪNG BƯỚC]\nMục tiêu: Giải bài tập sau với các bước rõ ràng (Bước 1, Bước 2...), lập luận toán học chặt chẽ, công thức LaTeX ($...$) và đóng khung đáp án cuối cùng:\n\nCâu hỏi:\n${prompt}`;
      }
    }
  }

  return `${langPrefix}${body}${langSuffix}`;
}
