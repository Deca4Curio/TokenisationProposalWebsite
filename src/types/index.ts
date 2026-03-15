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

// Legacy questionnaire (kept for backward compat with API)
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

// New multi-step wizard data
export interface ContactInfo {
  fullName: string;
  phone: string;
  role: string;
  website: string;
}

export interface CompanyInfo {
  companyName: string;
  industry: string;
  shortDescription: string;
  detailedSummary: string;
}

export type TokenisationGoal =
  | "equity"
  | "debt"
  | "inventory_product_fund";

export type BusinessObjective =
  | "raise_capital"
  | "unlock_liquidity"
  | "new_revenue"
  | "expand_access";

export interface TokenisationDetails {
  objectives: BusinessObjective[];
  estimatedValue: string;
  jurisdiction: string;
  targetInvestors: string;
  timeline: string;
  existingStructure: string;
  biggestChallenge: string;
}

export interface WizardData {
  contact: ContactInfo;
  company: CompanyInfo;
  objectives: BusinessObjective[];
  details: TokenisationDetails;
}

export interface SiteMetadata {
  title?: string;
  description?: string;
  ogImage?: string;
  favicon?: string;
  siteName?: string;
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
  slug?: string;
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

export type AssetClass =
  | "Real estate"
  | "Commodities/metals"
  | "Private credit/loans"
  | "Energy/oil & gas"
  | "Infrastructure"
  | "Other";

export type ValueRange =
  | "Under CHF 5M"
  | "CHF 5M-25M"
  | "CHF 25M-100M"
  | "CHF 100M-500M"
  | "Over CHF 500M";

export type PrimaryGoal =
  | "Access non-dilutive liquidity"
  | "Raise new capital"
  | "Increase asset value"
  | "Explore feasibility"
  | "Other";

export interface Quote {
  id: string;
  proposalId: string;
  userId: string;
  status: QuoteStatus;
  path?: QuotePath;

  // Step 1: Project confirmation
  companyName: string;
  companyUrl: string;
  assetClass: AssetClass;
  assetValueRange: ValueRange;
  geography: string;
  primaryGoal: PrimaryGoal;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;

  // Derived
  assetValueMid: number;
  estimatedLiquidityUnlock: number;
  coBrand: "curioinvest" | "curioinvest_deca4";

  // Step 2: Path-specific
  discoveryPrice?: number;
  earlyBirdDeadline?: string;
  successFeePct?: number;
  successFeeAmount?: number;

  createdAt: string;
  updatedAt: string;
}
