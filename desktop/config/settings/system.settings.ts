import { defineSettings } from './define';

export const systemSettings = defineSettings('system', 'groupSystem', {
  launchAtLogin: {
    type: 'boolean', default: false,
    i18n: 'setLaunchAtLogin', i18nDesc: 'setLaunchAtLoginDesc',
  },
  hideFromDock: {
    type: 'boolean', default: false,
    i18n: 'setHideFromDock', i18nDesc: 'setHideFromDockDesc',
  },
  autoUpdate: {
    type: 'boolean', default: true,
    i18n: 'setAutoUpdate', i18nDesc: 'setAutoUpdateDesc',
  },
  updateChannel: {
    type: 'enum', default: 'stable',
    options: [
      { value: 'stable', i18n: 'channelStable' },
      { value: 'beta', i18n: 'channelBeta' },
    ],
    i18n: 'setUpdateChannel', i18nDesc: 'setUpdateChannelDesc',
  },
  logLevel: {
    type: 'enum', default: 'info',
    options: [
      { value: 'error', i18n: 'logError' }, { value: 'warn', i18n: 'logWarn' },
      { value: 'info', i18n: 'logInfo' }, { value: 'debug', i18n: 'logDebug' },
    ],
    i18n: 'setLogLevel', i18nDesc: 'setLogLevelDesc',
  },
  debugOverlay: {
    type: 'boolean', default: false,
    i18n: 'setDebugOverlay', i18nDesc: 'setDebugOverlayDesc',
  },
} as const);
