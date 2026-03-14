"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ReportView from "@/components/ReportView";
import AnalysisProgress from "@/components/AnalysisProgress";
import type { Proposal } from "@/types";

const CALENDLY_URL = "https://calend.ly/rfv";

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

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { dark } = useTheme();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");

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
          setError("Failed to load report");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setProposal(data.proposal);
          if (data.proposal.status === "generating" || data.proposal.status === "scraping") {
            setTimeout(poll, 3000);
          }
        }
      } catch {
        if (!cancelled) setError("Network error");
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [id, router]);

  // Initial loading (fetching proposal data)
  if (!proposal) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="animate-spin-slow h-10 w-10 rounded-full border-2 border-transparent border-t-[var(--color-teal)]" />
      </div>
    );
  }

  // Still generating
  if (proposal.status === "generating" || proposal.status === "scraping") {
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
          <AnalysisProgress url={proposal.url} animate={true} />
          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Generating your tokenisation report...
          </p>
        </div>
      </div>
    );
  }

  if (error || proposal.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error || proposal.errorMessage}</p>
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

  // Report ready
  return (
    <div className="min-h-screen px-6 py-12" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-3xl">
        {/* Nav */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logos/deca4.svg" alt="Deca4" width={136} height={50} className="h-6 w-auto" priority />
            <span style={{ color: "var(--text-faint)" }} className="font-light">x</span>
            <Image
              src="/logos/curio.svg" alt="Curio" width={120} height={20}
              className={`h-4 w-auto ${dark ? "invert" : ""}`}
              style={{ filter: dark ? "invert(1) hue-rotate(180deg)" : undefined }}
              priority
            />
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm transition-colors hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Dashboard →
          </button>
        </div>

        {proposal.report && (
          <ReportView
            sections={proposal.report}
            companyName={proposal.questionnaireSubmitted?.companyName || proposal.questionnaire?.companyName || ""}
            url={proposal.url}
          />
        )}

        {/* CTA */}
        <div
          className="mt-8 rounded-2xl p-8 text-center"
          style={{ background: "var(--feature-bg)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Ready to move forward?
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Book a consultation with our tokenisation advisors to discuss your proposal and next steps.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[var(--color-teal)] px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-lg active:scale-95"
              style={{ boxShadow: "0 4px 20px var(--glow-color)" }}
            >
              Book a Call →
            </a>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl px-8 py-4 text-base font-medium transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}
            >
              View Dashboard
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Deca4 Advisory FZE · Dubai World Trade Center · info@deca4.com
          </p>
        </footer>
      </div>
    </div>
  );
}
