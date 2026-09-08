import { createRoot } from 'react-dom/client';
import { ChatApp } from './ChatApp';
import { initTheme } from '@renderer/theme/apply-theme';
import '@renderer/theme/theme.css';
import 'katex/dist/katex.min.css';
import './chat.css';

initTheme();

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');
createRoot(root).render(<ChatApp />);
