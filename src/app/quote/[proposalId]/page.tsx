"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PartnerLogos from "@/components/PartnerLogos";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import type {
  Proposal,
  Quote,
  AssetClass,
  ValueRange,
  PrimaryGoal,
} from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const STRIPE_DISCOVERY = "https://buy.stripe.com/7sY7sD9gH4AR02V1VA48001";
const STRIPE_CALL = "https://buy.stripe.com/cNicMX2Sj2sJaHzdEi48000";

const ASSET_CLASSES: AssetClass[] = [
  "Real estate",
  "Commodities/metals",
  "Private credit/loans",
  "Energy/oil & gas",
  "Infrastructure",
  "Other",
];

const VALUE_RANGES: ValueRange[] = [
  "Under CHF 5M",
  "CHF 5M-25M",
  "CHF 25M-100M",
  "CHF 100M-500M",
  "Over CHF 500M",
];

const PRIMARY_GOALS: PrimaryGoal[] = [
  "Access non-dilutive liquidity",
  "Raise new capital",
  "Increase asset value",
  "Explore feasibility",
  "Other",
];

const VALUE_MIDPOINTS: Record<string, number> = {
  "Under CHF 5M": 2_500_000,
  "CHF 5M-25M": 15_000_000,
  "CHF 25M-100M": 62_500_000,
  "CHF 100M-500M": 300_000_000,
  "Over CHF 500M": 750_000_000,
};

