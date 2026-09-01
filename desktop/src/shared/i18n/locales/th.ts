/**
 * Bản dịch tiếng Thái.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'ภาษา',
  groupAi: 'AI และโมเดล',
  groupPrivacy: 'ความเป็นส่วนตัว',
  groupSystem: 'ระบบ',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'ภาษาของแอป',
  setUiLanguageDesc: 'ภาษาของตัวแอปเอง — เมนู ป้ายกำกับ ข้อความแจ้งเตือน',
  setOutputLanguage: 'ภาษาคำตอบ',
  setOutputLanguageDesc: 'ภาษาที่ AI ใช้เขียนคำตอบ แยกจากภาษาของแอป',
  setTranslateTarget: 'แปลเป็น',
  setTranslateTargetDesc: 'ภาษาปลายทางเริ่มต้นเมื่อแปลด้วยการชี้เมาส์',
  setTranslateProviders: 'บริการแปลภาษา',
  setTranslateProvidersDesc: 'ลำดับการลองใช้เมื่อแปลด้วยการวางเมาส์ — สลับไปบริการถัดไปโดยอัตโนมัติหากบริการหนึ่งล้มเหลว',
  translateProviderGoogle: 'Google Translate',
  translateProviderBing: 'Bing Translator',
  translateProviderMymemory: 'MyMemory',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'ตรวจอัตโนมัติ',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'กลยุทธ์การเลือกโมเดล',
  setRoutingStrategyDesc: 'จะใช้โมเดลใดก่อนเมื่อต้องตอบคำถาม',
  routingPreferConfig: 'ใช้คีย์ที่ตั้งค่าไว้ก่อน',
  routingPreferLocal: 'ใช้โมเดลในเครื่องก่อน',
  routingLocalOnly: 'ใช้เฉพาะโมเดลในเครื่อง',
  routingConfigOnly: 'ใช้เฉพาะคีย์ที่ตั้งค่าไว้',

  setRotationStrategy: 'การหมุนเวียนคีย์',
  setRotationStrategyDesc: 'วิธีเลือกคีย์เมื่อเปิดใช้งานหลายคีย์',
  rotationRoundRobin: 'วนตามลำดับ',
  rotationRandom: 'สุ่ม',
  rotationFallback: 'เปลี่ยนเมื่อเกิดข้อผิดพลาดเท่านั้น',

  setRequestTimeout: 'เวลารอสูงสุด',
  setRequestTimeoutDesc: 'โมเดลที่คิดวิเคราะห์อาจเงียบนานก่อนส่งคำแรกออกมา',
  setMaxRetries: 'จำนวนครั้งที่ลองใหม่',
  setMaxRetriesDesc: 'จะลองกี่คีย์ก่อนจะยอมแพ้',
  setThinkingEnabled: 'เปิดโหมดคิดวิเคราะห์',
  setThinkingEnabledDesc: 'ให้โมเดลที่รองรับคิดก่อนตอบ ช้ากว่าแต่แม่นยำกว่า',
  setMaxRequestsPerMinute: 'จำกัดคำขอต่อนาที',
  setMaxRequestsPerMinuteDesc: 'ตาข่ายนิรภัยกันค่าใช้จ่ายบานปลาย คำขอที่เกินจะถูกปฏิเสธ',
  setMonthlyTokenBudget: 'งบโทเค็นต่อเดือน',
  setMonthlyTokenBudgetDesc: 'เตือนเมื่อการใช้งานใกล้ถึงจำนวนนี้ ใส่ 0 คือไม่จำกัด',
  setOllamaBaseUrl: 'ที่อยู่ Ollama',
  setLmStudioBaseUrl: 'ที่อยู่ LM Studio',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'แอปที่ยกเว้น',
  setExcludedAppsDesc: 'แอปจะไม่อ่านหน้าจอเลยขณะที่โปรแกรมเหล่านี้ทำงานอยู่',
  setPauseWhenScreenSharing: 'หยุดชั่วคราวขณะแชร์หน้าจอ',
  setPauseWhenScreenSharingDesc: 'ซ่อนทุกหน้าต่างซ้อนทับระหว่างแชร์หรือบันทึกหน้าจอ',
  setPauseOnSensitiveApps: 'หยุดกับแอปที่มีข้อมูลอ่อนไหว',
  setPauseOnSensitiveAppsDesc: 'หยุดอัตโนมัติเมื่อโปรแกรมจัดการรหัสผ่านหรือแอปธนาคารทำงานอยู่',
  setLocalModelsOnly: 'ใช้เฉพาะโมเดลในเครื่อง',
  setLocalModelsOnlyDesc: 'ไม่ส่งข้อความหรือรูปภาพขึ้นคลาวด์เลย ไม่มีอะไรออกจากเครื่องนี้',
  setSaveHistory: 'บันทึกประวัติการสนทนา',
  setSaveHistoryDesc: 'เก็บคำถามและคำตอบเดิมไว้ให้กลับมาดูได้',
  setHistoryRetention: 'ลบประวัติหลังจาก',
  setHistoryRetentionDesc: 'จำนวนวันที่เก็บประวัติ ใส่ 0 คือเก็บตลอดไป',
  setTelemetry: 'ส่งข้อมูลการใช้งานแบบไม่ระบุตัวตน',
  setTelemetryDesc: 'ช่วยพัฒนาแอปให้ดีขึ้น ไม่มีเนื้อหาหน้าจอหรือคำถามของคุณ',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'เปิดพร้อมเครื่อง',
  setLaunchAtLoginDesc: 'เริ่มแอปอัตโนมัติเมื่อคุณเข้าสู่ระบบ',
  setHideFromDock: 'ซ่อนจาก Dock',
  setHideFromDockDesc: 'ทำงานบนแถบเมนูเท่านั้น ไม่มีไอคอนใน Dock หรือทาสก์บาร์',
  setAutoUpdate: 'อัปเดตอัตโนมัติ',
  setAutoUpdateDesc: 'ดาวน์โหลดและติดตั้งเวอร์ชันใหม่เบื้องหลัง',
  setUpdateChannel: 'ช่องทางอัปเดต',
  setUpdateChannelDesc: 'ช่อง Beta ได้ฟีเจอร์ใหม่เร็วกว่า แลกกับโอกาสเจอข้อผิดพลาดสูงกว่า',
  channelStable: 'เสถียร', channelBeta: 'ทดลอง',
  setLogLevel: 'ระดับการบันทึกล็อก',
  setLogLevelDesc: 'เพิ่มระดับนี้เมื่อรายงานปัญหา เพื่อให้ล็อกมีรายละเอียดมากขึ้น',
  logError: 'เฉพาะข้อผิดพลาด', logWarn: 'คำเตือน', logInfo: 'ปกติ', logDebug: 'ละเอียด',
  setDebugOverlay: 'ชั้นซ้อนสำหรับดีบัก',
  setDebugOverlayDesc: 'วาดกรอบรอบข้อความที่ตรวจพบ มีประโยชน์เมื่อรายงานปัญหาการอ่านข้อความ',

  // ── Xin quyền hệ thống (onboarding) ────────────────────────────────────────
  onboardingTitle: 'สิทธิ์ระบบ',
  onboardingIntro: 'Homework Helper ต้องการสิทธิ์ macOS สองอย่างเพื่อแปลและแก้โจทย์ได้ทุกที่บนหน้าจอ ทั้งสองอย่างจำเป็น — หากขาดอย่างใดอย่างหนึ่ง แอปจะอ่านเนื้อหาบนหน้าจอไม่ได้',
  onboardingAccessibilityTitle: 'การช่วยการเข้าถึง (Accessibility)',
  onboardingAccessibilityDesc: 'ให้แอปอ่านข้อความใต้เคอร์เซอร์เพื่อแปลทันที — เส้นทางที่เร็วที่สุดสำหรับแอปส่วนใหญ่',
  onboardingScreenTitle: 'การบันทึกหน้าจอ (Screen Recording)',
  onboardingScreenDesc: 'ให้แอปจับภาพหน้าจอ — ใช้สำหรับ Crop & Solve และเป็นทางเลือกสำรองเมื่ออ่านข้อความโดยตรงไม่ได้ (PDF, โปรแกรมแก้ไขบางตัว)',
  onboardingGranted: 'ได้รับอนุญาตแล้ว',
  onboardingNotGranted: 'ยังไม่ได้รับอนุญาต',
  onboardingOpenPane: 'เปิด System Settings',
  onboardingNeedsRestart: 'ได้รับสิทธิ์แล้ว รีสตาร์ทแอปเพื่อให้มีผล — macOS จะไม่ใช้สิทธิ์ใหม่กับโปรเซสที่กำลังทำงานอยู่',
  onboardingRelaunch: 'รีสตาร์ทตอนนี้',
  onboardingSkip: 'ไว้ทีหลัง',
  onboardingReopenLabel: 'สิทธิ์ระบบ',
  onboardingReopenDesc: 'ตรวจสอบหรือให้สิทธิ์ที่ Homework Helper ต้องการอีกครั้ง',
  onboardingReopenButton: 'ตรวจสอบ',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'แปล',
  intentSolve: 'แก้โจทย์',
  intentSummarize: 'สรุป',
  intentExplain: 'อธิบาย',
  intentRewrite: 'เขียนใหม่',
  intentChat: 'สนทนา',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'ปุ่มลัด',
  setHotkeys: 'ปุ่มลัดทั่วระบบ',
  setHotkeysDesc: 'ปุ่มที่ใช้ได้จากทุกแอป เว้นว่างไว้เพื่อปิดปุ่มลัดนั้น',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'ผู้ให้บริการ AI และคีย์',
  setApiConfigs: 'โมเดลที่ตั้งค่าไว้',
  keysAdd: 'เพิ่มโมเดล',
  keysEmpty: 'ยังไม่ได้ตั้งค่าโมเดลใด เพิ่มสักตัวเพื่อเริ่มต้น',
  keysTest: 'ทดสอบการเชื่อมต่อ',
  keysTesting: 'กำลังทดสอบ…',
  keysOk: 'เชื่อมต่อแล้ว',
  keysRemove: 'ลบ',
  keysKeySaved: 'บันทึกคีย์แล้ว',
  keysKeyPlaceholder: 'วาง API key',
  keysGetKey: 'ขอรับคีย์',
  keysNoKeyNeeded: 'ไม่ต้องใช้คีย์ — ทำงานบนเครื่องของคุณ',
  keysModel: 'โมเดล',
  keysBaseUrl: 'ที่อยู่',
  keysLabel: 'ชื่อเรียก',
  keysEnabled: 'เปิดใช้',
  keysVision: 'อ่านรูปภาพได้',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: 'งาน',
  setStudyMode: 'โหมดการเรียนเริ่มต้น',
  setStudyModeDesc: 'วิธีที่ AI ตอบโดยค่าเริ่มต้น เปลี่ยนเป็นรายคำตอบได้',
  modeStepByStep: 'แก้ทีละขั้น',
  modeDirect: 'เฉพาะคำตอบ',
  modeHint: 'ใบ้ ไม่บอกคำตอบ',
  modeExplain: 'อธิบายเชิงลึก',
  modeTranslate: 'แปลเชิงวิชาการ',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: 'พื้นที่จัดเก็บ',
  setMaxConversations: 'จำนวนบทสนทนาที่เก็บไว้',
  setMaxConversationsDesc: 'บทสนทนาเก่าจะถูกลบเมื่อเกินขีดจำกัดนี้',
  setCacheTtl: 'อายุแคชการแปล',
  setCacheTtlDesc: 'จำนวนวันที่คำแปลในแคชยังใช้ได้ก่อนจะดึงใหม่',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: 'แปลเมื่อชี้เมาส์',
  setHoverEnabled: 'เปิดการแปลเมื่อชี้เมาส์',
  setHoverEnabledDesc: 'แสดงคำแปลเมื่อคุณชี้เมาส์ไปที่ข้อความบนหน้าจอ',
  setClipboardWatcher: 'เปิดใช้งานการติดตามคลิปบอร์ด',
  setClipboardWatcherDesc: 'แสดงแถบการทำงานลอย (แปล / สรุป / อธิบาย / เขียนใหม่) ทุกครั้งที่คุณคัดลอกข้อความบนหน้าจอ',
  setHoverDelay: 'ระยะหน่วงก่อนทำงาน',
  setHoverDelayDesc: 'ระยะเวลาที่เคอร์เซอร์ต้องนิ่งก่อนค้นหาคำแปล',
  setHoverTolerance: 'ระยะยอมรับการขยับ',
  setHoverToleranceDesc: 'การสั่นเล็กน้อยภายในระยะนี้ยังถือว่านิ่ง',
  setHoverModifiers: 'ปุ่มกระตุ้น',
  setHoverModifiersDesc: 'ปุ่มที่ต้องกดค้างขณะชี้เมาส์ เว้นว่างไว้เพื่อทำงานทันทีเมื่อชี้',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',

  // ── Mức chi tiết hover ────────────────────────────────────────────────────
  setHoverGranularity: 'ระดับรายละเอียด',
  setHoverGranularityDesc: 'แปลข้อความมากแค่ไหนในแต่ละครั้ง',
  granWord: 'คำ',
  granSentence: 'ประโยค',
  granParagraph: 'ย่อหน้า',
  // ── Kéo-thả file (Phase 4) ────────────────────────────────────────────────
  notifFileDropUnsupported: 'ยังไม่รองรับไฟล์ประเภทนี้ รองรับเฉพาะ PDF และรูปภาพ (PNG/JPG)',
  notifFileDropPdfNoText: 'ไม่พบข้อความในไฟล์ PDF นี้ (อาจเป็นเอกสารสแกน) ลองใช้ฟีเจอร์แก้โจทย์ด้วยการจับภาพหน้าจอแต่ละหน้าแทน',
  notifFileDropReadError: 'ไม่สามารถอ่านไฟล์นี้ได้ กรุณาลองใหม่อีกครั้ง',

  // ── Giao diện (Phase 5) ──────────────────────────────────────────────────
  groupAppearance: 'รูปลักษณ์',
  setTheme: 'ธีม',
  setThemeDesc: 'เลือกธีมสีของแอป',
  themeSystem: 'ตามระบบ',
  themeLight: 'สว่าง',
  themeDark: 'มืด',
  setHoverCustomStyle: 'ปรับแต่งรูปลักษณ์ทูลทิป',
  setHoverCustomStyleDesc: 'แทนที่สีและขนาดของทูลทิปคำแปล แทนค่าเริ่มต้นที่เปลี่ยนตามธีมแอป',
  setHoverBgColor: 'สีพื้นหลัง',
  setHoverBgColorDesc: 'สีพื้นหลังของทูลทิปคำแปล',
  setHoverBgOpacity: 'ความโปร่งใสพื้นหลัง',
  setHoverBgOpacityDesc: 'ระดับความโปร่งใสของพื้นหลังทูลทิป',
  setHoverTextColor: 'สีข้อความ',
  setHoverTextColorDesc: 'สีของข้อความที่แปล',
  setHoverFontSize: 'ขนาดตัวอักษร',
  setHoverFontSizeDesc: 'ขนาดตัวอักษรภายในทูลทิป',
  setHoverBlur: 'ความเบลอพื้นหลัง',
  setHoverBlurDesc: 'ระดับความเบลอด้านหลังทูลทิป',
  setHoverBorderRadius: 'ความโค้งมุม',
  setHoverBorderRadiusDesc: 'ระดับความโค้งมนของมุมทูลทิป',
  resultStop: 'หยุด',
  resultCopy: 'คัดลอก',

} as const satisfies Dictionary;
