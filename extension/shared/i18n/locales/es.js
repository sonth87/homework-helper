export default {
  general: {
    brandTitle: "Homework Helper",
    placeholder: "Escribe tu pregunta o fórmula aquí...",
    shiftEnterHint: "Enter para enviar, Shift+Enter para nueva línea",
    askAiBtn: "Preguntar a la IA",
    captureBtn: "Capturar",
    uploadBtn: "Adjuntar imagen",
    attachedLabel: "Imagen adjunta",
    welcomeText:
      "¡Hola! Soy tu asistente Homework Helper. ¿Qué tarea resolvemos hoy?",
    newChat: "Nuevo chat",
    historyTitle: "Historial de chat",
    modelNanoReady: "Chrome Gemini Nano (Listo en el dispositivo)",
    modelNanoSetup: "Chrome Gemini Nano (Requiere configuración)",
    modelNanoClick: "Clic para ver la guía de activación de Gemini Nano",
    modelAutoRotate: "Rotación automática",
    emptyHistory:
      "No hay conversaciones guardadas.<br>¡Inicia un nuevo chat para comenzar!",
    loadingHistory: "Cargando historial...",
    chips: [
      {
        label: "Ecuación cuadrática",
        query: "Resuelve la ecuación cuadrática ax^2 + bx + c = 0 paso a paso",
      },
      {
        label: "Leyes de Newton",
        query:
          "Explica las tres leyes del movimiento de Newton con ejemplos reales",
      },
      {
        label: "Ecuación química",
        query: "¿Cómo balancear ecuaciones químicas y calcular moles?",
      },
    ],
    modes: {
      "step-by-step": "Paso a paso",
      direct: "Respuesta directa",
      hint: "Pista y guía",
      explain: "Explicación profunda",
      translate: "Traducir",
    },
    cardHeading: "Respuesta detallada",
    nextQuestion: "Siguiente pregunta",
    continueInChat: "Continuar en el chat",
    copyBtn: "Copiar",
    copiedBtn: "¡Copiado!",
    retryBtn: "Reintentar",
    imagePromptHeader:
      "Por favor resuelve y explica esta pregunta de la imagen paso a paso con fórmulas LaTeX ($...$) y resalta la respuesta final:",
    captureSolveText: "Resolver problema de la imagen capturada",
    toastNewChat: "Nueva conversación iniciada",
    chatCleared: "Chat borrado. ¡Haz cualquier pregunta!",
    thinking: "Pensando y resolviendo...",
    tooltips: {
      newChat: {
        title: "Nuevo chat",
        desc: "Inicia una nueva sesión de estudio.",
      },
      history: {
        title: "Historial de chat",
        desc: "Ver conversaciones y soluciones guardadas.",
      },
      lang: {
        title: "Idioma de respuesta de la IA",
        desc: "La IA responderá y explicará en este idioma seleccionado.",
      },
      mode: {
        title: "Modo de resolución",
        desc: "Selecciona el formato: Paso a paso, Respuesta directa, Pistas o Concepto profundo.",
      },
      capture: {
        title: "Captura de pantalla (Alt+C)",
        desc: "Recorta cualquier problema o diagrama en la pantalla para resolverlo al instante.",
      },
      upload: {
        title: "Subir imagen",
        desc: "Adjunta una imagen desde tu ordenador.",
      },
      settings: {
        title: "Modelos y claves API",
        desc: "Configura proveedores de IA y rotación de claves gratuitas.",
      },
      clear: {
        title: "Borrar chat",
        desc: "Elimina todos los mensajes de la sesión actual.",
      },
      options: {
        title: "Configuración completa",
        desc: "Abre la página de configuración para gestionar claves y apariencia.",
      },
      close: {
        title: "Cerrar panel",
        desc: "Oculta el panel en el borde de la pantalla.",
      },
      open: {
        title: "Abrir panel de chat (Alt+K)",
        desc: "Abre el asistente de estudio para resolver tareas y hacer preguntas.",
      },
    },
    modalConfigTitle: "Configuración de modelos y claves API",
    modalConfigDesc:
      "Añade una o más claves API. La extensión balancea la carga automáticamente y cambia a claves de respaldo ante límites de uso.",
    modalNanoTitle: "Chrome Gemini Nano (IA local en el dispositivo)",
    modalNanoDesc:
      "IA en el dispositivo que funciona sin conexión. Haz clic en los enlaces para abrir las opciones directamente:",
    modalBtnFlagPrompt: "1. Abrir #prompt-api",
    modalBtnFlagOptGuide: "2. Abrir #optimization-guide",
    modalBtnComponents: "3. Abrir componentes",
    modalBtnAddKey: "Añadir modelo y clave",
    modalLinkGuide: "Ver guía de claves API gratuitas →",
    modalKeyPlaceholder: "Introduce la clave API (sk-... / AIza...)",
    customModelOption: "Modelo personalizado (Escribir nombre)...",
    customModelPlaceholder: "Ingresa el ID del modelo (ej: gemini-2.5-pro, gpt-5, claude-4...)",
  },
  selectionTooltip: {
    answer: "Resolver",
    copy: "Copiar",
    search: "Buscar",
    translate: "Traducir",
    more: "Más opciones",
    explain: "Explicar",
    summarize: "Resumir",
    grammar: "Corrector gramatical",
    disable: "Desactivar",
    disableSession: "Desactivar hasta la próxima visita",
    disablePage: "Desactivar para esta página",
    disableSite: "Desactivar para este sitio web",
    disableGlobal: "Desactivar globalmente",
    disableFooter: "Puedes reactivar en la configuración",
  },
  cropper: {
    tip: "Haz clic y arrastra para seleccionar el problema o fórmula (ESC para cancelar)",
    cancel: "Cancelar",
    askAi: "Preguntar a la IA",
  },
  floatingPopup: {
    helperTitle: "Asistente Homework Helper",
    translateTitle: "Traducir",
    translateHeading: "Traducción",
    searchTitle: "Buscar y resolver",
    searchHeading: "Resultados y respuesta",
    explainTitle: "Explicación profunda",
    explainHeading: "Explicación",
    summarizeTitle: "Resumen",
    summarizeHeading: "Puntos clave",
    grammarTitle: "Corrector gramatical",
    grammarHeading: "Correcciones y mejoras",
    answerHeading: "Respuesta detallada",
    nextQuestion: "Siguiente pregunta",
    continueInChat: "Continuar en el chat",
    copy: "Copiar",
    copied: "¡Copiado!",
    retry: "Reintentar",
    processing: "Procesando solicitud...",
    solvingStepByStep: "Resolviendo paso a paso con fórmulas KaTeX...",
    scanningOcr: "Escaneando texto y fórmulas con OCR local...",
    autoDetect: "Detección automática",
    historyTitle: "Historial de preguntas",
    historyDesc:
      "Revisa las preguntas resueltas recientemente y las sesiones de estudio.",
    closeTitle: "Cerrar ventana",
    closeDesc: "Cerrar popup de solución",
    addConvTitle: "Nuevo chat",
    addConvDesc: "Iniciar una nueva conversación de estudio.",
    closeHistoryTitle: "Cerrar historial",
    closeHistoryDesc: "Cerrar panel de historial.",
    openInDrawerBtn: "Abrir todo en el panel de chat",
  },
  popup: {
    brandSub: "IA académica sin inicio de sesión",
    openSidePanel: "Abrir panel lateral de IA",
    openSidePanelDesc: "Espacio de trabajo junto a cualquier página",
    cropSolve: "Recortar y resolver (Alt+C)",
    cropSolveDesc: "Selecciona fórmulas o diagramas",
    keysPool: "Claves activas:",
    rotationMode: "Modo de rotación:",
    formsAssistant: "Asistente de Google Forms",
    selectionTooltip: "Barra flotante de selección",
    configureBtn: "Configurar modelos y claves",
  },
  options: {
    navProviders: "Modelos y claves API",
    navOcr: "Modelos OCR locales",
    navAppearance: "Apariencia e interfaz",
    navGuide: "Guía de claves gratuitas",
    navPrompt: "Instrucciones del sistema",
    navGeneral: "Configuración general",
    brandDesc: "IA académica sin inicio de sesión",
    headingProviders: "Modelos de IA y grupo de claves API",
    subheadingProviders:
      "Añade una o más claves API. La extensión equilibra la carga y cambia a claves de respaldo cuando se alcanza el límite.",
    strategyTitle: "Estrategia de rotación",
    strategyDesc:
      "Elige cómo se seleccionan las claves activas durante las solicitudes.",
    statTotal: "Claves configuradas",
    statActive: "Listas y utilizables",
    statCooldown: "En espera (60s)",
    btnAddKey: "Añadir proveedor / clave",
    headingOcr: "Paquetes de modelos OCR locales (Offline)",
    subheadingOcr:
      "Descarga modelos de reconocimiento sin conexión para fórmulas y texto mediante Tesseract.js.",
    btnCheckUpdates: "Buscar actualizaciones",
    btnDownloadCore: "Descargar paquete principal (Español + Inglés)",
    corePackTitle: "Paquete OCR principal integrado",
    corePackBadge: "Recomendado",
    corePackDesc:
      "Alta precisión para caracteres latinos, fórmulas matemáticas, español e inglés.",
    allOcrTitle: "Todos los paquetes de idiomas",
    allOcrSub:
      "Descarga paquetes especializados para reconocimiento sin conexión según sea necesario.",
    headingAppearance: "Personalización de apariencia e interfaz",
    subheadingAppearance:
      "Personaliza los botones flotantes, barra de selección, temas, transparencia y desenfoque.",
    cardFabTitle: "Botones flotantes en la página (FAB)",
    labelFabDisplay: "Mostrar botones flotantes en las páginas",
    descFabDisplay:
      "Muestra botones rápidos en el borde para abrir el chat o capturar preguntas.",
    labelFabSize: "Tamaño del botón flotante",
    cardToolbarTitle: "Barra flotante al seleccionar texto",
    labelToolbarTheme: "Tema de color de la barra",
    labelToolbarText: "Mostrar etiquetas junto a los iconos",
    descToolbarText:
      "Muestra los nombres de acción (Resolver, Copiar, Buscar, Traducir) junto a los iconos.",
    labelToolbarSize: "Tamaño de la barra",
    labelToolbarOpacity: "Opacidad de la barra",
    labelToolbarBlur: "Desenfoque de fondo (Backdrop Blur)",
    cardPopupTitle: "Ventana emergente flotante de solución y traducción",
    labelPopupOpacity: "Opacidad de la ventana",
    labelPopupBlur: "Desenfoque de fondo (Blur)",
    livePreviewBadge: "Simulador en vivo",
    livePreviewSub:
      "Vista previa instantánea del estilo Liquid Glass con tu configuración.",
    headingGuide: "Guía de claves API gratuitas y portales oficiales",
    subheadingGuide:
      "Claves 100% oficiales y gratuitas de los principales proveedores con altos límites de uso.",
    guideWhyTitle: "¿Por qué deberías añadir múltiples claves?",
    guideWhy1:
      "Conmutación por error: Si una clave alcanza el límite (429), pasa a la siguiente inmediatamente.",
    guideWhy2:
      "Equilibrio de carga: Distribuye las solicitudes equitativamente para evitar límites.",
    guideWhy3:
      "Sin coste: Combina cuotas gratuitas de diferentes proveedores en la nube.",
    guideHowTitle: "¿Cómo funciona?",
    guideHow1:
      "Obtén claves gratuitas en portales oficiales (Google AI Studio, Groq, OpenRouter...).",
    guideHow2:
      'Añádelas en la pestaña "Modelos y claves API" y prueba la conexión.',
    guideHow3:
      "La extensión gestiona la rotación automáticamente en segundo plano.",
    guideLinksTitle: "Portales oficiales de claves gratuitas",
    linkSubGemini:
      "15 RPM gratis, velocidad ultrarrápida y potente análisis visual de problemas.",
    linkSubGroq:
      "Inferencia ultrarrápida (500+ tokens/s), compatible con Llama 3 y DeepSeek.",
    linkSubOpenAI: "Referencia en razonamiento académico y lógica rigurosa.",
    linkSubDeepSeek: "Modelo líder en matemáticas y código abierto.",
    linkSubClaude: "Excelente comprensión de diagramas y razonamiento claro.",
    headingPrompt: "Instrucciones del sistema y estilo de resolución",
    subheadingPrompt:
      "Personaliza instrucciones del sistema dedicadas para modelos Cloud y modelos On-Device locales.",
    cardCloudPromptTitle:
      "1. Instrucciones para modelos Cloud (Gemini, OpenAI, Claude, DeepSeek)",
    cardCloudPromptDesc:
      "Optimizado para modelos de cientos de miles de millones de parámetros, análisis pedagógico profundo, LaTeX y visión.",
    cardNanoPromptTitle:
      "2. Instrucciones para Chrome Gemini Nano (On-Device Local AI)",
    cardNanoPromptDesc:
      "Diseñado para el modelo local de ~3B parámetros en Chrome. Directo, conciso y prioriza la verificación de hechos reales.",
    btnResetPrompt: "Restablecer por defecto",
    btnSavePrompt: "Guardar instrucciones Cloud",
    btnResetNanoPrompt: "Restablecer por defecto",
    btnSaveNanoPrompt: "Guardar instrucciones Nano",
    headingGeneral: "Configuración general e idioma",
    subheadingGeneral:
      "Configura el idioma de respuesta, el asistente de Google Forms y las copias de seguridad.",
    uiLangTitle: "Idioma de la interfaz (UI Language)",
    uiLangDesc:
      "Idioma mostrado en todos los botones, barra lateral, herramientas y opciones.",
    respLangTitle: "Idioma de respuesta de la IA",
    respLangDesc:
      "Idioma en el que la IA responderá y explicará los ejercicios.",
    formsTitle: "Asistente para Google Forms",
    formsDesc:
      "Detecta preguntas automáticamente en Google Forms y ofrece un botón de análisis con un clic.",
    tooltipTitle: "Barra flotante de selección de texto",
    tooltipDesc:
      "Muestra la barra de acciones al seleccionar cualquier texto en una página web.",
    disabledSitesTitle: "Sitios web desactivados",
    disabledSitesDesc: "La extensión permanecerá inactiva en estos dominios.",
    noDisabledSites: "No hay sitios web desactivados.",
    backupTitle: "Copia de seguridad y gestión de datos",
    backupDesc:
      "Exporta la configuración en JSON o borra el historial de conversaciones guardado.",
    btnExport: "Exportar configuración JSON",
    btnClearData: "Borrar todo el historial de chat",
    aboutTitle: "Acerca de e información",
    aboutDesc:
      "Homework Helper - Asistente de IA para resolver tareas y estudio académico.",
    keyPlaceholder: "Introduce la clave API",
    deleteKey: "Eliminar esta configuración",
    toastLangUpdated: "¡Idioma de visualización actualizado con éxito!",
    toastPromptSaved: "¡Instrucciones del sistema guardadas!",
    toastDataCleared: "¡Todo el historial de chat ha sido eliminado!",
    stratPreferNanoTitle: "Preferir Gemini Nano",
    stratPreferNanoDesc: "Usa Nano en el dispositivo para texto; cambia automáticamente a Vision API u OCR para imágenes.",
    stratPreferConfigTitle: "Preferir modelos configurados (Recomendado)",
    stratPreferConfigDesc: "Usa claves de API en la nube; recurre automáticamente a Gemini Nano si se agota la cuota o hay errores de red.",
    stratNanoOnlyTitle: "Solo Gemini Nano",
    stratNanoOnlyDesc:
      "100% gratuito y sin conexión, nunca realiza llamadas a API externas.",
    stratConfigOnlyTitle: "Solo API en la nube configuradas",
    stratConfigOnlyDesc:
      "Usa las claves API configuradas abajo con rotación automática para evitar límites.",
    builtinNanoTitle:
      "IA integrada de Chrome (Gemini Nano local en el dispositivo)",
    builtinNanoDesc:
      "Modelo de IA local que se ejecuta 100% en tu ordenador. Sin necesidad de clave API, completamente gratis y funciona sin conexión.",
    btnOpenFlags: "Abrir chrome://flags",
    btnTestBuiltinAI: "Probar modelo integrado",
    guideNanoStepsTitle:
      "Cómo activar Chrome Gemini Nano (Haz clic en los enlaces para abrir las pestañas de configuración):",
    guideNanoStep1:
      "Paso 1: Abre chrome://flags/#prompt-api-for-gemini-nano → Selecciona Enabled (o Enabled Multilingual).",
    guideNanoStep2:
      "Paso 2 (Requerido): Abre chrome://flags/#optimization-guide-on-device-model → Selecciona Enabled BypassPerfRequirement.",
    guideNanoStep3:
      "Paso 3: Haz clic en Relaunch (Reiniciar) en la parte inferior de Chrome para aplicar los cambios.",
    guideNanoStep4:
      "Paso 4 (Descargar modelo): Abre chrome://components → Busca Optimization Guide On Device Model y haz clic en Comprobar actualizaciones.",
    guideNanoStep5:
      'Paso 5: Haz clic en "Probar modelo integrado" arriba para verificar.',
    testConnection: "Probar conexión",
    testingConnection: "Probando...",
    keyValid: "Clave válida y funcionando",
    keyInvalid: "Error de conexión:",
    enterKeyFirst: "Por favor introduce una clave API antes de probar",
    statusReady: "Estado: Listo",
    btnGetKeyGemini: "Obtener clave Gemini →",
    btnGetKeyGroq: "Obtener clave Groq →",
    btnGetKeyOpenAI: "Obtener clave OpenAI →",
    btnGetKeyDeepSeek: "Obtener clave DeepSeek →",
    btnGetKeyClaude: "Obtener clave Claude →",
  },
};
