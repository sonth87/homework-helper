import { createRoot } from 'react-dom/client';
import { ChatApp } from './ChatApp';
import 'katex/dist/katex.min.css';
import './chat.css';

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');
createRoot(root).render(<ChatApp />);
