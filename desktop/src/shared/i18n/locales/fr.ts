/**
 * Bản dịch tiếng Pháp.
 *
 * Bộ locale này TÁCH BIỆT HOÀN TOÀN với extension (CLAUDE.md mục 0).
 * Tên ngôn ngữ (langVi, langEn...) cố ý giữ nguyên dạng bản địa ở mọi locale.
 */
import type { Dictionary } from '../keys';

export default {
  // ── Nhóm cấu hình ─────────────────────────────────────────────────────────
  groupLanguage: 'Langue',
  groupAi: 'IA et modèles',
  groupPrivacy: 'Confidentialité',
  groupSystem: 'Système',

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  setUiLanguage: 'Langue de l\'interface',
  setUiLanguageDesc: 'Langue de l\'application elle-même : menus, libellés, messages.',
  setOutputLanguage: 'Langue des réponses',
  setOutputLanguageDesc: 'Langue dans laquelle l\'IA rédige ses réponses. Indépendante de la langue de l\'interface.',
  setTranslateTarget: 'Traduire vers',
  setTranslateTargetDesc: 'Langue cible par défaut pour la traduction au survol.',

  langVi: 'Tiếng Việt', langEn: 'English', langTh: 'ไทย',
  langZhCN: '简体中文', langZhTW: '繁體中文', langJa: '日本語', langKo: '한국어',
  langEs: 'Español', langFr: 'Français', langDe: 'Deutsch',
  langPt: 'Português', langId: 'Bahasa Indonesia', langRu: 'Русский',
  langAuto: 'Détection automatique',

  // ── AI ────────────────────────────────────────────────────────────────────
  setRoutingStrategy: 'Stratégie de routage',
  setRoutingStrategyDesc: 'Quel modèle solliciter en priorité pour répondre.',
  routingPreferConfig: 'Privilégier les clés configurées',
  routingPreferLocal: 'Privilégier les modèles locaux',
  routingLocalOnly: 'Modèles locaux uniquement',
  routingConfigOnly: 'Clés configurées uniquement',

  setRotationStrategy: 'Rotation des clés',
  setRotationStrategyDesc: 'Comment choisir parmi plusieurs clés actives.',
  rotationRoundRobin: 'À tour de rôle',
  rotationRandom: 'Aléatoire',
  rotationFallback: 'Changer uniquement en cas d\'erreur',

  setRequestTimeout: 'Délai d\'attente',
  setRequestTimeoutDesc: 'Les modèles de raisonnement peuvent rester silencieux longtemps avant le premier mot.',
  setMaxRetries: 'Tentatives maximales',
  setMaxRetriesDesc: 'Nombre de clés à essayer avant de renoncer.',
  setThinkingEnabled: 'Activer le raisonnement',
  setThinkingEnabledDesc: 'Laisse les modèles compatibles réfléchir avant de répondre. Plus lent, mais plus précis.',
  setMaxRequestsPerMinute: 'Limite de requêtes par minute',
  setMaxRequestsPerMinuteDesc: 'Filet de sécurité contre les coûts imprévus. Les requêtes au-delà de la limite sont refusées.',
  setMonthlyTokenBudget: 'Budget mensuel de jetons',
  setMonthlyTokenBudgetDesc: 'Avertit lorsque l\'usage approche ce nombre. 0 signifie aucune limite.',
  setOllamaBaseUrl: 'Adresse Ollama',
  setLmStudioBaseUrl: 'Adresse LM Studio',

  // ── Riêng tư ──────────────────────────────────────────────────────────────
  setExcludedApps: 'Applications exclues',
  setExcludedAppsDesc: 'L\'application ne lit jamais l\'écran tant que ces programmes sont au premier plan.',
  setPauseWhenScreenSharing: 'Suspendre pendant le partage d\'écran',
  setPauseWhenScreenSharingDesc: 'Masque toutes les surimpressions pendant un partage ou un enregistrement d\'écran.',
  setPauseOnSensitiveApps: 'Suspendre sur les applications sensibles',
  setPauseOnSensitiveAppsDesc: 'S\'arrête automatiquement lorsqu\'un gestionnaire de mots de passe ou une application bancaire est au premier plan.',
  setLocalModelsOnly: 'Modèles locaux uniquement',
  setLocalModelsOnlyDesc: 'N\'envoie jamais de texte ni d\'image vers un service en ligne. Rien ne quitte cette machine.',
  setSaveHistory: 'Enregistrer l\'historique des conversations',
  setSaveHistoryDesc: 'Conserve les questions et réponses passées pour pouvoir y revenir.',
  setHistoryRetention: 'Supprimer l\'historique après',
  setHistoryRetentionDesc: 'Nombre de jours de conservation de l\'historique. 0 signifie conserver indéfiniment.',
  setTelemetry: 'Envoyer des données d\'usage anonymes',
  setTelemetryDesc: 'Aide à améliorer l\'application. N\'inclut jamais le contenu de l\'écran ni vos questions.',

  // ── Hệ thống ──────────────────────────────────────────────────────────────
  setLaunchAtLogin: 'Lancer à la connexion',
  setLaunchAtLoginDesc: 'Démarre l\'application automatiquement à l\'ouverture de session.',
  setHideFromDock: 'Masquer du Dock',
  setHideFromDockDesc: 'Fonctionne uniquement depuis la barre des menus, sans icône dans le Dock ni la barre des tâches.',
  setAutoUpdate: 'Mettre à jour automatiquement',
  setAutoUpdateDesc: 'Télécharge et installe les nouvelles versions en arrière-plan.',
  setUpdateChannel: 'Canal de mise à jour',
  setUpdateChannelDesc: 'Le canal Bêta reçoit les nouveautés plus tôt, avec un risque de bugs plus élevé.',
  channelStable: 'Stable', channelBeta: 'Bêta',
  setLogLevel: 'Niveau de journalisation',
  setLogLevelDesc: 'Augmentez-le pour signaler un problème : les journaux contiendront plus de détails.',
  logError: 'Erreurs uniquement', logWarn: 'Avertissements', logInfo: 'Normal', logDebug: 'Détaillé',
  setDebugOverlay: 'Surimpression de débogage',
  setDebugOverlayDesc: 'Dessine des cadres autour du texte détecté. Utile pour signaler un problème de reconnaissance.',

  // ── Intent (config/intents.config.ts) ─────────────────────────────────────
  intentTranslate: 'Traduire',
  intentSolve: 'Résoudre',
  intentSummarize: 'Résumer',
  intentExplain: 'Expliquer',
  intentRewrite: 'Réécrire',
  intentChat: 'Discussion',

  // ── Phím tắt ──────────────────────────────────────────────────────────────
  groupHotkeys: 'Raccourcis',
  setHotkeys: 'Raccourcis globaux',
  setHotkeysDesc: "Touches utilisables depuis n'importe quelle application. Laissez vide pour désactiver un raccourci.",

  // ── Nhà cung cấp AI & khoá ────────────────────────────────────────────────
  groupApiKeys: 'Fournisseurs IA et clés',
  setApiConfigs: 'Modèles configurés',
  keysAdd: 'Ajouter un modèle',
  keysEmpty: 'Aucun modèle configuré. Ajoutez-en un pour commencer.',
  keysTest: 'Tester la connexion',
  keysTesting: 'Test en cours…',
  keysOk: 'Connecté',
  keysRemove: 'Retirer',
  keysKeySaved: 'Clé enregistrée',
  keysKeyPlaceholder: 'Collez la clé API',
  keysGetKey: 'Obtenir une clé',
  keysNoKeyNeeded: 'Aucune clé requise — fonctionne sur votre machine',
  keysModel: 'Modèle',
  keysBaseUrl: 'Adresse',
  keysLabel: 'Nom',
  keysEnabled: 'Activé',
  keysVision: 'Lit les images',

  // ── Tác vụ & chế độ học tập ───────────────────────────────────────────────
  groupIntent: 'Tâches',
  setStudyMode: 'Mode d\'étude par défaut',
  setStudyModeDesc: 'Façon dont l\'IA répond par défaut. Modifiable pour chaque réponse.',
  modeStepByStep: 'Étape par étape',
  modeDirect: 'Réponse seule',
  modeHint: 'Indices, sans réponse',
  modeExplain: 'Explication approfondie',
  modeTranslate: 'Traduction académique',
} as const satisfies Dictionary;
