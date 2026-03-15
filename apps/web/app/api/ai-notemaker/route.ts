import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import JSZip from "jszip";

type DomainKey =
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

const DOMAIN_VALUES = new Set<DomainKey>([
  "general",
  "smart",
  "academic",
  "medical",
  "legal",
  "business",
  "engineering",
  "finance",
  "education",
  "media",
]);

const normalizeMode = (value: DomainKey | string | undefined) =>
  value && DOMAIN_VALUES.has(value as DomainKey)
    ? (value as DomainKey)
    : "general";

export const runtime = "nodejs";

type NotesResponse = {
  notes: string;
  field?: DomainKey;
};

const MIN_WORDS = 30;
const REDUCTION_RATIO = 0.5;
const MAX_FILES = 5;

const ACCEPTED_EXTENSIONS = new Set(["pdf", "docx", "txt"]);
const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "had",
  "he",
  "her",
  "his",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "no",
  "not",
  "of",
  "on",
  "or",
  "our",
  "she",
  "so",
  "such",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "was",
  "we",
  "were",
  "will",
  "with",
  "you",
  "your",
]);

const DOMAIN_KEYWORDS: Record<Exclude<DomainKey, "smart">, string[]> = {
  general: [],
  academic: [
    "thesis",
    "dissertation",
    "literature",
    "methodology",
    "hypothesis",
    "research",
    "citation",
    "abstract",
  ],
  medical: [
    "patient",
    "clinical",
    "diagnosis",
    "symptom",
    "treatment",
    "therapy",
    "medication",
    "dosage",
    "mg",
    "icd",
  ],
  legal: [
    "court",
    "judgment",
    "plaintiff",
    "defendant",
    "statute",
    "section",
    "act",
    "contract",
    "case",
    "v.",
  ],
  business: [
    "market",
    "revenue",
    "strategy",
    "kpi",
    "stakeholder",
    "profit",
    "meeting",
    "forecast",
  ],
  engineering: [
    "architecture",
    "system",
    "api",
    "implementation",
    "specification",
    "module",
    "performance",
    "scalability",
  ],
  finance: [
    "balance sheet",
    "income statement",
    "cash flow",
    "investment",
    "portfolio",
    "equity",
    "bond",
    "inflation",
    "interest rate",
  ],
  education: [
    "curriculum",
    "lesson",
    "exam",
    "study",
    "learning outcomes",
    "assessment",
  ],
  media: [
    "interview",
    "press",
    "headline",
    "reporter",
    "quote",
    "timeline",
    "breaking",
  ],
};

const DOMAIN_SECTIONS: Record<
  Exclude<DomainKey, "general" | "smart">,
  { title: string; keywords: string[] }[]
> = {
  academic: [
    { title: "Research Topic", keywords: ["topic", "research", "study"] },
    {
      title: "Problem Statement",
      keywords: ["problem", "gap", "challenge", "issue"],
    },
    {
      title: "Objectives / Hypotheses",
      keywords: ["objective", "aim", "goal", "hypothesis"],
    },
    { title: "Methodology", keywords: ["method", "methodology", "design"] },
    {
      title: "Key Findings",
      keywords: ["finding", "result", "outcome", "evidence"],
    },
    {
      title: "Contributions",
      keywords: ["contribution", "significance", "novel"],
    },
    { title: "Limitations", keywords: ["limitation", "constraint"] },
    {
      title: "Future Research",
      keywords: ["future", "further research", "next steps"],
    },
    { title: "Key Terminology", keywords: ["definition", "term", "concept"] },
    {
      title: "Citations / References",
      keywords: ["citation", "reference", "doi", "et al", "journal", "source"],
    },
  ],
  medical: [
    { title: "Clinical Context", keywords: ["clinical", "history", "context"] },
    { title: "Symptoms / Conditions", keywords: ["symptom", "condition"] },
    { title: "Diagnostic Findings", keywords: ["diagnosis", "diagnostic"] },
    {
      title: "Treatment / Recommendations",
      keywords: ["treatment", "therapy", "recommendation", "plan"],
    },
    { title: "Medications", keywords: ["medication", "drug", "dosage"] },
    { title: "Key Terms", keywords: ["term", "definition"] },
  ],
  legal: [
    { title: "Case Name", keywords: ["v.", "vs.", "case"] },
    { title: "Facts", keywords: ["fact", "background"] },
    { title: "Legal Issues", keywords: ["issue", "question"] },
    {
      title: "Applicable Laws",
      keywords: ["statute", "act", "section", "regulation", "article"],
    },
    { title: "Arguments", keywords: ["argument", "claim", "submission"] },
    { title: "Decision", keywords: ["held", "decision", "judgment", "ruled"] },
    {
      title: "Reasoning",
      keywords: ["reason", "analysis", "considered"],
    },
    { title: "Precedents", keywords: ["precedent", "authority", "case"] },
  ],
  business: [
    { title: "Report Focus", keywords: ["report", "summary", "overview"] },
    { title: "Key Insights", keywords: ["insight", "highlight", "key"] },
    { title: "Market Trends", keywords: ["market", "trend", "demand"] },
    { title: "Financial Highlights", keywords: ["revenue", "profit", "kpi"] },
    { title: "Risks", keywords: ["risk", "challenge", "threat"] },
    {
      title: "Recommendations",
      keywords: ["recommend", "strategy", "opportunity"],
    },
    { title: "Action Points", keywords: ["action", "next steps", "plan"] },
  ],
  engineering: [
    { title: "System / Technology", keywords: ["system", "technology"] },
    { title: "Core Concepts", keywords: ["concept", "principle"] },
    { title: "Architecture Overview", keywords: ["architecture", "design"] },
    {
      title: "Implementation Notes",
      keywords: ["implementation", "algorithm", "approach"],
    },
    { title: "Key Components", keywords: ["component", "module", "service"] },
    { title: "Advantages / Limitations", keywords: ["advantage", "limitation"] },
  ],
  finance: [
    { title: "Report Focus", keywords: ["report", "overview"] },
    { title: "Key Metrics", keywords: ["metric", "ratio", "margin"] },
    { title: "Trends", keywords: ["trend", "growth", "decline"] },
    { title: "Risks", keywords: ["risk", "volatility"] },
    { title: "Forecasts", keywords: ["forecast", "projection", "outlook"] },
    { title: "Investment Insights", keywords: ["investment", "portfolio"] },
  ],
  education: [
    { title: "Key Concepts", keywords: ["concept", "idea", "theme"] },
    { title: "Definitions", keywords: ["definition", "term"] },
    { title: "Principles / Formulas", keywords: ["principle", "formula"] },
    { title: "Exam Takeaways", keywords: ["exam", "question", "remember"] },
  ],
  media: [
    { title: "Key Facts", keywords: ["fact", "reported", "confirmed"] },
    { title: "Timeline", keywords: ["timeline", "when", "date"] },
    { title: "Quotes", keywords: ["quote", "\"", "said"] },
    { title: "Stakeholders", keywords: ["stakeholder", "source", "official"] },
    { title: "Implications", keywords: ["impact", "implication", "effect"] },
  ],
};

