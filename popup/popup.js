import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Populate icons
  document.getElementById('popLogo').innerHTML = Icons.appLogo(24);
  document.getElementById('popBtnOptions').innerHTML = Icons.settings(16);
  document.getElementById('popIconSidePanel').innerHTML = Icons.externalLink(18);
  document.getElementById('popIconCapture').innerHTML = Icons.scissors(18);
  document.getElementById('popIconGear').innerHTML = Icons.settings(14);

  // Load Status
  const { apiConfigs = [], rotationStrategy, enableFormsAdapter = true, enableTextTooltip = true } = await Storage.get();
  const enabledKeys = apiConfigs.filter((c) => c.isEnabled && c.apiKey);

  const countBadge = document.getElementById('popKeyCount');
  countBadge.textContent = `${enabledKeys.length} Active Key${enabledKeys.length !== 1 ? 's' : ''}`;
  if (enabledKeys.length === 0) {
    countBadge.style.background = '#fee2e2';
    countBadge.style.color = '#dc2626';
    countBadge.textContent = 'No Key';
  }

  const modeSpan = document.getElementById('popRotationMode');
  modeSpan.textContent = rotationStrategy === 'random' ? 'Random Balance' : 'Round Robin';

  const toggleForms = document.getElementById('popToggleForms');
  const toggleTooltip = document.getElementById('popToggleTooltip');

  toggleForms.checked = enableFormsAdapter;
  toggleTooltip.checked = enableTextTooltip;

  toggleForms.addEventListener('change', () => Storage.set({ enableFormsAdapter: toggleForms.checked }));
  toggleTooltip.addEventListener('change', () => Storage.set({ enableTextTooltip: toggleTooltip.checked }));

  // Open Side Panel
  document.getElementById('popBtnOpenSidePanel').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && chrome.sidePanel) {
      await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
      window.close();
    }
  });

  // Capture
  document.getElementById('popBtnCapture').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'START_CROP' }).catch(() => {});
      window.close();
    }
  });

  // Open Options
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };
  document.getElementById('popBtnOptions').addEventListener('click', openOptions);
  document.getElementById('popBtnConfigure').addEventListener('click', openOptions);
});
