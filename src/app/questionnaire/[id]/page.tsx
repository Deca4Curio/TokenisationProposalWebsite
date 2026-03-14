"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import AnalysisProgress from "@/components/AnalysisProgress";
import QuestionnaireForm from "@/components/QuestionnaireForm";
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

function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") setDark(false);
    else if (stored === "dark") setDark(true);
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export default function QuestionnairePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { dark } = useTheme();
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
          if (res.status === 401) {
            router.push("/");
            return;
          }
          setError("Failed to load proposal");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setProposal(data.proposal);
          // Keep polling if still scraping
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
      // Save questionnaire
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

      // Trigger report generation
      const reportRes = await fetch(`/api/proposals/${id}/report`, {
        method: "POST",
      });
      if (!reportRes.ok) {
        const data = await reportRes.json();
        setError(data.error || "Report generation failed");
        setSubmitting(false);
        return;
      }

      router.push(`/report/${id}`);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }, [id, router]);

  // Loading / scraping state
  if (!proposal || proposal.status === "scraping") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="flex w-full max-w-md flex-col items-center gap-10">
          <div className="flex items-center gap-4">
            <Image src="/logos/deca4.svg" alt="Deca4" width={136} height={50} className="h-7 w-auto" priority />
            <span style={{ color: "var(--text-faint)" }} className="text-lg font-light">x</span>
            <Image
              src="/logos/curio.svg" alt="Curio" width={120} height={20}
              className={`h-5 w-auto ${dark ? "invert" : ""}`}
              style={{ filter: dark ? "invert(1) hue-rotate(180deg)" : undefined }}
              priority
            />
          </div>
          <AnalysisProgress url={proposal?.url || "..."} animate={true} />
        </div>
      </div>
    );
  }

  // Error state
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
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-[var(--color-teal)] px-6 py-3 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Generating report state
  if (submitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="animate-scale-in flex w-full max-w-md flex-col items-center gap-10">
          <div className="flex items-center gap-4">
            <Image src="/logos/deca4.svg" alt="Deca4" width={136} height={50} className="h-7 w-auto" priority />
            <span style={{ color: "var(--text-faint)" }} className="text-lg font-light">x</span>
            <Image
              src="/logos/curio.svg" alt="Curio" width={120} height={20}
              className={`h-5 w-auto ${dark ? "invert" : ""}`}
              style={{ filter: dark ? "invert(1) hue-rotate(180deg)" : undefined }}
              priority
            />
          </div>

          {/* Spinner */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ border: "1px solid var(--spinner-track)" }} />
            <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-[var(--color-teal)]" />
            <div
              className="absolute inset-3 animate-spin-slow rounded-full border border-transparent border-b-[var(--color-purple)]"
              style={{ animationDirection: "reverse", animationDuration: "3s" }}
            />
            <svg className="h-6 w-6" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>

          {/* Rotating phrase */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Generating your proposal
            </h2>
            <p
              key={phraseIndex}
              className="animate-fade-in text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {GENERATING_PHRASES[phraseIndex]}
            </p>
          </div>

          {/* URL tag */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: "var(--url-tag-bg)", border: "1px solid var(--url-tag-border)" }}
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-teal)]" />
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {proposal?.url.replace(/^https?:\/\//, "")}
            </span>
          </div>

          {error && (
            <div className="rounded-xl p-4 text-center text-sm text-red-500" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
              <button
                onClick={() => { setSubmitting(false); setError(""); }}
                className="mt-2 block w-full text-xs underline"
              >
                Go back to questionnaire
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Questionnaire form
  return (
    <div className="min-h-screen px-6 py-12" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2 rounded-full">
            <div className="flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-xs font-medium text-green-500">Analysis complete</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            Review your proposal details
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            We pre-filled this based on{" "}
            <span className="font-mono font-medium" style={{ color: "var(--accent)" }}>
              {proposal.url.replace(/^https?:\/\//, "")}
            </span>
            . Adjust anything before we generate your full report.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl p-4 text-center text-sm text-red-500" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {proposal.questionnaire && (
          <QuestionnaireForm
            initial={proposal.questionnaire}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        )}

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Your report will be generated in about 30 seconds.
        </p>
      </div>
    </div>
  );
}
