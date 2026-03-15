import type { TranslationKey } from "./translations";

export type NoteMakerCategoryIconName =
  | "general"
  | "academic"
  | "medical"
  | "legal"
  | "business"
  | "engineering"
  | "finance"
  | "education"
  | "media";

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
  descriptionKey?: TranslationKey;
};

export type NoteMakerGroup = {
  id: NoteMakerCategoryIconName;
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
  { value: string; labelKey: TranslationKey; descriptionKey: TranslationKey }[]
> = {
  academic: [
    {
      value: "thesis",
      labelKey: "aiNoteMaker.subtypeAcademicThesis",
      descriptionKey: "aiNoteMaker.subtypeAcademicThesis.description",
    },
    {
      value: "research",
      labelKey: "aiNoteMaker.subtypeAcademicResearch",
      descriptionKey: "aiNoteMaker.subtypeAcademicResearch.description",
    },
    {
      value: "literature",
      labelKey: "aiNoteMaker.subtypeAcademicLiterature",
      descriptionKey: "aiNoteMaker.subtypeAcademicLiterature.description",
    },
    {
      value: "lecture",
      labelKey: "aiNoteMaker.subtypeAcademicLecture",
      descriptionKey: "aiNoteMaker.subtypeAcademicLecture.description",
    },
  ],
  medical: [
    {
      value: "clinical",
      labelKey: "aiNoteMaker.subtypeMedicalClinical",
      descriptionKey: "aiNoteMaker.subtypeMedicalClinical.description",
    },
    {
      value: "case",
      labelKey: "aiNoteMaker.subtypeMedicalCase",
      descriptionKey: "aiNoteMaker.subtypeMedicalCase.description",
    },
    {
      value: "research",
      labelKey: "aiNoteMaker.subtypeMedicalResearch",
      descriptionKey: "aiNoteMaker.subtypeMedicalResearch.description",
    },
    {
      value: "drug",
      labelKey: "aiNoteMaker.subtypeMedicalDrug",
      descriptionKey: "aiNoteMaker.subtypeMedicalDrug.description",
    },
    {
      value: "study",
      labelKey: "aiNoteMaker.subtypeMedicalStudy",
      descriptionKey: "aiNoteMaker.subtypeMedicalStudy.description",
    },
  ],
  legal: [
    {
      value: "case",
      labelKey: "aiNoteMaker.subtypeLegalCase",
      descriptionKey: "aiNoteMaker.subtypeLegalCase.description",
    },
    {
      value: "contract",
      labelKey: "aiNoteMaker.subtypeLegalContract",
      descriptionKey: "aiNoteMaker.subtypeLegalContract.description",
    },
    {
      value: "judgment",
      labelKey: "aiNoteMaker.subtypeLegalJudgment",
      descriptionKey: "aiNoteMaker.subtypeLegalJudgment.description",
    },
    {
      value: "statute",
      labelKey: "aiNoteMaker.subtypeLegalStatute",
      descriptionKey: "aiNoteMaker.subtypeLegalStatute.description",
    },
    {
      value: "study",
      labelKey: "aiNoteMaker.subtypeLegalStudy",
      descriptionKey: "aiNoteMaker.subtypeLegalStudy.description",
    },
  ],
  business: [
    {
      value: "meeting",
      labelKey: "aiNoteMaker.subtypeBusinessMeeting",
      descriptionKey: "aiNoteMaker.subtypeBusinessMeeting.description",
    },
    {
      value: "market",
      labelKey: "aiNoteMaker.subtypeBusinessMarket",
      descriptionKey: "aiNoteMaker.subtypeBusinessMarket.description",
    },
    {
      value: "strategy",
      labelKey: "aiNoteMaker.subtypeBusinessStrategy",
      descriptionKey: "aiNoteMaker.subtypeBusinessStrategy.description",
    },
    {
      value: "financial",
      labelKey: "aiNoteMaker.subtypeBusinessFinancial",
      descriptionKey: "aiNoteMaker.subtypeBusinessFinancial.description",
    },
  ],
  engineering: [
    {
      value: "docs",
      labelKey: "aiNoteMaker.subtypeEngineeringDocs",
      descriptionKey: "aiNoteMaker.subtypeEngineeringDocs.description",
    },
    {
      value: "design",
      labelKey: "aiNoteMaker.subtypeEngineeringDesign",
      descriptionKey: "aiNoteMaker.subtypeEngineeringDesign.description",
    },
    {
      value: "api",
      labelKey: "aiNoteMaker.subtypeEngineeringApi",
      descriptionKey: "aiNoteMaker.subtypeEngineeringApi.description",
    },
    {
      value: "architecture",
      labelKey: "aiNoteMaker.subtypeEngineeringArchitecture",
      descriptionKey: "aiNoteMaker.subtypeEngineeringArchitecture.description",
    },
  ],
  finance: [
    {
      value: "report",
      labelKey: "aiNoteMaker.subtypeFinanceReport",
      descriptionKey: "aiNoteMaker.subtypeFinanceReport.description",
    },
    {
      value: "investment",
      labelKey: "aiNoteMaker.subtypeFinanceInvestment",
      descriptionKey: "aiNoteMaker.subtypeFinanceInvestment.description",
    },
    {
      value: "economic",
      labelKey: "aiNoteMaker.subtypeFinanceEconomic",
      descriptionKey: "aiNoteMaker.subtypeFinanceEconomic.description",
    },
    {
      value: "portfolio",
      labelKey: "aiNoteMaker.subtypeFinancePortfolio",
      descriptionKey: "aiNoteMaker.subtypeFinancePortfolio.description",
    },
  ],
  education: [
    {
      value: "textbook",
      labelKey: "aiNoteMaker.subtypeEducationTextbook",
      descriptionKey: "aiNoteMaker.subtypeEducationTextbook.description",
    },
    {
      value: "exam",
      labelKey: "aiNoteMaker.subtypeEducationExam",
      descriptionKey: "aiNoteMaker.subtypeEducationExam.description",
    },
    {
      value: "flashcards",
      labelKey: "aiNoteMaker.subtypeEducationFlashcards",
      descriptionKey: "aiNoteMaker.subtypeEducationFlashcards.description",
    },
    {
      value: "study",
      labelKey: "aiNoteMaker.subtypeEducationStudy",
      descriptionKey: "aiNoteMaker.subtypeEducationStudy.description",
    },
  ],
  media: [
    {
      value: "news",
      labelKey: "aiNoteMaker.subtypeMediaNews",
      descriptionKey: "aiNoteMaker.subtypeMediaNews.description",
    },
    {
      value: "interview",
      labelKey: "aiNoteMaker.subtypeMediaInterview",
      descriptionKey: "aiNoteMaker.subtypeMediaInterview.description",
    },
    {
      value: "press",
      labelKey: "aiNoteMaker.subtypeMediaPress",
      descriptionKey: "aiNoteMaker.subtypeMediaPress.description",
    },
    {
      value: "research",
      labelKey: "aiNoteMaker.subtypeMediaResearch",
      descriptionKey: "aiNoteMaker.subtypeMediaResearch.description",
    },
  ],
};

export const noteMakerGroups: NoteMakerGroup[] = [
  {
    id: "general",
    titleKey: "aiNoteMaker.group.general.title",
    descriptionKey: "aiNoteMaker.group.general.description",
    items: [
      {
        mode: "smart",
        labelKey: "aiNoteMaker.typeSmart",
        descriptionKey: "aiNoteMaker.typeSmart.description",
      },
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
      descriptionKey: item.descriptionKey,
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
      descriptionKey: item.descriptionKey,
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
      descriptionKey: item.descriptionKey,
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
      descriptionKey: item.descriptionKey,
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
      descriptionKey: item.descriptionKey,
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
      descriptionKey: item.descriptionKey,
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
      descriptionKey: item.descriptionKey,
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
      descriptionKey: item.descriptionKey,
    })),
  },
];

const modeSet = new Set<NoteMakerMode>(
  noteMakerModeOptions.map((option) => option.value),
);

export const normalizeMode = (value?: string | null): NoteMakerMode =>
  value && modeSet.has(value as NoteMakerMode)
    ? (value as NoteMakerMode)
    : "smart";