type SectionDef = {
  title: string;
  keywords: string[];
  required?: boolean;
  useCitations?: boolean;
  limit?: number;
};

const DEFAULT_SECTION_LIMIT = 6;

const DOMAIN_SPECS: Record<
  Exclude<DomainKey, "general" | "smart">,
  string[]
> = {
  academic: [
    "Research focus and objectives",
    "Methodology and evidence",
    "Key findings and contributions",
    "Limitations and future work",
    "Citations / references",
  ],
  medical: [
    "Clinical context and symptoms",
    "Diagnostic findings",
    "Treatment plan and medications",
    "Key medical terms",
  ],
  legal: [
    "Case facts and issues",
    "Applicable laws and precedents",
    "Rulings and reasoning",
  ],
  business: [
    "Key insights and decisions",
    "KPIs, risks, and action items",
  ],
  engineering: [
    "System overview and components",
    "Architecture and implementation notes",
    "Constraints and trade-offs",
  ],
  finance: [
    "Key metrics and trends",
    "Risks and outlook",
  ],
  education: [
    "Key concepts and definitions",
    "Study notes and review points",
  ],
  media: [
    "Key facts and timeline",
    "Quotes and implications",
  ],
};

const SUBTYPE_SPECS: Record<
  Exclude<DomainKey, "general" | "smart">,
  Record<string, string[]>
> = {
  academic: {
    thesis: [
      "Research topic and problem statement",
      "Objectives / hypotheses",
      "Methodology and data",
      "Key findings and contributions",
      "Limitations and future work",
      "Citations / references",
    ],
    research: [
      "Research question",
      "Methods and results",
      "Key conclusions",
      "Citations / references",
    ],
    literature: [
      "Themes and trends",
      "Key sources",
      "Research gaps",
      "Synthesis / conclusions",
      "Citations / references",
    ],
    lecture: [
      "Key concepts",
      "Definitions / formulas",
      "Study takeaways",
    ],
  },
  medical: {
    clinical: [
      "Presenting complaint and history",
      "Symptoms / vitals",
      "Diagnosis",
      "Treatment plan",
      "Medications and dosage",
    ],
    case: [
      "Case context",
      "Findings",
      "Interventions",
      "Outcome and follow-up",
    ],
    research: [
      "Study design",
      "Population / sample",
      "Key results",
      "Clinical implications",
      "Limitations",
    ],
    drug: [
      "Indications",
      "Dosage and route",
      "Contraindications",
      "Side effects",
      "Interactions",
    ],
    study: [
      "Key terms",
      "Disease mechanisms",
      "High-yield points",
      "Treatment summary",
    ],
  },
  legal: {
    case: [
      "Case name and court",
      "Facts and issues",
      "Holding",
      "Reasoning",
      "Precedents",
    ],
    contract: [
      "Parties and scope",
      "Key clauses",
      "Obligations",
      "Risks",
      "Termination terms",
    ],
    judgment: [
      "Decision",
      "Legal tests",
      "Reasoning",
      "Orders",
      "Precedents",
    ],
    statute: [
      "Purpose and scope",
      "Key sections",
      "Definitions",
      "Penalties / remedies",
      "Application notes",
    ],
    study: [
      "Core doctrines",
      "Elements / tests",
      "Leading cases",
    ],
  },
  business: {
    meeting: [
      "Agenda and decisions",
      "Action items",
      "Owners and deadlines",
    ],
    market: [
      "Market size and trends",
      "Competitors",
      "Customer insights",
    ],
    strategy: [
      "Objectives",
      "Initiatives",
      "KPIs",
      "Risks",
    ],
    financial: [
      "KPIs and performance",
      "Revenue / cost drivers",
      "Outlook",
    ],
  },
  engineering: {
    docs: [
      "System overview",
      "Key components",
      "Interfaces",
      "Implementation notes",
    ],
    design: [
      "Requirements",
      "Architecture",
      "Trade-offs",
      "Risks",
    ],
    api: [
      "Endpoints",
      "Inputs / outputs",
      "Authentication",
      "Errors / limits",
    ],
    architecture: [
      "System diagram references",
      "Dependencies",
      "Scalability",
      "Constraints",
    ],
  },
  finance: {
    report: [
      "Statements summary",
      "Key metrics",
      "Trends",
      "Risks",
    ],
    investment: [
      "Thesis",
      "Catalysts",
      "Valuation",
      "Risks",
    ],
    economic: [
      "Research question",
      "Model / method",
      "Findings",
      "Implications",
    ],
    portfolio: [
      "Allocation",
      "Performance",
      "Risk exposure",
      "Rebalancing notes",
    ],
  },
  education: {
    textbook: [
      "Chapter outline",
      "Key concepts",
      "Definitions",
      "Review points",
    ],
    exam: [
      "High-yield topics",
      "Formulas",
      "Common pitfalls",
      "Quick review",
    ],
    flashcards: [
      "Q&A pairs",
      "Key terms",
      "Definitions",
    ],
    study: [
      "Study plan",
      "Key concepts",
      "Practice focus",
    ],
  },
  media: {
    news: [
      "Key facts",
      "Timeline",
      "Sources",
      "Impact",
    ],
    interview: [
      "Key quotes",
      "Themes",
      "Notable claims",
    ],
    press: [
      "Announcement summary",
      "Key messages",
      "Dates / contacts",
    ],
    research: [
      "Background",
      "Findings",
      "Context",
      "Implications",
    ],
  },
};

const SUBTYPE_SECTION_OVERRIDES: Record<
  Exclude<DomainKey, "general" | "smart">,
  Record<string, SectionDef[]>
