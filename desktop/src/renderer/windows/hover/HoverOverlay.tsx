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

type Payload = { sourceText: string; translatedText: string; sourceLanguage?: string };

export function HoverOverlay() {
  const [data, setData] = useState<Payload | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onUpdate = (e: Event) => setData((e as CustomEvent<Payload>).detail);
    window.addEventListener('hover:update', onUpdate);
    return () => window.removeEventListener('hover:update', onUpdate);
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
    <div className="hover" ref={cardRef}>
      <p className="hover__translated">{data.translatedText}</p>
      <p className="hover__source">{data.sourceText}</p>
    </div>
  );
}
