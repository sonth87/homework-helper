export default {
  general: {
    brandTitle: "Homework Helper",
    placeholder: "Digite sua dúvida ou fórmula aqui...",
    shiftEnterHint: "Enter para enviar, Shift+Enter para nova linha",
    askAiBtn: "Perguntar à IA",
    captureBtn: "Capturar",
    uploadBtn: "Anexar imagem",
    attachedLabel: "Imagem anexada",
    welcomeText:
      "Olá! Sou seu assistente Homework Helper. Qual tarefa resolveremos hoje?",
    newChat: "Novo chat",
    historyTitle: "Histórico de chat",
    modelNanoReady: "Chrome Gemini Nano (Pronto no dispositivo)",
    modelNanoSetup: "Chrome Gemini Nano (Configuração necessária)",
    modelNanoClick: "Clique para ver o guia de ativação do Gemini Nano",
    modelAutoRotate: "Rotação automática",
    emptyHistory:
      "Nenhum histórico salvo.<br>Inicie um novo chat para começar!",
    loadingHistory: "Carregando histórico...",
    chips: [
      {
        label: "Equação quadrática",
        query: "Resolva a equação quadrática ax^2 + bx + c = 0 passo a passo",
      },
      {
        label: "Leis de Newton",
        query:
          "Explique as 3 leis do movimento de Newton com exemplos práticos",
      },
      {
        label: "Equação química",
        query:
          "Como balancear equações químicas e calcular proporções molares?",
      },
    ],
    modes: {
      "step-by-step": "Passo a passo",
      direct: "Resposta direta",
      hint: "Dica e orientação",
      explain: "Explicação aprofundada",
      translate: "Traduzir",
    },
    cardHeading: "Solução detalhada",
    nextQuestion: "Próxima pergunta",
    continueInChat: "Continuar no chat",
    copyBtn: "Copiar",
    copiedBtn: "Copiado!",
    retryBtn: "Tentar novamente",
    imagePromptHeader:
      "Por favor, resolva e explique esta questão da imagem passo a passo com fórmulas LaTeX ($...$) e destaque a resposta final:",
    captureSolveText: "Resolver problema da imagem capturada",
    toastNewChat: "Nova conversa iniciada",
    chatCleared: "Chat limpo. Faça uma nova pergunta!",
    thinking: "Pensando e resolvendo...",
    tooltips: {
      newChat: {
        title: "Novo chat",
        desc: "Inicie uma nova sessão de estudos.",
      },
      history: {
        title: "Histórico",
        desc: "Veja soluções de tarefas anteriores.",
      },
      lang: {
        title: "Idioma de resposta",
        desc: "A IA responderá e explicará neste idioma.",
      },
      mode: {
        title: "Modo de resolução",
        desc: "Formato: Passo a passo, Direto, Dicas ou Teoria profunda.",
      },
      capture: {
        title: "Captura de tela (Alt+C)",
        desc: "Recorte uma questão na tela para resolvê-la instantaneamente.",
      },
      upload: {
        title: "Enviar imagem",
        desc: "Anexe uma imagem do seu computador.",
      },
      settings: {
        title: "Modelos e chaves API",
        desc: "Gerencie provedores e rotação de chaves gratuitas.",
      },
      clear: {
        title: "Limpar chat",
        desc: "Exclui todas as mensagens da sessão atual.",
      },
      options: {
        title: "Configurações completas",
        desc: "Abra a página de configurações de chaves e aparência.",
      },
      close: {
        title: "Fechar painel",
        desc: "Recolhe o painel para a lateral da tela.",
      },
      open: {
        title: "Abrir painel de chat (Alt+K)",
        desc: "Abre o tutor de estudos para tirar dúvidas e resolver tarefas.",
      },
    },
    modalConfigTitle: "Configuração de Modelos e Chaves API",
    modalConfigDesc:
      "Adicione uma ou mais chaves API. A extensão equilibra a carga automaticamente e alterna para chaves reservas.",
    modalNanoTitle: "Chrome Gemini Nano (IA Local no Dispositivo)",
    modalNanoDesc:
      "IA local executada 100% offline no seu computador. Clique nos links para abrir as opções diretamente:",
    modalBtnFlagPrompt: "1. Abrir #prompt-api",
    modalBtnFlagOptGuide: "2. Abrir #optimization-guide",
    modalBtnComponents: "3. Abrir componentes",
    modalBtnAddKey: "Adicionar Modelo e Chave",
    modalLinkGuide: "Ver guia de chaves API gratuitas →",
    modalKeyPlaceholder: "Insira a chave API (sk-... / AIza...)",
  },
  selectionTooltip: {
    answer: "Resolver",
    copy: "Copiar",
    search: "Buscar",
    translate: "Traduzir",
    more: "Mais opções",
    explain: "Explicar",
    summarize: "Resumir",
    grammar: "Verificar gramática",
    disable: "Desativar",
    disableSession: "Desativar até a próxima visita",
    disablePage: "Desativar para esta página",
    disableSite: "Desativar para este site",
    disableGlobal: "Desativar globalmente",
    disableFooter: "Você pode reativar nas configurações",
  },
  cropper: {
    tip: "Clique e arraste para selecionar a questão ou fórmula (ESC para cancelar)",
    cancel: "Cancelar",
    askAi: "Perguntar à IA",
  },
  floatingPopup: {
    helperTitle: "Assistente Homework Helper",
    translateTitle: "Traduzir",
    translateHeading: "Tradução",
    searchTitle: "Pesquisar e resolver",
    searchHeading: "Resultados e solução",
    explainTitle: "Explicação aprofundada",
    explainHeading: "Explicação do conceito",
    summarizeTitle: "Resumo do conteúdo",
    summarizeHeading: "Pontos principais",
    grammarTitle: "Verificador gramatical",
    grammarHeading: "Correções e melhorias",
    answerHeading: "Solução detalhada",
    nextQuestion: "Próxima pergunta",
    continueInChat: "Continuar no chat",
    copy: "Copiar",
    copied: "Copiado!",
    retry: "Tentar novamente",
    processing: "Processando solicitação...",
    solvingStepByStep: "Resolvendo passo a passo com fórmulas KaTeX...",
    scanningOcr: "Escaneando texto e fórmulas com OCR local...",
    autoDetect: "Detecção automática",
    historyTitle: "Histórico de perguntas",
    historyDesc:
      "Revise perguntas resolvidas recentemente e sessões de estudo.",
    closeTitle: "Fechar janela",
    closeDesc: "Fechar popup de solução",
    addConvTitle: "Novo chat",
    addConvDesc: "Iniciar uma nova conversa de exercícios.",
    closeHistoryTitle: "Fechar histórico",
    closeHistoryDesc: "Fechar painel de histórico.",
    openInDrawerBtn: "Abrir tudo no painel de chat",
  },
  popup: {
    brandSub: "IA acadêmica sem login",
    openSidePanel: "Abrir painel lateral de IA",
    openSidePanelDesc: "Espaço de trabalho ao lado de qualquer página",
    cropSolve: "Recortar e resolver (Alt+C)",
    cropSolveDesc: "Selecione fórmulas ou diagramas",
    keysPool: "Chaves ativas:",
    rotationMode: "Modo de rotação:",
    formsAssistant: "Assistente Google Forms",
    selectionTooltip: "Barra de seleção flutuante",
    configureBtn: "Configurar modelos e chaves",
  },
  options: {
    navProviders: "Modelos e chaves API",
    navOcr: "Modelos OCR locais",
    navAppearance: "Aparência e interface",
    navGuide: "Guia de chaves gratuitas",
    navPrompt: "Instruções do sistema",
    navGeneral: "Configurações gerais",
    brandDesc: "IA acadêmica sem login",
    headingProviders: "Modelos de IA e chaves API",
    subheadingProviders:
      "Adicione uma ou mais chaves API. A extensão balanceia a carga e alterna automaticamente para chaves reservas.",
    strategyTitle: "Estratégia de rotação",
    strategyDesc:
      "Escolha como as chaves ativas são selecionadas nas solicitações.",
    statTotal: "Chaves configuradas",
    statActive: "Prontas para uso",
    statCooldown: "Em pausa (60s)",
    btnAddKey: "Adicionar provedor / Chave",
    headingOcr: "Pacotes de modelos OCR locais (Offline)",
    subheadingOcr:
      "Baixe modelos de reconhecimento offline para fórmulas e texto via Tesseract.js.",
    btnCheckUpdates: "Verificar atualizações",
    btnDownloadCore:
      "Baixar pacote principal (Português + Inglês + Matemática)",
    corePackTitle: "Pacote OCR principal integrado",
    corePackBadge: "Recomendado",
    corePackDesc:
      "Alta precisão para caracteres latinos, fórmulas matemáticas, português e inglês.",
    allOcrTitle: "Todos os pacotes de idiomas",
    allOcrSub:
      "Baixe pacotes específicos para reconhecimento offline conforme necessário.",
    headingAppearance: "Personalização visual e de interface",
    subheadingAppearance:
      "Personalize os botões flutuantes (FAB), barra de seleção, temas, transparência e desfoque.",
    cardFabTitle: "Botões flutuantes na página (FAB)",
    labelFabDisplay: "Exibir botões flutuantes nas páginas",
    descFabDisplay:
      "Mostra botões rápidos na borda da tela para abrir o chat ou capturar questões.",
    labelFabSize: "Tamanho dos botões flutuantes",
    cardToolbarTitle: "Barra flutuante ao selecionar texto",
    labelToolbarTheme: "Tema de cor da barra",
    labelToolbarText: "Mostrar texto ao lado dos ícones",
    descToolbarText:
      "Exibe nomes das ações (Resolver, Copiar, Buscar, Traduzir).",
    labelToolbarSize: "Tamanho da barra",
    labelToolbarOpacity: "Transparência da barra",
    labelToolbarBlur: "Desfoque de fundo (Backdrop Blur)",
    cardPopupTitle: "Janela flutuante de solução e tradução",
    labelPopupOpacity: "Transparência da janela",
    labelPopupBlur: "Desfoque de fundo (Blur)",
    livePreviewBadge: "Simulador em tempo real",
    livePreviewSub:
      "Visualização instantânea do estilo Liquid Glass com seus ajustes.",
    headingGuide: "Guia de chaves API gratuitas e portais oficiais",
    subheadingGuide:
      "Chaves 100% oficiais e gratuitas dos principais provedores com cotas generosas.",
    guideWhyTitle: "Por que adicionar múltiplas chaves API?",
    guideWhy1:
      "Failover automático: Se uma chave atingir o limite (429), o sistema muda para a próxima imediatamente.",
    guideWhy2:
      "Balanceamento de carga: Distribui as requisições uniformemente para evitar limites.",
    guideWhy3:
      "Sem custos: Combine cotas gratuitas de diversos provedores na nuvem.",
    guideHowTitle: "Como funciona?",
    guideHow1:
      "Obtenha chaves gratuitas nos portais oficiais (Google AI Studio, Groq, OpenRouter...).",
    guideHow2: 'Cole na aba "Modelos e chaves API" e clique em testar conexão.',
    guideHow3:
      "A extensão gerencia a rotação em segundo plano automaticamente.",
    guideLinksTitle: "Portais oficiais de chaves gratuitas",
    linkSubGemini:
      "15 RPM grátis, velocidade ultrarrápida e excelente análise visual de questões.",
    linkSubGroq:
      "Inferência ultraveloz (500+ tokens/s), compatível com Llama 3 e DeepSeek.",
    linkSubOpenAI: "Referência em raciocínio acadêmico e lógica rigorosa.",
    linkSubDeepSeek: "Modelo líder em matemática e código aberto.",
    linkSubClaude: "Excelente compreensão de diagramas e clareza pedagógica.",
    headingPrompt: "Instruções do sistema e estilo pedagógico",
    subheadingPrompt:
      "Personalize prompts de sistema dedicados para modelos em Nuvem e modelos On-Device locais.",
    cardCloudPromptTitle:
      "1. Prompt do sistema para modelos em Nuvem (Gemini, OpenAI, Claude, DeepSeek)",
    cardCloudPromptDesc:
      "Otimizado para modelos de centenas de bilhões de parâmetros, análise pedagógica profunda, LaTeX e visão.",
    cardNanoPromptTitle:
      "2. Prompt do sistema para Chrome Gemini Nano (On-Device Local AI)",
    cardNanoPromptDesc:
      "Feito para o modelo local de ~3B parâmetros no Chrome. Direto, conciso e força a verificação de fatos reais.",
    btnResetPrompt: "Restaurar padrão",
    btnSavePrompt: "Salvar prompt em Nuvem",
    btnResetNanoPrompt: "Restaurar padrão",
    btnSaveNanoPrompt: "Salvar prompt Nano",
    headingGeneral: "Configurações gerais e idioma",
    subheadingGeneral:
      "Gerencie idioma de resposta, assistente Google Forms e backups.",
    uiLangTitle: "Idioma da interface (UI Language)",
    uiLangDesc:
      "Idioma exibido em todos os botões, barra lateral e configurações.",
    respLangTitle: "Idioma de resposta da IA",
    respLangDesc: "Idioma no qual a IA resolverá e explicará os exercícios.",
    formsTitle: "Assistente Google Forms",
    formsDesc:
      "Detecta questões no Google Forms e oferece botão de análise em um clique.",
    tooltipTitle: "Barra flutuante de seleção de texto",
    tooltipDesc:
      "Exibe a barra de ações ao selecionar qualquer texto na página.",
    disabledSitesTitle: "Sites desativados",
    disabledSitesDesc: "A extensão ficará inativa nestes domínios.",
    noDisabledSites: "Nenhum site desativado no momento.",
    backupTitle: "Backup e gerenciamento de dados",
    backupDesc:
      "Exporte a configuração em JSON ou limpe o histórico de conversas salvo.",
    btnExport: "Exportar configuração JSON",
    btnClearData: "Limpar todo o histórico de chat",
    aboutTitle: "Sobre e informações",
    aboutDesc:
      "Homework Helper - Assistente de IA para resolução de tarefas e estudo acadêmico.",
    keyPlaceholder: "Insira a chave API",
    deleteKey: "Excluir esta configuração",
    toastLangUpdated: "Idioma de exibição atualizado com sucesso!",
    toastPromptSaved: "Instruções do sistema salvas com sucesso!",
    toastDataCleared: "Todo o histórico de chat foi apagado!",
    stratPreferNanoTitle: "Preferir Gemini Nano (Recomendado)",
    stratPreferNanoDesc:
      "Usa o Gemini Nano local quando disponível e alterna com fluidez para a Nuvem em tarefas visuais pesadas.",
    stratNanoOnlyTitle: "Apenas Gemini Nano",
    stratNanoOnlyDesc:
      "100% gratuito e offline, nunca realiza chamadas para APIs externas.",
    stratConfigOnlyTitle: "Apenas APIs em Nuvem Configuradas",
    stratConfigOnlyDesc:
      "Usa as chaves de API configuradas abaixo com rotação inteligente contra limites de taxa.",
    builtinNanoTitle: "IA Integrada do Chrome (Gemini Nano On-Device)",
    builtinNanoDesc:
      "Modelo de IA executado localmente na sua máquina. Não requer chave API, totalmente gratuito e funciona offline.",
    btnOpenFlags: "Abrir chrome://flags",
    btnTestBuiltinAI: "Testar Modelo Integrado",
    guideNanoStepsTitle:
      "Como ativar o Chrome Gemini Nano (Clique nos links para abrir as abas diretamente):",
    guideNanoStep1:
      "Passo 1: Abra chrome://flags/#prompt-api-for-gemini-nano → Selecione Enabled (ou Enabled Multilingual).",
    guideNanoStep2:
      "Passo 2 (Obrigatório): Abra chrome://flags/#optimization-guide-on-device-model → Selecione Enabled BypassPerfRequirement.",
    guideNanoStep3:
      "Passo 3: Clique em Relaunch (Reiniciar) na parte inferior do Chrome para aplicar as alterações.",
    guideNanoStep4:
      "Passo 4 (Baixar modelo): Abra chrome://components → Localize Optimization Guide On Device Model e clique em Verificar atualizações.",
    guideNanoStep5:
      'Passo 5: Clique em "Testar Modelo Integrado" acima para validar.',
    testConnection: "Testar Conexão",
    testingConnection: "Testando...",
    keyValid: "Chave válida e funcionando",
    keyInvalid: "Falha na conexão:",
    enterKeyFirst: "Por favor, insira uma chave API antes de testar",
    statusReady: "Status: Pronto",
    btnGetKeyGemini: "Obter chave Gemini →",
    btnGetKeyGroq: "Obterne chave Groq →",
    btnGetKeyOpenAI: "Obter chave OpenAI →",
    btnGetKeyDeepSeek: "Obter chave DeepSeek →",
    btnGetKeyClaude: "Obter chave Claude →",
  },
};
