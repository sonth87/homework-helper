/**
 * Model & API Key Configuration Modal for SidePanel
 */

import { Icons } from "../shared/icons.js";
import { Storage } from "../shared/storage.js";
import { getI18n } from "../shared/i18n.js";
import { isLocalProvider, createKeyCard, createLocalKeyCard, wireLocalModelPanel } from "../shared/api-config-ui.js";

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
          <span style="font-size:12.5px; font-weight:700; color:#16a34a;">${dict.localPanelTitle || "Connect Local AI Server"}</span>
          <span style="display:inline-flex; cursor:help; color:#16a34a;" data-tooltip-title="${dict.localPanelHelpTitle || "Picking the right local model"}" data-tooltip-desc="${dict.localPanelHelpDesc || ""}">${Icons.helpCircle(13)}</span>
          <span style="flex:1;"></span>
          <button type="button" class="sp-icon-btn" id="spLocalBtnClose" title="${dict.localBtnCancel || "Cancel"}" style="width:24px; height:24px;">${Icons.x(14)}</button>
        </div>

        <div style="display:flex; gap:6px;" id="spLocalTypeToggle">
          <button type="button" class="opt-local-type-btn active" data-type="lmstudio">LM Studio</button>
          <button type="button" class="opt-local-type-btn" data-type="ollama">Ollama</button>
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
    const onChange = () => this.controller.updateModelBadge();

    apiConfigs.forEach((cfg) => {
      const item = isLocalProvider(cfg.provider)
        ? createLocalKeyCard(cfg, { dict, variant: "sidepanel", onChange })
        : createKeyCard(cfg, { isNew: false, dict, variant: "sidepanel", onChange });
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
      list.appendChild(createKeyCard(newCfg, { isNew: true, dict, variant: "sidepanel", onChange }));
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

    wireLocalModelPanel(body, {
      dict,
      variant: "sidepanel",
      state: this,
      onModelsAdded: (newConfigs) => {
        newConfigs.forEach((cfg) => list.appendChild(createLocalKeyCard(cfg, { dict, variant: "sidepanel", onChange })));
        onChange();
      },
    });
  }
}
