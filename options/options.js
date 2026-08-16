import { Icons } from '../shared/icons.js';
import { Storage, DEFAULT_PROVIDERS, DEFAULT_SETTINGS, SUPPORTED_LANGUAGES } from '../shared/storage.js';

class OptionsController {
  constructor() {
    this.init();
  }

  async init() {
    this.renderIcons();
    this.setupNavigation();
    await this.loadProvidersAndKeys();
    await this.checkChromeBuiltinAI();
    await this.loadAppearanceSettings();
    await this.loadSystemPrompt();
    await this.loadGeneralSettings();

    // Check URL hash for direct navigation to Gemini Nano
    if (window.location.hash === '#builtin-nano') {
      const nanoCard = document.getElementById('builtinNanoCard');
      if (nanoCard) {
        nanoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nanoCard.style.transition = 'all 0.4s ease';
        nanoCard.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.4)';
        setTimeout(() => {
          nanoCard.style.boxShadow = '';
        }, 2500);
      }
    }
  }

  renderIcons() {
    document.getElementById('optLogo').innerHTML = Icons.appLogo(28);
    document.getElementById('navIconProviders').innerHTML = Icons.layers(16);
    document.getElementById('navIconAppearance').innerHTML = Icons.settings(16);
    document.getElementById('navIconGuide').innerHTML = Icons.helpCircle(16);
    document.getElementById('navIconPrompt').innerHTML = Icons.fileText(16);
    document.getElementById('navIconGeneral').innerHTML = Icons.settings(16);
    document.getElementById('optIconPlus').innerHTML = Icons.plus(16);
    document.getElementById('optIconStrategy').innerHTML = Icons.checkCircle(18, 'text-green-600');
    document.getElementById('optIconBuiltinNano').innerHTML = Icons.cpu(18);

    // Guide Icons
    document.getElementById('guideIconWhy').innerHTML = Icons.sparkles(16);
    document.getElementById('guideIconHow').innerHTML = Icons.refresh(16);
    document.getElementById('linkIconGemini').innerHTML = Icons.externalLink(12);
    document.getElementById('linkIconGroq').innerHTML = Icons.externalLink(12);
    document.getElementById('linkIconOpenAI').innerHTML = Icons.externalLink(12);
    document.getElementById('linkIconDeepSeek').innerHTML = Icons.externalLink(12);
    document.getElementById('linkIconClaude').innerHTML = Icons.externalLink(12);

    // Live Preview Icons
    document.getElementById('prevTbLogo').innerHTML = Icons.appLogo(16);
    document.getElementById('prevIconAnswer').innerHTML = Icons.messageCircle(13);
    document.getElementById('prevIconCopy').innerHTML = Icons.copy(13);
    document.getElementById('prevIconSearch').innerHTML = Icons.globe(13);
    document.getElementById('prevIconTranslate').innerHTML = Icons.languages(13);
    document.getElementById('prevIconMore').innerHTML = Icons.chevronUp(13);

    document.getElementById('prevIconSparkles').innerHTML = Icons.appLogo(16);
    document.getElementById('prevIconClose').innerHTML = Icons.x(13);
    document.getElementById('prevIconScissors').innerHTML = Icons.scissors(13);
    document.getElementById('prevIconCardCopy').innerHTML = Icons.copy(12);

    document.getElementById('prevFabCrop').innerHTML = Icons.scissors(14);
    document.getElementById('prevFabToggle').innerHTML = Icons.sparkles(15);
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.opt-nav-item');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        navButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.opt-section').forEach((sec) => sec.classList.remove('active'));
        if (tab === 'providers') document.getElementById('tabProviders').classList.add('active');
        if (tab === 'appearance') document.getElementById('tabAppearance').classList.add('active');
        if (tab === 'guide') document.getElementById('tabGuide').classList.add('active');
        if (tab === 'prompt') document.getElementById('tabPrompt').classList.add('active');
        if (tab === 'general') document.getElementById('tabGeneral').classList.add('active');
      });
    });
  }

  async loadProvidersAndKeys() {
    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const container = document.getElementById('optKeysContainer');

    container.innerHTML = '';
    if (apiConfigs.length === 0) {
      container.innerHTML = `
        <div class="opt-card" style="text-align:center; padding:32px; color:#64748b;">
          Chưa có API Key nào được thêm. Nhấn <strong>"Thêm Model & Key"</strong> ở trên để bắt đầu sử dụng hoàn toàn miễn phí.
        </div>
      `;
    } else {
      apiConfigs.forEach((cfg) => {
        container.appendChild(this.createKeyCard(cfg));
      });
    }

    document.getElementById('optBtnAddKey').addEventListener('click', () => {
      const newConfig = {
        id: `cfg_${Date.now()}`,
        provider: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-2.5-flash',
        apiKey: '',
        baseUrl: '',
        isEnabled: true,
      };
      if (apiConfigs.length === 0) container.innerHTML = '';
      container.appendChild(this.createKeyCard(newConfig, true));
    });
  }

  createKeyCard(cfg, isNew = false) {
    const card = document.createElement('div');
    card.className = 'opt-key-card';
    card.setAttribute('data-id', cfg.id);

    const providerOptions = DEFAULT_PROVIDERS.map(
      (p) => `<option value="${p.id}" ${cfg.provider === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const providerObj = DEFAULT_PROVIDERS.find((p) => p.id === cfg.provider) || DEFAULT_PROVIDERS[0];
    const modelOptions = providerObj.models.map(
      (m) => `<option value="${m.id}" ${cfg.model === m.id ? 'selected' : ''}>${m.name}</option>`
    ).join('');

    card.innerHTML = `
      <div class="opt-key-header">
        <label class="opt-key-provider-title">
          <input type="checkbox" class="card-enabled" ${cfg.isEnabled ? 'checked' : ''}>
          <span>${providerObj.name}</span>
        </label>
        <button class="opt-btn-secondary card-delete" style="color:#ef4444; padding:4px 8px; font-size:12px;">
          ${Icons.trash(14)} Xóa
        </button>
      </div>

      <div class="opt-key-grid">
        <select class="opt-select card-provider">${providerOptions}</select>
        <select class="opt-select card-model">${modelOptions}</select>
        <input type="password" class="opt-input card-key" placeholder="Nhập API Key (sk-... / AIza...)" value="${cfg.apiKey || ''}">
      </div>

      <div class="opt-key-actions">
        <div style="font-size:12px; color:#64748b;" class="card-status">
          ${cfg.cooldownUntil && cfg.cooldownUntil > Date.now() ? `${Icons.alertCircle(12)} Đang tạm nghỉ do Rate Limit (đến ${new Date(cfg.cooldownUntil).toLocaleTimeString()})` : 'Trạng thái: Sẵn sàng'}
        </div>
        <button class="opt-btn-secondary card-test" style="padding:4px 10px; font-size:12px;">
          ${Icons.refresh(12)} Kiểm tra Kết nối
        </button>
      </div>
    `;

    const providerSelect = card.querySelector('.card-provider');
    const modelSelect = card.querySelector('.card-model');
    const keyInput = card.querySelector('.card-key');
    const enabledCheck = card.querySelector('.card-enabled');
    const testBtn = card.querySelector('.card-test');
    const statusText = card.querySelector('.card-status');

    const save = async () => {
      await Storage.saveApiConfig({
        id: cfg.id,
        provider: providerSelect.value,
        model: modelSelect.value,
        apiKey: keyInput.value.trim(),
        isEnabled: enabledCheck.checked,
      });
    };

    providerSelect.addEventListener('change', () => {
      const pObj = DEFAULT_PROVIDERS.find((p) => p.id === providerSelect.value) || DEFAULT_PROVIDERS[0];
      modelSelect.innerHTML = pObj.models.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
      save();
    });

    modelSelect.addEventListener('change', save);
    keyInput.addEventListener('input', save);
    enabledCheck.addEventListener('change', save);

    card.querySelector('.card-delete').addEventListener('click', async () => {
      await Storage.removeApiConfig(cfg.id);
      card.remove();
    });

    testBtn.addEventListener('click', async () => {
      testBtn.innerHTML = `${Icons.refresh(12)} Đang kiểm tra...`;
      try {
        const testPayload = {
          provider: providerSelect.value,
          model: modelSelect.value,
          apiKey: keyInput.value.trim(),
        };

        if (!testPayload.apiKey) {
          throw new Error('Vui lòng nhập API Key trước khi kiểm tra');
        }

        chrome.runtime.sendMessage({
          action: 'ASK_AI',
          payload: { prompt: 'Reply "Connected OK"', preferredConfigId: cfg.id }
        }, (res) => {
          if (res?.success) {
            statusText.innerHTML = `<span style="color:#16a34a;">${Icons.check(12)} Key Hợp lệ & Hoạt động Tốt</span>`;
          } else {
            statusText.innerHTML = `<span style="color:#ef4444;">Kiểm tra thất bại: ${res?.error || 'Lỗi không xác định'}</span>`;
          }
        });
      } catch (err) {
        statusText.innerHTML = `<span style="color:#ef4444;">${err.message}</span>`;
      } finally {
        setTimeout(() => {
          testBtn.innerHTML = `${Icons.refresh(12)} Kiểm tra Kết nối`;
        }, 1000);
      }
    });

    if (isNew) save();
    return card;
  }

  async loadAppearanceSettings() {
    const {
      enableFloatingButton = true,
      fabSize = 'normal',
      popupOpacity = 92,
      popupBlur = 16,
      toolbarShowText = true,
      toolbarSize = 'normal',
      toolbarTheme = 'glass-light',
      toolbarOpacity = 90,
      toolbarBlur = 14,
    } = await Storage.get();

    // DOM Controls
    const checkFab = document.getElementById('optCheckFab');
    const fabSizeSelect = document.getElementById('optFabSizeSelect');
    const checkToolbarText = document.getElementById('optCheckToolbarText');
    const toolbarSizeSelect = document.getElementById('optToolbarSizeSelect');
    const toolbarThemeSelect = document.getElementById('optToolbarThemeSelect');

    const rangeToolbarOpacity = document.getElementById('optRangeToolbarOpacity');
    const valToolbarOpacity = document.getElementById('valToolbarOpacity');
    const rangeToolbarBlur = document.getElementById('optRangeToolbarBlur');
    const valToolbarBlur = document.getElementById('valToolbarBlur');

    const rangePopupOpacity = document.getElementById('optRangePopupOpacity');
    const valPopupOpacity = document.getElementById('valPopupOpacity');
    const rangePopupBlur = document.getElementById('optRangePopupBlur');
    const valPopupBlur = document.getElementById('valPopupBlur');

    // Live Preview Elements
    const prevToolbar = document.getElementById('prevToolbar');
    const prevPopup = document.getElementById('prevPopup');
    const prevFab = document.getElementById('prevFab');

    // Populate initial values
    checkFab.checked = enableFloatingButton;
    fabSizeSelect.value = fabSize;
    checkToolbarText.checked = toolbarShowText;
    toolbarSizeSelect.value = toolbarSize;
    toolbarThemeSelect.value = toolbarTheme;

    rangeToolbarOpacity.value = toolbarOpacity;
    valToolbarOpacity.textContent = `${toolbarOpacity}%`;
    rangeToolbarBlur.value = toolbarBlur;
    valToolbarBlur.textContent = `${toolbarBlur}px`;

    rangePopupOpacity.value = popupOpacity;
    valPopupOpacity.textContent = `${popupOpacity}%`;
    rangePopupBlur.value = popupBlur;
    valPopupBlur.textContent = `${popupBlur}px`;

    // Live update function
    const updatePreview = () => {
      // 1. FAB
      const isFabVisible = checkFab.checked;
      const fSize = fabSizeSelect.value;
      prevFab.style.display = isFabVisible ? 'flex' : 'none';
      prevFab.querySelectorAll('.prev-fab-btn').forEach((btn) => {
        if (fSize === 'small') {
          btn.style.width = '28px';
          btn.style.height = '28px';
        } else if (fSize === 'large') {
          btn.style.width = '42px';
          btn.style.height = '42px';
        } else {
          btn.style.width = '34px';
          btn.style.height = '34px';
        }
      });

      // 2. Toolbar
      const tbAlpha = (parseInt(rangeToolbarOpacity.value, 10) / 100).toFixed(2);
      const tbBlurVal = parseInt(rangeToolbarBlur.value, 10);
      const tbTheme = toolbarThemeSelect.value;
      const showText = checkToolbarText.checked;

      prevToolbar.querySelectorAll('.prev-tb-label').forEach((lbl) => {
        lbl.style.display = showText ? 'inline' : 'none';
      });

      prevToolbar.style.backdropFilter = `blur(${tbBlurVal}px) saturate(180%)`;
      prevToolbar.style.webkitBackdropFilter = `blur(${tbBlurVal}px) saturate(180%)`;

      if (tbTheme === 'glass-dark') {
        prevToolbar.style.background = `rgba(15, 23, 42, ${tbAlpha})`;
        prevToolbar.style.color = '#f8fafc';
        prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      } else if (tbTheme === 'cyber-blue') {
        prevToolbar.style.background = `rgba(2, 132, 199, ${tbAlpha})`;
        prevToolbar.style.color = '#ffffff';
        prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.35)';
      } else if (tbTheme === 'emerald') {
        prevToolbar.style.background = `rgba(5, 150, 105, ${tbAlpha})`;
        prevToolbar.style.color = '#ffffff';
        prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.35)';
      } else if (tbTheme === 'purple') {
        prevToolbar.style.background = `rgba(124, 58, 237, ${tbAlpha})`;
        prevToolbar.style.color = '#ffffff';
        prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.35)';
      } else {
        // glass-light
        prevToolbar.style.background = `rgba(255, 255, 255, ${tbAlpha})`;
        prevToolbar.style.color = '#1e293b';
        prevToolbar.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      }

      // 3. Popup
      const popAlpha = (parseInt(rangePopupOpacity.value, 10) / 100).toFixed(2);
      const popBlurVal = parseInt(rangePopupBlur.value, 10);
      prevPopup.style.background = `rgba(255, 255, 255, ${popAlpha})`;
      prevPopup.style.backdropFilter = `blur(${popBlurVal}px) saturate(180%)`;
      prevPopup.style.webkitBackdropFilter = `blur(${popBlurVal}px) saturate(180%)`;
    };

    updatePreview();

    // Event Listeners
    checkFab.addEventListener('change', () => {
      Storage.set({ enableFloatingButton: checkFab.checked });
      updatePreview();
    });

    fabSizeSelect.addEventListener('change', () => {
      Storage.set({ fabSize: fabSizeSelect.value });
      updatePreview();
    });

    checkToolbarText.addEventListener('change', () => {
      Storage.set({ toolbarShowText: checkToolbarText.checked });
      updatePreview();
    });

    toolbarSizeSelect.addEventListener('change', () => {
      Storage.set({ toolbarSize: toolbarSizeSelect.value });
      updatePreview();
    });

    toolbarThemeSelect.addEventListener('change', () => {
      Storage.set({ toolbarTheme: toolbarThemeSelect.value });
      updatePreview();
    });

    rangeToolbarOpacity.addEventListener('input', () => {
      valToolbarOpacity.textContent = `${rangeToolbarOpacity.value}%`;
      Storage.set({ toolbarOpacity: parseInt(rangeToolbarOpacity.value, 10) });
      updatePreview();
    });

    rangeToolbarBlur.addEventListener('input', () => {
      valToolbarBlur.textContent = `${rangeToolbarBlur.value}px`;
      Storage.set({ toolbarBlur: parseInt(rangeToolbarBlur.value, 10) });
      updatePreview();
    });

    rangePopupOpacity.addEventListener('input', () => {
      valPopupOpacity.textContent = `${rangePopupOpacity.value}%`;
      Storage.set({ popupOpacity: parseInt(rangePopupOpacity.value, 10) });
      updatePreview();
    });

    rangePopupBlur.addEventListener('input', () => {
      valPopupBlur.textContent = `${rangePopupBlur.value}px`;
      Storage.set({ popupBlur: parseInt(rangePopupBlur.value, 10) });
      updatePreview();
    });
  }

  async loadSystemPrompt() {
    const { systemPrompt } = await Storage.get(['systemPrompt']);
    const textarea = document.getElementById('optSystemPromptTextarea');
    textarea.value = systemPrompt || DEFAULT_SETTINGS.systemPrompt;

    document.getElementById('optBtnSavePrompt').addEventListener('click', async () => {
      await Storage.set({ systemPrompt: textarea.value });
      alert('Đã lưu System Prompt thành công!');
    });

    document.getElementById('optBtnResetPrompt').addEventListener('click', async () => {
      textarea.value = DEFAULT_SETTINGS.systemPrompt;
      await Storage.set({ systemPrompt: DEFAULT_SETTINGS.systemPrompt });
    });
  }

  async loadGeneralSettings() {
    const { enableFormsAdapter = true, enableTextTooltip = true, outputLanguage = 'en', disabledSites = [] } = await Storage.get();

    const langSelect = document.getElementById('optOutputLanguageSelect');
    if (langSelect) {
      langSelect.innerHTML = SUPPORTED_LANGUAGES.map(
        (l) => `<option value="${l.id}" ${l.id === outputLanguage ? 'selected' : ''}>${l.name}</option>`
      ).join('');
      langSelect.addEventListener('change', () => Storage.set({ outputLanguage: langSelect.value }));
    }

    const checkForms = document.getElementById('optCheckForms');
    const checkTooltip = document.getElementById('optCheckTooltip');

    checkForms.checked = enableFormsAdapter;
    checkTooltip.checked = enableTextTooltip;

    checkForms.addEventListener('change', () => Storage.set({ enableFormsAdapter: checkForms.checked }));
    checkTooltip.addEventListener('change', () => Storage.set({ enableTextTooltip: checkTooltip.checked }));

    // Disabled sites
    const disabledContainer = document.getElementById('optDisabledSitesList');
    disabledContainer.innerHTML = '';

    if (disabledSites.length === 0) {
      disabledContainer.innerHTML = '<div style="font-size:12px; color:#94a3b8;">Chưa có website nào bị tắt.</div>';
    } else {
      disabledSites.forEach((site) => {
        const item = document.createElement('div');
        item.className = 'opt-disabled-site-item';
        item.innerHTML = `
          <span>${site}</span>
          <button class="opt-btn-secondary" style="color:#ef4444; padding:3px 8px; font-size:12px;">Bật lại</button>
        `;
        item.querySelector('button').addEventListener('click', async () => {
          const updated = disabledSites.filter((s) => s !== site);
          await Storage.set({ disabledSites: updated });
          item.remove();
        });
        disabledContainer.appendChild(item);
      });
    }

    // Export / Clear
    document.getElementById('optBtnExport').addEventListener('click', async () => {
      const data = await Storage.get();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homework-ai-config-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    });

    document.getElementById('optBtnClearData').addEventListener('click', async () => {
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử Chat không?')) {
        await Storage.clearChatHistory();
        alert('Đã xóa lịch sử chat.');
      }
    });
  }

  async checkChromeBuiltinAI() {
    const badge = document.getElementById('builtinNanoBadge');
    const testBtn = document.getElementById('btnTestBuiltinAI');

    const getAiModel = () => {
      if (typeof chrome !== 'undefined' && chrome.aiOriginTrial?.languageModel) {
        return chrome.aiOriginTrial.languageModel;
      }
      if (typeof ai !== 'undefined' && ai?.languageModel) {
        return ai.languageModel;
      }
      const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
      return g.ai?.languageModel || g.ai?.assistant || g.LanguageModel || null;
    };

    const checkViaActiveTab = async () => {
      try {
        const tabs = await chrome.tabs.query({ url: ['https://*/*', 'http://*/*'] });
        if (!tabs || tabs.length === 0) return null;
        const targetTab = tabs.find((t) => t.active) || tabs[0];
        if (!targetTab?.id) return null;

        const results = await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          world: 'MAIN',
          func: async () => {
            const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
            const aiModel = g.ai?.languageModel || g.ai?.assistant || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null);
            if (!aiModel) return { available: false };
            try {
              const caps = typeof aiModel.capabilities === 'function' ? await aiModel.capabilities() : {};
              return { available: true, caps };
            } catch (e) {
              return { available: true, error: e.message };
            }
          },
        });
        return results?.[0]?.result;
      } catch (e) {
        return null;
      }
    };

    const updateStatus = async () => {
      try {
        let aiModel = getAiModel();
        let isTabAi = false;
        let tabCaps = null;

        if (!aiModel) {
          const tabRes = await checkViaActiveTab();
          if (tabRes?.available) {
            isTabAi = true;
            tabCaps = tabRes.caps || {};
          }
        }

        if (!aiModel && !isTabAi) {
          badge.textContent = 'Đã bật cờ (Mở 1 tab web bất kỳ để kiểm tra)';
          badge.style.background = '#fef3c7';
          badge.style.color = '#d97706';
          return;
        }

        const caps = isTabAi ? tabCaps : (typeof aiModel.capabilities === 'function' ? await aiModel.capabilities() : {});
        const avail = caps?.available || caps?.availability || 'readily';

        if (avail === 'readily') {
          badge.textContent = 'Đang hoạt động (Ready On-Device)';
          badge.style.background = '#dcfce7';
          badge.style.color = '#16a34a';
        } else if (avail === 'after-download') {
          badge.textContent = 'Đang tải model về máy (Downloading...)';
          badge.style.background = '#fef3c7';
          badge.style.color = '#d97706';
        } else {
          badge.textContent = 'Sẵn sàng trên Web Tab (Nhấn Kiểm tra)';
          badge.style.background = '#dcfce7';
          badge.style.color = '#16a34a';
        }
      } catch (e) {
        badge.textContent = 'Sẵn sàng kết nối';
        badge.style.background = '#dcfce7';
        badge.style.color = '#16a34a';
      }
    };

    await updateStatus();

    document.getElementById('btnOpenFlagsFromOptions')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api' });
    });

    document.getElementById('btnFlagPromptApi')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api' });
    });

    document.getElementById('btnFlagOptimizationGuide')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://flags/#prompt-api' });
    });

    document.getElementById('btnOpenComponents')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_CHROME_FLAGS', url: 'chrome://components' });
    });

    testBtn?.addEventListener('click', async () => {
      testBtn.innerHTML = `${Icons.refresh(12)} Đang kiểm tra Gemini Nano...`;
      try {
        let reply = '';
        const aiModel = getAiModel();

        if (aiModel && typeof aiModel.create === 'function') {
          const session = await aiModel.create();
          reply = await session.prompt('Say "Gemini Nano is working on your computer!" in 1 short sentence.');
        } else {
          // Test via active web tab
          const tabs = await chrome.tabs.query({ url: ['https://*/*', 'http://*/*'] });
          if (!tabs || tabs.length === 0) {
            throw new Error('Chrome chỉ cho phép Prompt API chạy trên các trang Web (https://). Bạn hãy mở 1 tab web thông thường (như google.com) rồi nhấn nút Kiểm tra lại nhé!');
          }
          const targetTab = tabs.find((t) => t.active) || tabs[0];
          const results = await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            world: 'MAIN',
            func: async () => {
              const g = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {});
              const m = g.ai?.languageModel || g.ai?.assistant || (typeof ai !== 'undefined' ? (ai.languageModel || ai.assistant) : null);
              if (!m) throw new Error('Không tìm thấy ai.languageModel trên trang web.');
              const sess = await m.create();
              return await sess.prompt('Say "Gemini Nano is working on your device!" in 1 short sentence.');
            },
          });
          reply = results?.[0]?.result;
        }

        if (reply) {
          alert(`Kiểm tra thành công!\n\nPhản hồi từ Gemini Nano On-Device:\n"${reply}"`);
          badge.textContent = 'Đang hoạt động (Ready On-Device)';
          badge.style.background = '#dcfce7';
          badge.style.color = '#16a34a';
        }
      } catch (err) {
        alert(`Thông báo kết nối Gemini Nano:\n${err.message}`);
        await updateStatus();
      } finally {
        testBtn.innerHTML = 'Kiểm tra Model Nội bộ';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
