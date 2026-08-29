/**
 * Bản dịch tiếng Bồ Đào Nha.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'Idioma',
  groupAi: 'IA e modelos',
  groupPrivacy: 'Privacidade',
  groupSystem: 'Sistema',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'Idioma da interface',
  setUiLanguageDesc: 'Idioma do próprio aplicativo: menus, rótulos e mensagens.',
  setOutputLanguage: 'Idioma das respostas',
  setOutputLanguageDesc: 'Idioma em que a IA escreve as respostas. Independente do idioma da interface.',
  setTranslateTarget: 'Traduzir para',
  setTranslateTargetDesc: 'Idioma de destino padrão ao traduzir com o cursor.',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'Detectar automaticamente',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'Estratégia de roteamento',
  setRoutingStrategyDesc: 'Qual modelo usar primeiro ao responder.',
  routingPreferConfig: 'Preferir chaves configuradas',
  routingPreferLocal: 'Preferir modelos locais',
  routingLocalOnly: 'Somente modelos locais',
  routingConfigOnly: 'Somente chaves configuradas',

  setRotationStrategy: 'Rotação de chaves',
  setRotationStrategyDesc: 'Como escolher entre várias chaves ativas.',
  rotationRoundRobin: 'Em sequência',
  rotationRandom: 'Aleatória',
  rotationFallback: 'Trocar apenas em caso de erro',

  setRequestTimeout: 'Tempo limite',
  setRequestTimeoutDesc: 'Modelos de raciocínio podem ficar em silêncio por muito tempo antes da primeira palavra.',
  setMaxRetries: 'Máximo de tentativas',
  setMaxRetriesDesc: 'Quantas chaves tentar antes de desistir.',
  setThinkingEnabled: 'Ativar raciocínio',
  setThinkingEnabledDesc: 'Permite que modelos compatíveis raciocinem antes de responder. Mais lento, porém mais preciso.',
  setMaxRequestsPerMinute: 'Limite de solicitações por minuto',
  setMaxRequestsPerMinuteDesc: 'Rede de segurança contra custos inesperados. Solicitações acima do limite são recusadas.',
  setMonthlyTokenBudget: 'Orçamento mensal de tokens',
  setMonthlyTokenBudgetDesc: 'Avisa quando o uso se aproximar desse número. 0 significa sem limite.',
  setOllamaBaseUrl: 'Endereço do Ollama',
  setLmStudioBaseUrl: 'Endereço do LM Studio',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'Aplicativos excluídos',
  setExcludedAppsDesc: 'O aplicativo nunca lê a tela enquanto esses programas estiverem em primeiro plano.',
  setPauseWhenScreenSharing: 'Pausar ao compartilhar a tela',
  setPauseWhenScreenSharingDesc: 'Oculta todas as sobreposições durante compartilhamento ou gravação de tela.',
  setPauseOnSensitiveApps: 'Pausar em aplicativos sensíveis',
  setPauseOnSensitiveAppsDesc: 'Para automaticamente quando um gerenciador de senhas ou app bancário está em primeiro plano.',
  setLocalModelsOnly: 'Somente modelos locais',
  setLocalModelsOnlyDesc: 'Nunca envia texto ou imagens para a nuvem. Nada sai deste computador.',
  setSaveHistory: 'Salvar histórico de conversas',
  setSaveHistoryDesc: 'Guarda perguntas e respostas anteriores para você consultar depois.',
  setHistoryRetention: 'Apagar histórico após',
  setHistoryRetentionDesc: 'Número de dias para manter o histórico. 0 significa manter para sempre.',
  setTelemetry: 'Enviar dados de uso anônimos',
  setTelemetryDesc: 'Ajuda a melhorar o aplicativo. Nunca inclui o conteúdo da tela nem suas perguntas.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'Iniciar ao fazer login',
  setLaunchAtLoginDesc: 'Abre o aplicativo automaticamente quando você entra no sistema.',
  setHideFromDock: 'Ocultar do Dock',
  setHideFromDockDesc: 'Funciona apenas na barra de menus, sem ícone no Dock ou na barra de tarefas.',
  setAutoUpdate: 'Atualizar automaticamente',
  setAutoUpdateDesc: 'Baixa e instala novas versões em segundo plano.',
  setUpdateChannel: 'Canal de atualização',
  setUpdateChannelDesc: 'O canal Beta recebe novidades antes, com maior chance de falhas.',
  channelStable: 'Estável', channelBeta: 'Beta',
  setLogLevel: 'Nível de log',
  setLogLevelDesc: 'Aumente ao relatar um problema para que os logs tragam mais detalhes.',
  logError: 'Somente erros', logWarn: 'Avisos', logInfo: 'Normal', logDebug: 'Detalhado',
  setDebugOverlay: 'Sobreposição de depuração',
  setDebugOverlayDesc: 'Desenha caixas ao redor do texto detectado. Útil ao relatar problemas de reconhecimento.',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'Traduzir',
  intentSolve: 'Resolver',
  intentSummarize: 'Resumir',
  intentExplain: 'Explicar',
  intentRewrite: 'Reescrever',
  intentChat: 'Conversa',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'Atalhos',
  setHotkeys: 'Atalhos globais',
  setHotkeysDesc: 'Teclas que funcionam a partir de qualquer aplicativo. Deixe vazio para desativar um atalho.',
} as const satisfies Dictionary;