> = {
  academic: {
    thesis: [
      { title: "Research Topic", keywords: ["topic", "research"], required: true },
      {
        title: "Problem Statement",
        keywords: ["problem", "gap", "challenge", "issue"],
        required: true,
      },
      {
        title: "Objectives / Hypotheses",
        keywords: ["objective", "aim", "goal", "hypothesis"],
        required: true,
      },
      { title: "Methodology", keywords: ["method", "methodology", "design"], required: true },
      { title: "Key Findings", keywords: ["finding", "result", "outcome"], required: true },
      { title: "Contributions", keywords: ["contribution", "significance", "novel"], required: true },
      { title: "Limitations", keywords: ["limitation", "constraint"], required: true },
      { title: "Future Research", keywords: ["future", "further research"], required: true },
      {
        title: "Citations / References",
        keywords: ["citation", "reference", "doi", "et al", "journal"],
        required: true,
        useCitations: true,
      },
    ],
    research: [
      { title: "Research Topic", keywords: ["topic", "research"], required: true },
      { title: "Methodology", keywords: ["method", "methodology", "design"], required: true },
      { title: "Key Findings", keywords: ["finding", "result", "outcome"], required: true },
      { title: "Limitations", keywords: ["limitation", "constraint"], required: true },
      {
        title: "Citations / References",
        keywords: ["citation", "reference", "doi", "et al", "journal"],
        required: true,
        useCitations: true,
      },
    ],
    literature: [
      { title: "Themes", keywords: ["theme", "trend", "pattern"], required: true },
      { title: "Key Sources", keywords: ["source", "author", "study"], required: true },
      { title: "Research Gaps", keywords: ["gap", "limited", "future"], required: true },
      { title: "Synthesis", keywords: ["synthesis", "summary", "conclusion"], required: true },
      {
        title: "Citations / References",
        keywords: ["citation", "reference", "doi", "et al", "journal"],
        required: true,
        useCitations: true,
      },
    ],
    lecture: [
      { title: "Key Concepts", keywords: ["concept", "idea", "principle"], required: true },
      { title: "Definitions / Formulas", keywords: ["definition", "formula", "equation"], required: true },
      { title: "Study Takeaways", keywords: ["takeaway", "remember", "exam"], required: true },
    ],
  },
  medical: {
    clinical: [
      { title: "Clinical Context", keywords: ["history", "context", "presentation"], required: true },
      { title: "Symptoms / Conditions", keywords: ["symptom", "condition"], required: true },
      { title: "Diagnostic Findings", keywords: ["diagnosis", "diagnostic", "lab", "imaging"], required: true },
      { title: "Treatment / Recommendations", keywords: ["treatment", "therapy", "plan"], required: true },
      { title: "Medications", keywords: ["medication", "drug", "dosage"], required: true },
    ],
    case: [
      { title: "Case Context", keywords: ["case", "history", "presentation"], required: true },
      { title: "Findings", keywords: ["finding", "result", "exam"], required: true },
      { title: "Interventions", keywords: ["intervention", "procedure", "treatment"], required: true },
      { title: "Outcome / Follow-up", keywords: ["outcome", "follow-up", "recovery"], required: true },
    ],
    research: [
      { title: "Study Design", keywords: ["study", "design", "trial"], required: true },
      { title: "Population / Sample", keywords: ["population", "sample", "cohort"], required: true },
      { title: "Key Results", keywords: ["result", "finding", "outcome"], required: true },
      { title: "Clinical Implications", keywords: ["implication", "clinical", "practice"], required: true },
      { title: "Limitations", keywords: ["limitation", "constraint"], required: true },
    ],
    drug: [
      { title: "Indications", keywords: ["indication", "use", "treat"], required: true },
      { title: "Dosage / Route", keywords: ["dose", "dosage", "route"], required: true },
      { title: "Contraindications", keywords: ["contraindication", "avoid"], required: true },
      { title: "Side Effects", keywords: ["side effect", "adverse"], required: true },
      { title: "Interactions", keywords: ["interaction", "contra", "combine"], required: true },
    ],
    study: [
      { title: "Key Terms", keywords: ["term", "definition"], required: true },
      { title: "Mechanisms", keywords: ["mechanism", "pathway"], required: true },
      { title: "High-Yield Points", keywords: ["high-yield", "exam", "remember"], required: true },
    ],
  },
  legal: {
    case: [
      { title: "Case Name", keywords: ["v.", "vs.", "case"], required: true },
      { title: "Facts", keywords: ["fact", "background"], required: true },
      { title: "Legal Issues", keywords: ["issue", "question"], required: true },
      { title: "Applicable Laws", keywords: ["statute", "act", "section"], required: true },
      { title: "Decision", keywords: ["held", "decision", "judgment"], required: true },
      { title: "Reasoning", keywords: ["reason", "analysis"], required: true },
      { title: "Precedents", keywords: ["precedent", "authority", "case"], required: true },
    ],
    contract: [
      { title: "Parties", keywords: ["party", "parties", "seller", "buyer"], required: true },
      { title: "Scope", keywords: ["scope", "services", "deliverable"], required: true },
      { title: "Key Clauses", keywords: ["clause", "term", "condition"], required: true },
      { title: "Obligations", keywords: ["obligation", "duty", "shall"], required: true },
      { title: "Risks", keywords: ["risk", "liability", "indemn"], required: true },
      { title: "Termination", keywords: ["termination", "terminate", "expiry"], required: true },
    ],
    judgment: [
      { title: "Decision", keywords: ["decision", "judgment", "order"], required: true },
      { title: "Legal Tests", keywords: ["test", "standard", "criteria"], required: true },
      { title: "Reasoning", keywords: ["reason", "analysis"], required: true },
      { title: "Orders", keywords: ["order", "remedy", "relief"], required: true },
      { title: "Precedents", keywords: ["precedent", "authority", "case"], required: true },
    ],
    statute: [
      { title: "Purpose", keywords: ["purpose", "aim", "intent"], required: true },
      { title: "Key Sections", keywords: ["section", "article", "provision"], required: true },
      { title: "Definitions", keywords: ["definition", "means", "interpretation"], required: true },
      { title: "Penalties / Remedies", keywords: ["penalty", "fine", "remedy"], required: true },
      { title: "Application Notes", keywords: ["apply", "scope", "jurisdiction"], required: true },
    ],
    study: [
      { title: "Doctrines / Principles", keywords: ["doctrine", "principle"], required: true },
      { title: "Elements / Tests", keywords: ["element", "test", "standard"], required: true },
      { title: "Key Cases", keywords: ["case", "precedent"], required: true },
    ],
  },
  business: {
    meeting: [
      { title: "Agenda", keywords: ["agenda", "topic"], required: true },
      { title: "Decisions", keywords: ["decision", "agreed"], required: true },
      { title: "Action Items", keywords: ["action", "next steps"], required: true },
      { title: "Owners / Deadlines", keywords: ["owner", "due", "deadline"], required: true },
    ],
    market: [
      { title: "Market Overview", keywords: ["market", "overview"], required: true },
      { title: "Trends", keywords: ["trend", "growth", "decline"], required: true },
      { title: "Competitors", keywords: ["competitor", "rival"], required: true },
      { title: "Customer Insights", keywords: ["customer", "buyer", "segment"], required: true },
      { title: "Opportunities", keywords: ["opportunity", "gap", "potential"], required: true },
    ],
    strategy: [
      { title: "Objectives", keywords: ["objective", "goal"], required: true },
      { title: "Initiatives", keywords: ["initiative", "strategy"], required: true },
      { title: "KPIs", keywords: ["kpi", "metric"], required: true },
      { title: "Risks", keywords: ["risk", "challenge"], required: true },
    ],
    financial: [
      { title: "Key Metrics", keywords: ["kpi", "metric", "margin"], required: true },
      { title: "Performance Drivers", keywords: ["driver", "revenue", "cost"], required: true },
      { title: "Risks", keywords: ["risk", "volatility"], required: true },
      { title: "Outlook", keywords: ["outlook", "forecast", "guidance"], required: true },
    ],
  },
  engineering: {
    docs: [
      { title: "System Overview", keywords: ["system", "overview"], required: true },
      { title: "Key Components", keywords: ["component", "module", "service"], required: true },
      { title: "Interfaces", keywords: ["interface", "api", "endpoint"], required: true },
      { title: "Implementation Notes", keywords: ["implementation", "algorithm"], required: true },
    ],
    design: [
      { title: "Requirements", keywords: ["requirement", "need"], required: true },
      { title: "Architecture", keywords: ["architecture", "design"], required: true },
      { title: "Trade-offs", keywords: ["trade-off", "tradeoff", "decision"], required: true },
      { title: "Risks", keywords: ["risk", "constraint"], required: true },
    ],
    api: [
      { title: "Endpoints", keywords: ["endpoint", "route"], required: true },
      { title: "Inputs / Outputs", keywords: ["request", "response", "payload"], required: true },
      { title: "Authentication", keywords: ["auth", "token", "key"], required: true },
      { title: "Errors / Limits", keywords: ["error", "limit", "rate"], required: true },
    ],
    architecture: [
      { title: "Components", keywords: ["component", "service", "module"], required: true },
      { title: "Data Flow", keywords: ["data flow", "pipeline"], required: true },
      { title: "Scalability", keywords: ["scale", "scalability"], required: true },
      { title: "Constraints", keywords: ["constraint", "limit"], required: true },
    ],
  },
  finance: {
    report: [
      { title: "Statements Summary", keywords: ["balance sheet", "income", "cash flow"], required: true },
      { title: "Key Metrics", keywords: ["metric", "ratio", "margin"], required: true },
      { title: "Trends", keywords: ["trend", "growth", "decline"], required: true },
      { title: "Risks", keywords: ["risk", "volatility"], required: true },
      { title: "Outlook", keywords: ["outlook", "forecast"], required: true },
    ],
    investment: [
      { title: "Thesis", keywords: ["thesis", "rationale"], required: true },
      { title: "Catalysts", keywords: ["catalyst", "driver"], required: true },
      { title: "Valuation", keywords: ["valuation", "multiple", "price"], required: true },
      { title: "Risks", keywords: ["risk", "downside"], required: true },
    ],
    economic: [
      { title: "Research Question", keywords: ["question", "objective"], required: true },
      { title: "Model / Method", keywords: ["model", "method", "approach"], required: true },
      { title: "Findings", keywords: ["finding", "result"], required: true },
      { title: "Implications", keywords: ["implication", "policy"], required: true },
    ],
    portfolio: [
      { title: "Allocation", keywords: ["allocation", "weight"], required: true },
      { title: "Performance", keywords: ["performance", "return"], required: true },
      { title: "Risk Exposure", keywords: ["risk", "exposure", "volatility"], required: true },
      { title: "Rebalancing Notes", keywords: ["rebalance", "adjust"], required: true },
    ],
  },
  education: {
    textbook: [
      { title: "Chapter Outline", keywords: ["chapter", "outline"], required: true },
      { title: "Key Concepts", keywords: ["concept", "idea"], required: true },
      { title: "Definitions", keywords: ["definition", "term"], required: true },
      { title: "Review Points", keywords: ["review", "remember"], required: true },
    ],
    exam: [
      { title: "High-Yield Topics", keywords: ["high-yield", "important"], required: true },
      { title: "Formulas", keywords: ["formula", "equation"], required: true },
      { title: "Common Pitfalls", keywords: ["pitfall", "mistake"], required: true },
      { title: "Quick Review", keywords: ["quick", "summary"], required: true },
    ],
    flashcards: [
      { title: "Q&A", keywords: ["question", "answer"], required: true },
      { title: "Key Terms", keywords: ["term", "definition"], required: true },
      { title: "Definitions", keywords: ["definition", "means"], required: true },
    ],
    study: [
      { title: "Study Plan", keywords: ["plan", "schedule"], required: true },
      { title: "Key Concepts", keywords: ["concept", "idea"], required: true },
      { title: "Practice Focus", keywords: ["practice", "exercise"], required: true },
    ],
  },
  media: {
    news: [
      { title: "Key Facts", keywords: ["fact", "reported", "confirmed"], required: true },
      { title: "Timeline", keywords: ["timeline", "date"], required: true },
      { title: "Sources", keywords: ["source", "official"], required: true },
      { title: "Implications", keywords: ["impact", "implication"], required: true },
    ],
    interview: [
      { title: "Key Quotes", keywords: ["quote", "\"", "said"], required: true },
      { title: "Themes", keywords: ["theme", "topic"], required: true },
      { title: "Notable Claims", keywords: ["claim", "statement"], required: true },
    ],
    press: [
      { title: "Announcement Summary", keywords: ["announce", "launch", "release"], required: true },
      { title: "Key Messages", keywords: ["message", "highlight"], required: true },
      { title: "Dates / Contacts", keywords: ["date", "contact", "email"], required: true },
    ],
    research: [
      { title: "Background", keywords: ["background", "context"], required: true },
      { title: "Findings", keywords: ["finding", "result"], required: true },
      { title: "Context", keywords: ["context", "environment"], required: true },
      { title: "Implications", keywords: ["impact", "implication"], required: true },
    ],
  },
};

