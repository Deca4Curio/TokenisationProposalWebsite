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
CASE STUDY REFERENCE BANK — Use selectively. Only cite cases that are GENUINELY comparable to the client's risk profile, jurisdiction type, and asset class. If citing a case from a different risk tier (e.g. US Treasuries vs frontier-market assets), explicitly acknowledge the difference. If no close comparable exists, say so honestly and explain what makes this opportunity novel.

- Gold/Commodities: CurioInvest XAUH token, backed by physical gold in Swiss vaults, traded on secondary markets
- Real Estate: RealT (tokenised US rental properties, $100M+ tokenised), Propy (on-chain property transfers)
- Equity/Securities: Securitize (SEC-registered, $1B+ tokenised), tZERO (regulated ATS for security tokens)
- Bonds/Debt: European Investment Bank (€100M digital bond on Ethereum), Obligate (on-chain corporate bonds)
- Funds: BlackRock BUIDL (tokenised Treasury fund, $500M+ AUM), Franklin Templeton (on-chain money market fund)
- Art/Collectibles: Masterworks (fractional blue-chip art), Maecenas (blockchain art investment)
- Frontier/Emerging Markets: Note that large-scale tokenisation of frontier-market assets is still nascent. Be honest about this — it is a first-mover opportunity but also an execution risk.
`;

const PARTNER_CREDENTIALS = `
PARTNER CREDENTIALS (use in "Your Partners" section). Lead with COMPLETED transactions, not pipeline. Be specific. Acknowledge where local partners or additional advisors may be needed for the client's jurisdiction.

CurioInvest (completed transactions first):
- Launched XAUH: first gold-backed token with Swiss vault custody — live and trading on secondary markets
- Issued first tokenised corporate bond in Switzerland — full lifecycle from issuance to secondary trading
- CHF 1B mortgage-backed securities tokenisation pipeline (in progress, not yet completed)
- Operating since 2018, regulated in Liechtenstein (EU-passportable)
- Featured in Forbes, Bloomberg, CoinDesk
- Legal counsel: LEXR (leading Swiss blockchain law firm)

Deca4 Advisory (engagements first):
- RAK Digital Assets Oasis: land registry tokenisation pilot with government endorsement
- TDRA: blockchain regulatory assessment for telecommunications authority
- DIFC Courts: digital evidence & smart contract dispute resolution programme
- Headquarters: Dubai World Trade Centre, UAE
- $1B+ combined tokenisation pipeline across 6 jurisdictions
- Team: blockchain architects, compliance specialists, financial structuring experts
- NOTE: For jurisdictions outside UAE/EU/Switzerland, Deca4 engages local legal counsel and regulatory advisors as part of the programme
`;

const FORMATTING_RULES = `
FORMATTING RULES:
- Use **Bold Label:** Value pairs on consecutive lines for key metrics (3+ in a row)
- Use - **Title:** Description for feature/item lists (2+ items)
- Use | Col | Col | tables with --- separator rows for comparisons
- Use **Phase N (Month X-Y):** Title followed by a description paragraph on a new line for timelines
- Use ## Subheading for sub-sections within a section
- Use > for important quotes or key takeaways
- Use **Note:** or **Key Insight:** to start callout paragraphs
- Mix prose paragraphs between structured elements for readability

SECTION-SPECIFIC GUIDANCE:

1. Executive Summary: Start with a compelling prose paragraph framing the business opportunity (not the technology). If financial data was provided, use **bold:** value pairs for 3-5 headline numbers. If financial data is missing or "To be determined," state the opportunity qualitatively and include a **Note:** callout listing what data is needed for quantification (e.g. "A formal asset valuation would allow us to quantify the capital raise target"). End with a > blockquote giving an honest recommendation.

2. Tokenisation Opportunities: Map specific opportunities to the client's stated business objectives. Use - **Opportunity:** Description cards for each. Explain concretely how tokenisation addresses each objective using the client's actual business context (their industry, their assets). Do not describe generic tokenisation benefits.

3. Market Validation: Use a | table | for case study comparisons. CRITICAL: Only cite cases genuinely comparable in risk profile. If the client operates in a frontier market and the best comparables are from developed markets, explicitly acknowledge the difference: "While no direct comparable exists for [jurisdiction], the closest precedents are...". Use **bold:** value pairs for market data with cited sources. Use > for a relevant quote. Do NOT use quotes from figures discussing entirely different asset classes (e.g. Larry Fink on US Treasuries is not relevant to DRC mining assets).

4. Implementation Plan: Use **Phase N (Month X-Y): Title** on one line, followed by a description paragraph on the next line. Each phase should include key deliverables AND key risks for that phase. Use - **Workstream:** Description cards for parallel workstreams. Include a **Note:** callout about jurisdiction-specific regulatory requirements and any additional local advisors needed.

5. Financial Outlook: ALL projections must be clearly labeled as "Illustrative" or "Subject to formal valuation." Show the methodology: "Assuming an asset base of X, a typical first issuance of 10-20% would yield...". Use a | table | for projections with a column for assumptions. Include a comparison | table | of traditional vs tokenised costs — but include the full cost of the tokenised route (advisory fees, platform fees, legal, ongoing). Include a downside scenario: "If the raise achieves only 30-50% of target...". If estimatedValue is "To be determined" or vague, use conditional language throughout: "Subject to valuation, if..." and do NOT present any figure as a forecast.

