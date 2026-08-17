export default {
  general: {
    brandTitle: "Homework Helper",
    placeholder: "Saisissez votre devoir ou question ici...",
    shiftEnterHint: "Entrée pour envoyer, Shift+Entrée pour saut de ligne",
    askAiBtn: "Demander à l’IA",
    captureBtn: "Capturer",
    uploadBtn: "Joindre une image",
    attachedLabel: "Image jointe",
    welcomeText:
      "Bonjour ! Je suis votre assistant Homework Helper. Quel exercice résolvons-nous aujourd’hui ?",
    newChat: "Nouvelle discussion",
    historyTitle: "Historique des discussions",
    modelNanoReady: "Chrome Gemini Nano (Prêt sur l’appareil)",
    modelNanoSetup: "Chrome Gemini Nano (Configuration requise)",
    modelNanoClick: "Cliquer pour voir le guide d’activation de Gemini Nano",
    modelAutoRotate: "Rotation automatique",
    emptyHistory:
      "Aucune discussion enregistrée.<br>Commencez un nouveau chat !",
    loadingHistory: "Chargement de l’historique...",
    chips: [
      {
        label: "Équation du second degré",
        query: "Résous l’équation ax^2 + bx + c = 0 étape par étape",
      },
      {
        label: "Lois de Newton",
        query:
          "Explique les 3 lois du mouvement de Newton avec des exemples concrets",
      },
      {
        label: "Équation chimique",
        query:
          "Comment équilibrer une équation chimique et calculer les moles ?",
      },
    ],
    modes: {
      "step-by-step": "Étape par étape",
      direct: "Réponse directe",
      hint: "Indice et guidage",
      explain: "Explication approfondie",
      translate: "Traduction",
    },
    cardHeading: "Solution détaillée",
    nextQuestion: "Question suivante",
    continueInChat: "Continuer dans le chat",
    copyBtn: "Copier",
    copiedBtn: "Copié !",
    retryBtn: "Réessayer",
    imagePromptHeader:
      "Veuillez résoudre et expliquer ce problème étape par étape avec des formules LaTeX ($...$) et encadrer la réponse finale :",
    captureSolveText: "Résoudre le devoir à partir de l'image capturée",
    toastNewChat: "Nouvelle discussion commencée",
    chatCleared: "Discussion effacée. Posez votre question !",
    thinking: "Réflexion & résolution...",
    tooltips: {
      newChat: {
        title: "Nouvelle discussion",
        desc: "Commencez une nouvelle session de devoirs.",
      },
      history: {
        title: "Historique",
        desc: "Consultez les exercices résolus précédemment.",
      },
      lang: {
        title: "Langue de réponse",
        desc: "L’IA répondra et expliquera dans cette langue.",
      },
      mode: {
        title: "Mode de résolution",
        desc: "Choisissez le format : étape par étape, direct, indice ou théorique.",
      },
      capture: {
        title: "Capture d’écran (Alt+C)",
        desc: "Capturez un exercice ou un graphique à l’écran pour le résoudre immédiatement.",
      },
      upload: {
        title: "Téléverser une image",
        desc: "Joignez une image depuis votre ordinateur.",
      },
      settings: {
        title: "Modèles & Clés API",
        desc: "Gérez vos clés d’API gratuites et la rotation de charge.",
      },
      clear: {
        title: "Effacer la discussion",
        desc: "Supprime tous les messages de la session active.",
      },
      options: {
        title: "Paramètres complets",
        desc: "Ouvrez la page de configuration des clés et de l’apparence.",
      },
      close: {
        title: "Fermer le tiroir",
        desc: "Repliez le volet sur le bord de l’écran.",
      },
      open: {
        title: "Ouvrir le panneau de chat (Alt+K)",
        desc: "Ouvre le tiroir IA pour poser vos questions et résoudre vos devoirs.",
      },
    },
    modalConfigTitle: "Configuration des modèles et clés API",
    modalConfigDesc:
      "Ajoutez une ou plusieurs clés API. L’extension répartit automatiquement la charge et bascule sur les clés de secours.",
    modalNanoTitle: "Chrome Gemini Nano (IA locale sur l’appareil)",
    modalNanoDesc:
      "IA exécutée 100% en local et hors ligne. Cliquez sur les liens ci-dessous pour ouvrir directement les options :",
    modalBtnFlagPrompt: "1. Ouvrir #prompt-api",
    modalBtnFlagOptGuide: "2. Ouvrir #optimization-guide",
    modalBtnComponents: "3. Ouvrir les composants",
    modalBtnAddKey: "Ajouter modèle et clé",
    modalLinkGuide: "Voir le guide des clés API gratuites →",
    modalKeyPlaceholder: "Entrez la clé API (sk-... / AIza...)",
    customModelOption: "Modèle personnalisé (Saisir le nom)...",
    customModelPlaceholder: "Saisir l'ID du modèle (ex: gemini-2.5-pro, gpt-5, claude-4...)",
  },
  selectionTooltip: {
    answer: "Résoudre",
    copy: "Copier",
    search: "Rechercher",
    translate: "Traduire",
    more: "Plus d’options",
    explain: "Expliquer",
    summarize: "Résumer",
    grammar: "Correcteur grammatical",
    disable: "Désactiver",
    disableSession: "Désactiver jusqu’à la prochaine visite",
    disablePage: "Désactiver pour cette page",
    disableSite: "Désactiver pour ce site web",
    disableGlobal: "Désactiver globalement",
    disableFooter: "Réactivable à tout moment dans les Paramètres",
  },
  cropper: {
    tip: "Cliquez et glissez pour sélectionner le problème ou la formule (ÉCHAP pour annuler)",
    cancel: "Annuler",
    askAi: "Demander à l’IA",
  },
  floatingPopup: {
    helperTitle: "Assistant Homework Helper",
    translateTitle: "Traduction",
    translateHeading: "Résultat de la traduction",
    searchTitle: "Recherche & Aide aux devoirs",
    searchHeading: "Résultats & Solution",
    explainTitle: "Explication approfondie",
    explainHeading: "Explication du concept",
    summarizeTitle: "Résumé du contenu",
    summarizeHeading: "Points clés",
    grammarTitle: "Correcteur grammatical",
    grammarHeading: "Corrections & Améliorations",
    answerHeading: "Solution détaillée",
    nextQuestion: "Question suivante",
    continueInChat: "Continuer dans le chat",
    copy: "Copier",
    copied: "Copié !",
    retry: "Réessayer",
    processing: "Traitement de la requête...",
    solvingStepByStep: "Résolution pas à pas avec formules KaTeX...",
    scanningOcr: "Numérisation du texte et formules par OCR local...",
    autoDetect: "Détection automatique",
    historyTitle: "Historique des questions",
    historyDesc: "Consultez les exercices et devoirs résolus récemment.",
    closeTitle: "Fermer la fenêtre",
    closeDesc: "Fermer le popup de solution",
    addConvTitle: "Nouvelle discussion",
    addConvDesc: "Démarrer une nouvelle session de devoirs.",
    closeHistoryTitle: "Fermer l'historique",
    closeHistoryDesc: "Fermer le panneau d'historique.",
    openInDrawerBtn: "Tout ouvrir dans le panneau de chat",
  },
  popup: {
    brandSub: "IA académique sans connexion",
    openSidePanel: "Ouvrir le volet latéral IA",
    openSidePanelDesc: "Espace de travail à côté de toute page web",
    cropSolve: "Capturer & Résoudre (Alt+C)",
    cropSolveDesc: "Sélectionnez des formules ou des schémas",
    keysPool: "Clés actives :",
    rotationMode: "Mode de rotation :",
    formsAssistant: "Assistant Google Forms",
    selectionTooltip: "Barre d’outils de surlignage",
    configureBtn: "Configurer modèles et clés",
  },
  options: {
    navProviders: "Modèles & Clés API",
    navOcr: "Modèles OCR locaux",
    navAppearance: "Apparence & Interface",
    navGuide: "Guide des clés gratuites",
    navPrompt: "Instructions système (Prompt)",
    navGeneral: "Paramètres généraux",
    brandDesc: "IA académique sans connexion",
    headingProviders: "Modèles IA & Pool de clés API",
    subheadingProviders:
      "Ajoutez une ou plusieurs clés API. L’extension répartit la charge et bascule automatiquement sur les clés de secours.",
    strategyTitle: "Stratégie de rotation",
    strategyDesc:
      "Choisissez la méthode de sélection des clés actives lors des requêtes.",
    statTotal: "Clés configurées",
    statActive: "Prêtes et utilisables",
    statCooldown: "En pause (60s)",
    btnAddKey: "Ajouter un fournisseur / Clé",
    headingOcr: "Packs de modèles OCR locaux (Hors-ligne)",
    subheadingOcr:
      "Téléchargez les modèles de reconnaissance de texte et formules hors-ligne via Tesseract.js.",
    btnCheckUpdates: "Vérifier les mises à jour",
    btnDownloadCore:
      "Télécharger le pack principal (Français + Anglais + Maths)",
    corePackTitle: "Pack OCR principal intégré",
    corePackBadge: "Recommandé",
    corePackDesc:
      "Haute précision pour les caractères latins, formules mathématiques, français et anglais.",
    allOcrTitle: "Tous les packs linguistiques",
    allOcrSub:
      "Téléchargez des packs spécifiques pour la reconnaissance hors-ligne selon vos besoins.",
    headingAppearance: "Personnalisation visuelle",
    subheadingAppearance:
      "Personnalisez les boutons flottants (FAB), la barre de sélection, la transparence et le flou.",
    cardFabTitle: "Boutons flottants dans la page (FAB)",
    labelFabDisplay: "Afficher les boutons flottants sur les pages",
    descFabDisplay:
      "Affiche des raccourcis au bord de l’écran pour ouvrir le chat ou capturer un exercice.",
    labelFabSize: "Taille des boutons flottants",
    cardToolbarTitle: "Barre flottante au surlignage de texte",
    labelToolbarTheme: "Thème de couleur de la barre",
    labelToolbarText: "Afficher les libellés à côté des icônes",
    descToolbarText:
      "Affiche le nom des actions (Résoudre, Copier, Rechercher, Traduire).",
    labelToolbarSize: "Taille de la barre",
    labelToolbarOpacity: "Transparence de la barre",
    labelToolbarBlur: "Flou d’arrière-plan (Backdrop Blur)",
    cardPopupTitle: "Fenêtre contextuelle de solution et traduction",
    labelPopupOpacity: "Transparence de la fenêtre",
    labelPopupBlur: "Flou d’arrière-plan (Blur)",
    livePreviewBadge: "Aperçu en direct",
    livePreviewSub:
      "Visualisez instantanément le style Liquid Glass selon vos réglages.",
    headingGuide: "Guide des clés API gratuites et portails officiels",
    subheadingGuide:
      "Clés 100% officielles et gratuites offertes par les meilleurs fournisseurs d’IA.",
    guideWhyTitle: "Pourquoi ajouter plusieurs clés API ?",
    guideWhy1:
      "Basculement automatique : Si une clé atteint le quota (429), le système passe immédiatement à la suivante.",
    guideWhy2:
      "Équilibrage de charge : Répartit les requêtes pour éviter les limites de débit.",
    guideWhy3:
      "Sans frais : Cumulez les quotas gratuits des différents fournisseurs.",
    guideHowTitle: "Comment ça fonctionne ?",
    guideHow1:
      "Obtenez des clés gratuites sur les portails officiels (Google AI Studio, Groq, OpenRouter...).",
    guideHow2:
      'Ajoutez-les dans l’onglet "Modèles & Clés API" et testez la connexion.',
    guideHow3: "L’extension gère automatiquement la rotation en arrière-plan.",
    guideLinksTitle: "Portails officiels de clés gratuites",
    linkSubGemini:
      "15 RPM gratuit, inférence ultra-rapide et analyse visuelle experte.",
    linkSubGroq: "Vitesse record (500+ tokens/s), supporte Llama 3 & DeepSeek.",
    linkSubOpenAI: "Référence pour le raisonnement logique et académique.",
    linkSubDeepSeek: "Modèle de pointe en mathématiques et programmation.",
    linkSubClaude:
      "Excellente compréhension des diagrammes et pédagogie claire.",
    headingPrompt: "Instructions système et style pédagogique",
    subheadingPrompt:
      "Personnalisez des invites système dédiées pour les modèles Cloud et les modèles On-Device locaux.",
    cardCloudPromptTitle:
      "1. Invite système pour modèles Cloud (Gemini, OpenAI, Claude, DeepSeek)",
    cardCloudPromptDesc:
      "Optimisé pour les modèles de plusieurs centaines de milliards de paramètres, avec raisonnement pédagogique profond et vision.",
    cardNanoPromptTitle:
      "2. Invite système pour Chrome Gemini Nano (On-Device Local AI)",
    cardNanoPromptDesc:
      "Spécialement conçu pour le modèle local de ~3B paramètres. Concis, direct et priorise la vérification des faits réels.",
    btnResetPrompt: "Restaurer par défaut",
    btnSavePrompt: "Enregistrer l'invite Cloud",
    btnResetNanoPrompt: "Restaurer par défaut",
    btnSaveNanoPrompt: "Enregistrer l'invite Nano",
    headingGeneral: "Paramètres généraux & Langue",
    subheadingGeneral:
      "Gérez la langue de réponse, l’assistant Google Forms et la sauvegarde des données.",
    uiLangTitle: "Langue de l’interface (UI Language)",
    uiLangDesc:
      "Langue utilisée pour tous les boutons, volets latéraux et pages d’options.",
    respLangTitle: "Langue de réponse de l’IA",
    respLangDesc:
      "Langue dans laquelle l’IA répondra et expliquera les devoirs.",
    formsTitle: "Assistant approfondi Google Forms",
    formsDesc:
      "Détecte les questions sur Google Forms et propose un bouton d’analyse en un clic.",
    tooltipTitle: "Barre flottante au surlignage de texte",
    tooltipDesc:
      "Affiche la barre d’actions rapides lorsque vous surlignez du texte.",
    disabledSitesTitle: "Liste des sites désactivés",
    disabledSitesDesc: "L’extension sera totalement inactive sur ces domaines.",
    noDisabledSites: "Aucun site désactivé pour le moment.",
    backupTitle: "Sauvegarde & Gestion des données",
    backupDesc:
      "Exportez votre configuration en JSON ou effacez l’historique des discussions.",
    btnExport: "Exporter la configuration JSON",
    btnClearData: "Effacer tout l’historique",
    aboutTitle: "À propos & Informations",
    aboutDesc:
      "Homework Helper - Assistant IA d’aide aux devoirs et d’apprentissage académique.",
    keyPlaceholder: "Saisir la clé API",
    deleteKey: "Supprimer cette configuration",
    toastLangUpdated: "Langue d’affichage mise à jour avec succès !",
    toastPromptSaved: "Instructions système enregistrées avec succès !",
    toastDataCleared: "Tout l’historique des discussions a été supprimé !",
    stratPreferNanoTitle: "Préférer Gemini Nano",
    stratPreferNanoDesc: "Utilise Nano sur l'appareil pour le texte ; bascule automatiquement sur l'API Vision ou l'OCR pour les images.",
    stratPreferConfigTitle: "Préférer les modèles configurés (Recommandé)",
    stratPreferConfigDesc: "Utilise les clés API cloud ; bascule automatiquement sur Gemini Nano en cas de dépassement de quota ou d'erreur réseau.",
    stratNanoOnlyTitle: "Gemini Nano uniquement",
    stratNanoOnlyDesc:
      "100% gratuit et hors ligne, n’effectue aucun appel vers des API cloud externes.",
    stratConfigOnlyTitle: "API Cloud configurées uniquement",
    stratConfigOnlyDesc:
      "Utilise les clés API configurées ci-dessous avec rotation automatique.",
    builtinNanoTitle: "IA intégrée de Chrome (Gemini Nano On-Device)",
    builtinNanoDesc:
      "Modèle d’IA s’exécutant entièrement en local sur votre machine. Aucune clé API requise, gratuit et fonctionne hors ligne.",
    btnOpenFlags: "Ouvrir chrome://flags",
    btnTestBuiltinAI: "Tester le modèle intégré",
    guideNanoStepsTitle:
      "Comment activer Chrome Gemini Nano (Cliquez sur les liens pour ouvrir les drapeaux) :",
    guideNanoStep1:
      "Étape 1 : Ouvrez chrome://flags/#prompt-api-for-gemini-nano → Sélectionnez Enabled (ou Enabled Multilingual).",
    guideNanoStep2:
      "Étape 2 (Requis) : Ouvrez chrome://flags/#optimization-guide-on-device-model → Sélectionnez Enabled BypassPerfRequirement.",
    guideNanoStep3:
      "Étape 3 : Cliquez sur Relaunch (Relancer) en bas de Chrome pour appliquer les modifications.",
    guideNanoStep4:
      "Étape 4 (Télécharger le modèle) : Ouvrez chrome://components → Cherchez Optimization Guide On Device Model et cliquez sur Vérifier les mises à jour.",
    guideNanoStep5:
      'Étape 5 : Cliquez sur "Tester le modèle intégré" ci-dessus pour vérifier.',
    testConnection: "Tester la connexion",
    testingConnection: "Test en cours...",
    keyValid: "Clé valide et fonctionnelle",
    keyInvalid: "Échec de connexion :",
    enterKeyFirst: "Veuillez saisir une clé API avant de tester",
    statusReady: "Statut : Prêt",
    btnGetKeyGemini: "Obtenir la clé Gemini →",
    btnGetKeyGroq: "Obtenir la clé Groq →",
    btnGetKeyOpenAI: "Obtenir la clé OpenAI →",
    btnGetKeyDeepSeek: "Obtenir la clé DeepSeek →",
    btnGetKeyClaude: "Obtenir la clé Claude →",
  },
};
