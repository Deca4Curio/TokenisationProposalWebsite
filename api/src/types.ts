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
  questionnaire?: Questionnaire;
  questionnaireSubmitted?: Questionnaire;
  report?: ReportSection[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
