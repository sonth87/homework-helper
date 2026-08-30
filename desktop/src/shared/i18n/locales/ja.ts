/**
 * Bản dịch tiếng Nhật.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: '言語',
  groupAi: 'AI とモデル',
  groupPrivacy: 'プライバシー',
  groupSystem: 'システム',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: '表示言語',
  setUiLanguageDesc: 'アプリ自体の言語です。メニュー、ラベル、メッセージに適用されます。',
  setOutputLanguage: '回答の言語',
  setOutputLanguageDesc: 'AI が回答を書く言語です。表示言語とは独立しています。',
  setTranslateTarget: '翻訳先',
  setTranslateTargetDesc: 'ホバー翻訳の既定の翻訳先言語です。',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: '自動判別',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'ルーティング方式',
  setRoutingStrategyDesc: '回答時にどのモデルを優先して使うかを決めます。',
  routingPreferConfig: '設定済みのキーを優先',
  routingPreferLocal: 'ローカルモデルを優先',
  routingLocalOnly: 'ローカルモデルのみ',
  routingConfigOnly: '設定済みのキーのみ',

  setRotationStrategy: 'キーの切り替え方',
  setRotationStrategyDesc: '複数のキーが有効なときの選び方です。',
  rotationRoundRobin: '順番に使う',
  rotationRandom: 'ランダム',
  rotationFallback: 'エラー時のみ切り替え',

  setRequestTimeout: 'タイムアウト',
  setRequestTimeoutDesc: '推論モデルは最初の一文字を返すまで長く沈黙することがあります。',
  setMaxRetries: '再試行の上限',
  setMaxRetriesDesc: 'あきらめるまでに試すキーの数です。',
  setThinkingEnabled: '思考モードを有効にする',
  setThinkingEnabledDesc: '対応モデルが回答前に推論します。遅くなりますが精度は上がります。',
  setMaxRequestsPerMinute: '1分あたりのリクエスト上限',
  setMaxRequestsPerMinuteDesc: '想定外の費用を防ぐ安全網です。上限を超えたリクエストは拒否されます。',
  setMonthlyTokenBudget: '月間トークン上限',
  setMonthlyTokenBudgetDesc: '使用量がこの値に近づくと警告します。0 で無制限。',
  setOllamaBaseUrl: 'Ollama のアドレス',
  setLmStudioBaseUrl: 'LM Studio のアドレス',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: '除外するアプリ',
  setExcludedAppsDesc: 'これらのアプリが前面にある間、画面を一切読み取りません。',
  setPauseWhenScreenSharing: '画面共有中は停止',
  setPauseWhenScreenSharingDesc: '画面共有や録画の間、すべてのオーバーレイを隠します。',
  setPauseOnSensitiveApps: '機密性の高いアプリで停止',
  setPauseOnSensitiveAppsDesc: 'パスワード管理ソフトや銀行アプリが前面にあるとき自動的に停止します。',
  setLocalModelsOnly: 'ローカルモデルのみ使用',
  setLocalModelsOnlyDesc: 'テキストも画像もクラウドへ送信しません。何もこの端末から出ません。',
  setSaveHistory: '会話履歴を保存',
  setSaveHistoryDesc: '過去の質問と回答を残し、後から見返せるようにします。',
  setHistoryRetention: '履歴を削除するまでの日数',
  setHistoryRetentionDesc: '履歴を保持する日数です。0 で無期限。',
  setTelemetry: '匿名の利用データを送信',
  setTelemetryDesc: 'アプリの改善に役立ちます。画面の内容や質問は一切含みません。',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'ログイン時に起動',
  setLaunchAtLoginDesc: 'サインイン時にアプリを自動的に起動します。',
  setHideFromDock: 'Dock に表示しない',
  setHideFromDockDesc: 'メニューバーだけで動作し、Dock やタスクバーにアイコンを出しません。',
  setAutoUpdate: '自動更新',
  setAutoUpdateDesc: '新しいバージョンをバックグラウンドでダウンロードして適用します。',
  setUpdateChannel: '更新チャンネル',
  setUpdateChannelDesc: 'Beta は新機能を早く使えますが、不具合に遭う可能性も高くなります。',
  channelStable: '安定版', channelBeta: 'ベータ版',
  setLogLevel: 'ログレベル',
  setLogLevelDesc: '不具合を報告するときに上げると、ログに詳細が残ります。',
  logError: 'エラーのみ', logWarn: '警告', logInfo: '通常', logDebug: '詳細',
  setDebugOverlay: 'デバッグ表示',
  setDebugOverlayDesc: '認識した文字の周囲に枠を描きます。認識の不具合を報告するときに便利です。',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: '翻訳',
  intentSolve: '問題を解く',
  intentSummarize: '要約',
  intentExplain: '解説',
  intentRewrite: '書き直し',
  intentChat: 'チャット',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'ショートカット',
  setHotkeys: 'グローバルショートカット',
  setHotkeysDesc: 'どのアプリからでも使えるキーです。空欄にするとそのショートカットを無効にします。',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'AI プロバイダーとキー',
  setApiConfigs: '設定済みのモデル',
  keysAdd: 'モデルを追加',
  keysEmpty: 'モデルがまだ設定されていません。追加して始めましょう。',
  keysTest: '接続をテスト',
  keysTesting: 'テスト中…',
  keysOk: '接続済み',
  keysRemove: '削除',
  keysKeySaved: 'キーを保存しました',
  keysKeyPlaceholder: 'API キーを貼り付け',
  keysGetKey: 'キーを取得',
  keysNoKeyNeeded: 'キー不要 — お使いの端末で動作します',
  keysModel: 'モデル',
  keysBaseUrl: 'アドレス',
  keysLabel: '名前',
  keysEnabled: '有効',
  keysVision: '画像を読める',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: 'タスク',
  setStudyMode: '既定の学習モード',
  setStudyModeDesc: 'AI が既定でどう答えるか。回答ごとに変更もできます。',
  modeStepByStep: '手順を追って解く',
  modeDirect: '答えのみ',
  modeHint: 'ヒントのみ',
  modeExplain: '詳しい解説',
  modeTranslate: '学術翻訳',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: 'ストレージ',
  setMaxConversations: '保持する会話数',
  setMaxConversationsDesc: 'この上限を超えると古い会話から削除されます。',
  setCacheTtl: '翻訳キャッシュの有効期間',
  setCacheTtlDesc: 'キャッシュした訳文を再取得するまでの日数です。',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: 'ホバー翻訳',
  setHoverEnabled: 'ホバー翻訳を有効化',
  setHoverEnabledDesc: '画面上の文字にカーソルを重ねると翻訳を表示します。',
  setHoverDelay: '発動までの遅延',
  setHoverDelayDesc: '翻訳を調べるまでカーソルが静止している必要がある時間です。',
  setHoverTolerance: '移動許容範囲',
  setHoverToleranceDesc: 'この半径内の小さな揺れは静止とみなします。',
  setHoverModifiers: '発動キー',
  setHoverModifiersDesc: 'ホバー中に押しておくキーです。空欄にするとキー不要でホバーだけで発動します。',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',

  // ── Mức chi tiết hover ────────────────────────────────────────────────────
  setHoverGranularity: '詳細度',
  setHoverGranularityDesc: '一度にどれだけの範囲を翻訳するか。',
  granWord: '単語',
  granSentence: '文',
  granParagraph: '段落',
} as const satisfies Dictionary;
