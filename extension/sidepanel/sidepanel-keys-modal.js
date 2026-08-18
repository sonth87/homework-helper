/**
 * Model & API Key Configuration Modal for SidePanel
 */

import { Icons } from "../shared/icons.js";
import { Storage, DEFAULT_PROVIDERS } from "../shared/storage.js";
import { getI18n } from "../shared/i18n.js";
import { detectLocalModels, prettifyModelName, looksLikeEmbeddingModel, looksLikeVisionModel } from "../shared/local-model-detect.js";

const isLocalProvider = (provider) => provider === "ollama" || provider === "lmstudio";

const LOCAL_DEFAULT_BASE_URLS = {
  lmstudio: "http://127.0.0.1:1234",
  ollama: "http://127.0.0.1:11434",
};

export class SidePanelKeysModal {
  constructor(controller) {
    this.controller = controller;
    this.localModelType = "lmstudio";
    this.localDiscoveredModels = [];
  }

  async open() {
    const modal = document.getElementById("spModal");
    const body = document.getElementById("spModalBody");
    if (!modal || !body) return;

    modal.style.display = "flex";

    const { apiConfigs = [] } = await Storage.getApiConfigs();
    const { uiLanguage = "en" } = await Storage.get(["uiLanguage"]);
    const dict = getI18n(uiLanguage);

    body.innerHTML = `
      <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">
        ${dict.modalConfigDesc || "Add one or more API Keys. The extension automatically load-balances and falls back to backup keys when hitting rate limits."}
      </div>

      <!-- Chrome Built-in AI Gemini Nano Guide Section in Modal -->
      <div style="margin-top: 8px; padding: 10px; background: rgba(2, 132, 199, 0.08); border-radius: 8px; border: 1px solid rgba(2, 132, 199, 0.25);">
        <div style="font-weight: 700; font-size: 12.5px; color: #0284c7; display:flex; align-items:center; gap:6px;">
          ${Icons.cpu(14)} ${dict.modalNanoTitle || "Chrome Gemini Nano (Local AI)"}
        </div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-top:4px; line-height:1.5;">
          ${dict.modalNanoDesc || "On-Device AI running offline. Click links below to open flags directly:"}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
          <button class="sp-copy-btn" id="spModalBtnFlagPrompt" style="background:#0284c7; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${dict.modalBtnFlagPrompt || "1. Open #prompt-api"}
          </button>
          <button class="sp-copy-btn" id="spModalBtnFlagOptGuide" style="background:#0284c7; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${dict.modalBtnFlagOptGuide || "2. Open #optimization-guide"}
          </button>
          <button class="sp-copy-btn" id="spModalBtnComponents" style="background:#0369a1; color:#fff; font-size:11px; padding:4px 8px;">
            ${Icons.externalLink(11)} ${dict.modalBtnComponents || "3. Open components"}
          </button>
        </div>
      </div>

      <div id="spModalKeyList" style="display:flex; flex-direction:column; gap:10px; margin-top:8px;"></div>

      <button class="sp-btn-add" id="spBtnAddKey">${Icons.plus(16)} ${dict.modalBtnAddKey || "Add Model & Key"}</button>
      <button class="sp-btn-add" id="spBtnAddLocalModel" style="border-color:#16a34a; background:rgba(22,163,74,0.06); color:#16a34a;">${Icons.server(16)} ${dict.btnAddLocalModel || "Add Local Model"}</button>

      <!-- Local AI Server (Ollama / LM Studio) Config Panel -->
      <div id="spLocalModelPanel" style="display:none; border:1px solid rgba(22,163,74,0.3); border-radius:10px; padding:10px; background:rgba(22,163,74,0.05); flex-direction:column; gap:8px;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="flex:1; font-size:12.5px; font-weight:700; color:#16a34a;">${dict.localPanelTitle || "Connect Local AI Server"}</span>
          <button type="button" class="sp-icon-btn" id="spLocalBtnClose" title="${dict.localBtnCancel || "Cancel"}" style="width:24px; height:24px;">${Icons.x(14)}</button>
        </div>

        <div style="display:flex; gap:6px;" id="spLocalTypeToggle">
          <button type="button" class="sp-copy-btn sp-local-type-btn active" data-type="lmstudio" style="font-size:11px; padding:4px 8px;">LM Studio</button>
          <button type="button" class="sp-copy-btn sp-local-type-btn" data-type="ollama" style="font-size:11px; padding:4px 8px;">Ollama</button>
        </div>

        <div style="display:flex; gap:6px; align-items:center;">
          <input type="text" class="sp-field" id="spLocalBaseUrl" style="flex:1;" placeholder="http://127.0.0.1:1234" value="http://127.0.0.1:1234">
          <button type="button" class="opt-local-ping-btn" id="spLocalBtnPing" title="${dict.localBtnPing || "Test Connection"}">
            <span id="spLocalStatusIcon">${Icons.check(15)}</span>
          </button>
        </div>

        <div id="spLocalStatusText" style="font-size:11px; color:var(--text-muted); line-height:1.4;"></div>
        <div id="spLocalModelsList" style="display:flex; flex-direction:column; gap:4px;"></div>

        <div id="spLocalPanelFooter" style="display:none; justify-content:flex-end; gap:8px;">
          <button type="button" class="sp-icon-btn" id="spLocalBtnCancel" style="width:auto; padding:4px 10px; font-size:11px;">${dict.localBtnCancel || "Cancel"}</button>
          <button type="button" class="sp-copy-btn" id="spLocalBtnAddSelected" style="font-size:11px; padding:4px 10px; background:#16a34a;">${dict.localBtnAddSelected || "Add Selected"}</button>
        </div>
      </div>

      <div style="text-align:right; margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
        <a href="#" id="spLinkLocalGuide" style="font-size:12px; color:#16a34a; text-decoration:none;">
          ${dict.localGuideLinkText || "Local Model setup guide →"}
        </a>
        <a href="#" id="spLinkFullOptions" style="font-size:12px; color:var(--accent); text-decoration:none;">
          ${dict.modalLinkGuide || "View free API key guide →"}
        </a>
      </div>
    `;

    body
      .querySelector("#spModalBtnFlagPrompt")
      ?.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          action: "OPEN_CHROME_FLAGS",
          url: "chrome://flags/#prompt-api-for-gemini-nano",
        });
      });

    body
      .querySelector("#spModalBtnFlagOptGuide")
      ?.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          action: "OPEN_CHROME_FLAGS",
          url: "chrome://flags/#optimization-guide-on-device-model",
        });
      });

    body
      .querySelector("#spModalBtnComponents")
      ?.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          action: "OPEN_CHROME_FLAGS",
          url: "chrome://components",
        });
      });

    const list = body.querySelector("#spModalKeyList");
    apiConfigs.forEach((cfg) => {
      const item = isLocalProvider(cfg.provider)
        ? this.renderLocalKeyItem(cfg, dict)
        : this.renderKeyItem(cfg, false, dict);
      list.appendChild(item);
    });

    body.querySelector("#spBtnAddKey").addEventListener("click", () => {
      const newCfg = {
        id: `cfg_${Date.now()}`,
        provider: "gemini",
        name: "Google Gemini",
        model: "gemini-3.7-flash",
        apiKey: "",
        isEnabled: true,
      };
      list.appendChild(this.renderKeyItem(newCfg, true, dict));
    });

    body.querySelector("#spLinkFullOptions").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });

    body.querySelector("#spLinkLocalGuide")?.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({
        url: `${chrome.runtime.getURL("options/options.html")}#local-model-guide`,
      });
    });

    this.initLocalModelPanel(body, dict);
  }

  // =======================================================
  // Local AI Server (Ollama / LM Studio) Add-Model Panel
  // =======================================================
  initLocalModelPanel(body, dict) {
    const openBtn = body.querySelector("#spBtnAddLocalModel");
    const panel = body.querySelector("#spLocalModelPanel");
    const baseUrlInput = body.querySelector("#spLocalBaseUrl");
    const pingBtn = body.querySelector("#spLocalBtnPing");
    const typeBtns = body.querySelectorAll("#spLocalTypeToggle .sp-local-type-btn");
    const cancelBtn = body.querySelector("#spLocalBtnCancel");
    const closeBtn = body.querySelector("#spLocalBtnClose");
    const addBtn = body.querySelector("#spLocalBtnAddSelected");
    if (!openBtn || !panel || !baseUrlInput) return;

    const closePanel = () => {
      panel.style.display = "none";
      this.resetLocalModelResults(body);
    };

    openBtn.addEventListener("click", () => {
      const willOpen = panel.style.display === "none";
      panel.style.display = willOpen ? "flex" : "none";
      if (willOpen) baseUrlInput.focus();
      else this.resetLocalModelResults(body);
    });

    closeBtn?.addEventListener("click", closePanel);

    typeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-type");
        this.localModelType = type;
        typeBtns.forEach((b) => b.classList.toggle("active", b === btn));

        const otherDefault = Object.values(LOCAL_DEFAULT_BASE_URLS).find(
          (u) => u === baseUrlInput.value.trim(),
        );
        if (!baseUrlInput.value.trim() || otherDefault) {
          baseUrlInput.value = LOCAL_DEFAULT_BASE_URLS[type];
        }
        this.resetLocalModelResults(body);
      });
    });

    baseUrlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.pingLocalServer(body, dict);
    });

    pingBtn?.addEventListener("click", () => this.pingLocalServer(body, dict));

    cancelBtn?.addEventListener("click", closePanel);

    addBtn?.addEventListener("click", () => this.addSelectedLocalModels(body, dict));
  }

  resetLocalModelResults(body) {
    this.localDiscoveredModels = [];
    const list = body.querySelector("#spLocalModelsList");
    const footer = body.querySelector("#spLocalPanelFooter");
    const statusText = body.querySelector("#spLocalStatusText");
    const pingBtn = body.querySelector("#spLocalBtnPing");
    const statusIcon = body.querySelector("#spLocalStatusIcon");
    if (list) list.innerHTML = "";
    if (footer) footer.style.display = "none";
    if (statusText) statusText.textContent = "";
    if (pingBtn) pingBtn.className = "opt-local-ping-btn";
    if (statusIcon) statusIcon.innerHTML = Icons.check(15);
  }

  async pingLocalServer(body, dict) {
    const d = dict || getI18n();
    const baseUrlInput = body.querySelector("#spLocalBaseUrl");
    const pingBtn = body.querySelector("#spLocalBtnPing");
    const statusIcon = body.querySelector("#spLocalStatusIcon");
    const statusText = body.querySelector("#spLocalStatusText");
    const list = body.querySelector("#spLocalModelsList");
    const footer = body.querySelector("#spLocalPanelFooter");
    if (!baseUrlInput) return;

    const baseUrl = baseUrlInput.value.trim();
    pingBtn.className = "opt-local-ping-btn checking";
    statusIcon.innerHTML = Icons.refresh(15);
    list.innerHTML = "";
    footer.style.display = "none";
    statusText.textContent = "";

    const result = await detectLocalModels(this.localModelType, baseUrl);

    if (!result.ok) {
      pingBtn.className = "opt-local-ping-btn offline";
      statusIcon.innerHTML = Icons.x(15);
      statusText.innerHTML = `<span style="color:#ef4444;">${d.localStatusOffline || "Could not connect to this server."}</span>`;
      this.localDiscoveredModels = [];
      return;
    }

    pingBtn.className = "opt-local-ping-btn online";
    statusIcon.innerHTML = Icons.check(15);
    this.localDiscoveredModels = result.models;

    if (result.models.length === 0) {
      const emptyMsg =
        this.localModelType === "ollama"
          ? d.localNoModelsOllama || "No models downloaded yet."
          : d.localNoModelsLmstudio || "No model is currently running.";
      statusText.innerHTML = `<span style="color:#d97706;">${d.localStatusOnlineEmpty || "Connected but no model is loaded yet."}</span><br>${emptyMsg}`;
      return;
    }

    statusText.innerHTML = `<span style="color:#16a34a;">${(d.localStatusOnline || "Connected! Found {count} model(s).").replace("{count}", result.models.length)}</span>`;

    list.innerHTML = result.models
      .map((m, idx) => {
        const pretty = prettifyModelName(m.id);
        const showRawId = pretty !== m.id;
        const capabilityTag = m.isEmbedding
          ? `<span style="font-size:9px; font-weight:700; color:#d97706; background:rgba(217,119,6,0.12); padding:1px 5px; border-radius:6px;">${d.localEmbeddingTag || "Embedding"}</span>`
          : m.isVision
            ? `<span style="font-size:9px; font-weight:700; color:#0284c7; background:rgba(2,132,199,0.12); padding:1px 5px; border-radius:6px;">${d.localVisionTag || "Vision"}</span>`
            : `<span style="font-size:9px; font-weight:700; color:#64748b; background:rgba(100,116,139,0.12); padding:1px 5px; border-radius:6px;">${d.localTextOnlyTag || "Text only"}</span>`;
        return `
        <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; padding:5px 8px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-secondary); ${m.isEmbedding ? "opacity:0.6;" : ""}">
          <input type="checkbox" class="sp-local-model-check" value="${idx}" ${m.isEmbedding ? "disabled" : "checked"}>
          <span style="display:flex; flex-direction:column;">
            <span>${pretty} ${capabilityTag}</span>
            ${showRawId ? `<span style="font-size:10px; color:var(--text-muted);">${m.id}</span>` : ""}
            ${m.isEmbedding ? `<span style="font-size:10px; color:#d97706;">${d.localEmbeddingWarning || "Embedding model — cannot answer questions."}</span>` : ""}
            ${!m.isEmbedding && !m.isVision ? `<span style="font-size:10px; color:var(--text-muted);">${d.localTextOnlyHint || "No direct image support — screenshots are OCR-extracted to text before sending."}</span>` : ""}
          </span>
        </label>
      `;
      })
      .join("");
    footer.style.display = "flex";
  }

  async addSelectedLocalModels(body, dict) {
    const d = dict || getI18n();
    const baseUrlInput = body.querySelector("#spLocalBaseUrl");
    const panel = body.querySelector("#spLocalModelPanel");
    const checks = body.querySelectorAll(".sp-local-model-check:checked");
    if (!baseUrlInput || checks.length === 0) return;

    // ai-engine.js calls `${baseUrl}/chat/completions` directly, so the
    // stored baseUrl must already carry the OpenAI-compatible /v1 suffix.
    const baseUrl = `${baseUrlInput.value.trim().replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`;
    const providerName =
      this.localModelType === "ollama" ? "Ollama (Local AI)" : "LM Studio (Local AI)";

    const list = body.querySelector("#spModalKeyList");
    for (const check of checks) {
      const model = this.localDiscoveredModels[Number(check.value)];
      if (!model || model.isEmbedding) continue;
      const newCfg = {
        id: `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        provider: this.localModelType,
        name: providerName,
        model: model.id,
        baseUrl,
        apiKey: "",
        isEnabled: true,
        isVision: model.isVision,
        ocrFallback: true,
      };
      await Storage.saveApiConfig(newCfg);
      list?.appendChild(this.renderLocalKeyItem(newCfg, d));
    }

    this.controller.updateModelBadge();
    if (panel) panel.style.display = "none";
    this.resetLocalModelResults(body);
  }

  // Local models (Ollama / LM Studio) get their own compact row instead of
  // the generic cloud-provider form — no API key, no provider/model
  // dropdowns; the baseUrl+model were already chosen via the ping flow.
  renderLocalKeyItem(cfg, dict = null) {
    const d = dict || getI18n();
    const el = document.createElement("div");
    el.className = "sp-local-key-item";

    const providerLabel = cfg.provider === "ollama" ? "Ollama" : "LM Studio";
    const prettyName = prettifyModelName(cfg.model);
    const embeddingWarning = looksLikeEmbeddingModel(cfg.model);
    const isVision = cfg.isVision !== undefined ? cfg.isVision : looksLikeVisionModel(cfg.model);
    const ocrFallbackOn = cfg.ocrFallback !== false;

    // Backfill isVision for configs saved before this field existed, so
    // ai-engine.js's OCR-fallback routing (which only trusts a persisted
    // `isVision === false`) sees the same capability the card is showing.
    if (cfg.isVision === undefined) {
      Storage.saveApiConfig({ id: cfg.id, isVision });
    }

    el.innerHTML = `
      <label class="sp-local-key-toggle">
        <input type="checkbox" class="cfg-enabled" ${cfg.isEnabled ? "checked" : ""}>
      </label>
      <div class="sp-local-key-icon">${Icons.server(16)}</div>
      <div class="sp-local-key-info">
        <div class="sp-local-key-title-row">
          <span class="sp-local-key-badge">${providerLabel}</span>
          <span class="sp-local-key-name">${prettyName}</span>
          ${isVision ? `<span style="font-size:9px; font-weight:700; color:#0284c7; background:rgba(2,132,199,0.12); padding:1px 5px; border-radius:6px;">${d.localVisionTag || "Vision"}</span>` : `<span style="font-size:9px; font-weight:700; color:#64748b; background:rgba(100,116,139,0.12); padding:1px 5px; border-radius:6px;">${d.localTextOnlyTag || "Text only"}</span>`}
        </div>
        <div class="sp-local-key-meta">${cfg.model} &middot; ${cfg.baseUrl || ""}</div>
        ${embeddingWarning ? `<div style="font-size:10px; color:#d97706; margin-top:2px;">${Icons.alertCircle(10)} ${d.localEmbeddingCardWarning || "Embedding model — cannot answer questions. Delete and add a chat model instead."}</div>` : ""}
        ${!embeddingWarning && !isVision ? `
          <label style="display:flex; align-items:center; gap:5px; font-size:10px; color:var(--text-muted); margin-top:3px; cursor:pointer;">
            <input type="checkbox" class="cfg-ocr-fallback" style="width:12px; height:12px;" ${ocrFallbackOn ? "checked" : ""}>
            <span>${d.localOcrFallbackToggle || "Auto-OCR screenshots into text before sending"}</span>
          </label>
        ` : ""}
        <div class="sp-local-key-status cfg-status"></div>
      </div>
      <div class="sp-local-key-actions">
        <button class="sp-icon-btn cfg-test" title="${d.testConnection || "Test Connection"}">${Icons.refresh(14)}</button>
        <button class="sp-icon-btn cfg-delete" style="color:#ef4444;" title="${d.deleteKey || "Delete"}">${Icons.trash(14)}</button>
      </div>
    `;

    const enabledInput = el.querySelector(".cfg-enabled");
    const ocrFallbackInput = el.querySelector(".cfg-ocr-fallback");
    const statusText = el.querySelector(".cfg-status");

    enabledInput.addEventListener("change", async () => {
      await Storage.saveApiConfig({ id: cfg.id, isEnabled: enabledInput.checked });
      this.controller.updateModelBadge();
    });

    ocrFallbackInput?.addEventListener("change", async () => {
      await Storage.saveApiConfig({ id: cfg.id, ocrFallback: ocrFallbackInput.checked });
    });

    el.querySelector(".cfg-delete").addEventListener("click", async () => {
      await Storage.removeApiConfig(cfg.id);
      el.remove();
      this.controller.updateModelBadge();
    });

    el.querySelector(".cfg-test").addEventListener("click", () => {
      statusText.textContent = d.testingConnection || "Testing...";
      chrome.runtime.sendMessage(
        {
          action: "ASK_AI",
          payload: { prompt: 'Reply "Connected OK"', preferredConfigId: cfg.id },
        },
        (res) => {
          if (res?.success) {
            statusText.innerHTML = `<span style="color:#16a34a;">${Icons.check(11)} ${d.keyValid || "Working"}</span>`;
          } else {
            statusText.innerHTML = `<span style="color:#ef4444;">${res?.error || d.keyInvalid || "Connection failed"}</span>`;
          }
        },
      );
    });

    return el;
  }

  renderKeyItem(cfg, isNew = false, dict = null) {
    const d = dict || getI18n();
    const el = document.createElement("div");
    el.style.cssText =
      "border:1px solid var(--border-color); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; background:var(--bg-secondary);";

    const providerOptions = DEFAULT_PROVIDERS.map(
      (p) =>
        `<option value="${p.id}" ${cfg.provider === p.id ? "selected" : ""}>${p.name}</option>`,
    ).join("");

    const providerObj =
      DEFAULT_PROVIDERS.find((p) => p.id === cfg.provider) ||
      DEFAULT_PROVIDERS[0];
    
    const isCustomModel =
      !providerObj.models.some((m) => m.id === cfg.model) ||
      cfg.model === "__custom__";

    const modelOptions =
      providerObj.models
        .map(
          (m) =>
            `<option value="${m.id}" ${cfg.model === m.id ? "selected" : ""}>${m.name}</option>`,
        )
        .join("") +
      `<option value="__custom__" ${isCustomModel ? "selected" : ""}>✏️ ${d.customModelOption || "Tự điền model (Custom)..."}</option>`;

    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label style="display:flex; align-items:center; gap:6px; font-weight:600; font-size:13px;">
          <input type="checkbox" class="cfg-enabled" ${cfg.isEnabled ? "checked" : ""}>
          <span>${providerObj.name}</span>
        </label>
        <button class="sp-icon-btn cfg-delete" style="color:#ef4444;">${Icons.trash(14)}</button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <select class="sp-field cfg-provider">${providerOptions}</select>
        <select class="sp-field cfg-model">${modelOptions}</select>
      </div>

      <input type="text" class="sp-field cfg-custom-model" placeholder="${d.customModelPlaceholder || "Nhập tên/mã model (vd: gemini-3.5-pro, gpt-5, claude-4...)"}" value="${isCustomModel && cfg.model !== "__custom__" ? cfg.model : ""}" style="margin-top:2px; ${isCustomModel ? "display:block;" : "display:none;"}">

      <input type="text" class="sp-field cfg-base-url" placeholder="${providerObj.defaultBaseUrl || "Base URL (http://localhost:...)"}" value="${cfg.baseUrl || (providerObj.requiresBaseUrl ? providerObj.defaultBaseUrl : "")}" style="margin-top:2px; ${providerObj.requiresBaseUrl ? "display:block;" : "display:none;"}">

      <input type="password" class="sp-field cfg-key" placeholder="${providerObj.requiresKey === false ? "API Key (Không bắt buộc cho Local AI)" : (d.modalKeyPlaceholder || "Enter API Key")}" value="${cfg.apiKey || ""}">
    `;

    const providerSelect = el.querySelector(".cfg-provider");
    const modelSelect = el.querySelector(".cfg-model");
    const customModelInput = el.querySelector(".cfg-custom-model");
    const baseUrlInput = el.querySelector(".cfg-base-url");
    const keyInput = el.querySelector(".cfg-key");
    const enabledInput = el.querySelector(".cfg-enabled");

    const getSelectedModel = () => {
      if (modelSelect.value === "__custom__") {
        return customModelInput.value.trim() || "__custom__";
      }
      return modelSelect.value;
    };

    const save = async () => {
      await Storage.saveApiConfig({
        id: cfg.id,
        provider: providerSelect.value,
        model: getSelectedModel(),
        baseUrl: baseUrlInput.value.trim(),
        apiKey: keyInput.value.trim(),
        isEnabled: enabledInput.checked,
      });
      this.controller.updateModelBadge();
    };

    const updateCustomModelVisibility = () => {
      if (modelSelect.value === "__custom__") {
        customModelInput.style.display = "block";
        customModelInput.focus();
      } else {
        customModelInput.style.display = "none";
      }
    };

    providerSelect.addEventListener("change", () => {
      const pObj =
        DEFAULT_PROVIDERS.find((p) => p.id === providerSelect.value) ||
        DEFAULT_PROVIDERS[0];
      modelSelect.innerHTML =
        pObj.models
          .map((m) => `<option value="${m.id}">${m.name}</option>`)
          .join("") +
        `<option value="__custom__">✏️ ${d.customModelOption || "Tự điền model (Custom)..."}</option>`;

      if (pObj.requiresBaseUrl) {
        baseUrlInput.style.display = "block";
        baseUrlInput.placeholder = pObj.defaultBaseUrl || "http://localhost:...";
        if (!baseUrlInput.value) baseUrlInput.value = pObj.defaultBaseUrl || "";
      } else {
        baseUrlInput.style.display = "none";
      }

      keyInput.placeholder = pObj.requiresKey === false ? "API Key (Không bắt buộc cho Local AI)" : (d.modalKeyPlaceholder || "Enter API Key");

      updateCustomModelVisibility();
      save();
    });

    modelSelect.addEventListener("change", () => {
      updateCustomModelVisibility();
      save();
    });

    customModelInput.addEventListener("input", save);
    baseUrlInput.addEventListener("input", save);
    keyInput.addEventListener("input", save);
    enabledInput.addEventListener("change", save);

    el.querySelector(".cfg-delete").addEventListener("click", async () => {
      await Storage.removeApiConfig(cfg.id);
      el.remove();
      this.controller.updateModelBadge();
    });

    if (isNew) save();
    return el;
  }
}
