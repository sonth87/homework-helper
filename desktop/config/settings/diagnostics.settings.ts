import { defineSettings } from './define';

/**
 * KHÔNG có setting nào thật — tồn tại chỉ để có một tab riêng trong UI Cài
 * đặt (SettingsApp.tsx đặc cách render <DiagnosticsPanel> khi activeGroup ===
 * 'diagnostics', giống cách 'apiKeys'/'privacy' có panel riêng). Trang này
 * THUẦN THÔNG TIN — không có gì để đổi, xem
 * src/main/diagnostics/diagnostics.service.ts.
 */
export const diagnosticsSettings = defineSettings('diagnostics', 'groupDiagnostics', {} as const);
