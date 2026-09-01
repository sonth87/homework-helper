/**
 * Bản dịch tiếng Tây Ban Nha.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'Idioma',
  groupAi: 'IA y modelos',
  groupPrivacy: 'Privacidad',
  groupSystem: 'Sistema',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'Idioma de la interfaz',
  setUiLanguageDesc: 'Idioma de la propia aplicación: menús, etiquetas y mensajes.',
  setOutputLanguage: 'Idioma de las respuestas',
  setOutputLanguageDesc: 'Idioma en el que la IA escribe sus respuestas. Independiente del idioma de la interfaz.',
  setTranslateTarget: 'Traducir a',
  setTranslateTargetDesc: 'Idioma de destino predeterminado al traducir con el cursor.',
  setTranslateProviders: 'Servicios de traducción',
  setTranslateProvidersDesc: 'Orden en que se prueban al traducir al pasar el cursor — cambia automáticamente al siguiente si uno falla.',
  translateProviderGoogle: 'Google Translate',
  translateProviderBing: 'Bing Translator',
  translateProviderMymemory: 'MyMemory',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'Detección automática',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'Estrategia de enrutamiento',
  setRoutingStrategyDesc: 'Qué modelo usar primero al responder.',
  routingPreferConfig: 'Preferir claves configuradas',
  routingPreferLocal: 'Preferir modelos locales',
  routingLocalOnly: 'Solo modelos locales',
  routingConfigOnly: 'Solo claves configuradas',

  setRotationStrategy: 'Rotación de claves',
  setRotationStrategyDesc: 'Cómo elegir entre varias claves activas.',
  rotationRoundRobin: 'Por turnos',
  rotationRandom: 'Aleatoria',
  rotationFallback: 'Cambiar solo si hay error',

  setRequestTimeout: 'Tiempo de espera',
  setRequestTimeoutDesc: 'Los modelos de razonamiento pueden permanecer en silencio mucho tiempo antes de la primera palabra.',
  setMaxRetries: 'Reintentos máximos',
  setMaxRetriesDesc: 'Cuántas claves probar antes de rendirse.',
  setThinkingEnabled: 'Activar razonamiento',
  setThinkingEnabledDesc: 'Permite que los modelos compatibles razonen antes de responder. Más lento, pero más preciso.',
  setMaxRequestsPerMinute: 'Límite de peticiones por minuto',
  setMaxRequestsPerMinuteDesc: 'Red de seguridad frente a costes inesperados. Las peticiones que superen el límite se rechazan.',
  setMonthlyTokenBudget: 'Presupuesto mensual de tokens',
  setMonthlyTokenBudgetDesc: 'Avisa cuando el uso se acerque a esta cifra. 0 significa sin límite.',
  setOllamaBaseUrl: 'Dirección de Ollama',
  setLmStudioBaseUrl: 'Dirección de LM Studio',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'Aplicaciones excluidas',
  setExcludedAppsDesc: 'La aplicación nunca lee la pantalla mientras estos programas están en primer plano.',
  setPauseWhenScreenSharing: 'Pausar al compartir pantalla',
  setPauseWhenScreenSharingDesc: 'Oculta todas las superposiciones durante una grabación o pantalla compartida.',
  setPauseOnSensitiveApps: 'Pausar en aplicaciones sensibles',
  setPauseOnSensitiveAppsDesc: 'Se detiene automáticamente cuando un gestor de contraseñas o una app bancaria está en primer plano.',
  setLocalModelsOnly: 'Solo modelos locales',
  setLocalModelsOnlyDesc: 'Nunca envía texto ni imágenes a un servicio en la nube. Nada sale de este equipo.',
  setSaveHistory: 'Guardar historial de conversaciones',
  setSaveHistoryDesc: 'Conserva preguntas y respuestas anteriores para poder volver a ellas.',
  setHistoryRetention: 'Borrar el historial después de',
  setHistoryRetentionDesc: 'Días que se conserva el historial. 0 significa conservarlo siempre.',
  setTelemetry: 'Enviar datos de uso anónimos',
  setTelemetryDesc: 'Ayuda a mejorar la aplicación. Nunca incluye el contenido de la pantalla ni tus preguntas.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'Iniciar al arrancar sesión',
  setLaunchAtLoginDesc: 'Abre la aplicación automáticamente al iniciar sesión.',
  setHideFromDock: 'Ocultar del Dock',
  setHideFromDockDesc: 'Funciona solo desde la barra de menús, sin icono en el Dock ni en la barra de tareas.',
  setAutoUpdate: 'Actualizar automáticamente',
  setAutoUpdateDesc: 'Descarga e instala las versiones nuevas en segundo plano.',
  setUpdateChannel: 'Canal de actualizaciones',
  setUpdateChannelDesc: 'El canal Beta recibe novedades antes, con más probabilidad de fallos.',
  channelStable: 'Estable', channelBeta: 'Beta',
  setLogLevel: 'Nivel de registro',
  setLogLevelDesc: 'Súbelo al informar de un problema para que los registros incluyan más detalle.',
  logError: 'Solo errores', logWarn: 'Avisos', logInfo: 'Normal', logDebug: 'Detallado',
  setDebugOverlay: 'Superposición de depuración',
  setDebugOverlayDesc: 'Dibuja recuadros alrededor del texto detectado. Útil al informar de problemas de reconocimiento.',

  // ── Xin quyền hệ thống (onboarding) ────────────────────────────────────────
  onboardingTitle: 'Permisos del sistema',
  onboardingIntro: 'Homework Helper necesita dos permisos de macOS para traducir y resolver problemas en cualquier parte de la pantalla. Ambos son obligatorios — sin alguno de ellos, la app no puede leer el contenido de la pantalla.',
  onboardingAccessibilityTitle: 'Accesibilidad (Accessibility)',
  onboardingAccessibilityDesc: 'Permite que la app lea el texto bajo el cursor para traducirlo al instante — la vía rápida usada en la mayoría de apps.',
  onboardingScreenTitle: 'Grabación de pantalla (Screen Recording)',
  onboardingScreenDesc: 'Permite que la app capture la pantalla — se usa para Recortar y resolver, y como alternativa cuando no se puede leer el texto directamente (PDF, algunos editores).',
  onboardingGranted: 'Concedido',
  onboardingNotGranted: 'No concedido',
  onboardingOpenPane: 'Abrir Ajustes del Sistema',
  onboardingNeedsRestart: 'Permisos concedidos. Reinicia la app para que surtan efecto — macOS no aplica permisos nuevos a un proceso que ya se está ejecutando.',
  onboardingRelaunch: 'Reiniciar ahora',
  onboardingSkip: 'Más tarde',
  onboardingReopenLabel: 'Permisos del sistema',
  onboardingReopenDesc: 'Revisa o vuelve a conceder los permisos que necesita Homework Helper.',
  onboardingReopenButton: 'Revisar',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'Traducir',
  intentSolve: 'Resolver',
  intentSummarize: 'Resumir',
  intentExplain: 'Explicar',
  intentRewrite: 'Reescribir',
  intentChat: 'Chat',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'Atajos',
  setHotkeys: 'Atajos globales',
  setHotkeysDesc: 'Teclas que funcionan desde cualquier aplicación. Déjalo vacío para desactivar un atajo.',

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'Proveedores de IA y claves',
  setApiConfigs: 'Modelos configurados',
  keysAdd: 'Añadir modelo',
  keysEmpty: 'Aún no hay modelos configurados. Añade uno para empezar.',
  keysTest: 'Probar conexión',
  keysTesting: 'Probando…',
  keysOk: 'Conectado',
  keysRemove: 'Quitar',
  keysKeySaved: 'Clave guardada',
  keysKeyPlaceholder: 'Pega la clave de API',
  keysGetKey: 'Obtener clave',
  keysNoKeyNeeded: 'Sin clave — se ejecuta en tu equipo',
  keysModel: 'Modelo',
  keysBaseUrl: 'Dirección',
  keysLabel: 'Nombre',
  keysEnabled: 'Activado',
  keysVision: 'Lee imágenes',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: 'Tareas',
  setStudyMode: 'Modo de estudio predeterminado',
  setStudyModeDesc: 'Cómo responde la IA por defecto. Puedes cambiarlo en cada respuesta.',
  modeStepByStep: 'Paso a paso',
  modeDirect: 'Solo la respuesta',
  modeHint: 'Pistas, sin respuesta',
  modeExplain: 'Explicación a fondo',
  modeTranslate: 'Traducción académica',

  // ── Lưu trữ ───────────────────────────────────────────────────────────────
  groupStorage: 'Almacenamiento',
  setMaxConversations: 'Conversaciones a conservar',
  setMaxConversationsDesc: 'Las conversaciones más antiguas se eliminan al superar este límite.',
  setCacheTtl: 'Vigencia de la caché de traducción',
  setCacheTtlDesc: 'Días que una traducción en caché sigue siendo válida.',

  // ── Dịch khi rê chuột ─────────────────────────────────────────────────────
  groupAcquisition: 'Traducción al pasar el cursor',
  setHoverEnabled: 'Activar traducción al pasar el cursor',
  setHoverEnabledDesc: 'Muestra una traducción al pasar el cursor sobre cualquier texto en pantalla.',
  setClipboardWatcher: 'Activar monitor del portapapeles',
  setClipboardWatcherDesc: 'Muestra una barra de acciones flotante (Traducir / Resumir / Explicar / Reescribir) cada vez que copies texto en cualquier parte de la pantalla.',
  setHoverDelay: 'Retraso de activación',
  setHoverDelayDesc: 'Tiempo que el cursor debe permanecer quieto antes de buscar la traducción.',
  setHoverTolerance: 'Tolerancia de movimiento',
  setHoverToleranceDesc: 'Un ligero temblor dentro de este radio sigue contando como quieto.',
  setHoverModifiers: 'Teclas de activación',
  setHoverModifiersDesc: 'Teclas que deben mantenerse pulsadas. Déjalo vacío para activar solo con el cursor.',
  modCommand: 'Command',
  modControl: 'Control',
  modOption: 'Option',
  modShift: 'Shift',

  // ── Mức chi tiết hover ────────────────────────────────────────────────────
  setHoverGranularity: 'Nivel de detalle',
  setHoverGranularityDesc: 'Cuánto texto traducir a la vez.',
  granWord: 'Palabra',
  granSentence: 'Oración',
  granParagraph: 'Párrafo',
} as const satisfies Dictionary;
