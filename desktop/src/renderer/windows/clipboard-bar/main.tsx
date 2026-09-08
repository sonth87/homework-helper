import { createRoot } from 'react-dom/client';
import { ClipboardBar } from './ClipboardBar';
import { initTheme } from '@renderer/theme/apply-theme';
import '@renderer/theme/theme.css';
import './clipboard-bar.css';

initTheme();

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');
createRoot(root).render(<ClipboardBar />);
