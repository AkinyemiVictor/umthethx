import type { TranslationKey } from "./translations";

export type NoteMakerMode =
  | "general"
  | "smart"
  | "academic"
  | "medical"
  | "legal"
  | "business"
  | "engineering"
  | "finance"
  | "education"
  | "media";

export type NoteMakerItem = {
  mode: NoteMakerMode;
  subtype?: string;
  labelKey: TranslationKey;
};

export type NoteMakerGroup = {
  id: string;
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
  items: NoteMakerItem[];
};

export const noteMakerModeOptions: {
  value: NoteMakerMode;
  labelKey: TranslationKey;
}[] = [
  { value: "general", labelKey: "aiNoteMaker.typeGeneral" },
  { value: "smart", labelKey: "aiNoteMaker.typeSmart" },
  { value: "academic", labelKey: "aiNoteMaker.typeAcademic" },
  { value: "medical", labelKey: "aiNoteMaker.typeMedical" },
  { value: "legal", labelKey: "aiNoteMaker.typeLegal" },
  { value: "business", labelKey: "aiNoteMaker.typeBusiness" },
  { value: "engineering", labelKey: "aiNoteMaker.typeEngineering" },
  { value: "finance", labelKey: "aiNoteMaker.typeFinance" },
  { value: "education", labelKey: "aiNoteMaker.typeEducation" },
  { value: "media", labelKey: "aiNoteMaker.typeMedia" },
];

export const noteMakerSubtypeOptions: Record<
  Exclude<NoteMakerMode, "general" | "smart">,
  { value: string; labelKey: TranslationKey }[]
> = {
  academic: [
    { value: "thesis", labelKey: "aiNoteMaker.subtypeAcademicThesis" },
    { value: "research", labelKey: "aiNoteMaker.subtypeAcademicResearch" },
    { value: "literature", labelKey: "aiNoteMaker.subtypeAcademicLiterature" },
    { value: "lecture", labelKey: "aiNoteMaker.subtypeAcademicLecture" },
  ],
  medical: [
    { value: "clinical", labelKey: "aiNoteMaker.subtypeMedicalClinical" },
    { value: "case", labelKey: "aiNoteMaker.subtypeMedicalCase" },
    { value: "research", labelKey: "aiNoteMaker.subtypeMedicalResearch" },
    { value: "drug", labelKey: "aiNoteMaker.subtypeMedicalDrug" },
    { value: "study", labelKey: "aiNoteMaker.subtypeMedicalStudy" },
  ],
  legal: [
    { value: "case", labelKey: "aiNoteMaker.subtypeLegalCase" },
    { value: "contract", labelKey: "aiNoteMaker.subtypeLegalContract" },
    { value: "judgment", labelKey: "aiNoteMaker.subtypeLegalJudgment" },
    { value: "statute", labelKey: "aiNoteMaker.subtypeLegalStatute" },
    { value: "study", labelKey: "aiNoteMaker.subtypeLegalStudy" },
  ],
  business: [
    { value: "meeting", labelKey: "aiNoteMaker.subtypeBusinessMeeting" },
    { value: "market", labelKey: "aiNoteMaker.subtypeBusinessMarket" },
    { value: "strategy", labelKey: "aiNoteMaker.subtypeBusinessStrategy" },
    { value: "financial", labelKey: "aiNoteMaker.subtypeBusinessFinancial" },
  ],
  engineering: [
    { value: "docs", labelKey: "aiNoteMaker.subtypeEngineeringDocs" },
    { value: "design", labelKey: "aiNoteMaker.subtypeEngineeringDesign" },
    { value: "api", labelKey: "aiNoteMaker.subtypeEngineeringApi" },
    {
      value: "architecture",
      labelKey: "aiNoteMaker.subtypeEngineeringArchitecture",
    },
  ],
  finance: [
    { value: "report", labelKey: "aiNoteMaker.subtypeFinanceReport" },
    { value: "investment", labelKey: "aiNoteMaker.subtypeFinanceInvestment" },
    { value: "economic", labelKey: "aiNoteMaker.subtypeFinanceEconomic" },
    { value: "portfolio", labelKey: "aiNoteMaker.subtypeFinancePortfolio" },
  ],
  education: [
    { value: "textbook", labelKey: "aiNoteMaker.subtypeEducationTextbook" },
    { value: "exam", labelKey: "aiNoteMaker.subtypeEducationExam" },
    { value: "flashcards", labelKey: "aiNoteMaker.subtypeEducationFlashcards" },
    { value: "study", labelKey: "aiNoteMaker.subtypeEducationStudy" },
  ],
  media: [
    { value: "news", labelKey: "aiNoteMaker.subtypeMediaNews" },
    { value: "interview", labelKey: "aiNoteMaker.subtypeMediaInterview" },
    { value: "press", labelKey: "aiNoteMaker.subtypeMediaPress" },
    { value: "research", labelKey: "aiNoteMaker.subtypeMediaResearch" },
  ],
};

