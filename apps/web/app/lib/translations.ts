export type LanguageCode = "en" | "fr" | "es" | "de" | "pt" | "ar" | "af";

export const SUPPORTED_LANGUAGES: LanguageCode[] = [
  "en",
  "fr",
  "es",
  "de",
  "pt",
  "ar",
  "af",
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export type TranslationValues = Record<string, string | number>;

export const formatMessage = (
  message: string,
  values?: TranslationValues,
) =>
  message.replace(/\{(\w+)\}/g, (_, key) =>
    values && key in values ? String(values[key]) : "",
  );

export const translations = {
  en: {
    "common.stepLabel": "Step {number}",
    "header.converters": "Converters",
    "header.aiNoteMaker": "AI NoteMaker",
    "header.noteMakerTypes": "Notemaker",
    "header.toggleConvertersList": "Toggle converters list",
    "header.toggleMenu": "Toggle menu",
    "header.scrollMore": "Scroll to view more converters.",
    "footer.tagline": "AI-powered converters for images, documents, and more.",
    "footer.converters": "Converters",
    "footer.quickLinks": "Quick links",
    "footer.language": "Language",
    "footer.languageDescription":
      "Change the display language for the entire experience.",
    "footer.translateWithGoogle": "Translate with Google",
    "footer.translateWithGoogleDescription":
      "Open this page in Google Translate for more languages.",
    "footer.switchLanguageTo": "Switch language to {language}",
    "footer.terms": "Terms & Conditions",
    "footer.privacy": "Privacy Policy",
    "footer.refunds": "Refund Policy",
    "footer.contact": "Contact Us",
    "footer.copyright": "(c) 2026 Umthethx. All rights reserved.",
    "grid.title": "Converters",
    "grid.description": "Switch to another converter in one click.",
    "ads.label": "Advertisement slot",
    "ads.text": "Ad space",
    "aiNoteMaker.heroTag": "AI NoteMaker",
    "aiNoteMaker.title": "Turn long text into clear notes",
    "aiNoteMaker.subtitle": "Summarize paragraphs, transcripts, and reports into bullet points and action items.",
    "aiNoteMaker.inputLabel": "Your text",
    "aiNoteMaker.inputHint": "Paste text (or drop files)",
    "aiNoteMaker.inputPlaceholder": "Paste long text here...",
    "aiNoteMaker.suggestedLength": "Suggested length: 300 to 3000 words.",
    "aiNoteMaker.generate": "Generate notes",
    "aiNoteMaker.previewTitle": "Notes preview",
    "aiNoteMaker.previewBullet1": "Highlight the most important points in seconds.",
    "aiNoteMaker.previewBullet2": "Turn dense paragraphs into scannable bullets.",
    "aiNoteMaker.previewBullet3": "Capture action items without losing context.",
    "aiNoteMaker.previewTagSummary": "Summary",
    "aiNoteMaker.previewTagKeyPoints": "Key points",
    "aiNoteMaker.previewTagActionItems": "Action items",
    "aiNoteMaker.typeLabel": "Notemaker type",
    "aiNoteMaker.typeGridTitle": "Notemaker types",
    "aiNoteMaker.typeGridDescription":
      "Choose a note style tailored to your field.",
    "aiNoteMaker.subtypeLabel": "Focus",
    "aiNoteMaker.typeGeneral": "General",
    "aiNoteMaker.typeGeneral.description":
      "Quick notes for any document.",
    "aiNoteMaker.typeSmart": "Smart AI",
    "aiNoteMaker.typeSmart.description":
      "General notes with smart structure.",
    "aiNoteMaker.typeAcademic": "Academic",
    "aiNoteMaker.typeMedical": "Medical",
    "aiNoteMaker.typeLegal": "Legal",
    "aiNoteMaker.typeBusiness": "Business",
    "aiNoteMaker.typeEngineering": "Engineering",
    "aiNoteMaker.typeFinance": "Finance",
    "aiNoteMaker.typeEducation": "Education",
    "aiNoteMaker.typeMedia": "Media",
    "aiNoteMaker.group.general.title": "General",
    "aiNoteMaker.group.general.description":
      "Smart AI for any document.",
    "aiNoteMaker.group.academic.title": "Academic",
    "aiNoteMaker.group.academic.description":
      "Thesis, research, and lectures.",
    "aiNoteMaker.group.medical.title": "Medical",
    "aiNoteMaker.group.medical.description":
      "Clinical notes and study guides.",
    "aiNoteMaker.group.legal.title": "Legal",
    "aiNoteMaker.group.legal.description":
      "Cases, statutes, and contracts.",
    "aiNoteMaker.group.business.title": "Business",
    "aiNoteMaker.group.business.description":
      "Meetings, markets, and strategy.",
    "aiNoteMaker.group.engineering.title": "Engineering",
    "aiNoteMaker.group.engineering.description":
      "Docs, designs, and APIs.",
    "aiNoteMaker.group.finance.title": "Finance",
    "aiNoteMaker.group.finance.description":
      "Reports, investments, and trends.",
    "aiNoteMaker.group.education.title": "Education",
    "aiNoteMaker.group.education.description":
      "Projects, thesis, and note compression.",
    "aiNoteMaker.group.media.title": "Media",
    "aiNoteMaker.group.media.description":
      "News, interviews, and briefs.",
    "aiNoteMaker.subtypeAcademicThesis": "Thesis & Dissertation",
    "aiNoteMaker.subtypeAcademicThesis.description":
      "Capture research goals, methods, and findings.",
    "aiNoteMaker.subtypeAcademicResearch": "Research Paper",
    "aiNoteMaker.subtypeAcademicResearch.description":
      "Summarize studies with methods and results.",
    "aiNoteMaker.subtypeAcademicLiterature": "Literature Review",
    "aiNoteMaker.subtypeAcademicLiterature.description":
      "Track themes, gaps, and key sources.",
    "aiNoteMaker.subtypeAcademicLecture": "Lecture / Study Notes",
    "aiNoteMaker.subtypeAcademicLecture.description":
      "Clear lecture points for study and revision.",
    "aiNoteMaker.subtypeMedicalClinical": "Clinical Notes",
    "aiNoteMaker.subtypeMedicalClinical.description":
      "Symptoms, diagnosis, and treatment plans.",
    "aiNoteMaker.subtypeMedicalCase": "Patient Case Notes",
    "aiNoteMaker.subtypeMedicalCase.description":
      "Case context, findings, and outcomes.",
    "aiNoteMaker.subtypeMedicalResearch": "Medical Research Summary",
    "aiNoteMaker.subtypeMedicalResearch.description":
      "Medical studies with key results and limits.",
    "aiNoteMaker.subtypeMedicalDrug": "Drug Information Notes",
    "aiNoteMaker.subtypeMedicalDrug.description":
      "Indications, dosage, and cautions.",
    "aiNoteMaker.subtypeMedicalStudy": "Medical Study Guide",
    "aiNoteMaker.subtypeMedicalStudy.description":
      "Important terms and exam-focused points.",
    "aiNoteMaker.subtypeLegalCase": "Case Summary",
    "aiNoteMaker.subtypeLegalCase.description":
      "Facts, issues, holdings, and precedents.",
    "aiNoteMaker.subtypeLegalContract": "Contract Analysis",
    "aiNoteMaker.subtypeLegalContract.description":
      "Key clauses, risks, and obligations.",
    "aiNoteMaker.subtypeLegalJudgment": "Judgment Breakdown",
    "aiNoteMaker.subtypeLegalJudgment.description":
      "Decision reasoning and legal tests.",
    "aiNoteMaker.subtypeLegalStatute": "Statute Summary",
    "aiNoteMaker.subtypeLegalStatute.description":
      "Core provisions and applicability notes.",
    "aiNoteMaker.subtypeLegalStudy": "Law Study Notes",
    "aiNoteMaker.subtypeLegalStudy.description":
      "Doctrines, principles, and key cases.",
    "aiNoteMaker.subtypeBusinessMeeting": "Meeting Notes",
    "aiNoteMaker.subtypeBusinessMeeting.description":
      "Decisions, owners, and action items.",
    "aiNoteMaker.subtypeBusinessMarket": "Market Research Notes",
    "aiNoteMaker.subtypeBusinessMarket.description":
      "Trends, competitors, and insights.",
    "aiNoteMaker.subtypeBusinessStrategy": "Strategy Notes",
    "aiNoteMaker.subtypeBusinessStrategy.description":
      "Goals, initiatives, and risks.",
    "aiNoteMaker.subtypeBusinessFinancial": "Financial Report Breakdown",
    "aiNoteMaker.subtypeBusinessFinancial.description":
      "KPIs, performance, and takeaways.",
    "aiNoteMaker.subtypeEngineeringDocs": "Technical Documentation Notes",
    "aiNoteMaker.subtypeEngineeringDocs.description":
      "Summarize specs and implementation details.",
    "aiNoteMaker.subtypeEngineeringDesign": "System Design Notes",
    "aiNoteMaker.subtypeEngineeringDesign.description":
      "Architecture, trade-offs, and components.",
    "aiNoteMaker.subtypeEngineeringApi": "API Documentation Summary",
    "aiNoteMaker.subtypeEngineeringApi.description":
      "Endpoints, inputs, and outputs.",
    "aiNoteMaker.subtypeEngineeringArchitecture": "Architecture Notes",
    "aiNoteMaker.subtypeEngineeringArchitecture.description":
      "System structure and dependencies.",
    "aiNoteMaker.subtypeFinanceReport": "Financial Report Notes",
    "aiNoteMaker.subtypeFinanceReport.description":
      "Metrics, trends, and highlights.",
    "aiNoteMaker.subtypeFinanceInvestment": "Investment Research Summary",
    "aiNoteMaker.subtypeFinanceInvestment.description":
      "Thesis, risks, and upside drivers.",
    "aiNoteMaker.subtypeFinanceEconomic": "Economic Paper Summary",
    "aiNoteMaker.subtypeFinanceEconomic.description":
      "Models, assumptions, and conclusions.",
    "aiNoteMaker.subtypeFinancePortfolio": "Portfolio Analysis Notes",
    "aiNoteMaker.subtypeFinancePortfolio.description":
      "Allocation, risk, and performance.",
    "aiNoteMaker.subtypeEducationTextbook": "Textbook Chapter Notes",
    "aiNoteMaker.subtypeEducationTextbook.description":
      "Key concepts and definitions per chapter.",
    "aiNoteMaker.subtypeEducationExam": "Exam Revision Notes",
    "aiNoteMaker.subtypeEducationExam.description":
      "High-yield points and formulas.",
    "aiNoteMaker.subtypeEducationFlashcards": "Flashcards Generator",
    "aiNoteMaker.subtypeEducationFlashcards.description":
      "Turn concepts into Q&A cards.",
    "aiNoteMaker.subtypeEducationStudy": "Study Guide Generator",
    "aiNoteMaker.subtypeEducationStudy.description":
      "Structured study plan and summaries.",
    "aiNoteMaker.subtypeMediaNews": "News Article Summary",
    "aiNoteMaker.subtypeMediaNews.description":
      "Key facts, sources, and timeline.",
    "aiNoteMaker.subtypeMediaInterview": "Interview Notes",
    "aiNoteMaker.subtypeMediaInterview.description":
      "Quotes, themes, and highlights.",
    "aiNoteMaker.subtypeMediaPress": "Press Brief Summary",
    "aiNoteMaker.subtypeMediaPress.description":
      "Announcements and key messages.",
    "aiNoteMaker.subtypeMediaResearch": "Media Research Notes",
    "aiNoteMaker.subtypeMediaResearch.description":
      "Insights, context, and analysis.",
    "aiNoteMaker.detectedField": "Detected field: {field}",
    "aiNoteMaker.downloadNotes": "Download notes",
    "aiNoteMaker.backToInputs": "Back to inputs",
    "aiNoteMaker.supportedFormats": "Accepted formats: PDF, DOCX, TXT.",
    "aiNoteMaker.specsLabel": "Specs",
    "aiNoteMaker.notFoundLabel": "Not found.",
    "aiNoteMaker.errorEmpty": "Paste text or upload a document to generate notes.",
    "aiNoteMaker.errorTooShort": "Add a bit more text or upload a document.",
    "aiNoteMaker.errorRequestFailed": "Unable to generate notes right now.",
    "aiNoteMaker.noActionItems": "No action items detected yet.",
    "aiNoteMaker.howItWorks.title": "How it works",
    "aiNoteMaker.howItWorks.description": "A fast workflow from raw text to clean notes.",
    "aiNoteMaker.steps.paste.title": "Drop or paste your content",
    "aiNoteMaker.steps.paste.description": "Upload PDF, DOCX, or TXT files, or paste long text, transcripts, or reports.",
    "aiNoteMaker.steps.generate.title": "Generate notes",
    "aiNoteMaker.steps.generate.description": "Create summaries, bullet points, and action items.",
    "aiNoteMaker.steps.export.title": "Export and share",
    "aiNoteMaker.steps.export.description": "Copy, download, or keep refining your notes.",
    "home.howItWorks.title": "How it works",
    "home.howItWorks.description":
      "Convert files in minutes with a simple flow.",
    "home.steps.upload.title": "Upload your file",
    "home.steps.upload.description":
      "Drop or browse to select your document or image.",
    "home.steps.convert.title": "Convert instantly",
    "home.steps.convert.description":
      "We extract and convert with AI-powered processing.",
    "home.steps.download.title": "Download results",
    "home.steps.download.description":
      "Save or share your converted file immediately.",
    "converterPage.titleSuffix": "Converter",
    "converterPage.howItWorks.title": "How it works",
    "converterPage.howItWorks.description":
      "Simple steps to move from source files to finished results.",
    "converterPage.steps.drop.title": "Drop your file",
    "converterPage.steps.drop.description":
      "Drop files or browse your device to get started.",
    "converterPage.steps.convert.title": "Convert",
    "converterPage.steps.convert.description":
      "Convert to {outputLabel} in seconds.",
    "converterPage.steps.download.title": "Download results",
    "converterPage.steps.download.description":
      "Save, share, or continue working right away.",
    "converterPage.features.free": "Free to use",
    "converterPage.features.ai": "AI-based extraction",
    "converterPage.features.languages": "Supports multiple languages",
    "converterPage.supportedFormatsPlural":
      "Supported formats: {formats} and more.",
    "converterPage.supportedFormatsSingle": "Supported format: {formats}.",
    "workflow.dropLabel": "Drop, upload, or paste files",
    "workflow.browseFiles": "Upload file",
    "workflow.dragAndDrop": "or drag and drop",
    "workflow.noFilesSelected": "No files selected yet.",
    "workflow.selectedFiles": "Selected files",
    "workflow.results": "Results",
    "workflow.clearAll": "Clear all",
    "workflow.convertNow": "Convert now",
    "workflow.converted": "Converted",
    "workflow.uploading": "Uploading...",
    "workflow.processing": "Processing...",
    "workflow.processingLabel": "Processing",
    "workflow.download": "Download",
    "workflow.textPreviewTitle": "Extracted text",
    "workflow.copyText": "Copy text",
    "workflow.copied": "Copied!",
    "workflow.copyFailed": "Copy failed.",
    "workflow.previewLoading": "Loading text...",
    "workflow.previewFailed": "Unable to load text preview.",
    "workflow.fileLimit": "You can upload up to {count} files at once.",
    "workflow.selectFile": "Select a file to convert.",
    "workflow.uploadUrlError": "Failed to get upload URL.",
    "workflow.uploadFailed": "Upload failed. Try again.",
    "workflow.startFailed": "Failed to start conversion.",
    "workflow.conversionFailed": "Conversion failed.",
    "workflow.fetchStatusFailed": "Unable to fetch job status.",
    "workflow.removeFileAria": "Remove {filename}",
    "workflow.usageLabel": "{used} / {limit} conversions used",
    "workflow.usageRemaining": "{remaining} left in this window.",
    "workflow.usageInfo":
      "You have {limit} conversions in this period. Limit resets every {window} (max {size} total).",
    "workflow.usageBlocked": "Free conversion limit reached. Convert again in {time}.",
    "workflow.usageResets": "Resets in {time}.",
    "workflow.usageLoading": "Checking usage...",
    "theme.toggleLabel": "Toggle color mode",
    "theme.dark": "Dark",
    "theme.light": "Light",
  },
  fr: {
    "common.stepLabel": "Étape {number}",
    "header.converters": "Convertisseurs",
    "header.aiNoteMaker": "AI NoteMaker",
    "header.toggleConvertersList": "Afficher la liste des convertisseurs",
    "header.toggleMenu": "Toggle menu",
    "header.scrollMore": "Faites défiler pour voir plus de convertisseurs.",
    "footer.tagline":
      "Convertisseurs basés sur l’IA pour images, documents et plus.",
    "footer.converters": "Convertisseurs",
    "footer.quickLinks": "Liens rapides",
    "footer.language": "Langue",
    "footer.languageDescription":
      "Changez la langue d’affichage pour toute l’expérience.",
    "footer.switchLanguageTo": "Passer la langue à {language}",
    "footer.terms": "Conditions générales",
    "footer.privacy": "Politique de confidentialité",
    "footer.refunds": "Politique de remboursement",
    "footer.contact": "Nous contacter",
    "footer.copyright": "(c) 2026 Umthethx. Tous droits réservés.",
    "grid.title": "Convertisseurs",
    "grid.description": "Passez à un autre convertisseur en un clic.",
    "ads.label": "Emplacement publicitaire",
    "ads.text": "Espace publicitaire",
    "aiNoteMaker.heroTag": "AI NoteMaker",
    "aiNoteMaker.title": "Transformez les longs textes en notes claires",
    "aiNoteMaker.subtitle": "Resumez les paragraphes, transcriptions et rapports en puces et actions.",
    "aiNoteMaker.inputLabel": "Votre texte",
    "aiNoteMaker.inputHint": "Collez ou tapez",
    "aiNoteMaker.inputPlaceholder": "Collez un long texte ici...",
    "aiNoteMaker.suggestedLength": "Longueur suggeree : 300 a 3000 mots.",
    "aiNoteMaker.generate": "Generer des notes",
    "aiNoteMaker.previewTitle": "Apercu des notes",
    "aiNoteMaker.previewBullet1": "Mettez en avant les points les plus importants en quelques secondes.",
    "aiNoteMaker.previewBullet2": "Transformez des paragraphes denses en puces faciles a lire.",
    "aiNoteMaker.previewBullet3": "Capturez les actions sans perdre le contexte.",
    "aiNoteMaker.previewTagSummary": "Resume",
    "aiNoteMaker.previewTagKeyPoints": "Points cles",
    "aiNoteMaker.previewTagActionItems": "Actions",
    "aiNoteMaker.howItWorks.title": "Comment ca marche",
    "aiNoteMaker.howItWorks.description": "Un flux rapide du texte brut aux notes claires.",
    "aiNoteMaker.steps.paste.title": "Collez votre texte",
    "aiNoteMaker.steps.paste.description": "Deposez de longs paragraphes, transcriptions ou rapports.",
    "aiNoteMaker.steps.generate.title": "Generez des notes",
    "aiNoteMaker.steps.generate.description": "Creez des resumes, des puces et des actions.",
    "aiNoteMaker.steps.export.title": "Exporter et partager",
    "aiNoteMaker.steps.export.description": "Copiez, telechargez ou affinez vos notes.",
    "home.howItWorks.title": "Comment ça marche",
    "home.howItWorks.description":
      "Convertissez des fichiers en quelques minutes grâce à un flux simple.",
    "home.steps.upload.title": "Téléversez votre fichier",
    "home.steps.upload.description":
      "Déposez ou parcourez pour sélectionner votre document ou image.",
    "home.steps.convert.title": "Convertissez instantanément",
    "home.steps.convert.description":
      "Nous extrayons et convertissons grâce à un traitement alimenté par l’IA.",
    "home.steps.download.title": "Télécharger les résultats",
    "home.steps.download.description":
      "Enregistrez ou partagez votre fichier converti immédiatement.",
    "converterPage.titleSuffix": "Convertisseur",
    "converterPage.howItWorks.title": "Comment ça marche",
    "converterPage.howItWorks.description":
      "Des étapes simples pour passer des fichiers source aux résultats.",
    "converterPage.steps.drop.title": "Déposez votre fichier",
    "converterPage.steps.drop.description":
      "Déposez des fichiers ou parcourez votre appareil pour commencer.",
    "converterPage.steps.convert.title": "Convertir",
    "converterPage.steps.convert.description":
      "Convertissez en {outputLabel} en quelques secondes.",
    "converterPage.steps.download.title": "Télécharger les résultats",
    "converterPage.steps.download.description":
      "Enregistrez, partagez ou continuez à travailler tout de suite.",
    "converterPage.features.free": "Gratuit",
    "converterPage.features.ai": "Extraction basée sur l’IA",
    "converterPage.features.languages": "Prend en charge plusieurs langues",
    "converterPage.supportedFormatsPlural":
      "Formats pris en charge : {formats} et plus.",
    "converterPage.supportedFormatsSingle":
      "Format pris en charge : {formats}.",
    "workflow.dropLabel": "Déposer, téléverser ou coller des fichiers",
    "workflow.browseFiles": "Parcourir les fichiers",
    "workflow.dragAndDrop": "ou glisser-déposer",
    "workflow.noFilesSelected": "Aucun fichier sélectionné pour l’instant.",
    "workflow.selectedFiles": "Fichiers sélectionnés",
    "workflow.results": "Résultats",
    "workflow.clearAll": "Tout effacer",
    "workflow.convertNow": "Convertir",
    "workflow.converted": "Converti",
    "workflow.uploading": "Téléversement...",
    "workflow.processing": "Traitement...",
    "workflow.processingLabel": "Traitement",
    "workflow.download": "Télécharger",
    "workflow.textPreviewTitle": "Extracted text",
    "workflow.copyText": "Copy text",
    "workflow.copied": "Copied!",
    "workflow.copyFailed": "Copy failed.",
    "workflow.previewLoading": "Loading text...",
    "workflow.previewFailed": "Unable to load text preview.",
    "workflow.fileLimit":
      "Vous pouvez téléverser jusqu’à {count} fichiers à la fois.",
    "workflow.selectFile": "Sélectionnez un fichier à convertir.",
    "workflow.uploadUrlError":
      "Échec de la récupération de l’URL de téléversement.",
    "workflow.uploadFailed": "Le téléversement a échoué. Réessayez.",
    "workflow.startFailed": "Échec du démarrage de la conversion.",
    "workflow.conversionFailed": "La conversion a échoué.",
    "workflow.fetchStatusFailed":
      "Impossible de récupérer l’état du traitement.",
    "workflow.removeFileAria": "Supprimer {filename}",
    "theme.toggleLabel": "Basculer le mode couleur",
    "theme.dark": "Sombre",
    "theme.light": "Clair",
  },
  es: {
    "common.stepLabel": "Paso {number}",
    "header.converters": "Convertidores",
    "header.aiNoteMaker": "AI NoteMaker",
    "header.toggleConvertersList": "Mostrar lista de convertidores",
    "header.toggleMenu": "Toggle menu",
    "header.scrollMore": "Desplázate para ver más convertidores.",
    "footer.tagline":
      "Convertidores con IA para imágenes, documentos y más.",
    "footer.converters": "Convertidores",
    "footer.quickLinks": "Enlaces rápidos",
    "footer.language": "Idioma",
    "footer.languageDescription":
      "Cambia el idioma de visualización para toda la experiencia.",
    "footer.switchLanguageTo": "Cambiar idioma a {language}",
    "footer.terms": "Términos y condiciones",
    "footer.privacy": "Política de privacidad",
    "footer.refunds": "Política de reembolso",
    "footer.contact": "Contáctanos",
    "footer.copyright": "(c) 2026 Umthethx. Todos los derechos reservados.",
    "grid.title": "Convertidores",
    "grid.description": "Cambia a otro convertidor en un clic.",
    "ads.label": "Espacio publicitario",
    "ads.text": "Espacio publicitario",
    "aiNoteMaker.heroTag": "AI NoteMaker",
    "aiNoteMaker.title": "Convierte textos largos en notas claras",
    "aiNoteMaker.subtitle": "Resume parrafos, transcripciones e informes en vinetas y acciones.",
    "aiNoteMaker.inputLabel": "Tu texto",
    "aiNoteMaker.inputHint": "Pega o escribe",
    "aiNoteMaker.inputPlaceholder": "Pega texto largo aqui...",
    "aiNoteMaker.suggestedLength": "Longitud sugerida: 300 a 3000 palabras.",
    "aiNoteMaker.generate": "Generar notas",
    "aiNoteMaker.previewTitle": "Vista previa de notas",
    "aiNoteMaker.previewBullet1": "Destaca los puntos mas importantes en segundos.",
    "aiNoteMaker.previewBullet2": "Convierte parrafos densos en vinetas faciles de leer.",
    "aiNoteMaker.previewBullet3": "Captura acciones sin perder el contexto.",
    "aiNoteMaker.previewTagSummary": "Resumen",
    "aiNoteMaker.previewTagKeyPoints": "Puntos clave",
    "aiNoteMaker.previewTagActionItems": "Acciones",
    "aiNoteMaker.howItWorks.title": "Como funciona",
    "aiNoteMaker.howItWorks.description": "Un flujo rapido del texto en bruto a notas claras.",
    "aiNoteMaker.steps.paste.title": "Pega tu texto",
    "aiNoteMaker.steps.paste.description": "Coloca parrafos largos, transcripciones o informes.",
    "aiNoteMaker.steps.generate.title": "Genera notas",
    "aiNoteMaker.steps.generate.description": "Crea resumenes, vinetas y acciones.",
    "aiNoteMaker.steps.export.title": "Exporta y comparte",
    "aiNoteMaker.steps.export.description": "Copia, descarga o sigue refinando tus notas.",
    "home.howItWorks.title": "Cómo funciona",
    "home.howItWorks.description":
      "Convierte archivos en minutos con un flujo simple.",
    "home.steps.upload.title": "Sube tu archivo",
    "home.steps.upload.description":
      "Arrastra o busca para seleccionar tu documento o imagen.",
    "home.steps.convert.title": "Convierte al instante",
    "home.steps.convert.description":
      "Extraemos y convertimos con procesamiento impulsado por IA.",
    "home.steps.download.title": "Descarga los resultados",
    "home.steps.download.description":
      "Guarda o comparte tu archivo convertido de inmediato.",
    "converterPage.titleSuffix": "Convertidor",
    "converterPage.howItWorks.title": "Cómo funciona",
    "converterPage.howItWorks.description":
      "Pasos sencillos para pasar de los archivos de origen a los resultados.",
    "converterPage.steps.drop.title": "Suelta tu archivo",
    "converterPage.steps.drop.description":
      "Suelta archivos o explora tu dispositivo para comenzar.",
    "converterPage.steps.convert.title": "Convertir",
    "converterPage.steps.convert.description":
      "Convierte a {outputLabel} en segundos.",
    "converterPage.steps.download.title": "Descargar resultados",
    "converterPage.steps.download.description":
      "Guarda, comparte o sigue trabajando al instante.",
    "converterPage.features.free": "Gratis",
    "converterPage.features.ai": "Extracción basada en IA",
    "converterPage.features.languages": "Soporta varios idiomas",
    "converterPage.supportedFormatsPlural":
      "Formatos compatibles: {formats} y más.",
    "converterPage.supportedFormatsSingle": "Formato compatible: {formats}.",
    "workflow.dropLabel": "Suelta, sube o pega archivos",
    "workflow.browseFiles": "Examinar archivos",
    "workflow.dragAndDrop": "o arrastra y suelta",
    "workflow.noFilesSelected": "Aún no hay archivos seleccionados.",
    "workflow.selectedFiles": "Archivos seleccionados",
    "workflow.results": "Resultados",
    "workflow.clearAll": "Borrar todo",
    "workflow.convertNow": "Convertir ahora",
    "workflow.converted": "Convertido",
    "workflow.uploading": "Subiendo...",
    "workflow.processing": "Procesando...",
    "workflow.processingLabel": "Procesando",
    "workflow.download": "Descargar",
    "workflow.textPreviewTitle": "Extracted text",
    "workflow.copyText": "Copy text",
    "workflow.copied": "Copied!",
    "workflow.copyFailed": "Copy failed.",
    "workflow.previewLoading": "Loading text...",
    "workflow.previewFailed": "Unable to load text preview.",
    "workflow.fileLimit": "Puedes subir hasta {count} archivos a la vez.",
    "workflow.selectFile": "Selecciona un archivo para convertir.",
    "workflow.uploadUrlError": "No se pudo obtener la URL de subida.",
    "workflow.uploadFailed": "La subida falló. Inténtalo de nuevo.",
    "workflow.startFailed": "No se pudo iniciar la conversión.",
    "workflow.conversionFailed": "La conversión falló.",
    "workflow.fetchStatusFailed":
      "No se pudo obtener el estado del trabajo.",
    "workflow.removeFileAria": "Eliminar {filename}",
    "theme.toggleLabel": "Cambiar modo de color",
    "theme.dark": "Oscuro",
    "theme.light": "Claro",
  },
  de: {
    "common.stepLabel": "Schritt {number}",
    "header.converters": "Konverter",
    "header.aiNoteMaker": "AI NoteMaker",
    "header.toggleConvertersList": "Konverterliste umschalten",
    "header.toggleMenu": "Toggle menu",
    "header.scrollMore": "Zum Anzeigen weiterer Konverter scrollen.",
    "footer.tagline":
      "KI-gestützte Konverter für Bilder, Dokumente und mehr.",
    "footer.converters": "Konverter",
    "footer.quickLinks": "Schnelllinks",
    "footer.language": "Sprache",
    "footer.languageDescription":
      "Ändern Sie die Anzeigesprache für das gesamte Erlebnis.",
    "footer.switchLanguageTo": "Sprache wechseln zu {language}",
    "footer.terms": "Allgemeine Geschäftsbedingungen",
    "footer.privacy": "Datenschutzrichtlinie",
    "footer.refunds": "Rückerstattungsrichtlinie",
    "footer.contact": "Kontakt",
    "footer.copyright": "(c) 2026 Umthethx. Alle Rechte vorbehalten.",
    "grid.title": "Konverter",
    "grid.description":
      "Wechseln Sie mit einem Klick zu einem anderen Konverter.",
    "ads.label": "Werbefläche",
    "ads.text": "Werbefläche",
    "aiNoteMaker.heroTag": "AI NoteMaker",
    "aiNoteMaker.title": "Verwandle lange Texte in klare Notizen",
    "aiNoteMaker.subtitle": "Fasse Absatze, Transkripte und Berichte in Stichpunkten und Aufgaben zusammen.",
    "aiNoteMaker.inputLabel": "Dein Text",
    "aiNoteMaker.inputHint": "Einfugen oder tippen",
    "aiNoteMaker.inputPlaceholder": "Langen Text hier einfugen...",
    "aiNoteMaker.suggestedLength": "Empfohlene Lange: 300 bis 3000 Worter.",
    "aiNoteMaker.generate": "Notizen erstellen",
    "aiNoteMaker.previewTitle": "Notizvorschau",
    "aiNoteMaker.previewBullet1": "Hebe die wichtigsten Punkte in Sekunden hervor.",
    "aiNoteMaker.previewBullet2": "Verwandle dichte Absatze in scannbare Stichpunkte.",
    "aiNoteMaker.previewBullet3": "Erfasse Aufgaben, ohne den Kontext zu verlieren.",
    "aiNoteMaker.previewTagSummary": "Zusammenfassung",
    "aiNoteMaker.previewTagKeyPoints": "Schluesselpunkte",
    "aiNoteMaker.previewTagActionItems": "Aufgaben",
    "aiNoteMaker.howItWorks.title": "So funktioniert es",
    "aiNoteMaker.howItWorks.description": "Ein schneller Ablauf von Rohtext zu klaren Notizen.",
    "aiNoteMaker.steps.paste.title": "Text einfugen",
    "aiNoteMaker.steps.paste.description": "Fuge lange Absatze, Transkripte oder Berichte ein.",
    "aiNoteMaker.steps.generate.title": "Notizen erzeugen",
    "aiNoteMaker.steps.generate.description": "Erstelle Zusammenfassungen, Stichpunkte und Aufgaben.",
    "aiNoteMaker.steps.export.title": "Exportieren und teilen",
    "aiNoteMaker.steps.export.description": "Kopiere, lade herunter oder verfeinere deine Notizen.",
    "home.howItWorks.title": "So funktioniert’s",
    "home.howItWorks.description":
      "Konvertieren Sie Dateien in Minuten mit einem einfachen Ablauf.",
    "home.steps.upload.title": "Datei hochladen",
    "home.steps.upload.description":
      "Ablegen oder durchsuchen, um Ihr Dokument oder Bild auszuwählen.",
    "home.steps.convert.title": "Sofort konvertieren",
    "home.steps.convert.description":
      "Wir extrahieren und konvertieren mit KI-gestützter Verarbeitung.",
    "home.steps.download.title": "Ergebnisse herunterladen",
    "home.steps.download.description":
      "Speichern oder teilen Sie Ihre konvertierte Datei sofort.",
    "converterPage.titleSuffix": "Konverter",
    "converterPage.howItWorks.title": "So funktioniert’s",
    "converterPage.howItWorks.description":
      "Einfache Schritte vom Ausgangsfile zum Ergebnis.",
    "converterPage.steps.drop.title": "Datei ablegen",
    "converterPage.steps.drop.description":
      "Dateien ablegen oder Ihr Gerät durchsuchen, um zu starten.",
    "converterPage.steps.convert.title": "Konvertieren",
    "converterPage.steps.convert.description":
      "In wenigen Sekunden zu {outputLabel} konvertieren.",
    "converterPage.steps.download.title": "Ergebnisse herunterladen",
    "converterPage.steps.download.description":
      "Speichern, teilen oder sofort weiterarbeiten.",
    "converterPage.features.free": "Kostenlos",
    "converterPage.features.ai": "KI-basierte Extraktion",
    "converterPage.features.languages": "Unterstützt mehrere Sprachen",
    "converterPage.supportedFormatsPlural":
      "Unterstützte Formate: {formats} und mehr.",
    "converterPage.supportedFormatsSingle": "Unterstütztes Format: {formats}.",
    "workflow.dropLabel": "Dateien ablegen, hochladen oder einfügen",
    "workflow.browseFiles": "Dateien auswählen",
    "workflow.dragAndDrop": "oder per Drag-and-Drop",
    "workflow.noFilesSelected": "Noch keine Dateien ausgewählt.",
    "workflow.selectedFiles": "Ausgewählte Dateien",
    "workflow.results": "Ergebnisse",
    "workflow.clearAll": "Alle entfernen",
    "workflow.convertNow": "Jetzt konvertieren",
    "workflow.converted": "Konvertiert",
    "workflow.uploading": "Wird hochgeladen...",
    "workflow.processing": "Wird verarbeitet...",
    "workflow.processingLabel": "Verarbeitung",
    "workflow.download": "Herunterladen",
    "workflow.textPreviewTitle": "Extracted text",
    "workflow.copyText": "Copy text",
    "workflow.copied": "Copied!",
    "workflow.copyFailed": "Copy failed.",
    "workflow.previewLoading": "Loading text...",
    "workflow.previewFailed": "Unable to load text preview.",
    "workflow.fileLimit":
      "Sie können bis zu {count} Dateien gleichzeitig hochladen.",
    "workflow.selectFile": "Wählen Sie eine Datei zum Konvertieren aus.",
    "workflow.uploadUrlError": "Upload-URL konnte nicht abgerufen werden.",
    "workflow.uploadFailed": "Upload fehlgeschlagen. Bitte erneut versuchen.",
    "workflow.startFailed": "Konvertierung konnte nicht gestartet werden.",
    "workflow.conversionFailed": "Konvertierung fehlgeschlagen.",
    "workflow.fetchStatusFailed":
      "Job-Status konnte nicht abgerufen werden.",
    "workflow.removeFileAria": "{filename} entfernen",
    "theme.toggleLabel": "Farbmodus umschalten",
    "theme.dark": "Dunkel",
    "theme.light": "Hell",
  },
  pt: {
    "common.stepLabel": "Etapa {number}",
    "header.converters": "Conversores",
    "header.aiNoteMaker": "AI NoteMaker",
    "header.toggleConvertersList": "Alternar lista de conversores",
    "header.toggleMenu": "Toggle menu",
    "header.scrollMore": "Role para ver mais conversores.",
    "footer.tagline":
      "Conversores com IA para imagens, documentos e muito mais.",
    "footer.converters": "Conversores",
    "footer.quickLinks": "Links rápidos",
    "footer.language": "Idioma",
    "footer.languageDescription":
      "Altere o idioma de exibição para toda a experiência.",
    "footer.switchLanguageTo": "Mudar idioma para {language}",
    "footer.terms": "Termos e Condições",
    "footer.privacy": "Política de Privacidade",
    "footer.refunds": "Política de Reembolso",
    "footer.contact": "Fale conosco",
    "footer.copyright": "(c) 2026 Umthethx. Todos os direitos reservados.",
    "grid.title": "Conversores",
    "grid.description": "Mude para outro conversor com um clique.",
    "ads.label": "Espaço publicitário",
    "ads.text": "Espaço publicitário",
    "aiNoteMaker.heroTag": "AI NoteMaker",
    "aiNoteMaker.title": "Transforme textos longos em notas claras",
    "aiNoteMaker.subtitle": "Resuma paragrafos, transcricoes e relatorios em bullets e acoes.",
    "aiNoteMaker.inputLabel": "Seu texto",
    "aiNoteMaker.inputHint": "Cole ou digite",
    "aiNoteMaker.inputPlaceholder": "Cole um texto longo aqui...",
    "aiNoteMaker.suggestedLength": "Tamanho sugerido: 300 a 3000 palavras.",
    "aiNoteMaker.generate": "Gerar notas",
    "aiNoteMaker.previewTitle": "Previa das notas",
    "aiNoteMaker.previewBullet1": "Destaque os pontos mais importantes em segundos.",
    "aiNoteMaker.previewBullet2": "Transforme paragrafos densos em bullets faceis de ler.",
    "aiNoteMaker.previewBullet3": "Capture itens de acao sem perder o contexto.",
    "aiNoteMaker.previewTagSummary": "Resumo",
    "aiNoteMaker.previewTagKeyPoints": "Pontos-chave",
    "aiNoteMaker.previewTagActionItems": "Itens de acao",
    "aiNoteMaker.howItWorks.title": "Como funciona",
    "aiNoteMaker.howItWorks.description": "Um fluxo rapido do texto bruto a notas claras.",
    "aiNoteMaker.steps.paste.title": "Cole seu texto",
    "aiNoteMaker.steps.paste.description": "Cole paragrafos longos, transcricoes ou relatorios.",
    "aiNoteMaker.steps.generate.title": "Gere notas",
    "aiNoteMaker.steps.generate.description": "Crie resumos, bullets e acoes.",
    "aiNoteMaker.steps.export.title": "Exporte e compartilhe",
    "aiNoteMaker.steps.export.description": "Copie, baixe ou continue refinando suas notas.",
    "home.howItWorks.title": "Como funciona",
    "home.howItWorks.description":
      "Converta arquivos em minutos com um fluxo simples.",
    "home.steps.upload.title": "Envie seu arquivo",
    "home.steps.upload.description":
      "Arraste ou navegue para selecionar seu documento ou imagem.",
    "home.steps.convert.title": "Converta instantaneamente",
    "home.steps.convert.description":
      "Extraímos e convertemos com processamento baseado em IA.",
    "home.steps.download.title": "Baixe os resultados",
    "home.steps.download.description":
      "Salve ou compartilhe seu arquivo convertido imediatamente.",
    "converterPage.titleSuffix": "Conversor",
    "converterPage.howItWorks.title": "Como funciona",
    "converterPage.howItWorks.description":
      "Passos simples para ir dos arquivos de origem aos resultados.",
    "converterPage.steps.drop.title": "Solte seu arquivo",
    "converterPage.steps.drop.description":
      "Solte arquivos ou navegue no seu dispositivo para começar.",
    "converterPage.steps.convert.title": "Converter",
    "converterPage.steps.convert.description":
      "Converta para {outputLabel} em segundos.",
    "converterPage.steps.download.title": "Baixar resultados",
    "converterPage.steps.download.description":
      "Salve, compartilhe ou continue trabalhando imediatamente.",
    "converterPage.features.free": "Grátis",
    "converterPage.features.ai": "Extração baseada em IA",
    "converterPage.features.languages": "Compatível com vários idiomas",
    "converterPage.supportedFormatsPlural":
      "Formatos suportados: {formats} e mais.",
    "converterPage.supportedFormatsSingle": "Formato suportado: {formats}.",
    "workflow.dropLabel": "Solte, envie ou cole arquivos",
    "workflow.browseFiles": "Selecionar arquivos",
    "workflow.dragAndDrop": "ou arraste e solte",
    "workflow.noFilesSelected": "Nenhum arquivo selecionado ainda.",
    "workflow.selectedFiles": "Arquivos selecionados",
    "workflow.results": "Resultados",
    "workflow.clearAll": "Limpar tudo",
    "workflow.convertNow": "Converter agora",
    "workflow.converted": "Convertido",
    "workflow.uploading": "Enviando...",
    "workflow.processing": "Processando...",
    "workflow.processingLabel": "Processando",
    "workflow.download": "Baixar",
    "workflow.textPreviewTitle": "Extracted text",
    "workflow.copyText": "Copy text",
    "workflow.copied": "Copied!",
    "workflow.copyFailed": "Copy failed.",
    "workflow.previewLoading": "Loading text...",
    "workflow.previewFailed": "Unable to load text preview.",
    "workflow.fileLimit":
      "Você pode enviar até {count} arquivos de uma vez.",
    "workflow.selectFile": "Selecione um arquivo para converter.",
    "workflow.uploadUrlError": "Falha ao obter a URL de envio.",
    "workflow.uploadFailed": "Falha no envio. Tente novamente.",
    "workflow.startFailed": "Falha ao iniciar a conversão.",
    "workflow.conversionFailed": "A conversão falhou.",
    "workflow.fetchStatusFailed":
      "Não foi possível obter o status do trabalho.",
    "workflow.removeFileAria": "Remover {filename}",
    "theme.toggleLabel": "Alternar modo de cor",
    "theme.dark": "Escuro",
    "theme.light": "Claro",
  },
  ar: {
    "common.stepLabel": "الخطوة {number}",
    "header.converters": "المحوّلات",
    "header.aiNoteMaker": "AI NoteMaker",
    "header.toggleConvertersList": "تبديل قائمة المحوّلات",
    "header.toggleMenu": "Toggle menu",
    "header.scrollMore": "مرّر لعرض المزيد من المحوّلات.",
    "footer.tagline":
      "محوّلات مدعومة بالذكاء الاصطناعي للصور والمستندات وأكثر.",
    "footer.converters": "المحوّلات",
    "footer.quickLinks": "روابط سريعة",
    "footer.language": "اللغة",
    "footer.languageDescription": "غيّر لغة العرض للتجربة بالكامل.",
    "footer.switchLanguageTo": "تبديل اللغة إلى {language}",
    "footer.terms": "الشروط والأحكام",
    "footer.privacy": "سياسة الخصوصية",
    "footer.refunds": "سياسة الاسترداد",
    "footer.contact": "اتصل بنا",
    "footer.copyright": "(c) 2026 Umthethx. جميع الحقوق محفوظة.",
    "grid.title": "المحوّلات",
    "grid.description": "انتقل إلى محوّل آخر بنقرة واحدة.",
    "ads.label": "مساحة إعلانية",
    "ads.text": "مساحة إعلانية",
    "aiNoteMaker.heroTag": "???? ????????? ??????? ?????????",
    "aiNoteMaker.title": "???? ?????? ??????? ??? ??????? ?????",
    "aiNoteMaker.subtitle": "???? ??????? ?????????? ????????? ??? ???? ?????? ???.",
    "aiNoteMaker.inputLabel": "???",
    "aiNoteMaker.inputHint": "???? ?? ????",
    "aiNoteMaker.inputPlaceholder": "???? ???? ?????? ???...",
    "aiNoteMaker.suggestedLength": "????? ???????: ?? 300 ??? 3000 ????.",
    "aiNoteMaker.generate": "????? ???????",
    "aiNoteMaker.previewTitle": "?????? ?????????",
    "aiNoteMaker.previewBullet1": "???? ??? ?????? ???? ?????.",
    "aiNoteMaker.previewBullet2": "???? ??????? ??????? ??? ???? ???? ???????.",
    "aiNoteMaker.previewBullet3": "????? ????? ????? ??? ????? ??????.",
    "aiNoteMaker.previewTagSummary": "????",
    "aiNoteMaker.previewTagKeyPoints": "???? ??????",
    "aiNoteMaker.previewTagActionItems": "????? ?????",
    "aiNoteMaker.howItWorks.title": "??? ????",
    "aiNoteMaker.howItWorks.description": "???? ???? ?? ???? ????? ??? ??????? ?????.",
    "aiNoteMaker.steps.paste.title": "???? ???",
    "aiNoteMaker.steps.paste.description": "??? ????? ????? ?? ??????? ?? ??????.",
    "aiNoteMaker.steps.generate.title": "???? ???????",
    "aiNoteMaker.steps.generate.description": "???? ?????? ??????? ?????? ???.",
    "aiNoteMaker.steps.export.title": "???? ?????",
    "aiNoteMaker.steps.export.description": "???? ?? ???? ?? ???? ????? ????????.",
    "home.howItWorks.title": "كيف يعمل",
    "home.howItWorks.description":
      "حوّل الملفات خلال دقائق عبر سير عمل بسيط.",
    "home.steps.upload.title": "ارفع ملفك",
    "home.steps.upload.description":
      "اسحب أو تصفّح لاختيار مستندك أو صورتك.",
    "home.steps.convert.title": "حوّل فورًا",
    "home.steps.convert.description":
      "نستخرج ونحوّل باستخدام معالجة مدعومة بالذكاء الاصطناعي.",
    "home.steps.download.title": "نزّل النتائج",
    "home.steps.download.description":
      "احفظ أو شارك ملفك المحوّل فورًا.",
    "converterPage.titleSuffix": "محوّل",
    "converterPage.howItWorks.title": "كيف يعمل",
    "converterPage.howItWorks.description":
      "خطوات بسيطة للانتقال من ملفات المصدر إلى النتائج.",
    "converterPage.steps.drop.title": "أسقط ملفك",
    "converterPage.steps.drop.description":
      "أسقط الملفات أو تصفّح جهازك للبدء.",
    "converterPage.steps.convert.title": "حوّل",
    "converterPage.steps.convert.description":
      "حوّل إلى {outputLabel} خلال ثوانٍ.",
    "converterPage.steps.download.title": "نزّل النتائج",
    "converterPage.steps.download.description":
      "احفظ أو شارك أو واصل العمل فورًا.",
    "converterPage.features.free": "مجاني",
    "converterPage.features.ai": "استخراج بالذكاء الاصطناعي",
    "converterPage.features.languages": "يدعم عدة لغات",
    "converterPage.supportedFormatsPlural":
      "التنسيقات المدعومة: {formats} والمزيد.",
    "converterPage.supportedFormatsSingle": "التنسيق المدعوم: {formats}.",
    "workflow.dropLabel": "أسقط الملفات أو ارفعها أو الصقها",
    "workflow.browseFiles": "استعراض الملفات",
    "workflow.dragAndDrop": "أو اسحب وأفلت",
    "workflow.noFilesSelected": "لا توجد ملفات محددة بعد.",
    "workflow.selectedFiles": "الملفات المحددة",
    "workflow.results": "النتائج",
    "workflow.clearAll": "مسح الكل",
    "workflow.convertNow": "حوّل الآن",
    "workflow.converted": "تم التحويل",
    "workflow.uploading": "جارٍ الرفع...",
    "workflow.processing": "جارٍ المعالجة...",
    "workflow.processingLabel": "جارٍ المعالجة",
    "workflow.download": "تنزيل",
    "workflow.textPreviewTitle": "Extracted text",
    "workflow.copyText": "Copy text",
    "workflow.copied": "Copied!",
    "workflow.copyFailed": "Copy failed.",
    "workflow.previewLoading": "Loading text...",
    "workflow.previewFailed": "Unable to load text preview.",
    "workflow.fileLimit":
      "يمكنك رفع حتى {count} ملفات في المرة الواحدة.",
    "workflow.selectFile": "اختر ملفًا للتحويل.",
    "workflow.uploadUrlError": "تعذر الحصول على رابط الرفع.",
    "workflow.uploadFailed": "فشل الرفع. حاول مرة أخرى.",
    "workflow.startFailed": "تعذر بدء التحويل.",
    "workflow.conversionFailed": "فشل التحويل.",
    "workflow.fetchStatusFailed": "تعذر جلب حالة المهمة.",
    "workflow.removeFileAria": "إزالة {filename}",
    "theme.toggleLabel": "تبديل وضع الألوان",
    "theme.dark": "داكن",
    "theme.light": "فاتح",
  },
  af: {
    "footer.tagline":
      "KI-aangedrewe omskakelaars vir beelde, dokumente en meer.",
    "footer.converters": "Omskakelaars",
    "footer.quickLinks": "Vinnige skakels",
    "footer.language": "Taal",
    "footer.languageDescription":
      "Verander die vertoontaal vir die hele ervaring.",
    "footer.switchLanguageTo": "Verander taal na {language}",
    "footer.terms": "Bepalings en Voorwaardes",
    "footer.privacy": "Privaatheidsbeleid",
    "footer.refunds": "Terugbetalingsbeleid",
    "footer.contact": "Kontak Ons",
    "footer.copyright":
      "(c) 2026 Umthethx. Alle regte voorbehou.",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type Messages = Record<TranslationKey, string>;

export const getMessages = (lang: LanguageCode): Messages =>
  ({
    ...translations[DEFAULT_LANGUAGE],
    ...(translations[lang] ?? {}),
  }) as Messages;

export const getTranslator =
  (lang: LanguageCode) =>
  (key: TranslationKey, values?: TranslationValues) => {
    const messages = getMessages(lang);
    const fallback = translations[DEFAULT_LANGUAGE][key] ?? String(key);
    return formatMessage(messages[key] ?? fallback, values);
  };
