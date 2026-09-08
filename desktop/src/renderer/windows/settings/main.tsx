import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsApp } from './SettingsApp';
import { initTheme } from '@renderer/theme/apply-theme';

initTheme();

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');

createRoot(root).render(
  <StrictMode>
    <SettingsApp />
  </StrictMode>,
);
