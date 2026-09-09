/**
 * Multi-Provider & Multi-Key Round-Robin Engine
 * Manages load balancing, key rotation, rate-limit cooldowns, and automatic failovers.
 */

import { Storage } from '../shared/storage.js';

class KeyRotator {
  constructor() {
    this.currentIndexes = new Map(); // key: provider+model -> current index
  }

  /**
   * Get all active and healthy API configurations
   */
  async getHealthyConfigs(preferredConfigId = null) {
    const { apiConfigs = [], activeConfigId, rotationStrategy } = await Storage.getApiConfigs();
    const now = Date.now();

    // Filter enabled configs and check cooldowns
    const available = apiConfigs.filter((cfg) => {
      const isKeyRequired = cfg.provider !== 'ollama' && cfg.provider !== 'lmstudio' && cfg.provider !== 'chrome-builtin';
      if (!cfg.isEnabled || (isKeyRequired && !cfg.apiKey)) return false;
      if (cfg.cooldownUntil && cfg.cooldownUntil > now) {
        return false; // Still in cooldown
      }
      return true;
    });

    if (available.length === 0) {
      // Fallback to Chrome Built-in Gemini Nano (Local On-Device)
      const builtinConfig = {
        id: 'chrome_builtin_nano',
        provider: 'chrome-builtin',
        name: 'Chrome Gemini Nano (Local)',
        model: 'gemini-nano',
        apiKey: '',
        isEnabled: true,
        isBuiltin: true,
      };
      return { config: builtinConfig, strategy: 'chrome-builtin-fallback', totalAvailable: 1 };
    }

    // If specific config requested and available
    const targetId = preferredConfigId || activeConfigId;
    if (targetId && targetId !== 'auto') {
      const matched = available.find((c) => c.id === targetId);
      if (matched) {
        return { config: matched, strategy: 'single', totalAvailable: available.length };
      }
    }

    // Apply rotation strategy across available pool
    if (rotationStrategy === 'random') {
      const randomIndex = Math.floor(Math.random() * available.length);
      return { config: available[randomIndex], strategy: 'random', totalAvailable: available.length };
    }

    // Default: Round-Robin
    const groupKey = 'global_round_robin';
    const lastIndex = this.currentIndexes.get(groupKey) || 0;
    const nextIndex = (lastIndex + 1) % available.length;
    this.currentIndexes.set(groupKey, nextIndex);

    return { config: available[nextIndex], strategy: 'round-robin', totalAvailable: available.length };
  }

  /**
   * Record a rate-limit (429) or temporary server error for a key
   */
  async reportFailure(configId, statusCode = 429) {
    const { apiConfigs = [] } = await Storage.get(['apiConfigs']);
    const now = Date.now();
    const cooldownDuration = statusCode === 429 ? 60 * 1000 : 30 * 1000; // 60s for rate limit, 30s for server error
    // Only 401/403 unambiguously mean "this key/config itself is bad" — a
    // 429 (rate limit) or a 5xx/network hiccup says nothing about whether
    // the key works, so those must never flip an untested config's Test
    // Connection badge to red on their own.
    const isAuthFailure = statusCode === 401 || statusCode === 403;

    const updated = apiConfigs.map((cfg) => {
      if (cfg.id === configId) {
        return {
          ...cfg,
          failureCount: (cfg.failureCount || 0) + 1,
          cooldownUntil: now + cooldownDuration,
          lastError: `HTTP ${statusCode} at ${new Date().toLocaleTimeString()}`,
          // Only set from real usage while the config has never been tested
          // (see reportSuccess below for the other half of this contract) —
          // once a status exists (from a manual test or a prior real
          // failure/success), only editing the config or re-testing changes
          // it again.
          ...(isAuthFailure && !cfg.connectionStatus ? { connectionStatus: 'invalid' } : {}),
        };
      }
      return cfg;
    });

    await Storage.set({ apiConfigs: updated });
    console.warn(`[KeyRotator] Key ${configId} placed in cooldown until ${new Date(now + cooldownDuration).toLocaleTimeString()}`);
  }

  /**
   * Record successful use of a key
   */
  async reportSuccess(configId) {
    const { apiConfigs = [] } = await Storage.get(['apiConfigs']);
    const now = Date.now();

    const updated = apiConfigs.map((cfg) => {
      if (cfg.id === configId) {
        return {
          ...cfg,
          failureCount: 0,
          cooldownUntil: 0,
          lastUsed: now,
          // A real successful reply is proof enough regardless of error
          // type — unlike the failure side there's no ambiguous case here.
          ...(cfg.connectionStatus ? {} : { connectionStatus: 'valid' }),
        };
      }
      return cfg;
    });

    await Storage.set({ apiConfigs: updated });
  }
}

export const keyRotator = new KeyRotator();