const getSectionDefinitions = (
  domain: Exclude<DomainKey, "general" | "smart">,
  subtypeValue: string,
): SectionDef[] => {
  const subtypeKey = subtypeValue.toLowerCase();
  const override = SUBTYPE_SECTION_OVERRIDES[domain]?.[subtypeKey];
  if (override?.length) {
    return override;
  }
  return DOMAIN_SECTIONS[domain].map((section) => ({
    ...section,
    useCitations:
      domain === "academic" && section.title === "Citations / References",
  }));
};

const normalizeWhitespace = (value: string) =>
  value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

type Section = {
  title: string;
  level: number;
  lines: string[];
  children: Section[];
  preserveLines?: boolean;
};

type HeadingMatch = {
  title: string;
  level: number;
  preserveLines?: boolean;
};

const splitSentences = (text: string) => {
  const normalized = text.trim();
  if (!normalized) return [];
  const lines = normalized
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sentences: string[] = [];
  const sentenceRegex = /[^.!?]+[.!?]+|[^.!?]+$/g;
  for (const line of lines) {
    const matches = line.match(sentenceRegex);
    if (matches) {
      matches
        .map((segment) => segment.trim())
        .filter(Boolean)
        .forEach((segment) => sentences.push(segment));
    }
  }
  return sentences.length ? sentences : [normalized];
};

