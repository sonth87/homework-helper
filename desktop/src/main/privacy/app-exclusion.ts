/**
 * Chặn đọc màn hình khi app đang hover thuộc danh sách loại trừ, hoặc là app
 * nhạy cảm đã biết — hai setting này tồn tại từ Phase 0 (privacy.settings.ts)
 * nhưng CHƯA từng có logic nào đọc, chỉ hiện trên UI. Nối vào đây.
 *
 * CHỈ hoạt động cho nội dung lấy qua Accessibility — đó là nguồn DUY NHẤT
 * trả về tên app (xem AcquiredContent.app trong content.ts, gán từ kết quả
 * accessibility-helper). Nhánh OCR fallback (PDF, editor ảo hoá cao, app
 * native không hỗ trợ AX) KHÔNG biết app nào đang hiển thị — không loại trừ
 * được. Đây là giới hạn thật, không phải sơ suất: chấp nhận vì OCR fallback
 * vốn đã hiếm khi trúng đúng loại app cần bảo vệ (trình quản lý mật khẩu,
 * form ngân hàng đều render bằng UI chuẩn, có AX).
 *
 * `pauseOnSensitiveApps` KHÔNG bao phủ "app ngân hàng" như mô tả setting đã
 * hứa (setPauseOnSensitiveAppsDesc) — không có danh sách tên app ngân hàng
 * nào đủ đầy đủ để liệt kê cứng (hàng nghìn ngân hàng khắp thế giới, khác hẳn
 * trình quản lý mật khẩu chỉ có một nhúm cái phổ biến). Chỉ che được trình
 * quản lý mật khẩu đã biết tên. Ghi rõ ở đây thay vì để UI ngầm hứa hơn thực
 * tế làm được.
 */

import type { Settings } from '@config/settings';

/** Tên hiển thị (không phân biệt hoa/thường) của các trình quản lý mật khẩu
 *  phổ biến — không đầy đủ, chỉ che được app có tên khớp một trong số này. */
const KNOWN_PASSWORD_MANAGERS = [
  '1password', 'bitwarden', 'lastpass', 'dashlane',
  'keepassxc', 'keepass', 'keeper', 'nordpass', 'roboform', 'enpass',
];

export type ExclusionVerdict = { excluded: false } | { excluded: true; reason: string };

export function checkAppExcluded(appName: string | undefined, settings: Settings): ExclusionVerdict {
  if (!appName) return { excluded: false };
  const normalized = appName.trim().toLowerCase();
  if (!normalized) return { excluded: false };

  if (settings.excludedApps.some((excluded) => normalized.includes(excluded.trim().toLowerCase()))) {
    return { excluded: true, reason: `"${appName}" nằm trong danh sách loại trừ` };
  }

  if (settings.pauseOnSensitiveApps && KNOWN_PASSWORD_MANAGERS.some((pm) => normalized.includes(pm))) {
    return { excluded: true, reason: `"${appName}" là trình quản lý mật khẩu đã biết` };
  }

  return { excluded: false };
}
