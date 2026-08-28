/**
 * Chrome Built-in AI (Gemini Nano) availability normalization.
 * Shared between the background service worker, the page MAIN-world bridge,
 * the sidepanel, and the Options page — every context that needs to know
 * whether Nano is ready, still needs downloading, or isn't supported here.
 */

export const NANO_STATUS = {
  UNAVAILABLE: 'unavailable',
  DOWNLOADABLE: 'downloadable',
  DOWNLOADING: 'downloading',
  AVAILABLE: 'available',
};

/**
 * Maps both the legacy capabilities() vocabulary ('readily'/'after-download'/'no',
 * or a {available|availability} object) and the current availability() strings
 * ('available'/'downloadable'/'downloading'/'unavailable') onto NANO_STATUS.
 */
export function normalizeAvailability(raw) {
  const value = (raw && typeof raw === 'object') ? (raw.availability || raw.available) : raw;

  switch (value) {
    case 'available':
    case 'readily':
      return NANO_STATUS.AVAILABLE;
    case 'downloadable':
      return NANO_STATUS.DOWNLOADABLE;
    case 'downloading':
    case 'after-download':
      return NANO_STATUS.DOWNLOADING;
    case 'unavailable':
    case 'no':
      return NANO_STATUS.UNAVAILABLE;
    default:
      return NANO_STATUS.UNAVAILABLE;
  }
}

/**
 * aiModel is whatever a getAiModel()-style lookup found (ai.languageModel /
 * LanguageModel / chrome.aiOriginTrial.languageModel). Prefers availability()
 * (current API, pure read), falls back to capabilities() (legacy), and never
 * throws — an error here just means "we can't tell, treat as unavailable".
 */
export async function checkNanoAvailability(aiModel) {
  if (!aiModel) return NANO_STATUS.UNAVAILABLE;

  try {
    if (typeof aiModel.availability === 'function') {
      return normalizeAvailability(await aiModel.availability());
    }
    if (typeof aiModel.capabilities === 'function') {
      return normalizeAvailability(await aiModel.capabilities());
    }
    // Ancient shape: only create() exists, no way to probe first — optimistic.
    if (typeof aiModel.create === 'function') {
      return NANO_STATUS.AVAILABLE;
    }
    return NANO_STATUS.UNAVAILABLE;
  } catch (err) {
    return NANO_STATUS.UNAVAILABLE;
  }
}
