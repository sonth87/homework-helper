import { Icons } from '../../shared/icons.js';
import { Storage } from '../../shared/storage.js';
import { OCR_MODEL_CATALOG, OcrEngine, getLocalizedModelName, getLocalizedModelDescription } from '../../shared/ocr-engine.js';
import { getOptionsI18n } from '../../shared/i18n.js';

export class OcrTab {
  constructor(optionsController) {
    this.controller = optionsController;
  }

  async init() {
    await this.loadOcrModelsManager();
  }

  async loadOcrModelsManager() {
    const container = document.getElementById('ocrModelsListContainer');
    if (!container) return;

    const { installedModels = {}, uiLanguage = 'en' } = await Storage.get(['installedModels', 'uiLanguage']);
    const dict = getOptionsI18n(uiLanguage);

    container.innerHTML = '';
    OCR_MODEL_CATALOG.forEach((model) => {
      const isInstalled = !!installedModels[model.lang]?.isInstalled || model.isBundled;
      const installedVer = installedModels[model.lang]?.version || model.version;

      const row = document.createElement('div');
      row.className = 'opt-ocr-item';

      let statusBadge = '';
      if (model.isBundled) {
        statusBadge = `<span class="opt-preview-badge" style="background:#ecfdf5; color:#059669;">${(dict.ocrBuiltinBadge || 'Built-in v{version}').replace('{version}', installedVer)}</span>`;
      } else if (isInstalled) {
        statusBadge = `<span class="opt-preview-badge" style="background:#ecfdf5; color:#059669;">${dict.ocrInstalled || 'Installed'} v${installedVer}</span>`;
      } else {
        statusBadge = `<span class="opt-preview-badge" style="background:#f1f5f9; color:#64748b;">${dict.ocrNotInstalled || 'Not Installed'}</span>`;
      }

      const localizedName = getLocalizedModelName(model, uiLanguage, dict);
      const localizedDesc = getLocalizedModelDescription(model, uiLanguage, dict);

      row.innerHTML = `
        <div class="opt-ocr-info">
          <div class="opt-ocr-title-row">
            <strong style="font-size:13.5px; color:#0f172a;">${localizedName} (${model.nativeName})</strong>
            <span style="font-size:11px; padding:1px 6px; border-radius:4px; background:#f1f5f9; color:#475569; font-weight:600;">${model.size}</span>
            ${statusBadge}
          </div>
          <p style="font-size:12px; color:#64748b; margin-top:3px; text-align:left;">${localizedDesc}</p>
        </div>

        <div class="opt-ocr-actions">
          ${
            !isInstalled
              ? `<button class="opt-btn-secondary btn-download-model" data-lang="${model.lang}" style="padding:6px 14px; font-size:12px; display:flex; align-items:center; gap:5px; white-space:nowrap;">
                  ${Icons.download(13)} ${dict.ocrDownloadBtn || 'Download'}
                </button>`
              : `<button class="opt-btn-secondary btn-delete-model" data-lang="${model.lang}" style="padding:6px 10px; font-size:12px; color:#ef4444; display:flex; align-items:center;" ${model.isBundled ? `disabled title="${dict.ocrCoreBuiltinTitle || 'Core built-in package'}"` : `title="${dict.ocrDeleteBtn || 'Delete'}"`}>
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
        btn.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> ${dict.ocrDownloading || 'Downloading...'}`;

        const progressCard = document.getElementById('ocrProgressCard');
        const progressLabel = document.getElementById('ocrProgressLabel');
        const progressPct = document.getElementById('ocrProgressPct');
        const progressBar = document.getElementById('ocrProgressBar');
        if (progressCard) progressCard.style.display = 'block';

        try {
          await OcrEngine.downloadModel(lang, (pct, label) => {
            if (progressLabel) progressLabel.textContent = label;
            if (progressPct) progressPct.textContent = `${pct}%`;
            if (progressBar) progressBar.style.width = `${pct}%`;
          });
          setTimeout(async () => {
            if (progressCard) progressCard.style.display = 'none';
            await this.loadOcrModelsManager();
          }, 1200);
        } catch (err) {
          alert((dict.ocrDownloadFailed || 'Download failed: {error}').replace('{error}', err.message));
          if (progressCard) progressCard.style.display = 'none';
          await this.loadOcrModelsManager();
        }
      });
    });

    // Attach Delete Handlers
    container.querySelectorAll('.btn-delete-model').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const lang = btn.getAttribute('data-lang');
        if (confirm(`${dict.ocrConfirmDelete || 'Are you sure you want to delete this language model from local cache?'}`)) {
          await OcrEngine.deleteModel(lang);
          await this.loadOcrModelsManager();
        }
      });
    });

    // Attach Download Core Pack Button
    const btnDownloadCore = document.getElementById('optBtnDownloadCoreOcr');
    if (btnDownloadCore) {
      btnDownloadCore.onclick = async () => {
        // 'equ' (Math & Symbols) has no LSTM-compatible traineddata on the CDN
        // (404) and is never used for recognition (see ocr-engine.js
        // getCompositeLanguage) — only 'vie'/'eng' can actually be fetched/updated.
        const coreLangs = ['vie', 'eng'];
        const progressCard = document.getElementById('ocrProgressCard');
        const progressLabel = document.getElementById('ocrProgressLabel');
        const progressPct = document.getElementById('ocrProgressPct');
        const progressBar = document.getElementById('ocrProgressBar');
        if (progressCard) progressCard.style.display = 'block';

        try {
          for (let i = 0; i < coreLangs.length; i++) {
            const l = coreLangs[i];
            await OcrEngine.downloadModel(l, (pct, label) => {
              const overallPct = Math.round(((i * 100) + pct) / coreLangs.length);
              if (progressLabel) progressLabel.textContent = `[${i + 1}/${coreLangs.length}] ${label}`;
              if (progressPct) progressPct.textContent = `${overallPct}%`;
              if (progressBar) progressBar.style.width = `${overallPct}%`;
            });
          }
          setTimeout(async () => {
            if (progressCard) progressCard.style.display = 'none';
            await this.loadOcrModelsManager();
          }, 1200);
        } catch (err) {
          alert((dict.ocrCoreDownloadError || 'Error downloading core pack: {error}').replace('{error}', err.message));
          if (progressCard) progressCard.style.display = 'none';
        }
      };
    }

    // Attach Check Updates Button
    const btnCheckUpdates = document.getElementById('optBtnCheckOcrUpdates');
    if (btnCheckUpdates) {
      btnCheckUpdates.onclick = async () => {
        const updates = await OcrEngine.checkForUpdates();
        if (updates.length === 0) {
          alert(dict.ocrAllUpToDate || 'All OCR Models are currently up to date!');
        } else {
          alert((dict.ocrUpdatesFound || 'Found {count} new update(s)! Syncing...').replace('{count}', updates.length));
        }
      };
    }
  }
}
