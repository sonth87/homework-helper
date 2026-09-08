/**
 * Nội dung overlay dịch nhanh (Lane A).
 *
 * Tự ĐO chiều cao thật sau khi render và báo về main — cửa sổ overlay từng cố
 * định 320×120px, nên bản dịch dài hơn một câu ngắn bị CẮT CỤT không thấy phần
 * còn lại (đã xác nhận bằng ảnh chụp thật). Người dùng không có cách nào biết
 * mình đang đọc thiếu, nên đây là lỗi nặng hơn nó trông: thà không hiện còn
 * hơn hiện một nửa câu.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Settings } from '@config/settings';

type Payload = { sourceText: string; translatedText: string; sourceLanguage?: string };

/** `#rrggbb` + phần trăm (0-100) → `rgba(...)` — kiểu `color` của schema settings
 *  không có kênh alpha riêng, độ trong suốt là một setting number tách biệt
 *  (hoverBgOpacity), phải gộp lại thành một giá trị CSS ở đây. */
function hexToRgba(hex: string, opacityPercent: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [, r, g, b] = m;
  const a = Math.min(1, Math.max(0, opacityPercent / 100));
  return `rgba(${parseInt(r!, 16)}, ${parseInt(g!, 16)}, ${parseInt(b!, 16)}, ${a})`;
}

/** Chỉ áp override khi `hoverCustomStyleEnabled` bật — mặc định trả object
 *  rỗng, để hover.css tự dùng token --float-* (theo theme), giữ nguyên hành
 *  vi cũ cho người dùng chưa từng mở tới cài đặt này (xem
 *  appearance.settings.ts). */
function customStyleVars(s: Settings | null): CSSProperties {
  if (!s || !s.hoverCustomStyleEnabled) return {};
  return {
    '--hover-bg': hexToRgba(s.hoverBgColor, s.hoverBgOpacity),
    '--hover-text': s.hoverTextColor,
    '--hover-font-size': `${s.hoverFontSize}px`,
    '--hover-blur': `${s.hoverBlur}px`,
    '--hover-radius': `${s.hoverBorderRadius}px`,
  } as CSSProperties;
}

export function HoverOverlay() {
  const [data, setData] = useState<Payload | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onUpdate = (e: Event) => setData((e as CustomEvent<Payload>).detail);
    window.addEventListener('hover:update', onUpdate);
    return () => window.removeEventListener('hover:update', onUpdate);
  }, []);

  useEffect(() => {
    window.api?.invoke('settings:get').then(setSettings).catch(() => undefined);
    // Đổi trong lúc overlay đang hiện (mở Cài đặt song song) phải áp ngay —
    // không đợi lần hover tiếp theo mới thấy khác.
    return window.api?.onSettingsChanged(setSettings);
  }, []);

  // useLayoutEffect (không phải useEffect): đo SAU khi trình duyệt đã bố cục
  // xong nhưng TRƯỚC khi vẽ ra màn hình, nên main kịp chỉnh kích thước cửa sổ
  // trước lúc hiện — không nháy một khung sai cỡ rồi mới giật về đúng cỡ.
  useLayoutEffect(() => {
    if (!data || !cardRef.current) return;
    // getBoundingClientRect trả số thực; cộng margin 6px hai phía của .hover
    // (xem hover.css) rồi làm tròn LÊN để không thiếu một pixel gây cắt chữ.
    const height = Math.ceil(cardRef.current.getBoundingClientRect().height) + 12;
    window.api?.send('hover:measured', { height });
  }, [data]);

  if (!data) return <div className="hover hover--idle" />;

  return (
    <div className="hover" ref={cardRef} style={customStyleVars(settings)}>
      <p className="hover__translated">{data.translatedText}</p>
      <p className="hover__source">{data.sourceText}</p>
    </div>
  );
}
