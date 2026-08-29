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
} as const satisfies Dictionary;