const tokenize = (value: string) =>
  value.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];

const stemToken = (value: string) => {
  let word = value.toLowerCase();
  if (word.length > 7 && word.endsWith("ments")) {
    word = word.slice(0, -5);
  } else if (word.length > 6 && word.endsWith("ment")) {
    word = word.slice(0, -4);
  }
  if (word.length > 6 && (word.endsWith("tion") || word.endsWith("sion"))) {
    word = word.slice(0, -3);
  }
  if (word.length > 5 && word.endsWith("ing")) {
    word = word.slice(0, -3);
  }
  if (word.length > 4 && word.endsWith("ies")) {
    word = word.slice(0, -3);
  }
  if (word.length > 4 && word.endsWith("ed")) {
    word = word.slice(0, -2);
  }
  if (word.length > 4 && word.endsWith("es")) {
    word = word.slice(0, -2);
  }
  if (word.length > 3 && word.endsWith("s")) {
    word = word.slice(0, -1);
  }
  return word;
};

const buildTokenData = (value: string) => {
  const tokens = tokenize(value);
  return {
    tokens,
    tokenSet: new Set(tokens),
    stemSet: new Set(tokens.map((token) => stemToken(token))),
  };
};

const boundedEditDistance = (a: string, b: string, maxDist: number) => {
  const aLen = a.length;
  const bLen = b.length;
  if (Math.abs(aLen - bLen) > maxDist) return maxDist + 1;
  const prev = new Array(bLen + 1);
  const curr = new Array(bLen + 1);
  for (let j = 0; j <= bLen; j += 1) {
    prev[j] = j;
  }
  for (let i = 1; i <= aLen; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    const aChar = a[i - 1];
    for (let j = 1; j <= bLen; j += 1) {
      const cost = aChar === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDist) return maxDist + 1;
    for (let j = 0; j <= bLen; j += 1) {
      prev[j] = curr[j];
    }
  }
  return prev[bLen];
};

const isSimilarToken = (keyword: string, token: string) => {
  if (keyword === token) return true;
  if (keyword.length <= 2 || token.length <= 2) return false;
  const maxDist = keyword.length <= 5 ? 1 : 2;
  if (Math.abs(keyword.length - token.length) > maxDist) return false;
  return boundedEditDistance(keyword, token, maxDist) <= maxDist;
};

const keywordMatchesText = (
  keyword: string,
  textLower: string,
  tokenData: { tokens: string[]; tokenSet: Set<string>; stemSet: Set<string> },
) => {
  const normalized = keyword.toLowerCase();
  if (!normalized) return false;
  if (normalized.includes(" ")) {
    return textLower.includes(normalized);
  }
  if (tokenData.tokenSet.has(normalized)) return true;
  const stem = stemToken(normalized);
  if (tokenData.stemSet.has(stem)) return true;
  return tokenData.tokens.some((token) => isSimilarToken(normalized, token));
};

const countWords = (value: string) => tokenize(value).length;

const getFileExtension = (name: string) =>
  name.split(".").pop()?.toLowerCase() ?? "";

const isAcceptedFile = (file: File) => {
  const ext = getFileExtension(file.name);
  if (ACCEPTED_EXTENSIONS.has(ext)) return true;
  if (file.type && ACCEPTED_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }
  return false;
};

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");

const extractTextFromPdf = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return parsed.text?.trim() ?? "";
};

const extractTextFromTxt = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("utf8").trim();
};

const extractTextFromDocx = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) {
    throw new Error("DOCX document.xml not found.");
  }
  const xml = await docFile.async("string");
  const withBreaks = xml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeXmlEntities(stripped);
  return normalizeWhitespace(decoded);
};

