import { createRoot } from 'react-dom/client';
import { RegionSelect } from './RegionSelect';
import './region-select.css';

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');
createRoot(root).render(<RegionSelect />);
