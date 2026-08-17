export default {
  general: {
    brandTitle: "Homework Helper",
    placeholder: "Ketik pertanyaan PR atau rumus di sini...",
    shiftEnterHint: "Enter untuk mengirim, Shift+Enter untuk baris baru",
    askAiBtn: "Tanya AI",
    captureBtn: "Tangkapan Layar",
    uploadBtn: "Lampirkan Gambar",
    attachedLabel: "Gambar Terlampir",
    welcomeText:
      "Halo! Saya asisten Homework Helper. Soal PR apa yang ingin kita selesaikan hari ini?",
    newChat: "Obrolan Baru",
    historyTitle: "Riwayat Obrolan",
    modelNanoReady: "Chrome Gemini Nano (Siap di Perangkat)",
    modelNanoSetup: "Chrome Gemini Nano (Perlu Pengaturan)",
    modelNanoClick:
      "Klik untuk melihat panduan aktivasi Gemini Nano di Pengaturan",
    modelAutoRotate: "Rotasi Kunci Otomatis",
    emptyHistory:
      "Belum ada riwayat percakapan tersimpan.<br>Mulai obrolan baru untuk memulai!",
    loadingHistory: "Memuat riwayat obrolan...",
    chips: [
      {
        label: "Persamaan Kuadrat",
        query:
          "Selesaikan persamaan kuadrat ax^2 + bx + c = 0 langkah demi langkah",
      },
      {
        label: "Hukum Newton",
        query: "Jelaskan 3 Hukum Gerak Newton beserta contoh nyata",
      },
      {
        label: "Persamaan Kimia",
        query:
          "Bagaimana cara menyetarakan persamaan reaksi kimia dan menghitung mol?",
      },
    ],
    modes: {
      "step-by-step": "Langkah demi Langkah",
      direct: "Jawaban Langsung",
      hint: "Petunjuk & Arahan",
      explain: "Penjelasan Konsep Mendalam",
      translate: "Terjemahkan",
    },
    cardHeading: "Solusi Lengkap",
    nextQuestion: "Pertanyaan Berikutnya",
    continueInChat: "Lanjutkan di Obrolan",
    copyBtn: "Salin",
    copiedBtn: "Tersalin!",
    retryBtn: "Coba Lagi",
    imagePromptHeader:
      "Tolong selesaikan dan jelaskan soal PR pada gambar ini langkah demi langkah dengan rumus LaTeX ($...$) dan tandai jawaban akhir:",
    captureSolveText: "Selesaikan soal dari gambar yang diambil",
    toastNewChat: "Obrolan baru telah dimulai",
    chatCleared: "Obrolan dibersihkan. Ajukan pertanyaan baru!",
    thinking: "Sedang berpikir & menyelesaikan...",
    tooltips: {
      newChat: {
        title: "Obrolan Baru",
        desc: "Mulai sesi penyelesaian PR yang baru.",
      },
      history: {
        title: "Riwayat Obrolan",
        desc: "Lihat daftar percakapan soal yang tersimpan.",
      },
      lang: {
        title: "Bahasa Respons AI",
        desc: "AI akan menjawab dan menjelaskan menggunakan bahasa ini.",
      },
      mode: {
        title: "Mode Penyelesaian",
        desc: "Pilih format jawaban: Langkah demi Langkah, Langsung, Petunjuk, atau Teori Mendalam.",
      },
      capture: {
        title: "Tangkapan Layar (Alt+C)",
        desc: "Potong soal atau grafik di layar untuk langsung diselesaikan.",
      },
      upload: {
        title: "Unggah Gambar",
        desc: "Lampirkan file gambar soal dari komputer Anda.",
      },
      settings: {
        title: "Model & Kunci API",
        desc: "Atur penyedia AI dan kelola rotasi kunci API gratis.",
      },
      clear: {
        title: "Bersihkan Obrolan",
        desc: "Hapus semua pesan dalam sesi saat ini.",
      },
      options: {
        title: "Pengaturan Lengkap",
        desc: "Buka halaman konfigurasi untuk mengelola kunci API dan tampilan.",
      },
      close: {
        title: "Tutup Panel",
        desc: "Ciutkan panel ke tepi layar.",
      },
      open: {
        title: "Buka Panel Obrolan (Alt+K)",
        desc: "Buka asisten belajar untuk bertanya dan menyelesaikan soal.",
      },
    },
    modalConfigTitle: "Konfigurasi Model AI & Kunci API",
    modalConfigDesc:
      "Tambahkan satu atau lebih Kunci API. Ekstensi otomatis menyeimbangkan beban dan beralih ke kunci cadangan saat terkena batas kuota.",
    modalNanoTitle: "Chrome Gemini Nano (AI Lokal Pada Perangkat)",
    modalNanoDesc:
      "AI luring yang berjalan 100% di komputer Anda. Klik tautan berikut untuk membuka opsi flag secara langsung:",
    modalBtnFlagPrompt: "1. Buka #prompt-api",
    modalBtnFlagOptGuide: "2. Buka #optimization-guide",
    modalBtnComponents: "3. Buka komponen",
    modalBtnAddKey: "Tambah Model & Kunci",
    modalLinkGuide: "Lihat panduan kunci API gratis →",
    modalKeyPlaceholder: "Masukkan Kunci API (sk-... / AIza...)",
    customModelOption: "Model kustom (Ketik nama)...",
    customModelPlaceholder: "Masukkan ID model (contoh: gemini-2.5-pro, gpt-5, claude-4...)",
  },
  selectionTooltip: {
    answer: "Selesaikan",
    copy: "Salin",
    search: "Cari",
    translate: "Terjemahkan",
    more: "Opsi Lainnya",
    explain: "Jelaskan Konsep",
    summarize: "Ringkas",
    grammar: "Pemeriksa Tata Bahasa",
    disable: "Nonaktifkan",
    disableSession: "Nonaktifkan hingga kunjungan berikutnya",
    disablePage: "Nonaktifkan untuk halaman ini",
    disableSite: "Nonaktifkan untuk situs web ini",
    disableGlobal: "Nonaktifkan secara global",
    disableFooter: "Dapat diaktifkan kembali di Pengaturan",
  },
  cropper: {
    tip: "Klik dan seret untuk memilih soal atau rumus (ESC untuk membatalkan)",
    cancel: "Batal",
    askAi: "Tanya AI",
  },
  floatingPopup: {
    helperTitle: "Asisten Homework Helper",
    translateTitle: "Terjemahkan",
    translateHeading: "Hasil Terjemahan",
    searchTitle: "Cari & Bantuan PR",
    searchHeading: "Hasil & Solusi",
    explainTitle: "Penjelasan Mendalam",
    explainHeading: "Penjelasan Konsep",
    summarizeTitle: "Ringkasan Konten",
    summarizeHeading: "Poin Kunci",
    grammarTitle: "Pemeriksa Tata Bahasa",
    grammarHeading: "Koreksi & Penyempurnaan",
    answerHeading: "Solusi Lengkap",
    nextQuestion: "Pertanyaan Berikutnya",
    continueInChat: "Lanjutkan di Obrolan",
    copy: "Salin",
    copied: "Tersalin!",
    retry: "Coba Lagi",
    processing: "Sedang memproses permintaan...",
    solvingStepByStep:
      "Menyelesaikan langkah demi langkah dengan rumus KaTeX...",
    scanningOcr: "Memindai teks dan rumus dengan OCR Lokal...",
    autoDetect: "Deteksi Otomatis",
    historyTitle: "Riwayat Soal",
    historyDesc:
      "Tinjau soal-soal yang baru saja diselesaikan dan sesi belajar.",
    closeTitle: "Tutup Jendela",
    closeDesc: "Tutup popup penyelesaian",
    addConvTitle: "Obrolan Baru",
    addConvDesc: "Mulai sesi obrolan soal yang baru.",
    closeHistoryTitle: "Tutup Riwayat",
    closeHistoryDesc: "Tutup panel riwayat.",
    openInDrawerBtn: "Buka semua di Panel Obrolan",
  },
  popup: {
    brandSub: "AI Akademik Tanpa Login",
    openSidePanel: "Buka Panel Samping AI",
    openSidePanelDesc: "Ruang kerja di samping halaman web",
    cropSolve: "Potong & Selesaikan (Alt+C)",
    cropSolveDesc: "Pilih rumus atau diagram soal",
    keysPool: "Kunci Aktif:",
    rotationMode: "Mode Rotasi:",
    formsAssistant: "Asisten Google Forms",
    selectionTooltip: "Bilah Seleksi Teks",
    configureBtn: "Konfigurasi Model & Kunci",
  },
  options: {
    navProviders: "Model & Kunci API",
    navOcr: "Model OCR Lokal",
    navAppearance: "Tampilan & Antarmuka",
    navGuide: "Panduan Kunci Gratis",
    navPrompt: "Instruksi Sistem (Prompt)",
    navGeneral: "Pengaturan Umum",
    brandDesc: "AI Akademik Tanpa Login",
    headingProviders: "Model AI & Kumpulan Kunci API",
    subheadingProviders:
      "Tambahkan satu atau lebih Kunci API. Ekstensi akan menyeimbangkan beban dan beralih otomatis saat batas limit tercapai.",
    strategyTitle: "Strategi Rotasi Kunci",
    strategyDesc:
      "Pilih metode pemilihan kunci saat mengirim permintaan ke AI.",
    statTotal: "Total Kunci Terdaftar",
    statActive: "Siap Digunakan",
    statCooldown: "Jeda Sementara (60d)",
    btnAddKey: "Tambah Penyedia AI / Kunci",
    headingOcr: "Paket Model OCR Lokal (Offline)",
    subheadingOcr:
      "Unduh dan kelola model pengenalan teks dan rumus offline via Tesseract.js.",
    btnCheckUpdates: "Periksa Pembaruan",
    btnDownloadCore:
      "Unduh Paket Utama (Bahasa Indonesia + Inggris + Matematika)",
    corePackTitle: "Paket OCR Utama Bawaan",
    corePackBadge: "Direkomendasikan",
    corePackDesc:
      "Akurasi tinggi untuk karakter Latin, rumus matematika, Bahasa Indonesia, dan Inggris.",
    allOcrTitle: "Semua Paket Bahasa",
    allOcrSub:
      "Unduh paket bahasa khusus untuk pengenalan offline sesuai kebutuhan.",
    headingAppearance: "Kustomisasi Tampilan & Antarmuka",
    subheadingAppearance:
      "Atur tombol mengambang (FAB), bilah seleksi teks, tema warna, transparansi, dan blur.",
    cardFabTitle: "Tombol Mengambang Halaman (FAB)",
    labelFabDisplay: "Tampilkan tombol mengambang di web",
    descFabDisplay:
      "Tampilkan tombol pintas di tepi layar untuk membuka obrolan atau tangkapan layar dengan cepat.",
    labelFabSize: "Ukuran Tombol Mengambang",
    cardToolbarTitle: "Bilah Mengambang Seleksi Teks (Selection Toolbar)",
    labelToolbarTheme: "Tema Warna Bilah",
    labelToolbarText: "Tampilkan teks di samping ikon",
    descToolbarText:
      "Menampilkan nama tindakan (Selesaikan, Salin, Cari, Terjemahkan).",
    labelToolbarSize: "Ukuran Bilah",
    labelToolbarOpacity: "Transparansi Bilah",
    labelToolbarBlur: "Tingkat Blur Latar Belakang (Backdrop Blur)",
    cardPopupTitle: "Jendela Solusi & Terjemahan Mengambang",
    labelPopupOpacity: "Transparansi Jendela",
    labelPopupBlur: "Tingkat Blur (Blur)",
    livePreviewBadge: "Simulasi Langsung",
    livePreviewSub:
      "Pratinjau langsung gaya Liquid Glass sesuai pengaturan Anda.",
    headingGuide: "Panduan Kunci API Gratis & Portal Resmi",
    subheadingGuide:
      "Dapatkan Kunci API 100% resmi dan gratis dari penyedia AI terkemuka dengan kuota besar.",
    guideWhyTitle: "Mengapa sebaiknya menambahkan banyak Kunci API?",
    guideWhy1:
      "Pengalihan Otomatis: Jika satu kunci mencapai batas (429), sistem langsung beralih ke kunci berikutnya.",
    guideWhy2:
      "Penyeimbangan Beban: Membagi permintaan secara merata untuk menghindari pembatasan kuota.",
    guideWhy3:
      "Hemat Biaya: Menggabungkan kuota gratis dari berbagai penyedia cloud.",
    guideHowTitle: "Bagaimana cara kerjanya?",
    guideHow1:
      "Dapatkan kunci gratis dari portal resmi (Google AI Studio, Groq, OpenRouter...).",
    guideHow2: 'Tempel di tab "Model & Kunci API" dan klik Uji Koneksi.',
    guideHow3: "Ekstensi mengelola rotasi otomatis di latar belakang.",
    guideLinksTitle: "Portal Resmi Pendaftaran Kunci Gratis",
    linkSubGemini:
      "Gratis 15 RPM, inferensi super cepat dan analisis gambar soal yang sangat kuat.",
    linkSubGroq:
      "Kecepatan inferensi tinggi (500+ token/dtk), mendukung Llama 3 & DeepSeek.",
    linkSubOpenAI: "Standar industri untuk penalaran logis dan akademis.",
    linkSubDeepSeek:
      "Model terdepan untuk matematika dan pemrograman sumber terbuka.",
    linkSubClaude:
      "Pemahaman diagram ilmiah dan penyampaian logika yang sangat jelas.",
    headingPrompt: "Instruksi Sistem & Gaya Penyelesaian Soal",
    subheadingPrompt:
      "Sesuaikan prompt sistem khusus untuk model Cloud dan model On-Device lokal secara terpisah.",
    cardCloudPromptTitle:
      "1. Prompt Sistem untuk Model Cloud (Gemini, OpenAI, Claude, DeepSeek)",
    cardCloudPromptDesc:
      "Dioptimalkan untuk model berkapasitas ratusan miliar parameter, analisis pedagogis mendalam, LaTeX, dan penglihatan gambar.",
    cardNanoPromptTitle:
      "2. Prompt Sistem untuk Chrome Gemini Nano (On-Device Local AI)",
    cardNanoPromptDesc:
      "Khusus untuk model lokal ~3B parameter di Chrome. Ringkas, langsung, dan memprioritaskan verifikasi fakta nyata sebelum memilih opsi.",
    btnResetPrompt: "Kembalikan ke Default",
    btnSavePrompt: "Simpan Prompt Cloud",
    btnResetNanoPrompt: "Kembalikan ke Default",
    btnSaveNanoPrompt: "Simpan Prompt Nano",
    headingGeneral: "Pengaturan Umum & Bahasa",
    subheadingGeneral:
      "Kelola bahasa respons, asisten Google Forms, dan pencadangan data.",
    uiLangTitle: "Bahasa Antarmuka (UI Language)",
    uiLangDesc:
      "Bahasa tampilan untuk tombol, bilah samping, toolbar, dan menu pengaturan.",
    respLangTitle: "Bahasa Respons AI",
    respLangDesc:
      "Bahasa yang digunakan AI untuk menyelesaikan dan menjelaskan soal.",
    formsTitle: "Asisten Google Forms",
    formsDesc:
      "Mendeteksi pertanyaan di Google Forms secara otomatis dan menyediakan tombol analisis satu klik.",
    tooltipTitle: "Bilah Mengambang Seleksi Teks",
    tooltipDesc:
      "Tampilkan bilah tindakan cepat saat Anda menyeleksi teks di halaman web.",
    disabledSitesTitle: "Daftar Situs Web yang Dinonaktifkan",
    disabledSitesDesc:
      "Ekstensi akan sepenuhnya nonaktif pada domain-domain ini.",
    noDisabledSites: "Belum ada situs web yang dinonaktifkan.",
    backupTitle: "Pencadangan & Pengelolaan Data",
    backupDesc:
      "Ekspor konfigurasi ke file JSON atau bersihkan riwayat percakapan tersimpan.",
    btnExport: "Ekspor Konfigurasi JSON",
    btnClearData: "Hapus Semua Riwayat Obrolan",
    aboutTitle: "Tentang & Informasi Ekstensi",
    aboutDesc:
      "Homework Helper - Asisten AI untuk menyelesaikan tugas sekolah dan studi akademis.",
    keyPlaceholder: "Masukkan Kunci API",
    deleteKey: "Hapus konfigurasi ini",
    toastLangUpdated: "Bahasa tampilan berhasil diperbarui!",
    toastPromptSaved: "Instruksi sistem berhasil disimpan!",
    toastDataCleared: "Semua riwayat obrolan telah dibersihkan!",
    stratPreferNanoTitle: "Utamakan Gemini Nano",
    stratPreferNanoDesc: "Gunakan Nano di perangkat untuk teks; otomatis beralih ke Vision API atau OCR untuk gambar.",
    stratPreferConfigTitle: "Utamakan Model yang Dikonfigurasi (Disarankan)",
    stratPreferConfigDesc: "Gunakan API Key cloud; otomatis beralih ke Gemini Nano jika kuota habis atau terjadi kesalahan jaringan.",
    stratNanoOnlyTitle: "Hanya Gemini Nano",
    stratNanoOnlyDesc:
      "100% Gratis & Luring, tidak pernah mengirim data ke API cloud luar.",
    stratConfigOnlyTitle: "Hanya API Cloud Terkonfigurasi",
    stratConfigOnlyDesc:
      "Gunakan kunci API cloud di bawah ini dengan rotasi otomatis anti-limit.",
    builtinNanoTitle: "AI Bawaan Chrome (Gemini Nano Lokal Pada Perangkat)",
    builtinNanoDesc:
      "Model AI lokal yang berjalan 100% di komputer Anda. Tanpa perlu kunci API, sepenuhnya gratis & bekerja offline.",
    btnOpenFlags: "Buka chrome://flags",
    btnTestBuiltinAI: "Uji Model Bawaan",
    guideNanoStepsTitle:
      "Cara mengaktifkan Chrome Gemini Nano (Klik tautan untuk langsung membuka flag):",
    guideNanoStep1:
      "Langkah 1: Buka chrome://flags/#prompt-api-for-gemini-nano → Pilih Enabled (atau Enabled Multilingual).",
    guideNanoStep2:
      "Langkah 2 (Wajib): Buka chrome://flags/#optimization-guide-on-device-model → Pilih Enabled BypassPerfRequirement.",
    guideNanoStep3:
      "Langkah 3: Klik Relaunch (Mulai ulang) di bagian bawah Chrome untuk menerapkan perubahan.",
    guideNanoStep4:
      "Langkah 4 (Unduh model): Buka chrome://components → Cari Optimization Guide On Device Model dan klik Periksa pembaruan.",
    guideNanoStep5:
      'Langkah 5: Klik "Uji Model Bawaan" di atas untuk memverifikasi.',
    testConnection: "Uji Koneksi",
    testingConnection: "Menguji...",
    keyValid: "Kunci Valid & Berfungsi",
    keyInvalid: "Koneksi Gagal:",
    enterKeyFirst: "Harap masukkan Kunci API sebelum menguji",
    statusReady: "Status: Siap",
    btnGetKeyGemini: "Dapatkan Kunci Gemini →",
    btnGetKeyGroq: "Dapatkan Kunci Groq →",
    btnGetKeyOpenAI: "Dapatkan Kunci OpenAI →",
    btnGetKeyDeepSeek: "Dapatkan Kunci DeepSeek →",
    btnGetKeyClaude: "Dapatkan Kunci Claude →",
  },
};
