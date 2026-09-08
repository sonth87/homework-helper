/**
 * Kéo để khoanh vùng màn hình.
 *
 * Ba chi tiết quyết định cảm giác dùng được:
 *   - Kéo được theo MỌI hướng, kể cả từ dưới lên hoặc phải sang trái. Người
 *     dùng không nghĩ về thứ tự điểm đầu/cuối.
 *   - Esc huỷ ở bất kỳ lúc nào, kể cả đang giữ chuột.
 *   - Hiện kích thước vùng đang chọn — người dùng biết mình đang lấy bao nhiêu.
 */

import { useCallback, useEffect, useState } from 'react';

type Anchor = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };

const MIN_SIZE = 4;

export function RegionSelect() {
  const [start, setStart] = useState<Anchor | null>(null);
  const [box, setBox] = useState<Box | null>(null);

  const finish = useCallback((result: Box | null) => {
    window.api?.send('region:done', result);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  const onDown = (e: React.MouseEvent) => {
    setStart({ x: e.clientX, y: e.clientY });
    setBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  };

  const onMove = (e: React.MouseEvent) => {
    if (!start) return;
    // Math.min + Math.abs cho phép kéo ngược mọi hướng.
    setBox({
      x: Math.min(start.x, e.clientX),
      y: Math.min(start.y, e.clientY),
      width: Math.abs(e.clientX - start.x),
      height: Math.abs(e.clientY - start.y),
    });
  };

  const onUp = () => {
    if (!box || box.width < MIN_SIZE || box.height < MIN_SIZE) return finish(null);
    finish(box);
  };

  return (
    <div className="region" onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}>
      {box && (
        <>
          {/* Bốn mảng tối quanh vùng chọn, để chính vùng chọn trong suốt hoàn toàn */}
          <div className="region__shade" style={{ inset: `0 0 auto 0`, height: box.y }} />
          <div className="region__shade" style={{ inset: `${box.y + box.height}px 0 0 0` }} />
          <div className="region__shade" style={{ top: box.y, height: box.height, left: 0, width: box.x }} />
          <div className="region__shade" style={{ top: box.y, height: box.height, left: box.x + box.width, right: 0 }} />

          <div
            className="region__box"
            style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
          >
            <span className="region__size">
              {Math.round(box.width)} × {Math.round(box.height)}
            </span>
          </div>
        </>
      )}
      {!box && <div className="region__hint">Kéo để khoanh vùng · Esc để huỷ</div>}
    </div>
  );
}
