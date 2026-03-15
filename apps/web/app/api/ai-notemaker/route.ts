import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import JSZip from "jszip";

export const runtime = "nodejs";

type NotesResponse = {
  notes: string;
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
  const files: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const textValue = form.get("text");
    if (typeof textValue === "string") {
      text = textValue;
    }
    form.getAll("files").forEach((entry) => {
      if (entry instanceof File) {
        files.push(entry);
      }
    });
  } else {
    try {
      const payload = (await request.json()) as { text?: string };
      text = payload.text ?? "";
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

  const notes = buildNotes(combined);
  return NextResponse.json(notes);
}
