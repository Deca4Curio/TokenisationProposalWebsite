"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ReportView from "@/components/ReportView";
import AnalysisProgress from "@/components/AnalysisProgress";
import PartnerLogos from "@/components/PartnerLogos";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import type { Proposal } from "@/types";

const CALENDLY_URL = "https://calend.ly/rfv";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/proposals/${id}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError("This report is not available. It may still be generating.");
          } else {
            setError("Failed to load report");
          }
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
          <PartnerLogos dark={dark} size="lg" />
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
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-12" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-6xl">
        {/* Nav */}
        <div className="report-nav mb-6 flex items-center justify-between sm:mb-8">
          <PartnerLogos dark={dark} size="sm" />
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs transition-colors hover:underline sm:text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Dashboard
            </button>
            <ThemeToggle dark={dark} toggle={toggle} />
          </div>
        </div>

        {proposal.report && (
          <ReportView
            sections={proposal.report}
            companyName={proposal.questionnaireSubmitted?.companyName || proposal.questionnaire?.companyName || ""}
            url={proposal.url}
            siteMetadata={proposal.siteMetadata}
            questionnaire={proposal.questionnaireSubmitted || proposal.questionnaire}
          />
        )}

        {/* CTA */}
        <div
          className="report-cta mt-12 rounded-2xl p-8 text-center"
          style={{ background: "var(--card-tan)", border: "1px solid var(--border-report)" }}
        >
          <h3
            className="text-2xl font-light"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
          >
            Ready to move forward?
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Book a consultation with our tokenisation advisors to discuss your report and next steps.
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <button
              onClick={() => window.print()}
              className="rounded-xl px-6 py-3 text-sm font-medium transition-all sm:px-8 sm:py-4 sm:text-base"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}
            >
              Download PDF
            </button>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[var(--color-teal)] px-6 py-3 text-center text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95 sm:px-8 sm:py-4 sm:text-base"
              style={{ boxShadow: "0 4px 20px var(--glow-color)" }}
            >
              Book a Consultation
            </a>
            <a
              href="#"
              className="rounded-xl px-6 py-3 text-center text-sm font-medium transition-all sm:px-8 sm:py-4 sm:text-base"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}
            >
              Request a Quote
            </a>
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
