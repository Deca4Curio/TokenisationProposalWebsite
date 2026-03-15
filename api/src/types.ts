export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type ProposalStatus =
  | "scraping"
  | "questionnaire_ready"
  | "generating"
  | "report_ready"
  | "error";

export interface ScrapedPage {
  url: string;
  content: string;
}

export interface SiteMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
  favicon?: string;
  siteName?: string;
}

export interface Questionnaire {
  companyName: string;
  industry: string;
  jurisdiction: string;
  assetTypes: string[];
  estimatedValue: string;
  revenueModel: string;
  targetInvestors: string;
  tokenStandard: string;
  regulatoryNotes: string;
  businessObjectives?: string[];
  biggestChallenge?: string;
}

export interface ReportSection {
  title: string;
  content: string;
}

export interface Proposal {
  id: string;
  userId: string;
  url: string;
  status: ProposalStatus;
  scrapedContent?: ScrapedPage[];
  siteMetadata?: SiteMetadata;
  questionnaire?: Questionnaire;
  questionnaireSubmitted?: Questionnaire;
  report?: ReportSection[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Quote Flow ─────────────────────────────────────────────────────────────

export type QuoteStatus =
  | "draft"
  | "confirmed"
  | "discovery_requested"
  | "call_redirected"
  | "pipeline_submitted";

export type QuotePath = "priced" | "call" | "success";

export interface Quote {
  id: string;
  proposalId: string;
  userId: string;
  status: QuoteStatus;
  path?: QuotePath;
  companyName: string;
  companyUrl: string;
  assetClass: string;
  assetValueRange: string;
  assetValueMid: number;
  estimatedLiquidityUnlock: number;
  geography: string;
  primaryGoal: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  coBrand: "curioinvest" | "curioinvest_deca4";
  discoveryPrice?: number;
  earlyBirdDeadline?: string;
  successFeePct?: number;
  successFeeAmount?: number;
  createdAt: string;
  updatedAt: string;
}
