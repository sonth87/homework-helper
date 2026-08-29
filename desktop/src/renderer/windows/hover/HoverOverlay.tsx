/**
 * Nội dung overlay dịch nhanh (Lane A).
 *
 * Phase 1 mới dựng khung cửa sổ. Nối vào pipeline dịch là việc của Phase 3 —
 * xem dev/decisions/0004-solve-truoc-translate.md về lý do Lane A ra sau.
 */

import { useEffect, useState } from 'react';

type Payload = { sourceText: string; translatedText: string; sourceLanguage?: string };

export function HoverOverlay() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    const onUpdate = (e: Event) => setData((e as CustomEvent<Payload>).detail);
    window.addEventListener('hover:update', onUpdate);
    return () => window.removeEventListener('hover:update', onUpdate);
  }, []);

  if (!data) return <div className="hover hover--idle" />;

  return (
    <div className="hover">
      <p className="hover__translated">{data.translatedText}</p>
      <p className="hover__source">{data.sourceText}</p>
    </div>
  );
}
