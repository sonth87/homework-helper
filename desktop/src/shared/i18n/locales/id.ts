/**
 * Bản dịch tiếng Indonesia.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'Bahasa',
  groupAi: 'AI & Model',
  groupPrivacy: 'Privasi',
  groupSystem: 'Sistem',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'Bahasa antarmuka',
  setUiLanguageDesc: 'Bahasa aplikasi itu sendiri — menu, label, dan pesan.',
  setOutputLanguage: 'Bahasa jawaban',
  setOutputLanguageDesc: 'Bahasa yang dipakai AI untuk menulis jawaban. Terpisah dari bahasa antarmuka.',
  setTranslateTarget: 'Terjemahkan ke',
  setTranslateTargetDesc: 'Bahasa tujuan bawaan saat menerjemahkan dengan kursor.',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'Deteksi otomatis',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'Strategi perutean',
  setRoutingStrategyDesc: 'Model mana yang dipakai lebih dulu saat menjawab.',
  routingPreferConfig: 'Utamakan kunci yang disetel',
  routingPreferLocal: 'Utamakan model lokal',
  routingLocalOnly: 'Hanya model lokal',
  routingConfigOnly: 'Hanya kunci yang disetel',

  setRotationStrategy: 'Rotasi kunci',
  setRotationStrategyDesc: 'Cara memilih di antara beberapa kunci yang aktif.',
  rotationRoundRobin: 'Bergiliran',
  rotationRandom: 'Acak',
  rotationFallback: 'Ganti hanya saat error',

  setRequestTimeout: 'Batas waktu permintaan',
  setRequestTimeoutDesc: 'Model penalaran bisa diam lama sebelum mengirim kata pertama.',
  setMaxRetries: 'Maksimum percobaan ulang',
  setMaxRetriesDesc: 'Berapa kunci yang dicoba sebelum menyerah.',
  setThinkingEnabled: 'Aktifkan mode penalaran',
  setThinkingEnabledDesc: 'Biarkan model yang mendukung berpikir sebelum menjawab. Lebih lambat, tetapi lebih akurat.',
  setMaxRequestsPerMinute: 'Batas permintaan per menit',
  setMaxRequestsPerMinuteDesc: 'Jaring pengaman terhadap biaya tak terduga. Permintaan melebihi batas akan ditolak.',
  setMonthlyTokenBudget: 'Anggaran token bulanan',
  setMonthlyTokenBudgetDesc: 'Beri peringatan saat pemakaian mendekati angka ini. 0 berarti tanpa batas.',
  setOllamaBaseUrl: 'Alamat Ollama',
  setLmStudioBaseUrl: 'Alamat LM Studio',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'Aplikasi yang dikecualikan',
  setExcludedAppsDesc: 'Aplikasi tidak pernah membaca layar selama program-program ini sedang aktif.',
  setPauseWhenScreenSharing: 'Jeda saat berbagi layar',
  setPauseWhenScreenSharingDesc: 'Sembunyikan semua lapisan tampilan selama berbagi atau merekam layar.',
  setPauseOnSensitiveApps: 'Jeda pada aplikasi sensitif',
  setPauseOnSensitiveAppsDesc: 'Berhenti otomatis saat pengelola kata sandi atau aplikasi perbankan sedang aktif.',
  setLocalModelsOnly: 'Hanya model lokal',
  setLocalModelsOnlyDesc: 'Tidak pernah mengirim teks atau gambar ke layanan awan. Tidak ada yang keluar dari perangkat ini.',
  setSaveHistory: 'Simpan riwayat percakapan',
  setSaveHistoryDesc: 'Menyimpan pertanyaan dan jawaban lama agar bisa dibuka kembali.',
  setHistoryRetention: 'Hapus riwayat setelah',
  setHistoryRetentionDesc: 'Jumlah hari riwayat disimpan. 0 berarti disimpan selamanya.',
  setTelemetry: 'Kirim data penggunaan anonim',
  setTelemetryDesc: 'Membantu menyempurnakan aplikasi. Tidak pernah memuat isi layar atau pertanyaan Anda.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'Jalankan saat masuk',
  setLaunchAtLoginDesc: 'Membuka aplikasi secara otomatis saat Anda masuk ke sistem.',
  setHideFromDock: 'Sembunyikan dari Dock',
  setHideFromDockDesc: 'Berjalan hanya di bilah menu, tanpa ikon di Dock atau bilah tugas.',
  setAutoUpdate: 'Perbarui otomatis',
  setAutoUpdateDesc: 'Mengunduh dan memasang versi baru di latar belakang.',
  setUpdateChannel: 'Saluran pembaruan',
  setUpdateChannelDesc: 'Saluran Beta mendapat fitur baru lebih awal, dengan kemungkinan bug lebih tinggi.',
  channelStable: 'Stabil', channelBeta: 'Beta',
  setLogLevel: 'Tingkat log',
  setLogLevelDesc: 'Naikkan saat melaporkan masalah agar log memuat lebih banyak detail.',
  logError: 'Hanya kesalahan', logWarn: 'Peringatan', logInfo: 'Normal', logDebug: 'Rinci',
  setDebugOverlay: 'Lapisan debug',
  setDebugOverlayDesc: 'Menggambar kotak di sekitar teks yang terdeteksi. Berguna saat melaporkan masalah pengenalan.',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'Terjemahkan',
  intentSolve: 'Selesaikan soal',
  intentSummarize: 'Ringkas',
  intentExplain: 'Jelaskan',
  intentRewrite: 'Tulis ulang',
  intentChat: 'Obrolan',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'Pintasan',
  setHotkeys: 'Pintasan global',
  setHotkeysDesc: 'Tombol yang berfungsi dari aplikasi mana pun. Kosongkan untuk menonaktifkan pintasan.',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'Penyedia AI & Kunci',
  setApiConfigs: 'Model yang disetel',
  keysAdd: 'Tambah model',
  keysEmpty: 'Belum ada model yang disetel. Tambahkan satu untuk mulai.',
  keysTest: 'Uji koneksi',
  keysTesting: 'Menguji…',
  keysOk: 'Terhubung',
  keysRemove: 'Hapus',
  keysKeySaved: 'Kunci tersimpan',
  keysKeyPlaceholder: 'Tempel API key',
  keysGetKey: 'Dapatkan kunci',
  keysNoKeyNeeded: 'Tanpa kunci — berjalan di perangkat Anda',
  keysModel: 'Model',
  keysBaseUrl: 'Alamat',
  keysLabel: 'Nama',
  keysEnabled: 'Aktif',
  keysVision: 'Bisa membaca gambar',
} as const satisfies Dictionary;
