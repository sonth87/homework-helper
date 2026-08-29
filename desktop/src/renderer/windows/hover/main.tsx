import { createRoot } from 'react-dom/client';
import { HoverOverlay } from './HoverOverlay';
import './hover.css';

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');
createRoot(root).render(<HoverOverlay />);
