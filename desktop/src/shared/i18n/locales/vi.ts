/**
 * Bản dịch tiếng Việt. Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Thêm key ở đây không áp dụng cho extension và ngược lại.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'Ngôn ngữ',
  groupAi: 'AI & Mô hình',
  groupPrivacy: 'Riêng tư',
  groupSystem: 'Hệ thống',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'Ngôn ngữ giao diện',
  setUiLanguageDesc: 'Ngôn ngữ của chính ứng dụng — menu, nhãn, thông báo.',
  setOutputLanguage: 'Ngôn ngữ trả lời',
  setOutputLanguageDesc: 'Ngôn ngữ AI dùng để viết lời giải. Độc lập với ngôn ngữ giao diện.',
  setTranslateTarget: 'Dịch sang',
  setTranslateTargetDesc: 'Ngôn ngữ đích mặc định khi dịch bằng cách rê chuột.',
  setTranslateProviders: 'Dịch vụ dịch',
  setTranslateProvidersDesc: 'Thứ tự thử khi dịch bằng cách rê chuột — tự chuyển sang dịch vụ tiếp theo nếu một dịch vụ lỗi.',
  translateProviderGoogle: 'Google Translate',
  translateProviderBing: 'Bing Translator',
  translateProviderMymemory: 'MyMemory',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'Tự nhận diện',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'Chiến lược định tuyến',
  setRoutingStrategyDesc: 'Ưu tiên dùng mô hình nào trước khi trả lời.',
  routingPreferConfig: 'Ưu tiên key đã cấu hình',
  routingPreferLocal: 'Ưu tiên mô hình nội bộ',
  routingLocalOnly: 'Chỉ dùng mô hình nội bộ',
  routingConfigOnly: 'Chỉ dùng key đã cấu hình',

  setRotationStrategy: 'Cách xoay vòng key',
  setRotationStrategyDesc: 'Cách chọn giữa nhiều key đang bật.',
  rotationRoundRobin: 'Lần lượt',
  rotationRandom: 'Ngẫu nhiên',
  rotationFallback: 'Chỉ đổi khi lỗi',

  setRequestTimeout: 'Thời gian chờ tối đa',
  setRequestTimeoutDesc: 'Mô hình suy luận có thể im lặng rất lâu trước khi trả về chữ đầu tiên.',
  setMaxRetries: 'Số lần thử lại',
  setMaxRetriesDesc: 'Thử tối đa bao nhiêu key trước khi báo lỗi.',
  setThinkingEnabled: 'Bật chế độ suy luận',
  setThinkingEnabledDesc: 'Cho phép mô hình hỗ trợ suy luận kỹ trước khi trả lời. Chậm hơn nhưng chính xác hơn.',
  setMaxRequestsPerMinute: 'Giới hạn request mỗi phút',
  setMaxRequestsPerMinuteDesc: 'Lưới an toàn chống phát sinh chi phí ngoài ý muốn. Request vượt ngưỡng sẽ bị từ chối.',
  setMonthlyTokenBudget: 'Hạn mức token mỗi tháng',
  setMonthlyTokenBudgetDesc: 'Cảnh báo khi mức dùng gần chạm con số này. Để 0 là không giới hạn.',
  setOllamaBaseUrl: 'Địa chỉ Ollama',
  setLmStudioBaseUrl: 'Địa chỉ LM Studio',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'Ứng dụng loại trừ',
  setExcludedAppsDesc: 'Ứng dụng sẽ không bao giờ đọc màn hình khi các phần mềm này đang được chọn.',
  setPauseWhenScreenSharing: 'Tạm dừng khi chia sẻ màn hình',
  setPauseWhenScreenSharingDesc: 'Ẩn mọi lớp phủ trong lúc chia sẻ hoặc quay màn hình.',
  setPauseOnSensitiveApps: 'Tạm dừng với ứng dụng nhạy cảm',
  setPauseOnSensitiveAppsDesc: 'Tự động ngưng khi trình quản lý mật khẩu hoặc ứng dụng ngân hàng đang được chọn.',
  setLocalModelsOnly: 'Chỉ dùng mô hình nội bộ',
  setLocalModelsOnlyDesc: 'Không bao giờ gửi văn bản hay hình ảnh lên dịch vụ đám mây. Không có gì rời khỏi máy này.',
  setSaveHistory: 'Lưu lịch sử hội thoại',
  setSaveHistoryDesc: 'Giữ lại câu hỏi và lời giải cũ để xem lại.',
  setHistoryRetention: 'Xoá lịch sử sau',
  setHistoryRetentionDesc: 'Số ngày giữ lịch sử. Để 0 là giữ vĩnh viễn.',
  setTelemetry: 'Gửi dữ liệu sử dụng ẩn danh',
  setTelemetryDesc: 'Giúp cải thiện ứng dụng. Không bao giờ gồm nội dung màn hình hay câu hỏi của bạn.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'Khởi động cùng máy',
  setLaunchAtLoginDesc: 'Tự chạy ứng dụng khi bạn đăng nhập.',
  setHideFromDock: 'Ẩn khỏi Dock',
  setHideFromDockDesc: 'Chỉ chạy trên thanh menu, không hiện icon ở Dock hay taskbar.',
  setAutoUpdate: 'Tự động cập nhật',
  setAutoUpdateDesc: 'Tải và cài phiên bản mới ở chế độ nền.',
  setUpdateChannel: 'Kênh cập nhật',
  setUpdateChannelDesc: 'Kênh Beta nhận tính năng mới sớm hơn, đổi lại khả năng gặp lỗi cao hơn.',
  channelStable: 'Ổn định', channelBeta: 'Thử nghiệm',
  setLogLevel: 'Mức ghi log',
  setLogLevelDesc: 'Tăng mức này khi báo lỗi để log ghi được nhiều chi tiết hơn.',
  logError: 'Chỉ lỗi', logWarn: 'Cảnh báo', logInfo: 'Bình thường', logDebug: 'Chi tiết',
  setDebugOverlay: 'Lớp phủ gỡ lỗi',
  setDebugOverlayDesc: 'Vẽ khung quanh vùng văn bản nhận diện được. Hữu ích khi báo lỗi nhận diện.',

  // ── Xin quyền hệ thống (onboarding) ────────────────────────────────────────
  onboardingTitle: 'Quyền hệ thống',
  onboardingIntro: 'Homework Helper cần hai quyền của macOS để dịch và giải bài ở bất kỳ đâu trên màn hình. Cả hai đều bắt buộc — thiếu một trong hai app sẽ không đọc được nội dung trên màn hình.',
  onboardingAccessibilityTitle: 'Trợ năng (Accessibility)',
  onboardingAccessibilityDesc: 'Cho phép app đọc text dưới con trỏ chuột để dịch ngay lập tức — đường nhanh dùng cho hầu hết ứng dụng.',
  onboardingScreenTitle: 'Ghi màn hình (Screen Recording)',
  onboardingScreenDesc: 'Cho phép app chụp màn hình — dùng cho Khoanh vùng & Giải, và làm phương án dự phòng khi không đọc trực tiếp được text (PDF, một số trình soạn thảo).',
  onboardingGranted: 'Đã cấp',
  onboardingNotGranted: 'Chưa cấp',
  onboardingOpenPane: 'Mở System Settings',
  onboardingNeedsRestart: 'Đã cấp quyền. Khởi động lại app để áp dụng — macOS không áp dụng quyền mới cho tiến trình đang chạy sẵn.',
  onboardingRelaunch: 'Khởi động lại ngay',
  onboardingSkip: 'Để sau',
  onboardingReopenLabel: 'Quyền hệ thống',
  onboardingReopenDesc: 'Xem lại hoặc cấp lại các quyền Homework Helper cần.',
  onboardingReopenButton: 'Xem lại',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'Dịch',
  intentSolve: 'Giải bài tập',
  intentSummarize: 'Tóm tắt',
  intentExplain: 'Giải thích',
  intentRewrite: 'Viết lại',
  intentChat: 'Trò chuyện',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'Phím tắt',
  setHotkeys: 'Phím tắt toàn cục',
  setHotkeysDesc: 'Phím dùng được từ bất kỳ ứng dụng nào. Để trống là tắt phím tắt đó.',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'Nhà cung cấp AI & Khoá',
  setApiConfigs: 'Mô hình đã cấu hình',
  keysAdd: 'Thêm mô hình',
  keysEmpty: 'Chưa cấu hình mô hình nào. Thêm một cái để bắt đầu.',
  keysTest: 'Kiểm tra kết nối',
  keysTesting: 'Đang kiểm tra…',
  keysOk: 'Đã kết nối',
  keysRemove: 'Xoá',
  keysKeySaved: 'Đã lưu khoá',
  keysKeyPlaceholder: 'Dán API key',
  keysGetKey: 'Lấy khoá',
  keysNoKeyNeeded: 'Không cần khoá — chạy trên máy bạn',
  keysModel: 'Mô hình',
  keysBaseUrl: 'Địa chỉ',
  keysLabel: 'Tên gọi',
  keysEnabled: 'Bật',
  keysVision: 'Đọc được ảnh',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: 'Tác vụ',
  setStudyMode: 'Chế độ học tập mặc định',
  setStudyModeDesc: 'Cách AI trả lời mặc định. Bạn vẫn đổi được cho từng lời giải.',
  modeStepByStep: 'Giải từng bước',
  modeDirect: 'Chỉ đáp án',
  modeHint: 'Gợi ý, không đáp án',
  modeExplain: 'Giải thích chuyên sâu',
  modeTranslate: 'Dịch học thuật',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: 'Lưu trữ',
  setMaxConversations: 'Số hội thoại giữ lại',
  setMaxConversationsDesc: 'Hội thoại cũ hơn sẽ bị xoá khi vượt quá giới hạn này.',
  setCacheTtl: 'Thời hạn cache dịch',
  setCacheTtlDesc: 'Số ngày một bản dịch đã lưu còn dùng được trước khi tra lại.',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: 'Dịch khi rê chuột',
  setHoverEnabled: 'Bật dịch khi rê chuột',
  setHoverEnabledDesc: 'Hiện bản dịch khi rê chuột lên văn bản bất kỳ trên màn hình.',
  setClipboardWatcher: 'Bật theo dõi clipboard',
  setClipboardWatcherDesc: 'Hiện thanh hành động nổi (Dịch / Tóm tắt / Giải thích / Viết lại) mỗi khi bạn copy văn bản ở bất kỳ đâu trên màn hình.',
  setHoverDelay: 'Độ trễ kích hoạt',
  setHoverDelayDesc: 'Thời gian con trỏ phải đứng yên trước khi tra bản dịch.',
  setHoverTolerance: 'Dung sai di chuyển',
  setHoverToleranceDesc: 'Rung tay nhỏ trong bán kính này vẫn tính là đứng yên.',
  setHoverModifiers: 'Phím kích hoạt',
  setHoverModifiersDesc: 'Phím phải giữ khi rê chuột. Để trống là kích hoạt ngay khi rê, không cần giữ phím.',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',

  // ── Mức chi tiết hover ────────────────────────────────────────────────────
  setHoverGranularity: 'Mức chi tiết',
  setHoverGranularityDesc: 'Dịch bao nhiêu văn bản trong một lần.',
  granWord: 'Từ',
  granSentence: 'Câu',
  granParagraph: 'Đoạn',
  // ── Kéo-thả file (Phase 4) ────────────────────────────────────────────────
  notifFileDropUnsupported: 'Định dạng file này chưa được hỗ trợ. Chỉ hỗ trợ PDF và ảnh (PNG/JPG).',
  notifFileDropPdfNoText: 'Không tìm thấy văn bản trong PDF này (có thể là bản scan). Hãy thử Giải bài tập bằng cách chụp màn hình từng trang.',
  notifFileDropReadError: 'Không đọc được file này. Hãy thử lại.',

} as const satisfies Dictionary;