export const noteMakerGroups: NoteMakerGroup[] = [
  {
    id: "general",
    titleKey: "aiNoteMaker.group.general.title",
    descriptionKey: "aiNoteMaker.group.general.description",
    items: [
      { mode: "general", labelKey: "aiNoteMaker.typeGeneral" },
      { mode: "smart", labelKey: "aiNoteMaker.typeSmart" },
    ],
  },
  {
    id: "academic",
    titleKey: "aiNoteMaker.group.academic.title",
    descriptionKey: "aiNoteMaker.group.academic.description",
    items: noteMakerSubtypeOptions.academic.map((item) => ({
      mode: "academic",
      subtype: item.value,
      labelKey: item.labelKey,
    })),
  },
  {
    id: "medical",
    titleKey: "aiNoteMaker.group.medical.title",
    descriptionKey: "aiNoteMaker.group.medical.description",
    items: noteMakerSubtypeOptions.medical.map((item) => ({
      mode: "medical",
      subtype: item.value,
      labelKey: item.labelKey,
    })),
  },
  {
    id: "legal",
    titleKey: "aiNoteMaker.group.legal.title",
    descriptionKey: "aiNoteMaker.group.legal.description",
    items: noteMakerSubtypeOptions.legal.map((item) => ({
      mode: "legal",
      subtype: item.value,
      labelKey: item.labelKey,
    })),
  },
  {
    id: "business",
    titleKey: "aiNoteMaker.group.business.title",
    descriptionKey: "aiNoteMaker.group.business.description",
    items: noteMakerSubtypeOptions.business.map((item) => ({
      mode: "business",
      subtype: item.value,
      labelKey: item.labelKey,
    })),
  },
  {
    id: "engineering",
    titleKey: "aiNoteMaker.group.engineering.title",
    descriptionKey: "aiNoteMaker.group.engineering.description",
    items: noteMakerSubtypeOptions.engineering.map((item) => ({
      mode: "engineering",
      subtype: item.value,
      labelKey: item.labelKey,
    })),
  },
  {
    id: "finance",
    titleKey: "aiNoteMaker.group.finance.title",
    descriptionKey: "aiNoteMaker.group.finance.description",
    items: noteMakerSubtypeOptions.finance.map((item) => ({
      mode: "finance",
      subtype: item.value,
      labelKey: item.labelKey,
    })),
  },
  {
    id: "education",
    titleKey: "aiNoteMaker.group.education.title",
    descriptionKey: "aiNoteMaker.group.education.description",
    items: noteMakerSubtypeOptions.education.map((item) => ({
      mode: "education",
      subtype: item.value,
      labelKey: item.labelKey,
    })),
  },
  {
    id: "media",
    titleKey: "aiNoteMaker.group.media.title",
    descriptionKey: "aiNoteMaker.group.media.description",
    items: noteMakerSubtypeOptions.media.map((item) => ({
      mode: "media",
      subtype: item.value,
      labelKey: item.labelKey,
    })),
  },
];

const modeSet = new Set<NoteMakerMode>(
  noteMakerModeOptions.map((option) => option.value),
);

export const normalizeMode = (value?: string | null): NoteMakerMode =>
  value && modeSet.has(value as NoteMakerMode)
    ? (value as NoteMakerMode)
    : "general";
