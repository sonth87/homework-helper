import { useMemo } from 'react';
import { renderMarkdown } from './render';

/**
 * Nội dung do AI sinh ra, không phải người dùng nhập, và đã đi qua marked (vốn
 * thoát HTML theo mặc định). KaTeX xuất HTML nên bắt buộc dùng
 * dangerouslySetInnerHTML — đó là cách dùng đúng của thư viện này.
 */
export function Markdown({ source }: { source: string }) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}
