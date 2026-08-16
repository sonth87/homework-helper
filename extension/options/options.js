import { Icons } from '../shared/icons.js';
import { Storage, DEFAULT_PROVIDERS, DEFAULT_SETTINGS, SUPPORTED_LANGUAGES } from '../shared/storage.js';
import { OCR_MODEL_CATALOG, OcrEngine } from '../shared/ocr-engine.js';
import { getOptionsI18n } from '../shared/i18n.js';

class OptionsController {
  constructor() {
    this.init();
  }

  async init() {
    this.renderIcons();
    this.setupNavigation();
    await this.applyLanguageI18n();
    await this.loadRoutingStrategy();
    await this.loadProvidersAndKeys();
    await this.checkChromeBuiltinAI();
    await this.loadOcrModelsManager();
    await this.loadAppearanceSettings();
    await this.loadSystemPrompt();
    await this.loadGeneralSettings();

    // Listen to real-time storage changes
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.uiLanguage) {
          this.applyLanguageI18n(changes.uiLanguage.newValue);
        }
      });
    }

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
    } else if (window.location.hash === '#ocr') {
      const ocrNav = document.querySelector('[data-tab="ocr"]');
      if (ocrNav) ocrNav.click();
    }
  }

  renderIcons() {
    document.getElementById('optLogo').innerHTML = Icons.appLogo(28);
    document.getElementById('navIconProviders').innerHTML = Icons.layers(16);
    document.getElementById('navIconOcr').innerHTML = Icons.scan(16);
    document.getElementById('navIconAppearance').innerHTML = Icons.settings(16);
    document.getElementById('navIconGuide').innerHTML = Icons.helpCircle(16);
    document.getElementById('navIconPrompt').innerHTML = Icons.fileText(16);
    document.getElementById('navIconGeneral').innerHTML = Icons.settings(16);
    document.getElementById('optIconPlus').innerHTML = Icons.plus(16);
    document.getElementById('optIconRouting').innerHTML = Icons.cpu(18);
    document.getElementById('optIconStrategy').innerHTML = Icons.checkCircle(18, 'text-green-600');
    document.getElementById('optIconBuiltinNano').innerHTML = Icons.cpu(18);
    document.getElementById('optIconCheckUpdates').innerHTML = Icons.refresh(14);
    document.getElementById('optIconDownloadCore').innerHTML = Icons.download(14);
    document.getElementById('optIconCorePackage').innerHTML = Icons.checkCircle(18, 'text-green-600');

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
        if (tab === 'ocr') document.getElementById('tabOcr').classList.add('active');
        if (tab === 'appearance') document.getElementById('tabAppearance').classList.add('active');
        if (tab === 'guide') document.getElementById('tabGuide').classList.add('active');
        if (tab === 'prompt') document.getElementById('tabPrompt').classList.add('active');
        if (tab === 'general') document.getElementById('tabGeneral').classList.add('active');
      });
    });
  }

  async loadRoutingStrategy() {
    const strategy = await Storage.getRoutingStrategy();
    const radios = document.querySelectorAll('input[name="optRoutingStrategy"]');
    radios.forEach((r) => {
      r.checked = r.value === strategy;
      r.addEventListener('change', async () => {
        if (r.checked) {
          await Storage.setRoutingStrategy(r.value);
        }
      });
    });
  }

  async loadOcrModelsManager() {
    const container = document.getElementById('ocrModelsListContainer');
    const { installedModels = {}, uiLanguage = 'vi' } = await Storage.get(['installedModels', 'uiLanguage']);
    const dict = getOptionsI18n(uiLanguage);

    container.innerHTML = '';
    OCR_MODEL_CATALOG.forEach((model) => {
      const isInstalled = !!installedModels[model.lang]?.isInstalled || model.isBundled;
      const installedVer = installedModels[model.lang]?.version || model.version;

      const row = document.createElement('div');
      row.className = 'opt-ocr-item';

      let statusBadge = '';
      if (model.isBundled) {
        statusBadge = `<span class="opt-preview-badge" style="background:#ecfdf5; color:#059669;">${dict.corePackBadge || `Tích hợp sẵn v${installedVer}`}</span>`;
      } else if (isInstalled) {
        statusBadge = `<span class="opt-preview-badge" style="background:#ecfdf5; color:#059669;">${dict.ocrInstalled || 'Đã tải'} v${installedVer}</span>`;
      } else {
        statusBadge = `<span class="opt-preview-badge" style="background:#f1f5f9; color:#64748b;">${dict.ocrNotInstalled || 'Chưa tải'}</span>`;
      }

      row.innerHTML = `
        <div class="opt-ocr-info">
          <div class="opt-ocr-title-row">
            <strong style="font-size:13.5px; color:#0f172a;">${model.name} (${model.nativeName})</strong>
            <span style="font-size:11px; padding:1px 6px; border-radius:4px; background:#f1f5f9; color:#475569; font-weight:600;">${model.size}</span>
            ${statusBadge}
          </div>
          <p style="font-size:12px; color:#64748b; margin-top:3px; text-align:left;">${model.description}</p>
        </div>

        <div class="opt-ocr-actions">
          ${
            !isInstalled
              ? `<button class="opt-btn-secondary btn-download-model" data-lang="${model.lang}" style="padding:6px 14px; font-size:12px; display:flex; align-items:center; gap:5px; white-space:nowrap;">
                  ${Icons.download(13)} ${dict.ocrDownloadBtn || 'Tải về'}
                </button>`
              : `<button class="opt-btn-secondary btn-delete-model" data-lang="${model.lang}" style="padding:6px 10px; font-size:12px; color:#ef4444; display:flex; align-items:center;" ${model.isBundled ? 'disabled title="Gói cốt lõi tích hợp sẵn trong tiện ích"' : `title="${dict.ocrDeleteBtn || 'Xóa'}"`}>
                  ${Icons.trash(13)}
                </button>`
          }
        </div>
      `;

      container.appendChild(row);
    });

    // Attach Download Handlers
    container.querySelectorAll('.btn-download-model').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const lang = btn.getAttribute('data-lang');
        btn.disabled = true;
        btn.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> ${dict.ocrDownloading || 'Đang tải...'}`;

        const progressCard = document.getElementById('ocrProgressCard');
        const progressLabel = document.getElementById('ocrProgressLabel');
        const progressPct = document.getElementById('ocrProgressPct');
        const progressBar = document.getElementById('ocrProgressBar');
        progressCard.style.display = 'block';

        try {
          await OcrEngine.downloadModel(lang, (pct, label) => {
            progressLabel.textContent = label;
            progressPct.textContent = `${pct}%`;
            progressBar.style.width = `${pct}%`;
          });
          setTimeout(async () => {
            progressCard.style.display = 'none';
            await this.loadOcrModelsManager();
          }, 1200);
        } catch (err) {
          alert(`Tải model thất bại: ${err.message}`);
          progressCard.style.display = 'none';
          await this.loadOcrModelsManager();
        }
      });
    });

    // Attach Delete Handlers
    container.querySelectorAll('.btn-delete-model').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const lang = btn.getAttribute('data-lang');
        if (confirm(`${dict.ocrConfirmDelete || 'Bạn có chắc muốn xóa model ngôn ngữ này khỏi bộ nhớ đệm?'}`)) {
          await OcrEngine.deleteModel(lang);
          await this.loadOcrModelsManager();
        }
      });
    });

    // Attach Download Core Pack Button
    document.getElementById('optBtnDownloadCoreOcr').onclick = async () => {
      const coreLangs = ['vie', 'eng', 'equ'];
      const progressCard = document.getElementById('ocrProgressCard');
      const progressLabel = document.getElementById('ocrProgressLabel');
      const progressPct = document.getElementById('ocrProgressPct');
      const progressBar = document.getElementById('ocrProgressBar');
      progressCard.style.display = 'block';

      try {
        for (let i = 0; i < coreLangs.length; i++) {
          const l = coreLangs[i];
          await OcrEngine.downloadModel(l, (pct, label) => {
            const overallPct = Math.round(((i * 100) + pct) / coreLangs.length);
            progressLabel.textContent = `[${i + 1}/${coreLangs.length}] ${label}`;
            progressPct.textContent = `${overallPct}%`;
            progressBar.style.width = `${overallPct}%`;
          });
        }
        setTimeout(async () => {
          progressCard.style.display = 'none';
          await this.loadOcrModelsManager();
        }, 1200);
      } catch (err) {
        alert(`Lỗi khi tải gói cốt lõi: ${err.message}`);
        progressCard.style.display = 'none';
      }
    };

    // Attach Check Updates Button
    document.getElementById('optBtnCheckOcrUpdates').onclick = async () => {
      const updates = await OcrEngine.checkForUpdates();
      if (updates.length === 0) {
        alert('Tất cả các Model OCR đều đang ở phiên bản mới nhất!');
      } else {
        alert(`Đã tìm thấy ${updates.length} bản cập nhật mới! Đang tiến hành đồng bộ...`);
      }
    };
  }

  async loadProvidersAndKeys() {
    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const dict = getOptionsI18n(uiLanguage);
    const container = document.getElementById('optKeysContainer');

    container.innerHTML = '';
    if (apiConfigs.length === 0) {
      container.innerHTML = `
        <div class="opt-card" style="text-align:center; padding:32px; color:#64748b;">
          ${dict.subheadingProviders || 'Chưa có API Key nào được thêm. Nhấn "Thêm Model & Key" ở trên để bắt đầu sử dụng hoàn toàn miễn phí.'}
        </div>
      `;
    } else {
      apiConfigs.forEach((cfg) => {
        container.appendChild(this.createKeyCard(cfg, false, dict));
      });
    }

    const addBtn = document.getElementById('optBtnAddKey');
    addBtn.onclick = () => {
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
      container.appendChild(this.createKeyCard(newConfig, true, dict));
    };
  }

  createKeyCard(cfg, isNew = false, dict = null) {
    const d = dict || getOptionsI18n();
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
        <button class="opt-btn-secondary card-delete" style="color:#ef4444; padding:4px 8px; font-size:12px;" title="${d.ocrDeleteBtn || 'Xóa'}">
          ${Icons.trash(14)} ${d.ocrDeleteBtn || 'Xóa'}
        </button>
      </div>

      <div class="opt-key-grid">
        <select class="opt-select card-provider">${providerOptions}</select>
        <select class="opt-select card-model">${modelOptions}</select>
        <input type="password" class="opt-input card-key" placeholder="${d.keyPlaceholder || 'Nhập API Key'} (sk-... / AIza...)" value="${cfg.apiKey || ''}">
      </div>

      <div class="opt-key-actions">
        <div style="font-size:12px; color:#64748b;" class="card-status">
          ${cfg.cooldownUntil && cfg.cooldownUntil > Date.now() ? `${Icons.alertCircle(12)} ${d.cooldownStatus || 'Đang tạm nghỉ'} (${new Date(cfg.cooldownUntil).toLocaleTimeString()})` : (d.statusReady || 'Trạng thái: Sẵn sàng')}
        </div>
        <button class="opt-btn-secondary card-test" style="padding:4px 10px; font-size:12px;">
          ${Icons.refresh(12)} ${d.testConnection || 'Kiểm tra Kết nối'}
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

  showToast(msg) {
    const toast = document.getElementById('optToast');
    if (!toast) return;
    toast.innerHTML = `<span style="display:flex;align-items:center;gap:8px;">${Icons.checkCircle(16)} <span>${msg}</span></span>`;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  async applyLanguageI18n(lang = null) {
    const { uiLanguage = 'vi' } = await Storage.get(['uiLanguage']);
    const currentLang = lang || uiLanguage;
    const dict = getOptionsI18n(currentLang);

    // Sidebar Nav
    const navProviders = document.getElementById('navTextProviders');
    if (navProviders) navProviders.textContent = dict.navProviders;
    const navOcr = document.getElementById('navTextOcr');
    if (navOcr) navOcr.textContent = dict.navOcr;
    const navAppearance = document.getElementById('navTextAppearance');
    if (navAppearance) navAppearance.textContent = dict.navAppearance;
    const navGuide = document.getElementById('navTextGuide');
    if (navGuide) navGuide.textContent = dict.navGuide;
    const navPrompt = document.getElementById('navTextPrompt');
    if (navPrompt) navPrompt.textContent = dict.navPrompt;
    const navGeneral = document.getElementById('navTextGeneral');
    if (navGeneral) navGeneral.textContent = dict.navGeneral;

    // Brand Desc
    const brandDesc = document.querySelector('.opt-brand-desc');
    if (brandDesc) brandDesc.textContent = dict.brandDesc;

    // Providers Tab
    const headingProviders = document.getElementById('optHeadingProviders');
    if (headingProviders) headingProviders.textContent = dict.headingProviders;
    const subheadingProviders = document.getElementById('optSubheadingProviders');
    if (subheadingProviders) subheadingProviders.textContent = dict.subheadingProviders;
    const btnAddKeyText = document.getElementById('optBtnAddKeyText');
    if (btnAddKeyText) btnAddKeyText.textContent = dict.btnAddKey;

    const routingTitle = document.getElementById('optRoutingTitle');
    if (routingTitle) routingTitle.textContent = dict.routingTitle;
    const routingDesc = document.getElementById('optRoutingDesc');
    if (routingDesc) routingDesc.textContent = dict.routingDesc;

    const opt1Title = document.getElementById('optRoutingOpt1Title');
    if (opt1Title) opt1Title.textContent = dict.routingOpt1Title;
    const opt1Desc = document.getElementById('optRoutingOpt1Desc');
    if (opt1Desc) opt1Desc.textContent = dict.routingOpt1Desc;

    const opt2Title = document.getElementById('optRoutingOpt2Title');
    if (opt2Title) opt2Title.textContent = dict.routingOpt2Title;
    const opt2Desc = document.getElementById('optRoutingOpt2Desc');
    if (opt2Desc) opt2Desc.textContent = dict.routingOpt2Desc;

    const opt3Title = document.getElementById('optRoutingOpt3Title');
    if (opt3Title) opt3Title.textContent = dict.routingOpt3Title;
    const opt3Desc = document.getElementById('optRoutingOpt3Desc');
    if (opt3Desc) opt3Desc.textContent = dict.routingOpt3Desc;

    const opt4Title = document.getElementById('optRoutingOpt4Title');
    if (opt4Title) opt4Title.textContent = dict.routingOpt4Title;
    const opt4Desc = document.getElementById('optRoutingOpt4Desc');
    if (opt4Desc) opt4Desc.textContent = dict.routingOpt4Desc;

    const strategyTitle = document.getElementById('optStrategyTitle');
    if (strategyTitle) strategyTitle.textContent = dict.strategyTitle;
    const strategyDesc = document.getElementById('optStrategyDesc');
    if (strategyDesc) strategyDesc.textContent = dict.strategyDesc;

    const nanoTitle = document.getElementById('builtinNanoTitle');
    if (nanoTitle) nanoTitle.textContent = dict.builtinNanoTitle;
    const nanoDesc = document.getElementById('builtinNanoDesc');
    if (nanoDesc) nanoDesc.textContent = dict.builtinNanoDesc;

    const btnFlags = document.getElementById('btnOpenFlagsFromOptions');
    if (btnFlags) btnFlags.textContent = dict.btnOpenFlags;
    const btnTestAi = document.getElementById('btnTestBuiltinAI');
    if (btnTestAi) btnTestAi.textContent = dict.btnTestBuiltinAI;

    // OCR Tab
    const headingOcr = document.getElementById('optHeadingOcr');
    if (headingOcr) headingOcr.textContent = dict.headingOcr;
    const subheadingOcr = document.getElementById('optSubheadingOcr');
    if (subheadingOcr) subheadingOcr.textContent = dict.subheadingOcr;
    const btnCheckOcrUpdatesText = document.getElementById('optBtnCheckOcrUpdatesText');
    if (btnCheckOcrUpdatesText) btnCheckOcrUpdatesText.textContent = dict.btnCheckUpdates;
    const btnDownloadCoreOcrText = document.getElementById('optBtnDownloadCoreOcrText');
    if (btnDownloadCoreOcrText) btnDownloadCoreOcrText.textContent = dict.btnDownloadCore;
    const corePackTitle = document.getElementById('optCorePackTitle');
    if (corePackTitle) corePackTitle.textContent = dict.corePackTitle;
    const corePackBadge = document.getElementById('optCorePackBadge');
    if (corePackBadge) corePackBadge.textContent = dict.corePackBadge;
    const corePackDesc = document.getElementById('optCorePackDesc');
    if (corePackDesc) corePackDesc.textContent = dict.corePackDesc;
    const allOcrTitle = document.getElementById('optAllOcrTitle');
    if (allOcrTitle) allOcrTitle.textContent = dict.allOcrTitle;
    const allOcrSub = document.getElementById('optAllOcrSub');
    if (allOcrSub) allOcrSub.textContent = dict.allOcrSub;

    // Appearance Tab
    const headingAppearance = document.getElementById('optHeadingAppearance');
    if (headingAppearance) headingAppearance.textContent = dict.headingAppearance;
    const subheadingAppearance = document.getElementById('optSubheadingAppearance');
    if (subheadingAppearance) subheadingAppearance.textContent = dict.subheadingAppearance;

    const cardFabTitle = document.getElementById('optCardFabTitle');
    if (cardFabTitle) cardFabTitle.textContent = dict.cardFabTitle;
    const labelFabDisplay = document.getElementById('optLabelFabDisplay');
    if (labelFabDisplay) labelFabDisplay.textContent = dict.labelFabDisplay;
    const labelFabDisplayDesc = document.getElementById('optLabelFabDisplayDesc');
    if (labelFabDisplayDesc) labelFabDisplayDesc.textContent = dict.labelFabDisplayDesc;
    const labelFabSize = document.getElementById('optLabelFabSize');
    if (labelFabSize) labelFabSize.textContent = dict.labelFabSize;
    const labelFabSizeDesc = document.getElementById('optLabelFabSizeDesc');
    if (labelFabSizeDesc) labelFabSizeDesc.textContent = dict.labelFabSizeDesc;
    const optFabOptSmall = document.getElementById('optFabOptSmall');
    if (optFabOptSmall) optFabOptSmall.textContent = dict.fabSizeSmall;
    const optFabOptNormal = document.getElementById('optFabOptNormal');
    if (optFabOptNormal) optFabOptNormal.textContent = dict.fabSizeNormal;
    const optFabOptLarge = document.getElementById('optFabOptLarge');
    if (optFabOptLarge) optFabOptLarge.textContent = dict.fabSizeLarge;

    const cardToolbarTitle = document.getElementById('optCardToolbarTitle');
    if (cardToolbarTitle) cardToolbarTitle.textContent = dict.cardToolbarTitle;
    const labelToolbarTheme = document.getElementById('optLabelToolbarTheme');
    if (labelToolbarTheme) labelToolbarTheme.textContent = dict.labelToolbarTheme;
    const labelToolbarThemeDesc = document.getElementById('optLabelToolbarThemeDesc');
    if (labelToolbarThemeDesc) labelToolbarThemeDesc.textContent = dict.labelToolbarThemeDesc;
    const optThemeOptLight = document.getElementById('optThemeOptLight');
    if (optThemeOptLight) optThemeOptLight.textContent = dict.toolbarThemeLight;
    const optThemeOptDark = document.getElementById('optThemeOptDark');
    if (optThemeOptDark) optThemeOptDark.textContent = dict.toolbarThemeDark;
    const optThemeOptBlue = document.getElementById('optThemeOptBlue');
    if (optThemeOptBlue) optThemeOptBlue.textContent = dict.toolbarThemeBlue;
    const optThemeOptGreen = document.getElementById('optThemeOptGreen');
    if (optThemeOptGreen) optThemeOptGreen.textContent = dict.toolbarThemeGreen;
    const optThemeOptPurple = document.getElementById('optThemeOptPurple');
    if (optThemeOptPurple) optThemeOptPurple.textContent = dict.toolbarThemePurple;

    const labelToolbarText = document.getElementById('optLabelToolbarText');
    if (labelToolbarText) labelToolbarText.textContent = dict.labelToolbarText;
    const labelToolbarTextDesc = document.getElementById('optLabelToolbarTextDesc');
    if (labelToolbarTextDesc) labelToolbarTextDesc.textContent = dict.labelToolbarTextDesc;
    const labelToolbarSize = document.getElementById('optLabelToolbarSize');
    if (labelToolbarSize) labelToolbarSize.textContent = dict.labelToolbarSize;
    const labelToolbarSizeDesc = document.getElementById('optLabelToolbarSizeDesc');
    if (labelToolbarSizeDesc) labelToolbarSizeDesc.textContent = dict.labelToolbarSizeDesc;
    const optSizeOptCompact = document.getElementById('optSizeOptCompact');
    if (optSizeOptCompact) optSizeOptCompact.textContent = dict.toolbarSizeCompact;
    const optSizeOptNormal = document.getElementById('optSizeOptNormal');
    if (optSizeOptNormal) optSizeOptNormal.textContent = dict.toolbarSizeNormal;
    const optSizeOptLarge = document.getElementById('optSizeOptLarge');
    if (optSizeOptLarge) optSizeOptLarge.textContent = dict.toolbarSizeLarge;

    const labelToolbarOpacity = document.getElementById('optLabelToolbarOpacity');
    if (labelToolbarOpacity) labelToolbarOpacity.textContent = dict.labelToolbarOpacity;
    const labelToolbarOpacityDesc = document.getElementById('optLabelToolbarOpacityDesc');
    if (labelToolbarOpacityDesc) labelToolbarOpacityDesc.textContent = dict.labelToolbarOpacityDesc;
    const labelToolbarBlur = document.getElementById('optLabelToolbarBlur');
    if (labelToolbarBlur) labelToolbarBlur.textContent = dict.labelToolbarBlur;
    const labelToolbarBlurDesc = document.getElementById('optLabelToolbarBlurDesc');
    if (labelToolbarBlurDesc) labelToolbarBlurDesc.textContent = dict.labelToolbarBlurDesc;

    const cardPopupTitle = document.getElementById('optCardPopupTitle');
    if (cardPopupTitle) cardPopupTitle.textContent = dict.cardPopupTitle;
    const labelPopupOpacity = document.getElementById('optLabelPopupOpacity');
    if (labelPopupOpacity) labelPopupOpacity.textContent = dict.labelPopupOpacity;
    const labelPopupOpacityDesc = document.getElementById('optLabelPopupOpacityDesc');
    if (labelPopupOpacityDesc) labelPopupOpacityDesc.textContent = dict.labelPopupOpacityDesc;
    const labelPopupBlur = document.getElementById('optLabelPopupBlur');
    if (labelPopupBlur) labelPopupBlur.textContent = dict.labelPopupBlur;
    const labelPopupBlurDesc = document.getElementById('optLabelPopupBlurDesc');
    if (labelPopupBlurDesc) labelPopupBlurDesc.textContent = dict.labelPopupBlurDesc;

    const livePreviewBadge = document.getElementById('optLivePreviewBadge');
    if (livePreviewBadge) livePreviewBadge.textContent = dict.livePreviewBadge;
    const livePreviewSub = document.getElementById('optLivePreviewSub');
    if (livePreviewSub) livePreviewSub.textContent = dict.livePreviewSub;

    // Guide Tab
    const headingGuide = document.getElementById('optHeadingGuide');
    if (headingGuide) headingGuide.textContent = dict.headingGuide;
    const subheadingGuide = document.getElementById('optSubheadingGuide');
    if (subheadingGuide) subheadingGuide.textContent = dict.subheadingGuide;
    const optGuideWhyTitle = document.getElementById('optGuideWhyTitle');
    if (optGuideWhyTitle) optGuideWhyTitle.textContent = dict.guideWhyTitle;
    const optGuideWhyItem1 = document.getElementById('optGuideWhyItem1');
    if (optGuideWhyItem1) optGuideWhyItem1.innerHTML = dict.guideWhy1;
    const optGuideWhyItem2 = document.getElementById('optGuideWhyItem2');
    if (optGuideWhyItem2) optGuideWhyItem2.innerHTML = dict.guideWhy2;
    const optGuideWhyItem3 = document.getElementById('optGuideWhyItem3');
    if (optGuideWhyItem3) optGuideWhyItem3.innerHTML = dict.guideWhy3;

    const optGuideHowTitle = document.getElementById('optGuideHowTitle');
    if (optGuideHowTitle) optGuideHowTitle.textContent = dict.guideHowTitle;
    const optGuideHowItem1 = document.getElementById('optGuideHowItem1');
    if (optGuideHowItem1) optGuideHowItem1.innerHTML = dict.guideHow1;
    const optGuideHowItem2 = document.getElementById('optGuideHowItem2');
    if (optGuideHowItem2) optGuideHowItem2.innerHTML = dict.guideHow2;
    const optGuideHowItem3 = document.getElementById('optGuideHowItem3');
    if (optGuideHowItem3) optGuideHowItem3.innerHTML = dict.guideHow3;

    const optGuideLinksTitle = document.getElementById('optGuideLinksTitle');
    if (optGuideLinksTitle) optGuideLinksTitle.textContent = dict.guideLinksTitle;

    const linkSubGemini = document.getElementById('optLinkSubGemini');
    if (linkSubGemini) linkSubGemini.textContent = dict.linkSubGemini;
    const linkSubGroq = document.getElementById('optLinkSubGroq');
    if (linkSubGroq) linkSubGroq.textContent = dict.linkSubGroq;
    const linkSubOpenAI = document.getElementById('optLinkSubOpenAI');
    if (linkSubOpenAI) linkSubOpenAI.textContent = dict.linkSubOpenAI;
    const linkSubDeepSeek = document.getElementById('optLinkSubDeepSeek');
    if (linkSubDeepSeek) linkSubDeepSeek.textContent = dict.linkSubDeepSeek;
    const linkSubClaude = document.getElementById('optLinkSubClaude');
    if (linkSubClaude) linkSubClaude.textContent = dict.linkSubClaude;

    const linkBtnGeminiSpan = document.querySelector('#optLinkBtnGemini span:first-child');
    if (linkBtnGeminiSpan) linkBtnGeminiSpan.textContent = dict.getKeyGemini;
    const linkBtnGroqSpan = document.querySelector('#optLinkBtnGroq span:first-child');
    if (linkBtnGroqSpan) linkBtnGroqSpan.textContent = dict.getKeyGroq;
    const linkBtnOpenAISpan = document.querySelector('#optLinkBtnOpenAI span:first-child');
    if (linkBtnOpenAISpan) linkBtnOpenAISpan.textContent = dict.getKeyOpenAI;
    const linkBtnDeepSeekSpan = document.querySelector('#optLinkBtnDeepSeek span:first-child');
    if (linkBtnDeepSeekSpan) linkBtnDeepSeekSpan.textContent = dict.getKeyDeepSeek;
    const linkBtnClaudeSpan = document.querySelector('#optLinkBtnClaude span:first-child');
    if (linkBtnClaudeSpan) linkBtnClaudeSpan.textContent = dict.getKeyClaude;

    // Prompt Tab
    const headingPrompt = document.getElementById('optHeadingPrompt');
    if (headingPrompt) headingPrompt.textContent = dict.headingPrompt;
    const subheadingPrompt = document.getElementById('optSubheadingPrompt');
    if (subheadingPrompt) subheadingPrompt.textContent = dict.subheadingPrompt;
    const btnResetPrompt = document.getElementById('optBtnResetPrompt');
    if (btnResetPrompt) btnResetPrompt.textContent = dict.btnResetPrompt;
    const btnSavePrompt = document.getElementById('optBtnSavePrompt');
    if (btnSavePrompt) btnSavePrompt.textContent = dict.btnSavePrompt;

    // General Tab
    const headingGen = document.getElementById('optHeadingGeneral');
    if (headingGen) headingGen.textContent = dict.headingGeneral;
    const subheadingGen = document.getElementById('optSubheadingGeneral');
    if (subheadingGen) subheadingGen.textContent = dict.subheadingGeneral;

    const cardLangTitle = document.getElementById('optCardLangTitle');
    if (cardLangTitle) cardLangTitle.textContent = currentLang === 'vi' ? 'Cài đặt Ngôn ngữ (Language Settings)' : 'Language Settings';
    const uiLangTitle = document.getElementById('optUiLangTitle');
    if (uiLangTitle) uiLangTitle.textContent = dict.uiLangTitle;
    const uiLangDesc = document.getElementById('optUiLangDesc');
    if (uiLangDesc) uiLangDesc.textContent = dict.uiLangDesc;

    const respLangTitle = document.getElementById('optRespLangTitle');
    if (respLangTitle) respLangTitle.textContent = dict.respLangTitle;
    const respLangDesc = document.getElementById('optRespLangDesc');
    if (respLangDesc) respLangDesc.textContent = dict.respLangDesc;

    const formsTitle = document.getElementById('optFormsTitle');
    if (formsTitle) formsTitle.textContent = dict.formsTitle;
    const formsDesc = document.getElementById('optFormsDesc');
    if (formsDesc) formsDesc.textContent = dict.formsDesc;

    const tooltipTitle = document.getElementById('optTooltipTitle');
    if (tooltipTitle) tooltipTitle.textContent = dict.tooltipTitle;
    const tooltipDesc = document.getElementById('optTooltipDesc');
    if (tooltipDesc) tooltipDesc.textContent = dict.tooltipDesc;

    const disabledSitesTitle = document.getElementById('optDisabledSitesTitle');
    if (disabledSitesTitle) disabledSitesTitle.textContent = dict.disabledSitesTitle;
    const disabledSitesDesc = document.getElementById('optDisabledSitesDesc');
    if (disabledSitesDesc) disabledSitesDesc.textContent = dict.disabledSitesDesc;

    const backupTitle = document.getElementById('optBackupTitle');
    if (backupTitle) backupTitle.textContent = dict.backupTitle;
    const backupDesc = document.getElementById('optBackupDesc');
    if (backupDesc) backupDesc.textContent = dict.backupDesc;

    const btnExport = document.getElementById('optBtnExport');
    if (btnExport) btnExport.textContent = dict.btnExport;
    const btnClearData = document.getElementById('optBtnClearData');
    if (btnClearData) btnClearData.textContent = dict.btnClearData;

    const aboutTitle = document.getElementById('optAboutTitle');
    if (aboutTitle) aboutTitle.textContent = dict.aboutTitle;
    const aboutDesc = document.getElementById('optAboutDesc');
    if (aboutDesc) aboutDesc.textContent = dict.aboutDesc;

    // Refresh dynamic lists
    await this.loadProvidersAndKeys();
    await this.loadOcrModelsManager();
  }

  async loadSystemPrompt() {
    const { systemPrompt, uiLanguage = 'vi' } = await Storage.get(['systemPrompt', 'uiLanguage']);
    const textarea = document.getElementById('optSystemPromptTextarea');
    textarea.value = systemPrompt || DEFAULT_SETTINGS.systemPrompt;

    document.getElementById('optBtnSavePrompt').addEventListener('click', async () => {
      await Storage.set({ systemPrompt: textarea.value });
      const dict = getOptionsI18n(uiLanguage);
      this.showToast(dict.toastPromptSaved || 'Đã lưu System Prompt thành công!');
    });

    document.getElementById('optBtnResetPrompt').addEventListener('click', async () => {
      textarea.value = DEFAULT_SETTINGS.systemPrompt;
      await Storage.set({ systemPrompt: DEFAULT_SETTINGS.systemPrompt });
    });
  }

  async loadGeneralSettings() {
    const { enableFormsAdapter = true, enableTextTooltip = true, uiLanguage = 'vi', outputLanguage = 'en', disabledSites = [] } = await Storage.get();

    const uiLangSelect = document.getElementById('optUiLanguageSelect');
    if (uiLangSelect) {
      const uiLangs = SUPPORTED_LANGUAGES.filter((l) => l.id !== 'auto');
      uiLangSelect.innerHTML = uiLangs.map(
        (l) => `<option value="${l.id}" ${l.id === uiLanguage ? 'selected' : ''}>${l.name}</option>`
      ).join('');
      uiLangSelect.addEventListener('change', async () => {
        const newLang = uiLangSelect.value;
        await Storage.set({ uiLanguage: newLang });
        await this.applyLanguageI18n(newLang);
        const dict = getOptionsI18n(newLang);
        this.showToast(dict.toastLangUpdated);
      });
    }

    const langSelect = document.getElementById('optOutputLanguageSelect');
    if (langSelect) {
      langSelect.innerHTML = SUPPORTED_LANGUAGES.map(
        (l) => `<option value="${l.id}" ${l.id === outputLanguage ? 'selected' : ''}>${l.name}</option>`
      ).join('');
      langSelect.addEventListener('change', async () => {
        await Storage.set({ outputLanguage: langSelect.value });
        const dict = getOptionsI18n(uiLangSelect?.value || 'vi');
        this.showToast(dict.toastLangUpdated);
      });
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
      const dict = getOptionsI18n(uiLanguage);
      disabledContainer.innerHTML = `<div style="font-size:12px; color:#94a3b8;">${dict.noDisabledSites || 'Chưa có website nào bị tắt.'}</div>`;
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
      const { uiLanguage: curLang = 'vi' } = await Storage.get(['uiLanguage']);
      const dict = getOptionsI18n(curLang);
      if (confirm(curLang === 'vi' ? 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử Chat không?' : 'Are you sure you want to clear all chat history?')) {
        await Storage.clearChatHistory();
        this.showToast(dict.toastDataCleared);
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
