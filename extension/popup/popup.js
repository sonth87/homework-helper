import { Icons } from '../shared/icons.js';
import { Storage } from '../shared/storage.js';
import { getPopupI18n } from '../shared/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Populate icons
  document.getElementById('popLogo').innerHTML = Icons.appLogo(24);
  document.getElementById('popBtnOptions').innerHTML = Icons.settings(16);
  document.getElementById('popIconSidePanel').innerHTML = Icons.externalLink(18);
  document.getElementById('popIconCapture').innerHTML = Icons.scissors(18);
  document.getElementById('popIconGear').innerHTML = Icons.settings(14);

  // Apply Language i18n
  const applyLanguage = async () => {
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const dict = getPopupI18n(uiLanguage);

    const sidePanelTitle = document.getElementById('popSidePanelTitle');
    if (sidePanelTitle) sidePanelTitle.textContent = dict.openSidePanel;
    const sidePanelDesc = document.getElementById('popSidePanelDesc');
    if (sidePanelDesc) sidePanelDesc.textContent = dict.openSidePanelDesc;

    const captureTitle = document.getElementById('popCaptureTitle');
    if (captureTitle) captureTitle.textContent = dict.cropSolve;
    const captureDesc = document.getElementById('popCaptureDesc');
    if (captureDesc) captureDesc.textContent = dict.cropSolveDesc;

    const labelKeyPool = document.getElementById('popLabelKeyPool');
    if (labelKeyPool) labelKeyPool.textContent = dict.keysPool;
    const labelRotationMode = document.getElementById('popLabelRotationMode');
    if (labelRotationMode) labelRotationMode.textContent = dict.rotationMode;

    const labelForms = document.getElementById('popLabelForms');
    if (labelForms) labelForms.textContent = dict.formsAssistant;
    const labelTooltip = document.getElementById('popLabelTooltip');
    if (labelTooltip) labelTooltip.textContent = dict.selectionTooltip;

    const configureBtnText = document.getElementById('popConfigureBtnText');
    if (configureBtnText) configureBtnText.textContent = dict.configureBtn;
  };

  await applyLanguage();

  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.uiLanguage) {
        applyLanguage();
      }
    });
  }

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
