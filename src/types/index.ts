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

export interface TokenisationDetails {
  goals: TokenisationGoal[];
  estimatedValue: string;
  jurisdiction: string;
  targetInvestors: string;
  timeline: string;
  existingStructure: string;
  offeringType: string;
}

export interface WizardData {
  contact: ContactInfo;
  company: CompanyInfo;
  goals: TokenisationGoal[];
  details: TokenisationDetails;
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
  questionnaire?: Questionnaire;
  questionnaireSubmitted?: Questionnaire;
  report?: ReportSection[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
