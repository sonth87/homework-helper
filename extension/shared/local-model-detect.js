/**
 * Local AI Server Discovery
 * Pings a local Ollama / LM Studio (or other OpenAI-compatible) server and
 * lists the models it currently serves. Used by the "Add Local Model" flow
 * so users don't have to type model IDs by hand.
 */

const PING_TIMEOUT_MS = 4000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeBaseUrl(rawBaseUrl) {
  const trimmed = (rawBaseUrl || '').trim().replace(/\/+$/, '');
  const root = trimmed.replace(/\/v1$/, '');
  const v1 = trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
  return { root, v1 };
}

// Chat/vision requests will silently fail (or return garbage) against an
// embedding-only model, which is otherwise indistinguishable from a normal
// chat model in a plain id list. Used as a fallback when we can't get
// authoritative type info (see fetchModelTypes below).
const EMBEDDING_NAME_HINT = /embed|bge-|bce-|e5-|gte-|minilm/i;

// Common local multimodal/vision-language model families. Best-effort only —
// used as a fallback when we don't have LM Studio's authoritative "vlm" type.
const VISION_NAME_HINT = /vision|[-_]vl[-_0-9]|[-_]vl$|\bllava|bakllava|moondream|minicpm-v|cogvlm|internvl|pixtral|paligemma|idefics|fuyu|yi-vl|deepseek-vl|glm-4v|xcomposer|florence|multimodal/i;

/**
 * Best-effort lookup of each model's real type (llm / vlm / embeddings) via
 * LM Studio's richer REST API. Not available on Ollama or older LM Studio
 * builds — failures here are silently ignored and callers fall back to
 * EMBEDDING_NAME_HINT.
 * @returns {Promise<Record<string, string>>} id -> type
 */
async function fetchModelTypes(root) {
  try {
    const data = await fetchJson(`${root}/api/v0/models`);
    const map = {};
    (data.data || []).forEach((m) => {
      if (m.id) map[m.id] = m.type;
    });
    return map;
  } catch (e) {
    return {};
  }
}

function isLikelyEmbeddingModel(id, typeMap) {
  const type = typeMap[id];
  if (type) return type === 'embeddings' || type === 'embedding';
  return EMBEDDING_NAME_HINT.test(id);
}

function isLikelyVisionModel(id, typeMap) {
  const type = typeMap[id];
  if (type) return type === 'vlm';
  return VISION_NAME_HINT.test(id);
}

/**
 * Name-only heuristic, for flagging already-saved configs where we don't
 * have a live /api/v0/models type lookup to confirm against.
 * @param {string} id
 * @returns {boolean}
 */
export function looksLikeEmbeddingModel(id) {
  return EMBEDDING_NAME_HINT.test(id || '');
}

/**
 * Name-only heuristic for vision/multimodal capability on an already-saved
 * config (no live server round-trip). Ollama never exposes a type field for
 * this, and LM Studio's authoritative check only runs during the ping/add
 * flow — this is the best we can do after the fact.
 * @param {string} id
 * @returns {boolean}
 */
export function looksLikeVisionModel(id) {
  return VISION_NAME_HINT.test(id || '');
}

/**
 * @param {'ollama'|'lmstudio'} type
 * @param {string} rawBaseUrl
 * @returns {Promise<{ok: boolean, models: {id: string, isEmbedding: boolean, isVision: boolean}[], error?: string}>}
 */
export async function detectLocalModels(type, rawBaseUrl) {
  if (!rawBaseUrl || !rawBaseUrl.trim()) {
    return { ok: false, models: [], error: 'missing_base_url' };
  }
  const { root, v1 } = normalizeBaseUrl(rawBaseUrl);

  let ids;
  if (type === 'ollama') {
    try {
      const data = await fetchJson(`${root}/api/tags`);
      ids = (data.models || []).map((m) => m.name || m.model).filter(Boolean);
    } catch (e) {
      // Older/newer Ollama builds also expose an OpenAI-compatible /v1/models
      try {
        const data = await fetchJson(`${v1}/models`);
        ids = (data.data || []).map((m) => m.id).filter(Boolean);
      } catch (e2) {
        return { ok: false, models: [], error: e2.message || e.message };
      }
    }
  } else {
    // lmstudio / generic OpenAI-compatible local server
    try {
      const data = await fetchJson(`${v1}/models`);
      ids = (data.data || []).map((m) => m.id).filter(Boolean);
    } catch (e) {
      return { ok: false, models: [], error: e.message };
    }
  }

  const typeMap = await fetchModelTypes(root);
  const models = ids.map((id) => ({
    id,
    isEmbedding: isLikelyEmbeddingModel(id, typeMap),
    isVision: isLikelyVisionModel(id, typeMap),
  }));
  return { ok: true, models };
}

// Well-known model family names, capitalized the way people actually write them.
const KNOWN_NAME_CASING = {
  deepseek: 'DeepSeek', llama: 'Llama', qwen: 'Qwen', mistral: 'Mistral',
  phi: 'Phi', gemma: 'Gemma', codellama: 'CodeLlama', starcoder: 'StarCoder',
  wizardlm: 'WizardLM', vicuna: 'Vicuna', falcon: 'Falcon', nomic: 'Nomic',
  bge: 'BGE', minilm: 'MiniLM', mixtral: 'Mixtral', openchat: 'OpenChat',
  yi: 'Yi', embed: 'Embed', instruct: 'Instruct', chat: 'Chat', text: 'Text',
  coder: 'Coder', math: 'Math', vision: 'Vision', mini: 'Mini', gguf: 'GGUF',
};

/**
 * Turns a raw local model id (e.g. "text-embedding-nomic-embed-text-v1.5")
 * into a human-friendly display name (e.g. "Nomic Embed Text v1.5").
 * Best-effort heuristic — the raw id is what actually gets saved/used.
 * @param {string} rawId
 * @returns {string}
 */
export function prettifyModelName(rawId) {
  if (!rawId) return rawId;
  let name = rawId;

  // Strip HF-style "publisher/repo" prefix
  if (name.includes('/')) name = name.split('/').pop();
  // Strip LM Studio quantization suffix, e.g. "...@q4_k_m"
  name = name.replace(/@.+$/, '');
  // Common prefix that reads better dropped
  name = name.replace(/^text-embedding-/i, '');

  const tokens = name.split(/[-_:]+/).filter(Boolean);
  if (tokens.length === 0) return rawId;

  const prettyTokens = tokens.map((tok) => {
    // Version numbers like "v1.5" or "3.5"
    if (/^v?\d+(\.\d+)*$/i.test(tok)) {
      return tok[0].toLowerCase() === 'v' ? `v${tok.slice(1)}` : tok;
    }
    // Size tokens like "8b", "70b", "8x7b"
    if (/^\d+(x\d+)?[bmk]$/i.test(tok)) {
      return tok.slice(0, -1) + tok.slice(-1).toUpperCase();
    }
    const lower = tok.toLowerCase();
    if (KNOWN_NAME_CASING[lower]) return KNOWN_NAME_CASING[lower];
    return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
  });

  return prettyTokens.join(' ');
}
