import Anthropic from "@anthropic-ai/sdk";
import type { Questionnaire, ReportSection, ScrapedPage } from "../types.js";

const REPORT_MODEL = "claude-sonnet-4-6";
const PREFILL_MODEL = "claude-sonnet-4-20250514"; // TODO: switch to Haiku 4.5

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function cleanJsonString(text: string): string {
  let cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  const objMatch = cleaned.match(/(\{[\s\S]*\})/);
  const arrMatch = cleaned.match(/(\[[\s\S]*\])/);
  if (arrMatch && (!objMatch || arrMatch.index! <= objMatch.index!)) {
    cleaned = arrMatch[1];
  } else if (objMatch) {
    cleaned = objMatch[1];
  }
  return cleaned;
}

const REPORT_TOOL: Anthropic.Messages.Tool = {
  name: "submit_report",
  description: "Submit the completed tokenisation report with all 6 sections",
  input_schema: {
    type: "object" as const,
    properties: {
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Section title" },
            content: { type: "string", description: "Section content with markdown formatting" },
          },
          required: ["title", "content"],
        },
        minItems: 6,
        maxItems: 6,
      },
    },
    required: ["sections"],
  },
};

function extractSectionsFromToolUse(response: Anthropic.Messages.Message): ReportSection[] {
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No tool_use block in response");
  }
  const input = toolBlock.input as { sections: ReportSection[] };
  return input.sections;
}

const FORMATTING_RULES = `
FORMATTING RULES:
- Use **Bold Label:** Value pairs on consecutive lines for key metrics (3+ in a row)
- Use - **Title:** Description for feature/item lists (2+ items)
- Use | Col | Col | tables with --- separator rows for comparisons
- Use **Phase N:** or **Month N-N:** on consecutive lines for timelines
- Use ## Subheading for sub-sections within a section
- Use > for important quotes or key takeaways
- Use **Note:** or **Key Insight:** to start callout paragraphs
- Mix prose paragraphs between structured elements for readability

SECTION-SPECIFIC GUIDANCE:
1. Asset Analysis: Start with a prose overview, then use **bold:** value pairs for key asset characteristics (e.g. **Asset Class:** Real Estate, **Estimated Value:** $50M, **Jurisdiction:** UAE, **Ownership Structure:** Freehold). End with a key insight callout.

2. Token Economics: Use a | table | for token distribution/allocation. Use **bold:** value pairs for token specs (supply, price, minimum investment). Prose for yield mechanism explanation.

3. Regulatory Framework: Use - **Requirement:** Description cards for compliance items. A | table | comparing regulatory options if relevant. Prose for jurisdiction analysis.

4. Smart Contract Architecture: Use - **Component:** Description cards for contract modules. A **Phase N:** timeline for deployment stages.

5. Go-to-Market Strategy: Use **Phase N:** timeline for launch phases. Use - **Channel:** Description cards for marketing channels.

6. Financial Projections: Use a | table | for year-by-year projections. Use **bold:** value pairs for key financial metrics (ROI, yield, break-even). End with a key insight callout.`;

function buildReportPrompt(url: string, questionnaire: Questionnaire): string {
  return `You are a senior tokenisation advisor at Deca4 Advisory, a blockchain consulting firm based in Dubai. Generate a comprehensive tokenisation report.

Company: ${questionnaire.companyName}
Website: ${url}
Industry: ${questionnaire.industry}
Jurisdiction: ${questionnaire.jurisdiction}
Asset Types: ${questionnaire.assetTypes.join(", ")}
Estimated Value: ${questionnaire.estimatedValue}
Revenue Model: ${questionnaire.revenueModel}
Target Investors: ${questionnaire.targetInvestors}
Token Standard: ${questionnaire.tokenStandard}
Regulatory Notes: ${questionnaire.regulatoryNotes}

Generate a report with exactly 6 sections. Each section should have 300-500 words.
Use markdown formatting within the content strings to create visual structure:
${FORMATTING_RULES}

Use the submit_report tool to return your report. The 6 section titles must be exactly: "Asset Analysis", "Token Economics", "Regulatory Framework", "Smart Contract Architecture", "Go-to-Market Strategy", "Financial Projections".`;
}

