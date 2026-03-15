"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AnalysisProgress from "@/components/AnalysisProgress";
import QuestionnaireWizard from "@/components/QuestionnaireWizard";
import PartnerLogos from "@/components/PartnerLogos";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import type { Proposal, Questionnaire } from "@/types";

const GENERATING_PHRASES = [
  "Thinking...",
  "Analysing your asset structure...",
  "Modelling token economics...",
  "Imagining your tokenisation...",
  "Mapping regulatory frameworks...",
  "Designing smart contract architecture...",
  "Building financial projections...",
  "Crafting your go-to-market strategy...",
  "Putting it all together...",
  "Almost there...",
];

export default function QuestionnairePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phraseInterval = useRef<NodeJS.Timeout | null>(null);

  // Rotate generating phrases
  useEffect(() => {
    if (submitting) {
      phraseInterval.current = setInterval(() => {
        setPhraseIndex((i) => (i + 1) % GENERATING_PHRASES.length);
      }, 3000);
    } else {
      if (phraseInterval.current) clearInterval(phraseInterval.current);
      setPhraseIndex(0);
    }
    return () => { if (phraseInterval.current) clearInterval(phraseInterval.current); };
  }, [submitting]);

  // Poll for proposal data
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/proposals/${id}`);
        if (!res.ok) {
          if (res.status === 401) { router.push("/"); return; }
          setError("Failed to load report");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setProposal(data.proposal);
          if (data.proposal.status === "scraping") {
            setTimeout(poll, 2000);
          }
        }
      } catch {
        if (!cancelled) setError("Network error");
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [id, router]);

  const handleSubmit = useCallback(async (questionnaire: Questionnaire) => {
    setSubmitting(true);
    setError("");
    try {
      const saveRes = await fetch(`/api/proposals/${id}/questionnaire`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionnaire),
      });
      if (!saveRes.ok) {
        setError("Failed to save questionnaire");
        setSubmitting(false);
        return;
      }

      const reportRes = await fetch(`/api/proposals/${id}/report`, { method: "POST" });
      const reportData = await reportRes.json();
      if (!reportRes.ok) {
        setError(reportData.error || "Report generation failed");
        setSubmitting(false);
        return;
      }

      // Use slug for a nicer URL, fall back to UUID
      const reportPath = reportData.slug || id;
      router.push(`/report/${reportPath}`);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }, [id, router]);

  // ─── Loading / scraping ────────────────────────────────────────────────────

  if (!proposal || proposal.status === "scraping") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="flex w-full max-w-md flex-col items-center gap-10">
          <PartnerLogos dark={dark} size="lg" />
          <AnalysisProgress url={proposal?.url || "..."} animate={true} />
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────

  if (proposal.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(239,68,68,0.1)" }}>
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{proposal.errorMessage}</p>
          <button onClick={() => router.push("/")} className="rounded-xl bg-[var(--color-teal)] px-6 py-3 text-sm font-semibold text-white">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Generating report ─────────────────────────────────────────────────────

  if (submitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="animate-scale-in flex w-full max-w-md flex-col items-center gap-10">
          <PartnerLogos dark={dark} size="lg" />

          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ border: "1px solid var(--spinner-track)" }} />
            <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-[var(--color-teal)]" />
            <div className="absolute inset-3 animate-spin-slow rounded-full border border-transparent border-b-[var(--color-purple)]" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
            <svg className="h-6 w-6" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Generating your report</h2>
            <p key={phraseIndex} className="animate-fade-in text-sm" style={{ color: "var(--text-secondary)" }}>
              {GENERATING_PHRASES[phraseIndex]}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "var(--url-tag-bg)", border: "1px solid var(--url-tag-border)" }}>
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-teal)]" />
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{proposal?.url.replace(/^https?:\/\//, "")}</span>
          </div>

          {error && (
            <div className="rounded-xl p-4 text-center text-sm text-red-500" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
              <button onClick={() => { setSubmitting(false); setError(""); }} className="mt-2 block w-full text-xs underline">
                Go back to questionnaire
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Questionnaire Wizard ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen px-6 py-8 sm:py-12" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <PartnerLogos dark={dark} size="lg" />
          <ThemeToggle dark={dark} toggle={toggle} />
        </div>

        {error && (
          <div className="mb-6 rounded-xl p-4 text-center text-sm text-red-500" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {proposal.questionnaire && (
          <QuestionnaireWizard
            initial={proposal.questionnaire}
            url={proposal.url}
            proposalId={id}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        )}
      </div>
    </div>
  );
}

