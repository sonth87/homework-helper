import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsApp } from './SettingsApp';

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');

createRoot(root).render(
  <StrictMode>
    <SettingsApp />
  </StrictMode>,
);
