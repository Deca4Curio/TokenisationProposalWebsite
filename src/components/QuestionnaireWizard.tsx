"use client";

import { useState, useEffect, useCallback } from "react";
import CompanyBadge from "@/components/CompanyBadge";
import type {
  Questionnaire,
  ContactInfo,
  CompanyInfo,
  TokenisationGoal,
  TokenisationDetails,
} from "@/types";

// ─── Props ───────────────────────────────────────────────────────────────────

interface QuestionnaireWizardProps {
  /** Pre-filled questionnaire from the scrape */
  initial: Questionnaire;
  /** The URL that was scraped */
  url: string;
  /** The proposal ID for pre-generation */
  proposalId: string;
  /** Called when user completes the wizard */
  onSubmit: (questionnaire: Questionnaire) => void;
  /** Whether final submission is in progress */
  loading: boolean;
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = ["Your Details", "Your Company", "Tokenisation Goals", "Details", "Review & Book"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                done ? "bg-[var(--color-teal)] text-white" : active ? "ring-2 ring-[var(--color-teal)]" : ""
              }`}
              style={{
                background: done ? undefined : active ? "var(--bg-card)" : "var(--bg-input)",
                color: done ? undefined : active ? "var(--text-primary)" : "var(--text-muted)",
                border: done ? undefined : active ? undefined : "1px solid var(--border)",
              }}
            >
              {done ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < total - 1 && (
              <div
                className="h-0.5 w-8 transition-all sm:w-12"
                style={{ background: done ? "var(--color-teal)" : "var(--border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Form field helpers ──────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && (
        <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--input-focus-border)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", resize: "vertical" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--input-focus-border)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    />
  );
}

// ─── Goal cards ──────────────────────────────────────────────────────────────

interface GoalOption {
  id: TokenisationGoal;
  title: string;
  description: string;
  icon: string;
}

function getGoalOptions(industry: string): GoalOption[] {
  // Dynamic third option based on company type
  const lower = industry.toLowerCase();
  let thirdOption: GoalOption;

  if (lower.includes("fund") || lower.includes("invest") || lower.includes("asset management") || lower.includes("capital")) {
    thirdOption = {
      id: "inventory_product_fund",
      title: "Tokenise a Fund",
      description: "Create tokenised fund units for fractional investment access and secondary market liquidity.",
      icon: "M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm2 0v10h16V7H4z",
    };
  } else if (lower.includes("real estate") || lower.includes("property") || lower.includes("reit")) {
    thirdOption = {
      id: "inventory_product_fund",
      title: "Tokenise Property",
      description: "Fractionalise real estate assets for broader investor access and liquidity.",
      icon: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3",
    };
  } else if (lower.includes("commodity") || lower.includes("oil") || lower.includes("mining") || lower.includes("agriculture")) {
    thirdOption = {
      id: "inventory_product_fund",
      title: "Tokenise Commodities",
      description: "Create digital representations of physical commodities for fractional trading.",
      icon: "M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9",
    };
  } else {
    thirdOption = {
      id: "inventory_product_fund",
      title: "Tokenise Inventory / Product",
      description: "Tokenise physical or digital inventory, IP, or product-backed assets for new financing models.",
      icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
    };
  }

  return [
    {
      id: "equity",
      title: "Tokenise Equity",
      description: "Convert company shares into digital tokens for broader investor access and secondary market trading.",
      icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    },
    {
      id: "debt",
      title: "Issue Tokenised Debt",
      description: "Create blockchain-based bonds or debt instruments with automated coupon payments and transparent terms.",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    },
    thirdOption,
  ];
}

function GoalCard({
  option,
  selected,
  onToggle,
}: {
  option: GoalOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-start gap-4 rounded-xl p-5 text-left transition-all"
      style={{
        background: selected ? "var(--badge-bg)" : "var(--bg-input)",
        border: selected ? "2px solid var(--color-teal)" : "2px solid var(--border)",
      }}
    >
      {/* Checkbox */}
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
        style={{
          background: selected ? "var(--color-teal)" : "transparent",
          border: selected ? "none" : "2px solid var(--border-hover, var(--border))",
        }}
      >
        {selected && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: selected ? "rgba(0,169,165,0.15)" : "var(--step-card-bg)" }}
      >
        <svg
          className="h-5 w-5"
          style={{ color: selected ? "var(--accent)" : "var(--text-muted)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        >
          <path d={option.icon} />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{option.title}</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{option.description}</p>
      </div>
    </button>
  );
}

// ─── Report outline ──────────────────────────────────────────────────────────

const REPORT_SECTIONS = [
  "Executive Summary",
  "Asset Analysis",
  "Token Economics",
  "Regulatory Framework",
  "Smart Contract Architecture",
  "Go-to-Market Strategy",
  "Financial Projections",
];

function ReportOutline({ goals }: { goals: TokenisationGoal[] }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--feature-bg)", border: "1px solid var(--border)" }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Your report will include
      </p>
      <div className="flex flex-col gap-2">
        {REPORT_SECTIONS.map((section) => (
          <div key={section} className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-[var(--color-teal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{section}</span>
          </div>
        ))}
        {goals.includes("equity") && (
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-[var(--color-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Equity Tokenisation Specifics</span>
          </div>
        )}
        {goals.includes("debt") && (
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-[var(--color-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Debt Instrument Structure</span>
          </div>
        )}
        {goals.includes("inventory_product_fund") && (
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-[var(--color-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Asset-Specific Tokenisation Plan</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────

export default function QuestionnaireWizard({ initial, url, proposalId, onSubmit, loading }: QuestionnaireWizardProps) {
  const [step, setStep] = useState(0);
  const [pregenerateFired, setPregenerateFired] = useState(false);

  // Step 1: Contact
  const [contact, setContact] = useState<ContactInfo>({
    fullName: "",
    phone: "",
    role: "",
    website: url,
  });

  // Step 2: Company (prefilled from scrape)
  const [company, setCompany] = useState<CompanyInfo>({
    companyName: initial.companyName || "",
    industry: initial.industry || "",
    shortDescription: initial.revenueModel || "",
    detailedSummary: initial.regulatoryNotes || "",
  });
  const [researchDone, setResearchDone] = useState(false);

  // Step 3: Goals
  const [goals, setGoals] = useState<TokenisationGoal[]>([]);

  // Step 4: Details
  const [details, setDetails] = useState<TokenisationDetails>({
    goals: [],
    estimatedValue: initial.estimatedValue || "",
    jurisdiction: initial.jurisdiction || "",
    targetInvestors: initial.targetInvestors || "",
    timeline: "",
    existingStructure: "",
    offeringType: "",
  });

  // Simulate research on step 2
  useEffect(() => {
    if (step === 1 && !researchDone) {
      const timer = setTimeout(() => setResearchDone(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [step, researchDone]);

  const goalOptions = getGoalOptions(company.industry);

  const toggleGoal = useCallback((id: TokenisationGoal) => {
    setGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }, []);

  // Convert wizard data back to legacy Questionnaire for API
  const handleFinalSubmit = useCallback(() => {
    const q: Questionnaire = {
      companyName: company.companyName,
      industry: company.industry,
      jurisdiction: details.jurisdiction,
      assetTypes: goals.map((g) => {
        if (g === "equity") return "Equity";
        if (g === "debt") return "Debt";
        return goalOptions.find((o) => o.id === g)?.title.replace("Tokenise ", "") || "Other";
      }),
      estimatedValue: details.estimatedValue,
      revenueModel: company.shortDescription,
      targetInvestors: details.targetInvestors,
      tokenStandard: "",
      regulatoryNotes: `Timeline: ${details.timeline}\nExisting structure: ${details.existingStructure}\nOffering type: ${details.offeringType}\nContact: ${contact.fullName}, ${contact.role}, ${contact.phone}`,
    };
    onSubmit(q);
  }, [company, details, goals, contact, goalOptions, onSubmit]);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!(contact.fullName && contact.phone && contact.role);
      case 1: return researchDone && !!company.companyName;
      case 2: return goals.length > 0;
      case 3: return !!(details.estimatedValue && details.jurisdiction);
      default: return true;
    }
  };

  // ─── Render Steps ────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── Step 1: Your Details ──────────────────────────────────────────────
      case 0:
        return (
          <div className="animate-fade-in flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                Let&apos;s get started
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Tell us a bit about yourself so we can personalise your report.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <Field label="Your full name" required>
                <TextInput
                  value={contact.fullName}
                  onChange={(v) => setContact((c) => ({ ...c, fullName: v }))}
                  placeholder="Fernando Verboonen"
                />
              </Field>
              <Field label="Your phone number" required hint="We may follow up to discuss your report.">
                <TextInput
                  value={contact.phone}
                  onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
                  placeholder="+41 79 123 4567"
                  type="tel"
                />
              </Field>
              <Field label="Your role at the company" required>
                <TextInput
                  value={contact.role}
                  onChange={(v) => setContact((c) => ({ ...c, role: v }))}
                  placeholder="e.g. CEO, CFO, Head of Strategy"
                />
              </Field>
              <Field label="Company website">
                <TextInput
                  value={contact.website}
                  onChange={(v) => setContact((c) => ({ ...c, website: v }))}
                  placeholder="https://yourcompany.com"
                  disabled
                />
              </Field>
            </div>
          </div>
        );

      // ── Step 2: Company Research ──────────────────────────────────────────
      case 1:
        return (
          <div className="animate-fade-in flex flex-col gap-6">
            {!researchDone ? (
              /* Loading state */
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin-slow rounded-full border-2 border-transparent border-t-[var(--color-teal)]" />
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Performing deep research on your business. This may take up to 30 seconds.
                  </p>
                </div>

                {/* Company preview with real favicon */}
                <CompanyBadge url={url} companyName={company.companyName || "Loading..."} size="md" />

                {/* Skeleton lines */}
                <div className="flex flex-col gap-3">
                  <div className="h-3 w-24 animate-pulse rounded" style={{ background: "var(--border)" }} />
                  <div className="h-3 w-full animate-pulse rounded" style={{ background: "var(--border)" }} />
                  <div className="h-20 w-full animate-pulse rounded-lg" style={{ background: "var(--bg-input)" }} />
                  <div className="h-3 w-32 animate-pulse rounded" style={{ background: "var(--border)" }} />
                  <div className="h-3 w-3/4 animate-pulse rounded" style={{ background: "var(--border)" }} />
                  <div className="h-20 w-full animate-pulse rounded-lg" style={{ background: "var(--bg-input)" }} />
                </div>
              </div>
            ) : (
              /* Loaded state — editable company info */
              <div className="flex flex-col gap-6">
                <CompanyBadge url={url} companyName={company.companyName} size="lg" />

                <Field label="Company Name" required>
                  <TextInput
                    value={company.companyName}
                    onChange={(v) => setCompany((c) => ({ ...c, companyName: v }))}
                  />
                </Field>

                <Field label="Industry" required>
                  <TextInput
                    value={company.industry}
                    onChange={(v) => setCompany((c) => ({ ...c, industry: v }))}
                    placeholder="e.g. Real Estate, Financial Services, Technology"
                  />
                </Field>

                <Field label="Short description" hint="How would you describe your business in a few words?">
                  <TextInput
                    value={company.shortDescription}
                    onChange={(v) => setCompany((c) => ({ ...c, shortDescription: v }))}
                    placeholder="A leading tokenisation platform..."
                  />
                </Field>

                <Field label="Detailed Summary" hint="What is your business doing?">
                  <TextArea
                    value={company.detailedSummary}
                    onChange={(v) => setCompany((c) => ({ ...c, detailedSummary: v }))}
                    rows={5}
                    placeholder="Describe your business model, products, and services..."
                  />
                </Field>
              </div>
            )}
          </div>
        );

      // ── Step 3: Tokenisation Goals ────────────────────────────────────────
      case 2:
        return (
          <div className="animate-fade-in flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                What do you want to tokenise?
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Select all that apply. We&apos;ll tailor your report to each goal.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {goalOptions.map((option) => (
                <GoalCard
                  key={option.id}
                  option={option}
                  selected={goals.includes(option.id)}
                  onToggle={() => toggleGoal(option.id)}
                />
              ))}
            </div>

            {/* Report outline preview */}
            <ReportOutline goals={goals} />
          </div>
        );

      // ── Step 4: Details ───────────────────────────────────────────────────
      case 3:
        return (
          <div className="animate-fade-in flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                A few more details
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Help us scope your report accurately.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <Field label="Estimated total asset value or target raise" required hint="e.g. $5M, $50M, $500M">
                <TextInput
                  value={details.estimatedValue}
                  onChange={(v) => setDetails((d) => ({ ...d, estimatedValue: v }))}
                  placeholder="$10,000,000"
                />
              </Field>

              <Field label="Jurisdiction" required hint="Where is the asset or issuing entity based?">
                <TextInput
                  value={details.jurisdiction}
                  onChange={(v) => setDetails((d) => ({ ...d, jurisdiction: v }))}
                  placeholder="e.g. UAE (DIFC), Switzerland, Cayman Islands"
                />
              </Field>

              <Field label="Target investors" hint="Who will invest? (institutional, accredited, retail, geography)">
                <TextInput
                  value={details.targetInvestors}
                  onChange={(v) => setDetails((d) => ({ ...d, targetInvestors: v }))}
                  placeholder="e.g. GCC HNWIs, international institutional"
                />
              </Field>

              <Field label="Target timeline" hint="When do you want to launch?">
                <TextInput
                  value={details.timeline}
                  onChange={(v) => setDetails((d) => ({ ...d, timeline: v }))}
                  placeholder="e.g. Q3 2026, within 6 months, ASAP"
                />
              </Field>

              <Field label="Existing legal structure" hint="Do you have an SPV, fund, or holding company?">
                <TextInput
                  value={details.existingStructure}
                  onChange={(v) => setDetails((d) => ({ ...d, existingStructure: v }))}
                  placeholder="e.g. SPV in DIFC, BVI holding company, not yet"
                />
              </Field>

              <Field label="Offering type" hint="What are you selling to investors?">
                <TextInput
                  value={details.offeringType}
                  onChange={(v) => setDetails((d) => ({ ...d, offeringType: v }))}
                  placeholder="e.g. Equity, debt, revenue share, utility tokens"
                />
              </Field>
            </div>
          </div>
        );

      // ── Step 5: Review & Book ─────────────────────────────────────────────
      case 4:
        return (
          <div className="animate-fade-in flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                Ready to generate your report
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Review your details below, then generate your report or book a call with our team.
              </p>
            </div>

            {/* Summary cards */}
            <div className="flex flex-col gap-4">
              {/* Contact */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Contact</p>
                  <button onClick={() => setStep(0)} className="text-xs" style={{ color: "var(--accent)" }}>Edit</button>
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{contact.fullName}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{contact.role} · {contact.phone}</p>
              </div>

              {/* Company */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Company</p>
                  <button onClick={() => setStep(1)} className="text-xs" style={{ color: "var(--accent)" }}>Edit</button>
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{company.companyName}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{company.industry}</p>
              </div>

              {/* Goals */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Goals</p>
                  <button onClick={() => setStep(2)} className="text-xs" style={{ color: "var(--accent)" }}>Edit</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {goals.map((g) => {
                    const opt = goalOptions.find((o) => o.id === g);
                    return (
                      <span key={g} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "var(--badge-bg)", color: "var(--accent)" }}>
                        {opt?.title}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Details */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Details</p>
                  <button onClick={() => setStep(3)} className="text-xs" style={{ color: "var(--accent)" }}>Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <span>Value: {details.estimatedValue || "—"}</span>
                  <span>Jurisdiction: {details.jurisdiction || "—"}</span>
                  <span>Timeline: {details.timeline || "—"}</span>
                  <span>Structure: {details.existingStructure || "—"}</span>
                </div>
              </div>
            </div>

            {/* Report outline */}
            <ReportOutline goals={goals} />

            {/* Book a call option */}
            <div className="rounded-xl p-5 text-center" style={{ background: "var(--feature-bg)", border: "1px solid var(--border)" }}>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Prefer to discuss first?
              </p>
              <a
                href="https://calend.ly/rfv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                Schedule a Call →
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">
      {/* Step indicator */}
      <StepIndicator current={step} total={STEP_LABELS.length} />

      {/* Step content */}
      {renderStep()}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex h-12 w-12 items-center justify-center rounded-xl transition-all"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            ←
          </button>
        )}
        {step < STEP_LABELS.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              const nextStep = step + 1;
              setStep(nextStep);
              // After Step 3 (goals), fire pre-generation in background
              if (step === 2 && !pregenerateFired) {
                setPregenerateFired(true);
                const partialQ: Questionnaire = {
                  ...initial,
                  companyName: company.companyName,
                  industry: company.industry,
                  revenueModel: company.shortDescription,
                  regulatoryNotes: company.detailedSummary,
                  assetTypes: goals.map((g) => {
                    if (g === "equity") return "Equity";
                    if (g === "debt") return "Debt";
                    return goalOptions.find((o) => o.id === g)?.title.replace("Tokenise ", "") || "Other";
                  }),
                };
                fetch(`/api/proposals/${proposalId}/pregenerate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(partialQ),
                }).catch(() => {}); // fire and forget
              }
            }}
            disabled={!canProceed()}
            className="flex-1 rounded-xl py-3.5 text-base font-semibold text-white transition-all disabled:opacity-40"
            style={{
              background: canProceed() ? "var(--color-teal)" : "var(--text-muted)",
              boxShadow: canProceed() ? "0 4px 20px var(--glow-color)" : undefined,
            }}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={loading}
            className="flex-1 rounded-xl bg-[var(--color-teal)] py-3.5 text-base font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            style={{ boxShadow: "0 4px 20px var(--glow-color)" }}
          >
            {loading ? "Generating..." : "Generate Report →"}
          </button>
        )}
      </div>
    </div>
  );
}
