import { createRoot } from 'react-dom/client';
import { ClipboardBar } from './ClipboardBar';
import './clipboard-bar.css';

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');
createRoot(root).render(<ClipboardBar />);
