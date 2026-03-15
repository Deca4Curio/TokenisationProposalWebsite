"use client";

import Link from "next/link";
import type { Proposal } from "@/types";
import StatusBadge from "./StatusBadge";

function getProposalLink(proposal: Proposal): string {
  const reportId = proposal.slug || proposal.id;
  switch (proposal.status) {
    case "questionnaire_ready":
      return `/questionnaire/${proposal.id}`;
    case "report_ready":
      return `/report/${reportId}`;
    case "generating":
      return `/report/${reportId}`;
    default:
      return `/questionnaire/${proposal.id}`;
  }
}

export default function ProposalCard({ proposal }: { proposal: Proposal }) {
  const date = new Date(proposal.createdAt);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={getProposalLink(proposal)}
      className="group block rounded-2xl p-5 transition-all hover:translate-y-[-2px]"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-base font-semibold group-hover:text-[var(--color-teal)]"
            style={{ color: "var(--text-primary)" }}
          >
            {proposal.questionnaire?.companyName || proposal.url.replace(/^https?:\/\//, "")}
          </h3>
          <p className="mt-1 truncate font-mono text-xs" style={{ color: "var(--text-muted)" }}>
            {proposal.url.replace(/^https?:\/\//, "")}
          </p>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      <div className="mt-3 flex items-center gap-4">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formattedDate}
        </span>
        {proposal.questionnaire?.industry && (
          <>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {proposal.questionnaire.industry}
            </span>
          </>
        )}
      </div>

      {proposal.status === "error" && proposal.errorMessage && (
        <p className="mt-2 text-xs text-red-400">{proposal.errorMessage}</p>
      )}
    </Link>
  );
}
