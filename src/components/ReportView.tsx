"use client";

import { useState } from "react";
import CompanyBadge from "@/components/CompanyBadge";
import type { ReportSection, SiteMetadata } from "@/types";

interface ReportViewProps {
  sections: ReportSection[];
  companyName: string;
  url: string;
  siteMetadata?: SiteMetadata;
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h4 class="text-base font-semibold mt-4 mb-2" style="color: var(--text-primary)">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-lg font-semibold mt-5 mb-2" style="color: var(--text-primary)">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="list-disc mb-3">$1</ul>')
    .replace(/^(?!<[hul])([\w$"'].+)$/gm, '<p class="mb-3">$1</p>');
}

const SECTION_ICONS: Record<string, string> = {
  "Asset Analysis": "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7",
  "Token Economics": "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "Regulatory Framework": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  "Smart Contract Architecture": "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  "Go-to-Market Strategy": "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  "Financial Projections": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "Executive Summary": "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
};

export default function ReportView({ sections, companyName, url, siteMetadata }: ReportViewProps) {
  const [ogImgError, setOgImgError] = useState(false);
  const ogImage = siteMetadata?.ogImage;

  return (
    <div className="flex flex-col gap-6">
      {/* Report hero header */}
      <div className="relative overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
        {/* OG image background if available */}
        {ogImage && !ogImgError && (
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogImage}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setOgImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
          </div>
        )}

        {/* Content overlay */}
        <div className={`relative z-10 p-6 sm:p-8 ${ogImage && !ogImgError ? "text-white" : ""}`}>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: ogImage && !ogImgError ? "rgba(255,255,255,0.7)" : "var(--accent)" }}
          >
            Tokenisation Proposal
          </p>

          <CompanyBadge
            url={url}
            companyName={companyName}
            favicon={siteMetadata?.favicon}
            size="lg"
          />

          {siteMetadata?.description && (
            <p
              className="mt-4 max-w-xl text-sm leading-relaxed"
              style={{ color: ogImage && !ogImgError ? "rgba(255,255,255,0.8)" : "var(--text-secondary)" }}
            >
              {siteMetadata.description}
            </p>
          )}
        </div>
      </div>

      {/* Table of contents */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Contents
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {sections.map((section, i) => (
            <a
              key={section.title}
              href={`#section-${i}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all hover:bg-[var(--badge-bg)]"
              style={{ color: "var(--text-secondary)" }}
            >
              <span className="font-mono text-xs" style={{ color: "var(--accent)" }}>{String(i + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          ))}
        </div>
      </div>

      {/* Report sections */}
      {sections.map((section, i) => (
        <div
          key={section.title}
          id={`section-${i}`}
          className="animate-fade-in-up scroll-mt-8 rounded-2xl p-6 sm:p-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            animationDelay: `${i * 100}ms`,
            opacity: 0,
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--badge-bg)" }}>
              <svg
                className="h-5 w-5" style={{ color: "var(--accent)" }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              >
                <path d={SECTION_ICONS[section.title] || SECTION_ICONS["Asset Analysis"]} />
              </svg>
            </div>
            <div>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Section {i + 1} of {sections.length}
              </span>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {section.title}
              </h2>
            </div>
          </div>

          <div
            className="prose-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
          />
        </div>
      ))}
    </div>
  );
}
