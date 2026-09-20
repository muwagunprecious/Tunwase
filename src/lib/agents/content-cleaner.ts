/**
 * Master Content Cleaner & Structure Formatter
 * Strictly enforces:
 * 1. ZERO EM DASHES (—), en dashes (–), or prose double-hyphens (--).
 * 2. ZERO ASTERISK BULLETS: Converts all '* item' into clean standard hyphens '- item'.
 * 3. FIXES BOLD LABELS: Replaces '**Label**, text' or '**Label** — text' with '**Label**: text'.
 * 4. STRUCTURES SECTION HEADERS: Converts isolated bold lines into clean semantic headers ('### Section Name').
 * 5. NORMALIZES UNICODE: Converts narrow spaces (\u202f), non-breaking spaces (\u00a0), and non-breaking hyphens (\u2011) to clean ASCII.
 * 6. ELIMINATES BANNED CORPORATE AI CLICHES.
 */

const BANNED_PHRASES = [
  /\bdelve into\b/gi,
  /\bdelving into\b/gi,
  /\bin today's rapidly evolving landscape\b/gi,
  /\bin today's fast-paced world\b/gi,
  /\bit is important to note\b/gi,
  /\bit's important to remember\b/gi,
  /\brevolutionary paradigm shift\b/gi,
  /\bgame-changing\b/gi,
  /\bunlock unprecedented potential\b/gi,
  /\btestament to\b/gi,
  /\bbeacon of hope\b/gi,
  /\bpivotal role\b/gi,
  /\bseamlessly integrate\b/gi,
  /\bfoster innovation\b/gi,
  /\bembark on a journey\b/gi,
  /\bwithout further ado\b/gi,
  /\bin conclusion\b/gi,
  /\bkey takeaway\b/gi,
  /\bharness the power of\b/gi,
  /\bat the forefront of\b/gi,
];

