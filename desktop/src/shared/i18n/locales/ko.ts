/**
 * Bản dịch tiếng Hàn.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: '언어',
  groupAi: 'AI 및 모델',
  groupPrivacy: '개인정보',
  groupSystem: '시스템',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: '인터페이스 언어',
  setUiLanguageDesc: '앱 자체의 언어입니다. 메뉴, 라벨, 알림에 적용됩니다.',
  setOutputLanguage: '답변 언어',
  setOutputLanguageDesc: 'AI가 답변을 작성하는 언어입니다. 인터페이스 언어와 별개입니다.',
  setTranslateTarget: '번역할 언어',
  setTranslateTargetDesc: '마우스를 올려 번역할 때의 기본 대상 언어입니다.',
  setTranslateProviders: '번역 서비스',
  setTranslateProvidersDesc: '마우스오버 번역 시 시도하는 순서 — 하나가 실패하면 자동으로 다음 서비스로 전환됩니다.',
  translateProviderGoogle: 'Google 번역',
  translateProviderBing: 'Bing 번역',
  translateProviderMymemory: 'MyMemory',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: '자동 감지',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: '라우팅 전략',
  setRoutingStrategyDesc: '답변할 때 어떤 모델을 먼저 사용할지 정합니다.',
  routingPreferConfig: '설정된 키 우선',
  routingPreferLocal: '로컬 모델 우선',
  routingLocalOnly: '로컬 모델만 사용',
  routingConfigOnly: '설정된 키만 사용',

  setRotationStrategy: '키 순환 방식',
  setRotationStrategyDesc: '여러 키가 켜져 있을 때 고르는 방법입니다.',
  rotationRoundRobin: '차례대로',
  rotationRandom: '무작위',
  rotationFallback: '오류가 날 때만 전환',

  setRequestTimeout: '요청 제한 시간',
  setRequestTimeoutDesc: '추론 모델은 첫 글자를 내놓기까지 오래 침묵할 수 있습니다.',
  setMaxRetries: '최대 재시도 횟수',
  setMaxRetriesDesc: '포기하기 전에 시도할 키의 개수입니다.',
  setThinkingEnabled: '심층 추론 사용',
  setThinkingEnabledDesc: '지원하는 모델이 답하기 전에 추론합니다. 느리지만 더 정확합니다.',
  setMaxRequestsPerMinute: '분당 요청 제한',
  setMaxRequestsPerMinuteDesc: '예상치 못한 비용을 막는 안전장치입니다. 한도를 넘는 요청은 거부됩니다.',
  setMonthlyTokenBudget: '월간 토큰 예산',
  setMonthlyTokenBudgetDesc: '사용량이 이 값에 가까워지면 알립니다. 0이면 제한 없음.',
  setOllamaBaseUrl: 'Ollama 주소',
  setLmStudioBaseUrl: 'LM Studio 주소',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: '제외할 앱',
  setExcludedAppsDesc: '이 프로그램들이 활성 상태일 때는 화면을 전혀 읽지 않습니다.',
  setPauseWhenScreenSharing: '화면 공유 중 일시정지',
  setPauseWhenScreenSharingDesc: '화면을 공유하거나 녹화하는 동안 모든 오버레이를 숨깁니다.',
  setPauseOnSensitiveApps: '민감한 앱에서 일시정지',
  setPauseOnSensitiveAppsDesc: '비밀번호 관리자나 금융 앱이 활성화되면 자동으로 멈춥니다.',
  setLocalModelsOnly: '로컬 모델만 사용',
  setLocalModelsOnlyDesc: '텍스트나 이미지를 클라우드로 보내지 않습니다. 아무것도 이 기기를 벗어나지 않습니다.',
  setSaveHistory: '대화 기록 저장',
  setSaveHistoryDesc: '지난 질문과 답변을 남겨 다시 볼 수 있게 합니다.',
  setHistoryRetention: '기록 보관 기간',
  setHistoryRetentionDesc: '기록을 보관할 일수입니다. 0이면 영구 보관.',
  setTelemetry: '익명 사용 데이터 전송',
  setTelemetryDesc: '앱 개선에 도움이 됩니다. 화면 내용이나 질문은 절대 포함하지 않습니다.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: '로그인 시 자동 실행',
  setLaunchAtLoginDesc: '로그인할 때 앱을 자동으로 시작합니다.',
  setHideFromDock: 'Dock에서 숨기기',
  setHideFromDockDesc: '메뉴 막대에서만 실행하며 Dock이나 작업 표시줄에 아이콘을 두지 않습니다.',
  setAutoUpdate: '자동 업데이트',
  setAutoUpdateDesc: '새 버전을 백그라운드에서 내려받아 설치합니다.',
  setUpdateChannel: '업데이트 채널',
  setUpdateChannelDesc: '베타는 새 기능을 먼저 쓸 수 있지만 오류를 만날 가능성이 높습니다.',
  channelStable: '안정', channelBeta: '베타',
  setLogLevel: '로그 수준',
  setLogLevelDesc: '문제를 신고할 때 높이면 로그에 더 많은 정보가 담깁니다.',
  logError: '오류만', logWarn: '경고', logInfo: '보통', logDebug: '상세',
  setDebugOverlay: '디버그 오버레이',
  setDebugOverlayDesc: '인식한 글자 주위에 상자를 그립니다. 인식 문제를 신고할 때 유용합니다.',

  // ── Xin quyền hệ thống (onboarding) ────────────────────────────────────────
  onboardingTitle: '시스템 권한',
  onboardingIntro: 'Homework Helper가 화면 어디서나 번역하고 문제를 풀려면 macOS 권한 두 가지가 필요합니다. 둘 다 필수입니다 — 하나라도 없으면 앱이 화면 내용을 읽을 수 없습니다.',
  onboardingAccessibilityTitle: '손쉬운 사용(Accessibility)',
  onboardingAccessibilityDesc: '커서 아래 텍스트를 읽어 즉시 번역할 수 있게 합니다 — 대부분 앱에서 사용하는 빠른 경로입니다.',
  onboardingScreenTitle: '화면 기록(Screen Recording)',
  onboardingScreenDesc: '화면을 캡처할 수 있게 합니다 — 영역 선택 후 풀이 기능과, 텍스트를 직접 읽을 수 없을 때(PDF, 일부 편집기 등)의 대체 수단으로 사용됩니다.',
  onboardingGranted: '허용됨',
  onboardingNotGranted: '허용 안 됨',
  onboardingOpenPane: '시스템 설정 열기',
  onboardingNeedsRestart: '권한이 허용되었습니다. 적용하려면 앱을 재시작하세요 — macOS는 이미 실행 중인 프로세스에 새 권한을 바로 적용하지 않습니다.',
  onboardingRelaunch: '지금 재시작',
  onboardingSkip: '나중에',
  onboardingReopenLabel: '시스템 권한',
  onboardingReopenDesc: 'Homework Helper에 필요한 권한을 확인하거나 다시 허용합니다.',
  onboardingReopenButton: '확인',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: '번역',
  intentSolve: '문제 풀이',
  intentSummarize: '요약',
  intentExplain: '설명',
  intentRewrite: '다시 쓰기',
  intentChat: '대화',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: '단축키',
  setHotkeys: '전역 단축키',
  setHotkeysDesc: '어떤 앱에서도 쓸 수 있는 키입니다. 비워 두면 해당 단축키가 꺼집니다.',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'AI 제공자 및 키',
  setApiConfigs: '설정된 모델',
  keysAdd: '모델 추가',
  keysEmpty: '아직 설정된 모델이 없습니다. 하나 추가해 시작하세요.',
  keysTest: '연결 테스트',
  keysTesting: '테스트 중…',
  keysOk: '연결됨',
  keysRemove: '제거',
  keysKeySaved: '키를 저장했습니다',
  keysKeyPlaceholder: 'API 키 붙여넣기',
  keysGetKey: '키 받기',
  keysNoKeyNeeded: '키 불필요 — 내 기기에서 실행',
  keysModel: '모델',
  keysBaseUrl: '주소',
  keysLabel: '이름',
  keysEnabled: '사용',
  keysVision: '이미지 인식 가능',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: '작업',
  setStudyMode: '기본 학습 모드',
  setStudyModeDesc: 'AI가 기본으로 답하는 방식입니다. 답변마다 바꿀 수도 있습니다.',
  modeStepByStep: '단계별 풀이',
  modeDirect: '답만',
  modeHint: '힌트만',
  modeExplain: '심화 설명',
  modeTranslate: '학술 번역',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: '저장 공간',
  setMaxConversations: '보관할 대화 수',
  setMaxConversationsDesc: '이 한도를 넘으면 오래된 대화부터 삭제됩니다.',
  setCacheTtl: '번역 캐시 유효 기간',
  setCacheTtlDesc: '캐시된 번역을 다시 가져오기까지 유지되는 일수입니다.',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: '호버 번역',
  setHoverEnabled: '호버 번역 사용',
  setHoverEnabledDesc: '화면의 텍스트 위에 마우스를 올리면 번역을 표시합니다.',
  setClipboardWatcher: '클립보드 감시 사용',
  setClipboardWatcherDesc: '화면 어디서든 텍스트를 복사할 때마다 플로팅 작업 바(번역 / 요약 / 설명 / 다시 쓰기)를 표시합니다.',
  setHoverDelay: '실행 지연 시간',
  setHoverDelayDesc: '번역을 조회하기까지 커서가 멈춰 있어야 하는 시간입니다.',
  setHoverTolerance: '이동 허용 범위',
  setHoverToleranceDesc: '이 반경 내의 작은 떨림은 정지로 간주합니다.',
  setHoverModifiers: '실행 키',
  setHoverModifiersDesc: '호버 중 눌러야 하는 키입니다. 비워 두면 키 없이 호버만으로 실행됩니다.',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',

  // ── Mức chi tiết hover ────────────────────────────────────────────────────
  setHoverGranularity: '세부 수준',
  setHoverGranularityDesc: '한 번에 번역할 텍스트 범위입니다.',
  granWord: '단어',
  granSentence: '문장',
  granParagraph: '단락',
} as const satisfies Dictionary;