const buildFrequencyMap = (text: string) => {
  const freq = new Map<string, number>();
  for (const word of tokenize(text)) {
    if (STOP_WORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return freq;
};

const scoreSentences = (sentences: string[], freq: Map<string, number>) =>
  sentences.map((sentence, index) => {
    const words = tokenize(sentence).filter((word) => !STOP_WORDS.has(word));
    if (!words.length) return { index, score: 0 };
    const score =
      words.reduce((sum, word) => sum + (freq.get(word) ?? 0), 0) /
      words.length;
    return { index, score };
  });

const pickTopIndices = (
  scores: Array<{ index: number; score: number }>,
  count: number,
  exclude = new Set<number>(),
) => {
  const ranked = scores
    .filter((entry) => !exclude.has(entry.index))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map((entry) => entry.index)
    .sort((a, b) => a - b);
  return ranked;
};

const removalPatterns = [
  /learning activities?/i,
  /learning activity/i,
  /self[- ]assessment/i,
  /activity feedback/i,
];

const examplePatterns = [
  /\bfor example\b/i,
  /\be\.g\.\b/i,
  /\bfor instance\b/i,
  /\bsuch as\b/i,
  /\bexample\b/i,
  /\billustration\b/i,
  /\bcase study\b/i,
];

const diagramPatterns = [
  /\bfigure\b/i,
  /\bfig\.\b/i,
  /\bdiagram\b/i,
  /\btable\b/i,
  /\bchart\b/i,
  /\bexhibit\b/i,
];

const tocEntryPattern = /(\.{2,}|\s{2,}\d+)\s*$/;

const isRemovalHeading = (value: string) =>
  removalPatterns.some((pattern) => pattern.test(value));

const isExampleSentence = (value: string) =>
  examplePatterns.some((pattern) => pattern.test(value));

const isDiagramReference = (value: string) =>
  diagramPatterns.some((pattern) => pattern.test(value));

const isPageMarker = (value: string) =>
  /^(page|pg\.?|p\.|pp\.)\s*\d+(\s*[-–]\s*\d+)?$/i.test(value);

const isLikelyPageNumber = (value: string) =>
  /^\d{1,4}$/.test(value);

const isBulletLine = (value: string) =>
  /^(\d+\.|[a-z]\)|[\-*•])\s+/.test(value);

const stripBulletPrefix = (value: string) =>
  value.replace(/^(\d+\.|[a-z]\)|[\-*•])\s+/, "").trim();

const isCaseReference = (value: string) =>
  /\b[A-Z][A-Za-z.'&-]+ v\.? [A-Z][A-Za-z.'&-]+/g.test(value) ||
  /\bvs\.\b/i.test(value) ||
  /\bIn re\b/i.test(value);

const isLegislationReference = (value: string) =>
  /\b(Act|Code|Statute|Regulation|Regulations|Constitution|Law|Decree|Ordinance)\b/i.test(
    value,
  ) ||
  /\b(Section|Article)\s+\d+[A-Za-z0-9-]*/i.test(value);

const annotateBullet = (value: string) => {
  if (isCaseReference(value)) {
    return `CASE: ${value}`;
  }
  if (isLegislationReference(value)) {
    return `LEGISLATION: ${value}`;
  }
  if (isDiagramReference(value)) {
    return `DIAGRAM: ${value}`;
  }
  return value;
};

const citationSignals = [
  /doi:/i,
  /\bdoi\b/i,
  /\bISBN\b/i,
  /\bISSN\b/i,
  /\bvol\.?\b/i,
  /\bno\.?\b/i,
  /\bpp\.\b/i,
  /\bRetrieved from\b/i,
  /\bAvailable at\b/i,
  /https?:\/\//i,
];
const citationYearPattern = /\b(19|20)\d{2}\b/;
const citationNumberedPattern = /^\[\d+\]/;
const citationAuthorPattern = /^[A-Z][A-Za-z-]+,?\s+[A-Z]/;

const isCitationLine = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.length > 220) {
    return false;
  }
  if (citationNumberedPattern.test(trimmed)) return true;
  if (citationSignals.some((pattern) => pattern.test(trimmed))) return true;
  if (citationYearPattern.test(trimmed) && citationAuthorPattern.test(trimmed)) {
    return true;
  }
  return false;
};

const extractCitations = (text: string) => {
  const lines = text.split(/\r?\n+/);
  const seen = new Set<string>();
  const citations: string[] = [];
  lines.forEach((line) => {
    if (!isCitationLine(line)) return;
    const cleaned = normalizeWhitespace(line);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) return;
    seen.add(key);
    citations.push(cleaned);
  });
  return citations;
};

const DOMAIN_TITLES: Record<Exclude<DomainKey, "smart">, string> = {
  general: "General Notes",
  academic: "Academic Notes",
  medical: "Medical Notes",
  legal: "Legal Notes",
  business: "Business Notes",
  engineering: "Engineering Notes",
  finance: "Finance Notes",
  education: "Education Notes",
  media: "Media Notes",
};

const countKeywordHitsWithTokens = (
  keywords: string[],
  textLower: string,
  tokenData: { tokens: string[]; tokenSet: Set<string>; stemSet: Set<string> },
) =>
  keywords.reduce((count, keyword) => {
    if (keywordMatchesText(keyword, textLower, tokenData)) {
      return count + 1;
    }
    return count;
  }, 0);

const countKeywordHits = (text: string, keywords: string[]) => {
  const normalized = text.toLowerCase();
  const tokenData = buildTokenData(normalized);
  return countKeywordHitsWithTokens(keywords, normalized, tokenData);
};

const detectDomain = (text: string): Exclude<DomainKey, "smart"> => {
  const candidates = Object.entries(DOMAIN_KEYWORDS).filter(
    ([key]) => key !== "general",
  ) as Array<[Exclude<DomainKey, "general" | "smart">, string[]]>;
  const normalized = text.toLowerCase();
  const tokenData = buildTokenData(normalized);
  let best: Exclude<DomainKey, "smart"> = "general";
  let bestScore = 0;
  for (const [domain, keywords] of candidates) {
    const score = countKeywordHitsWithTokens(keywords, normalized, tokenData);
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }
  if (bestScore === 0) {
    return "general";
  }
  return best;
};

const shouldSkipSentence = (sentence: string) => {
  if (
    isExampleSentence(sentence) &&
    !isCaseReference(sentence) &&
    !isLegislationReference(sentence) &&
    !isDiagramReference(sentence)
  ) {
    return true;
  }
  return false;
};

