import Anthropic from "@anthropic-ai/sdk";
import type { Questionnaire, ReportSection, ScrapedPage } from "../types.js";

const REPORT_MODEL = "claude-sonnet-4-6-20250627";
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

function buildReportPrompt(url: string, questionnaire: Questionnaire): string {
  return `You are a senior tokenisation advisor at Deca4 Advisory, a blockchain consulting firm based in Dubai. Generate a comprehensive tokenisation proposal.

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

Generate a proposal with exactly 6 sections. Each section should have 300-500 words.

CRITICAL: Respond with ONLY a valid JSON array. No markdown code fences, no extra text. All strings must be properly JSON-escaped (use \\n for newlines within content, escape quotes with \\"). Use plain text with dashes for bullet points, not markdown.

[
  {"title": "Asset Analysis", "content": "detailed analysis text here"},
  {"title": "Token Economics", "content": "token economics text here"},
  {"title": "Regulatory Framework", "content": "regulatory text here"},
  {"title": "Smart Contract Architecture", "content": "smart contract text here"},
  {"title": "Go-to-Market Strategy", "content": "go to market text here"},
  {"title": "Financial Projections", "content": "financial projections text here"}
]`;
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
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: buildReportPrompt(url, questionnaire),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = cleanJsonString(text);
    return JSON.parse(cleaned) as ReportSection[];
  } catch {
    console.error("Failed to parse report JSON:", text.slice(0, 500));
    throw new Error("AI returned invalid JSON for report");
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
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: `You are a senior tokenisation advisor at Deca4 Advisory. You previously generated a tokenisation proposal for ${updatedQuestionnaire.companyName} (${url}).

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

CRITICAL: Respond with ONLY a valid JSON array of all 6 updated sections. No markdown code fences. All strings must be properly JSON-escaped.

[
  {"title": "Asset Analysis", "content": "..."},
  {"title": "Token Economics", "content": "..."},
  {"title": "Regulatory Framework", "content": "..."},
  {"title": "Smart Contract Architecture", "content": "..."},
  {"title": "Go-to-Market Strategy", "content": "..."},
  {"title": "Financial Projections", "content": "..."}
]`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = cleanJsonString(text);
    return JSON.parse(cleaned) as ReportSection[];
  } catch {
    console.error("Failed to parse refined report JSON:", text.slice(0, 500));
    throw new Error("AI returned invalid JSON for refined report");
  }
}
