import Anthropic from "@anthropic-ai/sdk";
import type { Questionnaire, ReportSection, ScrapedPage } from "@/types";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function prefillQuestionnaire(
  url: string,
  scrapedContent: ScrapedPage[]
): Promise<Questionnaire> {
  const client = getClient();
  const siteContent = scrapedContent.map((p) => p.content).join("\n\n---\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a tokenisation expert. Analyse this website content and extract/infer the information needed for a tokenisation proposal.

Website URL: ${url}

Website content:
${siteContent}

Respond with ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "companyName": "string - company name from the website",
  "industry": "string - primary industry (e.g. Real Estate, Technology, Energy, Agriculture, Infrastructure, Finance)",
  "jurisdiction": "string - likely jurisdiction based on content (e.g. UAE - DIFC, UAE - ADGM, Switzerland, Singapore, USA)",
  "assetTypes": ["array of strings - types of assets that could be tokenised (e.g. Real Estate, Equity, Revenue Share, Debt, Commodities, IP Rights)"],
  "estimatedValue": "string - estimated asset value if mentioned, otherwise 'To be determined'",
  "revenueModel": "string - business revenue model (e.g. Rental Income, SaaS Revenue, Transaction Fees, Asset Appreciation)",
  "targetInvestors": "string - likely target investors (e.g. Institutional, Retail, Accredited, Family Offices)",
  "tokenStandard": "string - recommended token standard (e.g. ERC-20, ERC-1400, ERC-3643)",
  "regulatoryNotes": "string - key regulatory considerations for this business type and jurisdiction"
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  // Extract JSON from response, handling potential markdown wrapping
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude did not return valid JSON");

  return JSON.parse(jsonMatch[0]) as Questionnaire;
}

export async function generateReport(
  url: string,
  questionnaire: Questionnaire
): Promise<ReportSection[]> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: `You are a senior tokenisation advisor at Deca4 Advisory, a blockchain consulting firm based in Dubai. Generate a comprehensive tokenisation proposal based on this information.

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

Generate a proposal with exactly 6 sections. Respond with ONLY a JSON array (no markdown wrapping, no explanation):

[
  {
    "title": "Asset Analysis",
    "content": "markdown content - Detailed analysis of tokenisable assets, valuation approach, and asset structure recommendations"
  },
  {
    "title": "Token Economics",
    "content": "markdown content - Token supply, pricing mechanism, distribution schedule, vesting, and liquidity strategy"
  },
  {
    "title": "Regulatory Framework",
    "content": "markdown content - Jurisdiction-specific compliance, entity structure, licensing, and regulatory roadmap"
  },
  {
    "title": "Smart Contract Architecture",
    "content": "markdown content - Token standard rationale, on-chain logic, security considerations, and integration plan"
  },
  {
    "title": "Go-to-Market Strategy",
    "content": "markdown content - Investor targeting, distribution channels, marketing plan, and launch timeline"
  },
  {
    "title": "Financial Projections",
    "content": "markdown content - Fundraise modelling, cost breakdown, ROI scenarios, and 3-year projections"
  }
]

Make each section 300-500 words with specific, actionable insights. Use markdown formatting (headers, bullet points, bold) within content.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Claude did not return valid JSON array");

  return JSON.parse(jsonMatch[0]) as ReportSection[];
}
