/** Trạng thái phím bổ trợ NGAY LÚC hỏi — dùng để gate hoverModifiers
 *  (acquisition.settings.ts). Xem AccessibilityProvider.getModifiers(). */
export type ModifierState = {
  command: boolean;
  control: boolean;
  option: boolean;
  shift: boolean;
};
