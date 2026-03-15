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
  description: "Submit the completed tokenisation report with all 7 sections",
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
        minItems: 7,
        maxItems: 7,
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

const CASE_STUDY_BANK = `
CASE STUDY REFERENCE BANK (use relevant examples based on asset class):
- Gold/Commodities: CurioInvest XAUH token, backed by physical gold in Swiss vaults, traded on secondary markets
- Real Estate: RealT (tokenised US rental properties, $100M+ tokenised), Propy (on-chain property transfers)
- Equity/Securities: Securitize (SEC-registered, $1B+ tokenised), tZERO (regulated ATS for security tokens)
- Bonds/Debt: European Investment Bank (€100M digital bond on Ethereum), Obligate (on-chain corporate bonds)
- Funds: BlackRock BUIDL (tokenised Treasury fund, $500M+ AUM), Franklin Templeton (on-chain money market fund)
- Art/Collectibles: Masterworks (fractional blue-chip art), Maecenas (blockchain art investment)
`;

const PARTNER_CREDENTIALS = `
PARTNER CREDENTIALS (use in "Your Partners" section):

CurioInvest:
- Launched XAUH: first gold-backed token with Swiss vault custody
- Featured in Forbes, Bloomberg, CoinDesk
- Issued first tokenised corporate bond in Switzerland
- CHF 1B mortgage-backed securities tokenisation pipeline
- Operating since 2018, regulated in Liechtenstein
- Legal counsel: LEXR (leading Swiss blockchain law firm)

Deca4 Advisory:
- Headquarters: Dubai World Trade Centre, UAE
- RAK Digital Assets Oasis: land registry tokenisation (pilot)
- TDRA (Telecommunications & Digital Government Regulatory Authority): blockchain assessment
- DIFC Courts: digital evidence & smart contract dispute resolution
- $1B+ combined tokenisation pipeline across 6 jurisdictions
- Team: blockchain architects, compliance specialists, financial structuring experts
`;

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
1. Executive Summary: Start with a compelling prose paragraph about the opportunity. Use **bold:** value pairs for 3-5 headline numbers (estimated value, potential raise, projected ROI, timeline). End with a > blockquote giving a clear recommendation.

2. Tokenisation Opportunities: Use - **Opportunity:** Description cards for each opportunity mapped to their business objectives. Use **bold:** value pairs for goal-to-opportunity mapping. Prose explaining how tokenisation addresses each stated objective.

3. Market Validation: Use a | table | for case study comparisons (project, asset class, amount tokenised, outcome). Use **bold:** value pairs for market data points. Use > for a testimonial or key market quote.

4. Implementation Plan: Use **Phase N:** timeline for implementation phases (legal structuring, token design, compliance, distribution, launch). Use - **Component:** Description cards for key workstreams.

5. Financial Outlook: Use a | table | for year-by-year projections. Use **bold:** value pairs for key metrics (capital raised, liquidity unlocked, revenue, ROI). Include a comparison | table | of traditional vs tokenised approach costs.

6. Opportunity Cost: Use **bold:** value pairs for cost-of-waiting drivers (locked liquidity per month, missed investor pool size, competitor moves). Include a comparison | table | showing "Act Now" vs "Wait 12 Months" scenarios. End with a **Key Insight:** callout on urgency.

7. Your Partners: Use - **Credential:** Description cards for CurioInvest and Deca4 credentials. Use > for a testimonial quote. Use **bold:** value pairs for track record stats.`;

function buildReportPrompt(url: string, questionnaire: Questionnaire): string {
  const objectives = questionnaire.businessObjectives?.length
    ? questionnaire.businessObjectives.join(", ")
    : questionnaire.assetTypes.join(", ");
  const objectivesLabel = questionnaire.businessObjectives?.length
    ? "Business Objectives"
    : "Asset Types (legacy)";

  const challengeBlock = questionnaire.biggestChallenge
    ? `Biggest Challenge: ${questionnaire.biggestChallenge}`
    : "";

  return `You are a senior tokenisation advisor writing a report for a business executive who may not understand blockchain. Your job is to show them the business opportunity, prove it works, explain how it would work for them, quantify the returns, show the cost of inaction, and position CurioInvest + Deca4 as the right partners.

Company: ${questionnaire.companyName}
Website: ${url}
Industry: ${questionnaire.industry}
Jurisdiction: ${questionnaire.jurisdiction}
${objectivesLabel}: ${objectives}
Estimated Value: ${questionnaire.estimatedValue}
Revenue Model: ${questionnaire.revenueModel}
Target Investors: ${questionnaire.targetInvestors}
Regulatory Notes: ${questionnaire.regulatoryNotes}
${challengeBlock}

${CASE_STUDY_BANK}
${PARTNER_CREDENTIALS}

Generate a report with exactly 7 sections. Each section should have 300-500 words.
Use markdown formatting within the content strings to create visual structure:
${FORMATTING_RULES}

Use the submit_report tool to return your report. The 7 section titles must be exactly: "Executive Summary", "Tokenisation Opportunities", "Market Validation", "Implementation Plan", "Financial Outlook", "Opportunity Cost", "Your Partners".

IMPORTANT TONE: Write for a CEO/CFO, not a blockchain developer. Lead with business outcomes, not technical mechanisms. Use "tokenisation" as a means to an end (capital, liquidity, access), never as the goal itself.`;
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
        content: `You are a tokenisation expert. Analyse this website content and extract/infer the information needed for a tokenisation report.

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
    max_tokens: 12000,
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

  const objectives = updatedQuestionnaire.businessObjectives?.length
    ? updatedQuestionnaire.businessObjectives.join(", ")
    : updatedQuestionnaire.assetTypes.join(", ");
  const objectivesLabel = updatedQuestionnaire.businessObjectives?.length
    ? "Business Objectives"
    : "Asset Types (legacy)";

  const challengeBlock = updatedQuestionnaire.biggestChallenge
    ? `Biggest Challenge: ${updatedQuestionnaire.biggestChallenge}`
    : "";

  const response = await client.messages.create({
    model: REPORT_MODEL,
    max_tokens: 12000,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: "submit_report" },
    messages: [
      {
        role: "user",
        content: `You are a senior tokenisation advisor writing for a business executive. You previously generated a tokenisation report for ${updatedQuestionnaire.companyName} (${url}).

The client has updated their details. Here are the changes:
${changesSummary}

Updated company details:
Company: ${updatedQuestionnaire.companyName}
Industry: ${updatedQuestionnaire.industry}
Jurisdiction: ${updatedQuestionnaire.jurisdiction}
${objectivesLabel}: ${objectives}
Estimated Value: ${updatedQuestionnaire.estimatedValue}
Revenue Model: ${updatedQuestionnaire.revenueModel}
Target Investors: ${updatedQuestionnaire.targetInvestors}
Regulatory Notes: ${updatedQuestionnaire.regulatoryNotes}
${challengeBlock}

${PARTNER_CREDENTIALS}

Here is the existing draft report:
${existingReportText}

Update the report to reflect the changes above. Keep sections that are unaffected by the changes largely intact. Only rewrite sections that are materially impacted. Maintain the same quality and depth.
${FORMATTING_RULES}

Use the submit_report tool to return all 7 updated sections. The 7 section titles must be exactly: "Executive Summary", "Tokenisation Opportunities", "Market Validation", "Implementation Plan", "Financial Outlook", "Opportunity Cost", "Your Partners".

IMPORTANT TONE: Write for a CEO/CFO, not a blockchain developer. Lead with business outcomes, not technical mechanisms.`,
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