const BEFORE_AFTER_ROWS = [
  { before: "Vague idea", after: "Concrete tokenisation blueprint" },
  { before: "No investor materials", after: "Investor-ready pitch deck" },
  { before: "Unknown legal path", after: "Jurisdiction-mapped structure" },
  { before: "No tech evaluation", after: "Platform shortlist & comparison" },
  { before: "Months of research", after: "7-day accelerated output" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCHF(n: number): string {
  if (n >= 1_000_000) return `CHF ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `CHF ${(n / 1_000).toFixed(0)}k`;
  return `CHF ${n.toLocaleString()}`;
}

function extractContact(regulatoryNotes: string): { name: string; role: string } {
  const match = regulatoryNotes?.match(/Contact:\s*(.+?),\s*(.+?),/);
  return {
    name: match?.[1]?.trim() || "",
    role: match?.[2]?.trim() || "",
  };
}

// ─── Form Components ────────────────────────────────────────────────────────

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

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
      style={{
        background: "var(--bg-input)",
        border: "1px solid var(--border)",
        color: value ? "var(--text-primary)" : "var(--text-muted)",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

// ─── Countdown Timer ────────────────────────────────────────────────────────

function useCountdown(deadlineISO: string | undefined) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number; expired: boolean }>({
    days: 0,
    hours: 0,
    minutes: 0,
    expired: false,
  });

  useEffect(() => {
    if (!deadlineISO) return;

    // Use localStorage to persist the first visit deadline
    const storageKey = "curio_quote_session";
    let deadline: number;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      deadline = parseInt(stored, 10);
    } else {
      deadline = new Date(deadlineISO).getTime();
      localStorage.setItem(storageKey, deadline.toString());
    }

    function tick() {
      const now = Date.now();
      const diff = deadline - now;
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, expired: true });
        return;
      }
      setRemaining({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        expired: false,
      });
    }

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [deadlineISO]);

  return remaining;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function QuotePage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const router = useRouter();
  const { dark, toggle } = useTheme();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);

  // Step 1 form state
  const [companyName, setCompanyName] = useState("");
  const [assetClass, setAssetClass] = useState("");
  const [assetValueRange, setAssetValueRange] = useState("");
  const [geography, setGeography] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientRole, setRecipientRole] = useState("");

  // Step 2 state
  const [selectedFee, setSelectedFee] = useState<"2" | "5" | "custom">("2");
  const [customFee, setCustomFee] = useState("");
  const [pipelineSubmitted, setPipelineSubmitted] = useState(false);

  // Countdown
  const countdown = useCountdown(quote?.earlyBirdDeadline);

  // Load proposal data
  useEffect(() => {
    async function fetchProposal() {
      try {
        const res = await fetch(`/api/proposals/${proposalId}`);
        if (!res.ok) {
          setError("Failed to load proposal");
          setLoading(false);
          return;
        }
        const data = await res.json();
        const p = data.proposal as Proposal;
        setProposal(p);

        // Pre-fill from proposal
        const q = p.questionnaireSubmitted || p.questionnaire;
        if (q) {
          setCompanyName(q.companyName || "");
          setGeography(q.jurisdiction || "");
          // Map assetTypes to closest match
          if (q.assetTypes?.length) {
            const first = q.assetTypes[0].toLowerCase();
            const match = ASSET_CLASSES.find((ac) => first.includes(ac.toLowerCase().split("/")[0]));
            if (match) setAssetClass(match);
          }
          // Map estimatedValue to range
          if (q.estimatedValue) {
            const val = parseFloat(q.estimatedValue.replace(/[^0-9.]/g, ""));
            if (val < 5_000_000) setAssetValueRange("Under CHF 5M");
            else if (val < 25_000_000) setAssetValueRange("CHF 5M-25M");
            else if (val < 100_000_000) setAssetValueRange("CHF 25M-100M");
            else if (val < 500_000_000) setAssetValueRange("CHF 100M-500M");
            else setAssetValueRange("Over CHF 500M");
          }
          // Extract contact from regulatoryNotes
          const contact = extractContact(q.regulatoryNotes || "");
          if (contact.name) setRecipientName(contact.name);
          if (contact.role) setRecipientRole(contact.role);
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    fetchProposal();
  }, [proposalId]);

  // Step 1 validation
  const canSubmitStep1 = companyName && assetClass && assetValueRange && geography && primaryGoal;

  // Step 1 submit
  const handleStep1Submit = useCallback(async () => {
    if (!canSubmitStep1 || !proposal) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          companyName,
          companyUrl: proposal.url,
          assetClass,
          assetValueRange,
          geography,
          primaryGoal,
          recipientName,
          recipientEmail,
          recipientRole,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      // API returns quoteId at top level; normalize to id for our Quote type
      setQuote({ ...data, id: data.quoteId } as Quote);
      setCurrentStep(2);
    } catch {
      setError("Failed to save quote");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmitStep1, proposal, proposalId, companyName, assetClass, assetValueRange, geography, primaryGoal, recipientName, recipientEmail, recipientRole]);

  // Step 2: Path selection handlers
  const handleDiscovery = useCallback(async () => {
    if (!quote) return;
    const price = countdown.expired ? 25_000 : 10_000;

    // Update quote in Firestore, then redirect to Stripe
    await fetch(`/api/quotes/${quote.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "priced",
        status: "discovery_requested",
        discoveryPrice: price,
      }),
    }).catch(() => {});

    window.open(STRIPE_DISCOVERY, "_blank");
  }, [quote, countdown.expired]);

  const handleCall = useCallback(async () => {
    if (!quote) return;

    await fetch(`/api/quotes/${quote.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "call",
        status: "call_redirected",
      }),
    }).catch(() => {});

    window.open(STRIPE_CALL, "_blank");
  }, [quote]);

  const handlePipeline = useCallback(async () => {
    if (!quote) return;
    setSubmitting(true);

    const mid = VALUE_MIDPOINTS[assetValueRange] || 15_000_000;
    const pct = selectedFee === "custom" ? parseFloat(customFee) || 2 : parseInt(selectedFee);
    const amount = Math.max(mid * (pct / 100), 50_000);

    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "success",
          status: "pipeline_submitted",
          successFeePct: pct,
          successFeeAmount: amount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPipelineSubmitted(true);
      }
    } catch {
      setError("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }, [quote, assetValueRange, selectedFee, customFee]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="animate-spin-slow h-10 w-10 rounded-full border-2 border-transparent border-t-[var(--color-teal)]" />
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-xl bg-[var(--color-teal)] px-6 py-3 text-sm font-semibold text-white"
        >
          Go Home
        </button>
      </div>
    );
  }

  const mid = VALUE_MIDPOINTS[assetValueRange] || 0;
  const fee2 = Math.max(mid * 0.02, 50_000);
  const fee5 = Math.max(mid * 0.05, 50_000);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-12" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-4xl">
        {/* Nav */}
        <div className="mb-8 flex items-center justify-between">
          <PartnerLogos dark={dark} />
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-sm transition-colors hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Back to Report
            </button>
            <ThemeToggle dark={dark} toggle={toggle} />
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-0">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  currentStep > s ? "bg-[var(--color-teal)] text-white" : currentStep === s ? "ring-2 ring-[var(--color-teal)]" : ""
                }`}
                style={{
                  background: currentStep > s ? undefined : currentStep === s ? "var(--bg-card)" : "var(--bg-input)",
                  color: currentStep > s ? undefined : currentStep === s ? "var(--text-primary)" : "var(--text-muted)",
                  border: currentStep > s ? undefined : currentStep === s ? undefined : "1px solid var(--border)",
                }}
              >
                {currentStep > s ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              {s < 2 && (
                <div
                  className="h-0.5 w-12 transition-all sm:w-20"
                  style={{ background: currentStep > s ? "var(--color-teal)" : "var(--border)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ─── Step 1: Confirm Your Project ────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                Confirm Your Project
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Review and adjust the details below before requesting your quote.
              </p>
            </div>

            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Company name" required>
                    <TextInput value={companyName} onChange={setCompanyName} />
                  </Field>
                  <Field label="Website">
                    <TextInput value={proposal?.url || ""} onChange={() => {}} disabled />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Asset class" required>
                    <SelectInput
                      value={assetClass}
                      onChange={(v) => setAssetClass(v)}
                      options={ASSET_CLASSES}
                      placeholder="Select asset class"
                    />
                  </Field>
                  <Field label="Estimated value range" required>
                    <SelectInput
                      value={assetValueRange}
                      onChange={(v) => setAssetValueRange(v)}
                      options={VALUE_RANGES}
                      placeholder="Select value range"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Geography / HQ" required>
                    <TextInput value={geography} onChange={setGeography} placeholder="e.g. UAE, Switzerland" />
                  </Field>
                  <Field label="Primary goal" required>
                    <SelectInput
                      value={primaryGoal}
                      onChange={(v) => setPrimaryGoal(v)}
                      options={PRIMARY_GOALS}
                      placeholder="Select primary goal"
                    />
                  </Field>
                </div>

                <div
                  className="my-2 h-px"
                  style={{ background: "var(--border)" }}
                />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Field label="Your name">
                    <TextInput value={recipientName} onChange={setRecipientName} placeholder="Full name" />
                  </Field>
                  <Field label="Your email">
                    <TextInput value={recipientEmail} onChange={setRecipientEmail} placeholder="email@company.com" type="email" />
                  </Field>
                  <Field label="Your role">
                    <TextInput value={recipientRole} onChange={setRecipientRole} placeholder="e.g. CEO" />
                  </Field>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500">{error}</p>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleStep1Submit}
                  disabled={!canSubmitStep1 || submitting}
                  className="rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all disabled:opacity-40"
                  style={{
                    background: canSubmitStep1 ? "var(--color-teal)" : "var(--text-muted)",
                    boxShadow: canSubmitStep1 ? "0 4px 20px var(--glow-color)" : undefined,
                  }}
                >
                  {submitting ? "Saving..." : "Continue to Quote Options"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 2: Choose Your Path ────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
                Choose Your Path
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Select the engagement model that works best for {companyName}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* ── Column A: Discovery Workshop ───────────────────────────── */}
              <div
                className="relative flex flex-col rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "2px solid var(--color-teal)" }}
              >
                {/* Recommended badge */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ background: "var(--color-teal)" }}
                >
                  Recommended
                </div>

                <h3 className="mt-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  Start Now
                </h3>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Discovery Workshop
                </p>

                {/* Before / After table */}
                <div className="mt-4 flex flex-col gap-0 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                  <div className="grid grid-cols-2 text-xs font-semibold" style={{ background: "var(--card-tan)" }}>
                    <div className="px-3 py-2" style={{ color: "var(--text-muted)" }}>Before</div>
                    <div className="px-3 py-2" style={{ color: "var(--color-teal)" }}>After</div>
                  </div>
                  {BEFORE_AFTER_ROWS.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 text-xs"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <div className="px-3 py-2 line-through" style={{ color: "var(--text-muted)" }}>{row.before}</div>
                      <div className="px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>{row.after}</div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="mt-5 flex-1">
                  {!countdown.expired ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-light" style={{ color: "var(--text-primary)" }}>CHF 10,000</span>
                        <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>CHF 25,000</span>
                      </div>
                      <p className="mt-1 text-xs font-medium" style={{ color: "var(--color-teal)" }}>
                        Early bird pricing
                      </p>
                      <div
                        className="mt-3 rounded-lg px-3 py-2 text-center text-xs"
                        style={{ background: "var(--badge-bg)", color: "var(--accent)" }}
                      >
                        {countdown.days}d {countdown.hours}h {countdown.minutes}m remaining
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-light" style={{ color: "var(--text-primary)" }}>CHF 25,000</span>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  Work after the Discovery Workshop will be quoted based on your blueprint findings.
                </p>

                <button
                  onClick={handleDiscovery}
                  className="mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98]"
                  style={{ background: "var(--color-teal)", boxShadow: "0 4px 20px var(--glow-color)" }}
                >
                  Start Now &rarr;
                </button>
              </div>

              {/* ── Column B: Book a Call ───────────────────────────────────── */}
              <div
                className="flex flex-col rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  Book a Call
                </h3>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Not sure yet? Talk to Fernando first.
                </p>

                <div className="mt-6 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-light" style={{ color: "var(--text-primary)" }}>$500</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    30-minute diagnostic call
                  </p>

                  <div className="mt-5 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-teal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Personalised assessment of your tokenisation readiness
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-teal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Credited against Discovery Workshop if you proceed within 30 days
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-teal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Direct access to Fernando, our lead tokenisation advisor
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCall}
                  className="mt-5 w-full rounded-xl py-3.5 text-sm font-semibold transition-all hover:shadow-lg active:scale-[0.98]"
                  style={{
                    background: "var(--bg-card)",
                    border: "2px solid var(--color-teal)",
                    color: "var(--color-teal)",
                  }}
                >
                  Book a Call &rarr;
                </button>
              </div>

              {/* ── Column C: Join Pipeline ─────────────────────────────────── */}
              <div
                className="flex flex-col rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  Join Pipeline
                </h3>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  No upfront cost. Success fee only.
                </p>

                {pipelineSubmitted ? (
                  /* Confirmation state */
                  <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ background: "rgba(0,169,165,0.1)" }}
                    >
                      <svg className="h-8 w-8 text-[var(--color-teal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Pipeline Application Submitted
                    </p>
                    <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                      Our team will review your application and reach out within 48 hours.
                    </p>
                  </div>
                ) : (
                  /* Selection state */
                  <>
                    <div className="mt-6 flex-1">
                      <p className="mb-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                        Select your success fee
                      </p>

                      <div className="flex flex-col gap-2">
                        {/* 2% option */}
                        <button
                          type="button"
                          onClick={() => setSelectedFee("2")}
                          className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all"
                          style={{
                            background: selectedFee === "2" ? "var(--badge-bg)" : "var(--bg-input)",
                            border: selectedFee === "2" ? "2px solid var(--color-teal)" : "2px solid var(--border)",
                          }}
                        >
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>2%</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {mid > 0 ? formatCHF(fee2) : ""}
                          </span>
                        </button>

                        {/* 5% option */}
                        <button
                          type="button"
                          onClick={() => setSelectedFee("5")}
                          className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all"
                          style={{
                            background: selectedFee === "5" ? "var(--badge-bg)" : "var(--bg-input)",
                            border: selectedFee === "5" ? "2px solid var(--color-teal)" : "2px solid var(--border)",
                          }}
                        >
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>5%</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {mid > 0 ? formatCHF(fee5) : ""}
                          </span>
                        </button>

                        {/* Custom option */}
                        <button
                          type="button"
                          onClick={() => setSelectedFee("custom")}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                          style={{
                            background: selectedFee === "custom" ? "var(--badge-bg)" : "var(--bg-input)",
                            border: selectedFee === "custom" ? "2px solid var(--color-teal)" : "2px solid var(--border)",
                          }}
                        >
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Propose</span>
                          {selectedFee === "custom" && (
                            <input
                              type="text"
                              value={customFee}
                              onChange={(e) => setCustomFee(e.target.value)}
                              placeholder="e.g. 3"
                              className="w-16 rounded-lg px-2 py-1 text-center text-sm outline-none"
                              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </button>
                      </div>

                      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        Minimum CHF 50,000. Fee applies on successful capital raise or asset tokenisation.
                      </p>
                    </div>

                    <button
                      onClick={handlePipeline}
                      disabled={submitting || (selectedFee === "custom" && !customFee)}
                      className="mt-5 w-full rounded-xl py-3.5 text-sm font-semibold transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-40"
                      style={{
                        background: "var(--bg-card)",
                        border: "2px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {submitting ? "Submitting..." : "Join Pipeline \u2192"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Deca4 Advisory FZE &middot; Dubai World Trade Center &middot; info@deca4.com
          </p>
        </footer>
      </div>
    </div>
  );
}
