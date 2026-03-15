export type BlockType =
  | "prose"
  | "stats"
  | "cards"
  | "table"
  | "timeline"
  | "callout"
  | "subheading"
  | "quote";

export interface ContentBlock {
  type: BlockType;
  data: unknown;
}

export interface StatItem {
  key: string;
  value: string;
}

export interface CardItem {
  title: string;
  description: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface TimelinePhase {
  title: string;
  description: string;
}

export interface CalloutData {
  label: string;
  text: string;
}

/**
 * Parse a section's markdown content into typed ContentBlocks
 * for rich rendering with design system components.
 */
export function parseContent(markdown: string): ContentBlock[] {
  const lines = markdown.split("\n");
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Subheading: ## or ###
    if (/^#{2,3}\s+/.test(line)) {
      blocks.push({
        type: "subheading",
        data: line.replace(/^#{2,3}\s+/, ""),
      });
      i++;
      continue;
    }

    // Colon subheading: standalone line ending with colon (e.g. "Token Supply and Distribution:")
    // Must be a short standalone line (no ## prefix), not a bold key-value pair
    if (
      /^[A-Z][^*|>\-#]*:\s*$/.test(line.trim()) &&
      line.trim().length <= 80 &&
      (i + 1 >= lines.length || lines[i + 1].trim() === "" || /^[^:]/.test(lines[i + 1].trim()))
    ) {
      blocks.push({
        type: "subheading",
        data: line.trim().replace(/:$/, ""),
      });
      i++;
      continue;
    }

    // Table: starts with |
    if (line.trim().startsWith("|") && i + 1 < lines.length && lines[i + 1]?.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const parsed = parseTable(tableLines);
      if (parsed) {
        blocks.push({ type: "table", data: parsed });
      }
      continue;
    }

    // Callout: Note: / Important: / Key Insight:
    if (/^(?:\*\*)?(?:Note|Important|Key Insight|Warning|Disclaimer)(?:\*\*)?:/i.test(line.trim())) {
      const text = line.trim().replace(/^\*\*([^*]+)\*\*:\s*/, "$1: ").replace(/^([^:]+):\s*/, "$1: ");
      const labelMatch = text.match(/^([^:]+):\s*(.*)/);
      blocks.push({
        type: "callout",
        data: {
          label: labelMatch?.[1] || "Note",
          text: labelMatch?.[2] || text,
        } satisfies CalloutData,
      });
      i++;
      continue;
    }

    // Timeline: Phase N: / Month N-N: / Year N: patterns
    // Collect phase headers with their following description paragraphs
    if (/^(?:- )?\*\*(?:Phase|Month|Year|Quarter|Stage|Step)\s+\d/i.test(line.trim())) {
      const phases: TimelinePhase[] = [];
      while (i < lines.length) {
        const currentLine = lines[i]?.trim() || "";
        // Check if this line is a phase header
        if (/^(?:- )?\*\*(?:Phase|Month|Year|Quarter|Stage|Step)\s+\d/i.test(currentLine)) {
          const match = currentLine.match(/^\*\*(.+?)\*\*[:\s]*(.*)$/) ||
            currentLine.match(/^- \*\*(.+?)\*\*[:\s]*(.*)$/);
          if (match) {
            phases.push({ title: match[1], description: match[2] || "" });
          }
          i++;
          // Collect following description lines until next phase header, blank line gap, or structural element
          const descLines: string[] = [];
          // Skip one blank line if present
          if (i < lines.length && lines[i].trim() === "") i++;
          while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !/^(?:- )?\*\*(?:Phase|Month|Year|Quarter|Stage|Step)\s+\d/i.test(lines[i].trim()) &&
            !lines[i].trim().startsWith("|") &&
            !/^#{2,3}\s+/.test(lines[i]) &&
            !lines[i].trim().startsWith(">") &&
            !/^[A-Z][^*|>\-#]*:\s*$/.test(lines[i].trim())
          ) {
            descLines.push(lines[i].trim());
            i++;
          }
          if (descLines.length > 0 && phases.length > 0) {
            const last = phases[phases.length - 1];
            last.description = last.description
              ? last.description + " " + descLines.join(" ")
              : descLines.join(" ");
          }
          // Skip blank lines between phases
          while (i < lines.length && lines[i]?.trim() === "") i++;
        } else {
          // Not a phase header, stop collecting
          break;
        }
      }
      if (phases.length > 0) {
        blocks.push({ type: "timeline", data: phases });
      }
      continue;
    }

    // Stats: 3+ consecutive **Key:** Value lines
    if (/^\*\*[^*]+\*\*:\s*.+/.test(line.trim())) {
      const stats: StatItem[] = [];
      let j = i;
      while (j < lines.length && /^\*\*[^*]+\*\*:\s*.+/.test(lines[j]?.trim() || "")) {
        const match = lines[j].trim().match(/^\*\*(.+?)\*\*:\s*(.+)/);
        if (match) stats.push({ key: match[1], value: match[2] });
        j++;
      }
      if (stats.length >= 3) {
        blocks.push({ type: "stats", data: stats });
        i = j;
        continue;
      }
      // Fall through to cards/prose if < 3
    }

    // Cards: consecutive - **Title:** description lines
    if (/^- \*\*[^*]+\*\*[:\s]/.test(line.trim())) {
      const cards: CardItem[] = [];
      while (i < lines.length && /^- \*\*[^*]+\*\*/.test(lines[i]?.trim() || "")) {
        const match = lines[i].trim().match(/^- \*\*(.+?)\*\*[:\s]*(.*)$/);
        if (match) {
          cards.push({ title: match[1], description: match[2] || "" });
        }
        i++;
      }
      if (cards.length >= 2) {
        blocks.push({ type: "cards", data: cards });
        continue;
      }
      // If only 1 card, treat as prose
      i -= cards.length;
    }

    // Quote: lines starting with >
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      blocks.push({ type: "quote", data: quoteLines.join(" ") });
      continue;
    }

    // Default: collect consecutive prose lines
    const proseLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("|") &&
      !/^#{2,3}\s+/.test(lines[i]) &&
      !/^(?:- )?\*\*(?:Phase|Month|Year|Quarter|Stage|Step)\s+\d/i.test(lines[i].trim()) &&
      // Stop if we hit a colon subheading
      !/^[A-Z][^*|>\-#]*:\s*$/.test(lines[i].trim())
    ) {
      proseLines.push(lines[i]);
      i++;
    }
    if (proseLines.length > 0) {
      blocks.push({ type: "prose", data: proseLines.join("\n") });
    }
  }

  return blocks;
}

function parseTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const parseLine = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

  const headers = parseLine(lines[0]);

  // Skip separator row (---|---)
  const startRow = lines[1].includes("---") ? 2 : 1;

  const rows: string[][] = [];
  for (let i = startRow; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length > 0) rows.push(row);
  }

  return { headers, rows };
}

/**
 * Render inline markdown (bold, italic, links) to HTML
 */
export function renderInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline" style="color: var(--accent)">$1</a>'
    );
}