const buildDomainBlock = (
  domain: Exclude<DomainKey, "general" | "smart">,
  subtypeValue: string,
  subtypeLabel: string,
  text: string,
  specsLabel: string,
  missingLabel: string,
) => {
  const sections = getSectionDefinitions(domain, subtypeValue);
  if (!sections?.length) return "";
  const heading = subtypeLabel
    ? `${DOMAIN_TITLES[domain]} — ${subtypeLabel}`
    : DOMAIN_TITLES[domain];
  const sentences = splitSentences(text)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean)
    .filter((sentence) => !shouldSkipSentence(sentence));
  const sentenceEntries = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    return {
      sentence,
      lower,
      tokenData: buildTokenData(lower),
    };
  });
  const citations = extractCitations(text);

  const lines: string[] = [heading];
  const subtypeKey = subtypeValue.toLowerCase();
  const specs =
    (subtypeKey && SUBTYPE_SPECS[domain]?.[subtypeKey]) ||
    DOMAIN_SPECS[domain] ||
    [];

  if (specs.length) {
    lines.push(specsLabel);
    specs.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  sections.forEach((section) => {
    const bullets: string[] = [];
    if (section.useCitations) {
      citations.forEach((citation) => bullets.push(citation));
    } else {
      const seen = new Set<string>();
      const keywords = section.keywords.map((keyword) => keyword.toLowerCase());
      sentenceEntries.forEach(({ sentence, lower, tokenData }) => {
        if (!keywords.some((keyword) => keywordMatchesText(keyword, lower, tokenData))) {
          return;
        }
        const normalized = lower.trim();
        if (seen.has(normalized)) return;
        seen.add(normalized);
        bullets.push(annotateBullet(sentence));
      });
    }
    if (bullets.length) {
      lines.push(section.title);
      const limit = section.limit ?? DEFAULT_SECTION_LIMIT;
      bullets.slice(0, limit).forEach((bullet) => {
        lines.push(`- ${bullet}`);
      });
    } else if (section.required) {
      lines.push(section.title);
      lines.push(`- ${missingLabel}`);
    }
  });

  return lines.length > 1 ? lines.join("\n") : "";
};

const detectHeading = (
  line: string,
  prevBlank: boolean,
): HeadingMatch | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (isBulletLine(trimmed)) return null;

  if (/^table of contents$/i.test(trimmed)) {
    return { title: trimmed, level: 1, preserveLines: true };
  }
  if (/^chapter\s+\d+/i.test(trimmed)) {
    return { title: trimmed, level: 1 };
  }
  if (/^part\s+\d+/i.test(trimmed)) {
    return { title: trimmed, level: 1 };
  }
  if (/^(learning\s+unit|unit)\s+\d+/i.test(trimmed)) {
    return { title: trimmed, level: 2 };
  }
  if (/^module\s+\d+/i.test(trimmed)) {
    return { title: trimmed, level: 2 };
  }

  const numericMatch = trimmed.match(/^(\d+(?:\.\d+)+)\s+/);
  if (numericMatch) {
    const depth = numericMatch[1]?.split(".").length ?? 2;
    return { title: trimmed, level: Math.min(6, depth + 1) };
  }
  if (/^\d+\s+[^.]/.test(trimmed)) {
    return { title: trimmed, level: 2 };
  }
  if (/^[IVXLC]+\.\s+/i.test(trimmed)) {
    return { title: trimmed, level: 2 };
  }
  if (/^section\s+\d+/i.test(trimmed)) {
    return { title: trimmed, level: 3 };
  }
  if (/^article\s+\d+/i.test(trimmed)) {
    return { title: trimmed, level: 3 };
  }
  if (/^[A-Z][A-Z0-9\s:&-]{3,}$/.test(trimmed)) {
    return { title: trimmed, level: 2 };
  }
  if (
    prevBlank &&
    /^[A-Z][A-Za-z0-9 ,:&()/-]{3,}$/.test(trimmed) &&
    trimmed.length <= 80
  ) {
    return { title: trimmed, level: 3 };
  }

  return null;
};

const summarizeSentences = (sentences: string[]) => {
  if (!sentences.length) return [];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(sentence);
  }
  if (unique.length <= 2) {
    return unique;
  }
  const freq = buildFrequencyMap(unique.join(" "));
  const scores = scoreSentences(unique, freq);
  const keepCount = Math.min(
    12,
    Math.max(1, Math.round(unique.length * REDUCTION_RATIO)),
  );
  const keepIndices = new Set(pickTopIndices(scores, keepCount));

  const mustKeep = new Set(
    unique
      .filter(
        (sentence) =>
          isCaseReference(sentence) ||
          isLegislationReference(sentence) ||
          isDiagramReference(sentence),
      )
      .map((sentence) => sentence.toLowerCase()),
  );

  const selected: string[] = [];
  unique.forEach((sentence, index) => {
    const normalized = sentence.toLowerCase();
    if (keepIndices.has(index) || mustKeep.has(normalized)) {
      selected.push(sentence);
    }
  });
  return selected;
};

const buildSectionBullets = (section: Section) => {
  const bullets: string[] = [];
  if (section.preserveLines) {
    section.lines.forEach((line) => {
      if (isRemovalHeading(line)) return;
      const normalized = normalizeWhitespace(line);
      if (normalized) {
        bullets.push(annotateBullet(normalized));
      }
    });
    return bullets;
  }

  const paragraphLines: string[] = [];
  section.lines.forEach((line) => {
    if (isRemovalHeading(line)) return;
    if (isPageMarker(line) || isLikelyPageNumber(line)) {
      bullets.push(annotateBullet(line));
      return;
    }
    if (isDiagramReference(line)) {
      bullets.push(annotateBullet(line));
      return;
    }
    if (isBulletLine(line)) {
      const cleaned = stripBulletPrefix(line);
      if (cleaned) {
        bullets.push(annotateBullet(cleaned));
      }
      return;
    }
    paragraphLines.push(line);
  });

  const paragraphText = normalizeWhitespace(paragraphLines.join(" "));
  if (!paragraphText) {
    return bullets;
  }

  const sentences = splitSentences(paragraphText)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean)
    .filter((sentence) => {
      if (
        isExampleSentence(sentence) &&
        !isCaseReference(sentence) &&
        !isLegislationReference(sentence) &&
        !isDiagramReference(sentence)
      ) {
        return false;
      }
      return true;
    });

  const summarized = summarizeSentences(sentences);
  summarized.forEach((sentence) => {
    bullets.push(annotateBullet(sentence));
  });

  return bullets;
};