6. Opportunity Cost: Present a BALANCED risk-benefit analysis. Yes, show the cost of inaction — but also honestly acknowledge the risks of proceeding (execution risk, regulatory risk, reputational risk of being a first mover). Do NOT fabricate specific dollar amounts for "locked liquidity per month" unless derived from actual data. Use a comparison | table | showing "Proceed" vs "Defer" with BOTH benefits and risks for each path. Name specific competitors only if they actually exist — do not manufacture competitive threats. End with an honest **Key Insight:** that weighs both sides.

7. Your Partners: Lead with COMPLETED transactions, not pipeline (distinguish clearly). Use - **Credential:** Description cards. Acknowledge where local expertise will be brought in for the client's specific jurisdiction. Use > for a quote attributed to a named person, not "Leadership Team." Use **bold:** value pairs for track record stats.`;

function assessDataQuality(questionnaire: Questionnaire): string {
  const gaps: string[] = [];
  const ev = questionnaire.estimatedValue?.trim().toLowerCase() || "";
  if (!ev || ev === "to be determined" || ev === "tbd" || ev === "n/a") {
    gaps.push("ESTIMATED VALUE is unknown — do NOT invent specific financial projections. Use conditional language: 'Subject to formal valuation, if the asset base is in the range of X...'");
  }
  if (!questionnaire.businessObjectives?.length && !questionnaire.assetTypes?.length) {
    gaps.push("NO BUSINESS OBJECTIVES or ASSET TYPES specified — keep recommendations general and focus on the assessment framework rather than specific opportunities");
  }
  if (!questionnaire.biggestChallenge?.trim()) {
    gaps.push("BIGGEST CHALLENGE not provided — base your analysis on public information and industry-typical challenges for this jurisdiction/industry");
  }
  const notes = questionnaire.regulatoryNotes || "";
  if (!notes.includes("Existing structure:") || notes.includes("Existing structure: \n") || notes.includes("Existing structure:\n")) {
    gaps.push("NO EXISTING LEGAL STRUCTURE disclosed — do not assume an SPV or holding company exists. Recommend structuring as part of Phase 1");
  }
  if (gaps.length === 0) return "";
  return `\nDATA QUALITY ASSESSMENT — The following information gaps exist. You MUST handle these honestly:\n${gaps.map(g => `- ${g}`).join("\n")}\n`;
}

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

  const dataQuality = assessDataQuality(questionnaire);

  return `You are a senior tokenisation advisor writing an advisory assessment for a company's management team. This is NOT an investor offering document — it is an honest evaluation of whether and how tokenisation could serve this company's business objectives.

Your credibility depends on intellectual honesty. Where data is missing, say so. Where risks exist, name them. Where projections require assumptions, state the assumptions explicitly. A report that acknowledges uncertainty is far more persuasive to a CEO/CFO than one that fabricates confidence.

COMPANY DETAILS:
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
${dataQuality}
CRITICAL RULES:
1. NEVER fabricate specific financial figures. If asset value is unknown, use illustrative scenarios: "If the tokenisable asset base is USD X, then..."
2. Address jurisdiction-specific regulatory risks honestly. "${questionnaire.jurisdiction}" has specific legal, political, currency, and enforcement characteristics — name them. Do not treat the jurisdiction only as a selling point.
3. Every financial projection must show its assumptions. Label illustrative figures as "Illustrative" or "Assumes...".
4. Acknowledge risks alongside opportunities in every section. The Implementation Plan must include regulatory and execution risks. The Financial Outlook must include a downside scenario.
5. When citing case studies, only use genuinely comparable examples. If the best comparables are from very different jurisdictions or risk profiles, acknowledge the difference explicitly.
6. Include "Information Needed" callouts where critical data gaps prevent proper assessment.

${CASE_STUDY_BANK}
${PARTNER_CREDENTIALS}

Generate a report with exactly 7 sections. Each section should have 300-500 words.
Use markdown formatting within the content strings to create visual structure:
${FORMATTING_RULES}

Use the submit_report tool to return your report. The 7 section titles must be exactly: "Executive Summary", "Tokenisation Opportunities", "Market Validation", "Implementation Plan", "Financial Outlook", "Opportunity Cost", "Your Partners".

TONE: Write for a CEO/CFO who is smart, busy, and skeptical. Lead with business outcomes, not blockchain mechanics. Use "tokenisation" as a means to an end (capital, liquidity, access), never as the goal itself. Be the advisor they trust because you tell them what they need to hear, not what they want to hear.`;
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

  const dataQuality = assessDataQuality(updatedQuestionnaire);

  const response = await client.messages.create({
    model: REPORT_MODEL,
    max_tokens: 12000,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: "submit_report" },
    messages: [
      {
        role: "user",
        content: `You are a senior tokenisation advisor writing an honest advisory assessment. You previously generated a report for ${updatedQuestionnaire.companyName} (${url}).

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
${dataQuality}
${PARTNER_CREDENTIALS}

Here is the existing draft report:
${existingReportText}

Update the report to reflect the changes above. Keep sections that are unaffected by the changes largely intact. Only rewrite sections that are materially impacted. Maintain the same quality and depth.

CRITICAL: Never fabricate specific financial figures. Where data is missing, use conditional/illustrative language. Address jurisdiction-specific risks honestly. Acknowledge data gaps with "Information Needed" callouts.
${FORMATTING_RULES}

Use the submit_report tool to return all 7 updated sections. The 7 section titles must be exactly: "Executive Summary", "Tokenisation Opportunities", "Market Validation", "Implementation Plan", "Financial Outlook", "Opportunity Cost", "Your Partners".

TONE: Write for a skeptical CEO/CFO. Lead with business outcomes, not blockchain mechanics. Be the advisor they trust.`,
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
