import { createRoot } from 'react-dom/client';
import { ResultPanel } from './ResultPanel';
import 'katex/dist/katex.min.css';
import './result.css';

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');
createRoot(root).render(<ResultPanel />);