const buildNotesFromSections = (sections: Section[]) => {
  const lines: string[] = [];
  const pushSection = (section: Section, depth: number) => {
    const indent = depth > 0 ? "  ".repeat(depth - 1) : "";
    if (section.title) {
      lines.push(`${indent}${section.title}`);
    }
    const bullets = buildSectionBullets(section);
    bullets.forEach((bullet) => {
      lines.push(`${indent}- ${bullet}`);
    });
    section.children.forEach((child) => {
      const beforeLength = lines.length;
      pushSection(child, depth + 1);
      if (lines.length > beforeLength) {
        lines.push("");
      }
    });
    if (lines.length && lines[lines.length - 1] === "") {
      lines.pop();
    }
  };

  sections.forEach((section) => {
    pushSection(section, 1);
    lines.push("");
  });
  if (lines.length && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.join("\n").trim();
};

const buildNotes = (text: string): NotesResponse => {
  const normalized = text.replace(/\r\n/g, "\n");
  const rawLines = normalized.split("\n");

  const root: Section = {
    title: "",
    level: 0,
    lines: [],
    children: [],
  };

  const stack: Section[] = [root];
  let skipLevel: number | null = null;
  let prevBlank = true;

  const addSection = (heading: HeadingMatch) => {
    while (stack.length && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1] ?? root;
    const section: Section = {
      title: heading.title,
      level: heading.level,
      lines: [],
      children: [],
      preserveLines: heading.preserveLines,
    };
    parent.children.push(section);
    stack.push(section);
  };

  rawLines.forEach((rawLine) => {
    const line = rawLine.replace(/[ \t]+/g, " ").trim();
    const current = stack[stack.length - 1] ?? root;
    const inToc = Boolean(current.preserveLines);

    if (!line) {
      prevBlank = true;
      return;
    }

    if (inToc && tocEntryPattern.test(line)) {
      current.lines.push(line);
      prevBlank = false;
      return;
    }

    const heading = detectHeading(line, prevBlank);
    if (heading) {
      if (skipLevel !== null) {
        if (heading.level <= skipLevel) {
          skipLevel = null;
        } else {
          prevBlank = true;
          return;
        }
      }
      if (isRemovalHeading(heading.title)) {
        skipLevel = heading.level;
        prevBlank = true;
        return;
      }
      addSection(heading);
      prevBlank = true;
      return;
    }

    if (skipLevel !== null) {
      prevBlank = false;
      return;
    }

    current.lines.push(line);
    prevBlank = false;
  });

  const sections: Section[] = [];
  if (root.lines.length) {
    sections.push({ ...root, children: [] });
  }
  if (root.children.length) {
    sections.push(...root.children);
  }
  if (!sections.length) {
    sections.push(root);
  }
  const notes = buildNotesFromSections(sections);
  return { notes };
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let text = "";
  let mode: DomainKey = "general";
  let subtype = "";
  let subtypeLabel = "";
  let specsLabel = "Specs";
  let missingLabel = "Not found.";
  const files: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const textValue = form.get("text");
    if (typeof textValue === "string") {
      text = textValue;
    }
    const modeValue = form.get("mode");
    if (typeof modeValue === "string") {
      mode = normalizeMode(modeValue);
    }
    const subtypeValue = form.get("subtype");
    if (typeof subtypeValue === "string") {
      subtype = subtypeValue;
    }
    const subtypeLabelValue = form.get("subtypeLabel");
    if (typeof subtypeLabelValue === "string") {
      subtypeLabel = subtypeLabelValue;
    }
    const specsLabelValue = form.get("specsLabel");
    if (typeof specsLabelValue === "string" && specsLabelValue.trim()) {
      specsLabel = specsLabelValue.trim();
    }
    const missingLabelValue = form.get("missingLabel");
    if (typeof missingLabelValue === "string" && missingLabelValue.trim()) {
      missingLabel = missingLabelValue.trim();
    }
    form.getAll("files").forEach((entry) => {
      if (entry instanceof File) {
        files.push(entry);
      }
    });
  } else {
    try {
      const payload = (await request.json()) as {
        text?: string;
        mode?: DomainKey;
        subtype?: string;
        subtypeLabel?: string;
        specsLabel?: string;
        missingLabel?: string;
      };
      text = payload.text ?? "";
      mode = normalizeMode(payload.mode);
      subtype = payload.subtype ?? "";
      subtypeLabel = payload.subtypeLabel ?? "";
      if (payload.specsLabel?.trim()) {
        specsLabel = payload.specsLabel.trim();
      }
      if (payload.missingLabel?.trim()) {
        missingLabel = payload.missingLabel.trim();
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 },
      );
    }
  }

  if (!text.trim() && files.length === 0) {
    return NextResponse.json(
      { error: "Provide text or upload at least one file." },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `You can upload up to ${MAX_FILES} files at once.` },
      { status: 413 },
    );
  }

  for (const file of files) {
    if (!isAcceptedFile(file)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, DOCX, or TXT." },
        { status: 415 },
      );
    }
  }

  const chunks: string[] = [];
  const trimmedText = normalizeWhitespace(text);
  if (trimmedText) {
    chunks.push(trimmedText);
  }

  for (const file of files) {
    const ext = getFileExtension(file.name);
    let extracted = "";
    try {
      if (ext === "pdf") {
        extracted = await extractTextFromPdf(file);
      } else if (ext === "docx") {
        extracted = await extractTextFromDocx(file);
      } else if (ext === "txt") {
        extracted = await extractTextFromTxt(file);
      } else if (file.type === "application/pdf") {
        extracted = await extractTextFromPdf(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        extracted = await extractTextFromDocx(file);
      } else if (file.type === "text/plain") {
        extracted = await extractTextFromTxt(file);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      return NextResponse.json(
        { error: `Failed to read ${file.name}: ${message}` },
        { status: 400 },
      );
    }

    const cleaned = normalizeWhitespace(extracted);
    if (cleaned) {
      chunks.push(`Document: ${file.name}\n${cleaned}`);
    }
  }

  const combined = normalizeWhitespace(chunks.join("\n\n"));
  if (!combined) {
    return NextResponse.json(
      { error: "No readable text found in the provided input." },
      { status: 400 },
    );
  }
  if (countWords(combined) < MIN_WORDS) {
    return NextResponse.json(
      { error: `Text must be at least ${MIN_WORDS} words.` },
      { status: 400 },
    );
  }

  const baseNotes = buildNotes(combined).notes;
  let field: Exclude<DomainKey, "smart"> | undefined;
  let domainForBlock: Exclude<DomainKey, "general" | "smart"> | null = null;

  if (mode === "smart") {
    const detected = detectDomain(combined);
    field = detected;
    if (detected !== "general") {
      domainForBlock = detected;
    }
  } else if (mode !== "general") {
    domainForBlock = mode as Exclude<DomainKey, "general" | "smart">;
  }

  const blockSubtypeLabel = subtypeLabel || subtype;
  const domainBlock = domainForBlock
    ? buildDomainBlock(
        domainForBlock,
        subtype,
        blockSubtypeLabel,
        combined,
        specsLabel,
        missingLabel,
      )
    : "";
  const notes = domainBlock ? `${domainBlock}\n\n${baseNotes}` : baseNotes;

  return NextResponse.json({ notes, field });
}