export async function prefillQuestionnaire(
  url: string,
  scrapedContent: ScrapedPage[]
): Promise<Questionnaire> {
  const client = getClient();
  const siteContent = scrapedContent.map((p) => p.content).join("\n\n---\n\n");

  const response = await client.messages.create({
    model: PREFILL_MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a tokenisation expert. Analyse this website content and extract/infer the information needed for a tokenisation proposal.

Website URL: ${url}

Website content:
${siteContent}

Respond with ONLY a valid JSON object. No markdown, no explanation, no code fences. Ensure all strings are properly escaped. Fields:
{
  "companyName": "company name from the website",
  "industry": "primary industry",
  "jurisdiction": "likely jurisdiction",
  "assetTypes": ["array of tokenisable asset types"],
  "estimatedValue": "estimated asset value or To be determined",
  "revenueModel": "business revenue model",
  "targetInvestors": "likely target investors",
  "tokenStandard": "recommended token standard",
  "regulatoryNotes": "key regulatory considerations"
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = cleanJsonString(text);
    return JSON.parse(cleaned) as Questionnaire;
  } catch {
    console.error("Failed to parse questionnaire JSON:", text.slice(0, 500));
    throw new Error("AI returned invalid JSON for questionnaire");
  }
}

export async function generateReport(
  url: string,
  questionnaire: Questionnaire
): Promise<ReportSection[]> {
  const client = getClient();

  const response = await client.messages.create({
    model: REPORT_MODEL,
    max_tokens: 8000,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: "submit_report" },
    messages: [
      {
        role: "user",
        content: buildReportPrompt(url, questionnaire),
      },
    ],
  });

  try {
    return extractSectionsFromToolUse(response);
  } catch (err) {
    // Fallback: try parsing as text JSON (in case tool_use wasn't used)
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      const cleaned = cleanJsonString(text);
      return JSON.parse(cleaned) as ReportSection[];
    } catch {
      console.error("Failed to parse report:", err, text.slice(0, 500));
      throw new Error("AI returned invalid JSON for report");
    }
  }
}

/**
 * Compare two questionnaires and return the fields that changed.
 */
export function getChangedFields(
  original: Questionnaire,
  updated: Questionnaire
): Record<string, { from: string; to: string }> {
  const changes: Record<string, { from: string; to: string }> = {};
  const keys = Object.keys(original) as (keyof Questionnaire)[];

  for (const key of keys) {
    const origVal = Array.isArray(original[key]) ? (original[key] as string[]).join(", ") : String(original[key] || "");
    const updVal = Array.isArray(updated[key]) ? (updated[key] as string[]).join(", ") : String(updated[key] || "");
    if (origVal !== updVal) {
      changes[key] = { from: origVal, to: updVal };
    }
  }

  return changes;
}

/**
 * Refine an existing report based on questionnaire changes.
 * Much faster than generating from scratch since it's an edit, not a creation.
 */
export async function refineReport(
  url: string,
  updatedQuestionnaire: Questionnaire,
  existingReport: ReportSection[],
  changes: Record<string, { from: string; to: string }>
): Promise<ReportSection[]> {
  const client = getClient();

  const changesSummary = Object.entries(changes)
    .map(([key, { from, to }]) => `- ${key}: "${from}" → "${to}"`)
    .join("\n");

  const existingReportText = existingReport
    .map((s) => `## ${s.title}\n${s.content}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: REPORT_MODEL,
    max_tokens: 8000,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: "submit_report" },
    messages: [
      {
        role: "user",
        content: `You are a senior tokenisation advisor at Deca4 Advisory. You previously generated a tokenisation report for ${updatedQuestionnaire.companyName} (${url}).

The client has updated their details. Here are the changes:
${changesSummary}

Updated company details:
Company: ${updatedQuestionnaire.companyName}
Industry: ${updatedQuestionnaire.industry}
Jurisdiction: ${updatedQuestionnaire.jurisdiction}
Asset Types: ${updatedQuestionnaire.assetTypes.join(", ")}
Estimated Value: ${updatedQuestionnaire.estimatedValue}
Revenue Model: ${updatedQuestionnaire.revenueModel}
Target Investors: ${updatedQuestionnaire.targetInvestors}
Token Standard: ${updatedQuestionnaire.tokenStandard}
Regulatory Notes: ${updatedQuestionnaire.regulatoryNotes}

Here is the existing draft report:
${existingReportText}

Update the report to reflect the changes above. Keep sections that are unaffected by the changes largely intact. Only rewrite sections that are materially impacted. Maintain the same quality and depth.
${FORMATTING_RULES}

Use the submit_report tool to return all 6 updated sections. The 6 section titles must be exactly: "Asset Analysis", "Token Economics", "Regulatory Framework", "Smart Contract Architecture", "Go-to-Market Strategy", "Financial Projections".`,
      },
    ],
  });

  try {
    return extractSectionsFromToolUse(response);
  } catch (err) {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      const cleaned = cleanJsonString(text);
      return JSON.parse(cleaned) as ReportSection[];
    } catch {
      console.error("Failed to parse refined report:", err, text.slice(0, 500));
      throw new Error("AI returned invalid JSON for refined report");
    }
  }
}
