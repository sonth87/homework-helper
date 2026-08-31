import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingApp } from './OnboardingApp';

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root');

createRoot(root).render(
  <StrictMode>
    <OnboardingApp />
  </StrictMode>,
);