const REPLACEMENTS: Array<{ regex: RegExp; replacement: string }> = [
  { regex: /\bdelve into\b/gi, replacement: "look into" },
  { regex: /\bdelving into\b/gi, replacement: "looking into" },
  { regex: /\bin today's rapidly evolving landscape\b/gi, replacement: "today" },
  { regex: /\bin today's fast-paced world\b/gi, replacement: "these days" },
  { regex: /\bit is important to note\b/gi, replacement: "note" },
  { regex: /\bit's important to remember\b/gi, replacement: "remember" },
  { regex: /\brevolutionary paradigm shift\b/gi, replacement: "big change" },
  { regex: /\bunlock unprecedented potential\b/gi, replacement: "open up great chances" },
  { regex: /\btestament to\b/gi, replacement: "proof of" },
  { regex: /\bharness the power of\b/gi, replacement: "use" },
  { regex: /\bfacilitate\b/gi, replacement: "help with" },
  { regex: /\bfacilitating\b/gi, replacement: "helping with" },
  { regex: /\bleverage\b/gi, replacement: "use" },
  { regex: /\bleveraging\b/gi, replacement: "using" },
  { regex: /\butilize\b/gi, replacement: "use" },
  { regex: /\butilizing\b/gi, replacement: "using" },
  { regex: /\butilization\b/gi, replacement: "use" },
  { regex: /\bcommence\b/gi, replacement: "start" },
  { regex: /\bcommencing\b/gi, replacement: "starting" },
  { regex: /\bsubsequently\b/gi, replacement: "then" },
  { regex: /\bfurthermore\b/gi, replacement: "also" },
  { regex: /\bmoreover\b/gi, replacement: "also" },
  { regex: /\bparamount\b/gi, replacement: "vital" },
  { regex: /\bmeticulous\b/gi, replacement: "careful" },
  { regex: /\bmeticulously\b/gi, replacement: "carefully" },
  { regex: /\borchestrate\b/gi, replacement: "organize" },
  { regex: /\borchestrating\b/gi, replacement: "organizing" },
  { regex: /\bdispatched\b/gi, replacement: "sent" },
  { regex: /\bimperative\b/gi, replacement: "important" },
  { regex: /\bin order to\b/gi, replacement: "to" },
  { regex: /\bat this point in time\b/gi, replacement: "right now" },
  { regex: /\bprior to\b/gi, replacement: "before" },
];

/**
 * Normalize unusual unicode spaces, zero-width spaces, and non-breaking hyphens.
 */
export function normalizeUnicode(text: string): string {
  if (!text) return "";
  return text
    // Replace narrow non-breaking space, non-breaking space, zero-width space
    .replace(/[\u202f\u00a0\u200b\ufeff]/g, " ")
    // Replace non-breaking hyphen and figure dashes with standard hyphen
    .replace(/[\u2010\u2011\u2012]/g, "-")
    // Replace horizontal bar and quotation dashes
    .replace(/[\u2015]/g, "-")
    // Replace curly single quotes and apostrophes with ASCII single quote
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Replace curly double quotes with ASCII double quote
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Replace multiplication symbol with ASCII x
    .replace(/[\u00D7]/g, "x");
}

/**
 * Remove em dashes (—), en dashes (–), and prose double hyphens (--) without corrupting Markdown tables or code blocks.
 */
export function removeEmDashes(text: string): string {
  if (!text) return "";

  // 1. Temporarily protect fenced code blocks
  const codeBlocks: string[] = [];
  let protectedText = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 2. Temporarily protect inline code
  const inlineCodes: string[] = [];
  protectedText = protectedText.replace(/`[^`\n]+`/g, (match) => {
    inlineCodes.push(match);
    return `__INLINE_CODE_${inlineCodes.length - 1}__`;
  });

  // 3. Process line by line so table separators and HRs are untouched
  const lines = protectedText.split("\n");
  const cleanedLines = lines.map((line) => {
    // Markdown table row with hyphens: e.g. |---|---| or | :--- | ---: |
    if (/^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(line)) {
      return line;
    }
    // Markdown horizontal rule: e.g. --- or *** or ___
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      return line;
    }

    let cleanedLine = line;

    // Convert bold followed by em dash/en dash/double hyphen to bold + colon: e.g. **Title** — Text -> **Title**: Text
    cleanedLine = cleanedLine.replace(/\*\*([^*\n]+)\*\*\s*[—–-]{1,2}\s*/g, "**$1**: ");

    // Convert bold followed by comma to bold + colon: e.g. **Strategic Gatekeeper**, As -> **Strategic Gatekeeper**: As
    cleanedLine = cleanedLine.replace(/\*\*([^*\n]+)\*\*,\s*/g, "**$1**: ");

    // Real em dash: —
    cleanedLine = cleanedLine.replace(/\s*[—–]\s*/g, ", ");

    // Prose double hyphens: " -- " or word--word
    cleanedLine = cleanedLine.replace(/\s+--\s+/g, ": ");
    cleanedLine = cleanedLine.replace(/(\w)--(\w)/g, "$1, $2");

    // Fix awkward comma at start of dependent clauses like ", As a result" -> ". As a result"
    cleanedLine = cleanedLine.replace(/,\s*(As|The|Because|When|If|In|This|These|Our)\b/g, ". $1");

    // Clean up accidental double commas or trailing commas before period/colon
    cleanedLine = cleanedLine
      .replace(/,\s*,+/g, ",")
      .replace(/,\s*\./g, ".")
      .replace(/:\s*:/g, ":")
      .replace(/,\s*:/g, ":")
      .replace(/\s+,/g, ",");

    return cleanedLine;
  });

  let result = cleanedLines.join("\n");

  // Restore inline code
  result = result.replace(/__INLINE_CODE_(\d+)__/g, (_, idx) => inlineCodes[parseInt(idx, 10)] ?? "");

  // Restore code blocks
  result = result.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[parseInt(idx, 10)] ?? "");

  return result;
}

/**
 * Format text without forcing rigid structure or markdown headers.
 * Keeps short and one-word replies clean and untouched.
 */
export function structureAiText(text: string): string {
  if (!text) return "";

  const trimmed = text.trim();
  // If it's a one-word or short phrase response, do not add structure
  if (trimmed.split(/\s+/).length <= 4) {
    return trimmed;
  }

  let structured = text;

  // Convert asterisk bullets (* Item) to standard dash bullets (- Item)
  structured = structured.replace(/^(\s*)\*\s+/gm, "$1- ");

  // Clean unclosed or punctuation-adjacent italics like *‘word’* to ‘word’
  structured = structured.replace(/\*([‘'"])(.*?)([’'"])\*/g, "$1$2$3");

  return structured;
}

/**
 * Clean corporate AI cliches and replace them with natural language.
 */
export function cleanAiCliches(text: string): string {
  if (!text) return "";

  let cleaned = text;
  for (const { regex, replacement } of REPLACEMENTS) {
    cleaned = cleaned.replace(regex, replacement);
  }

  // Remove generic AI preambles and bot openings
  cleaned = cleaned.replace(/^(Certainly!|Sure!|Here is a post|Here's a breakdown|Here is a draft|Here is an executive briefing|As an AI|I would be happy to help):\s*/i, "");

  return cleaned;
}

/**
 * Strip raw markdown asterisks for plain text platforms (LinkedIn, X, Instagram, clipboard exports).
 */
export function stripAsterisksForPlaintext(text: string): string {
  if (!text) return "";
  return text
    // Replace **bold** with clean text
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    // Replace *italic* with clean text
    .replace(/\*([^*\n]+)\*/g, "$1")
    // Replace asterisk bullets with standard dash
    .replace(/^(\s*)\*\s+/gm, "$1- ");
}

/**
 * Master human-writing verification & structuring pipeline.
 */
export function polishHumanContent(text: string): {
  polished: string;
  violationsRemoved: string[];
  hadEmDashes: boolean;
} {
  const violationsRemoved: string[] = [];
  const hadEmDashes = text.includes("—") || text.includes("–") || text.includes("--");

  if (hadEmDashes) {
    violationsRemoved.push("Removed em dashes and dashes (—, –, --)");
  }

  for (const regex of BANNED_PHRASES) {
    if (regex.test(text)) {
      violationsRemoved.push(`Cleaned cliche matching ${regex.source}`);
    }
  }

  // Step 1: Normalize unicode artifacts
  let polished = normalizeUnicode(text);

  // Step 2: Remove em dashes, fix bold commas, fix double hyphens
  polished = removeEmDashes(polished);

  // Step 3: Format structure, clean asterisks, standardize lists
  polished = structureAiText(polished);

  // Step 4: Clean corporate AI cliches
  polished = cleanAiCliches(polished);

  return {
    polished,
    violationsRemoved,
    hadEmDashes,
  };
}

export function cleanGeneratedContent(text: string): string {
  return polishHumanContent(text).polished;
}
