"use client";

import { useState, useEffect, useCallback } from "react";
import CompanyBadge from "@/components/CompanyBadge";
import type {
  Questionnaire,
  ContactInfo,
  CompanyInfo,
  BusinessObjective,
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

const STEP_LABELS = ["Your Details", "Your Company", "Business Objectives", "Details", "Review & Book"];

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

// ─── Main need options ───────────────────────────────────────────────────────

const MAIN_NEED_OPTIONS = [
  { id: "feasibility", label: "Understand if tokenisation fits my business" },
  { id: "strategy", label: "Get a full tokenisation strategy" },
  { id: "investor_ready", label: "Create an investor-ready proposal" },
  { id: "exploring", label: "Just exploring options" },
];

// ─── Objective cards ─────────────────────────────────────────────────────────

interface ObjectiveOption {
  id: BusinessObjective;
  title: string;
  description: string;
  icon: string;
}

const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  {
    id: "raise_capital",
    title: "Raise capital from global investors",
    description: "Access a worldwide pool of investors through fractional, blockchain-based securities.",
    icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  },
  {
    id: "unlock_liquidity",
    title: "Unlock liquidity from existing assets",
    description: "Turn illiquid assets into tradeable digital tokens with secondary market access.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "new_revenue",
    title: "Generate new revenue streams",
    description: "Create new fee-based models through tokenised products, royalties, or yield structures.",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  {
    id: "expand_access",
    title: "Expand investor access",
    description: "Lower minimum investments and open your offering to a broader, more diverse investor base.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
];

function ObjectiveCard({
  option,
  selected,
  onToggle,
}: {
  option: ObjectiveOption;
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
  "Tokenisation Opportunities",
  "Market Validation",
  "Implementation Plan",
  "Financial Outlook",
  "Opportunity Cost",
  "Your Partners",
];

function ReportOutline() {
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
  const [mainNeed, setMainNeed] = useState("");

  // Step 3: Business Objectives
  const [objectives, setObjectives] = useState<BusinessObjective[]>([]);

  // Step 4: Details
  const [details, setDetails] = useState<TokenisationDetails>({
    objectives: [],
    estimatedValue: initial.estimatedValue || "",
    jurisdiction: initial.jurisdiction || "",
    targetInvestors: initial.targetInvestors || "",
    timeline: "",
    existingStructure: "",
    biggestChallenge: "",
  });

  // Simulate research on step 2
  useEffect(() => {
    if (step === 1 && !researchDone) {
      const timer = setTimeout(() => setResearchDone(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [step, researchDone]);

  const toggleObjective = useCallback((id: BusinessObjective) => {
    setObjectives((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]));
  }, []);

  // Convert wizard data back to legacy Questionnaire for API
  const handleFinalSubmit = useCallback(() => {
    const q: Questionnaire = {
      companyName: company.companyName,
      industry: company.industry,
      jurisdiction: details.jurisdiction,
      assetTypes: [],
      estimatedValue: details.estimatedValue,
      revenueModel: company.shortDescription,
      targetInvestors: details.targetInvestors,
      tokenStandard: "",
      regulatoryNotes: `Main need: ${MAIN_NEED_OPTIONS.find((o) => o.id === mainNeed)?.label || mainNeed}\nTimeline: ${details.timeline}\nExisting structure: ${details.existingStructure}\nContact: ${contact.fullName}, ${contact.role}, ${contact.phone}`,
      businessObjectives: objectives.map((o) => {
        if (o === "raise_capital") return "Raise capital from global investors";
        if (o === "unlock_liquidity") return "Unlock liquidity from existing assets";
        if (o === "new_revenue") return "Generate new revenue streams";
        return "Expand investor access";
      }),
      biggestChallenge: details.biggestChallenge,
    };
    onSubmit(q);
  }, [company, details, objectives, contact, onSubmit]);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!(contact.fullName && contact.phone && contact.role);
      case 1: return researchDone && !!company.companyName && !!mainNeed;
      case 2: return objectives.length > 0;
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

                {/* Main need selector */}
                <Field label="What are you looking for?" required>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {MAIN_NEED_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setMainNeed(option.id)}
                        className="rounded-xl px-4 py-3 text-left text-sm transition-all"
                        style={{
                          background: mainNeed === option.id ? "var(--badge-bg)" : "var(--bg-input)",
                          border: mainNeed === option.id ? "2px solid var(--color-teal)" : "2px solid var(--border)",
                          color: mainNeed === option.id ? "var(--accent)" : "var(--text-secondary)",
                          fontWeight: mainNeed === option.id ? 600 : 400,
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}
          </div>
        );

      // ── Step 3: Business Objectives ──────────────────────────────────────
      case 2:
        return (
          <div className="animate-fade-in flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                What are your business objectives?
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Select all that apply. We&apos;ll tailor your report to each objective.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {OBJECTIVE_OPTIONS.map((option) => (
                <ObjectiveCard
                  key={option.id}
                  option={option}
                  selected={objectives.includes(option.id)}
                  onToggle={() => toggleObjective(option.id)}
                />
              ))}
            </div>

            {/* Report outline preview */}
            <ReportOutline />
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

              <Field label="Existing legal structure" hint="Do you have a holding company, fund, or SPV?">
                <TextInput
                  value={details.existingStructure}
                  onChange={(v) => setDetails((d) => ({ ...d, existingStructure: v }))}
                  placeholder="e.g. SPV in DIFC, BVI holding company, not yet"
                />
              </Field>

              <Field label="What's your biggest challenge today?" hint="What's holding you back from achieving your objectives?">
                <TextArea
                  value={details.biggestChallenge}
                  onChange={(v) => setDetails((d) => ({ ...d, biggestChallenge: v }))}
                  rows={3}
                  placeholder="e.g. Can't access international investors, assets are illiquid, high intermediary costs"
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
                {mainNeed && (
                  <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    Looking for: {MAIN_NEED_OPTIONS.find((o) => o.id === mainNeed)?.label}
                  </p>
                )}
              </div>

              {/* Objectives */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Objectives</p>
                  <button onClick={() => setStep(2)} className="text-xs" style={{ color: "var(--accent)" }}>Edit</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((o) => {
                    const opt = OBJECTIVE_OPTIONS.find((opt) => opt.id === o);
                    return (
                      <span key={o} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "var(--badge-bg)", color: "var(--accent)" }}>
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
                {details.biggestChallenge && (
                  <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    Challenge: {details.biggestChallenge}
                  </p>
                )}
              </div>
            </div>

            {/* Report outline */}
            <ReportOutline />

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
              // After Step 3 (objectives), fire pre-generation in background
              if (step === 2 && !pregenerateFired) {
                setPregenerateFired(true);
                const partialQ: Questionnaire = {
                  ...initial,
                  companyName: company.companyName,
                  industry: company.industry,
                  revenueModel: company.shortDescription,
                  regulatoryNotes: company.detailedSummary,
                  assetTypes: [],
                  businessObjectives: objectives.map((o) => {
                    if (o === "raise_capital") return "Raise capital from global investors";
                    if (o === "unlock_liquidity") return "Unlock liquidity from existing assets";
                    if (o === "new_revenue") return "Generate new revenue streams";
                    return "Expand investor access";
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
