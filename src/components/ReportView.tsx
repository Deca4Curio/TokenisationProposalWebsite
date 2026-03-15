"use client";

import { useState, useEffect, useRef } from "react";
import CompanyBadge from "@/components/CompanyBadge";
import ReportIcon, { getIconForSection } from "@/components/report/ReportIcons";
import SectionLabel from "@/components/report/SectionLabel";
import SectionHeading from "@/components/report/SectionHeading";
import StatRow from "@/components/report/StatRow";
import CardGrid from "@/components/report/CardGrid";
import CalloutBox from "@/components/report/CalloutBox";
import ReportTable from "@/components/report/ReportTable";
import Timeline from "@/components/report/Timeline";
import QuoteBlock from "@/components/report/QuoteBlock";
import Divider from "@/components/report/Divider";
import {
  parseContent,
  renderInlineMarkdown,
  type ContentBlock,
  type StatItem as ParsedStat,
  type CardItem,
  type TableData,
  type TimelinePhase,
  type CalloutData,
} from "@/lib/report-parser";
import { extractMetrics } from "@/lib/report-metrics";
import type { ReportSection, SiteMetadata, Questionnaire } from "@/types";

interface ReportViewProps {
  sections: ReportSection[];
  companyName: string;
  url: string;
  siteMetadata?: SiteMetadata;
  questionnaire?: Questionnaire;
}

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case "subheading":
      return (
        <h3
          key={index}
          className="mt-6 mb-3 text-lg font-medium"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          {block.data as string}
        </h3>
      );

    case "stats": {
      const stats = block.data as ParsedStat[];
      return (
        <div key={index} className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-wrap items-baseline gap-1 rounded-lg px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3"
              style={{ background: "var(--card-tan)" }}
            >
              <span className="text-xs font-semibold sm:text-sm" style={{ color: "var(--text-primary)" }}>
                {stat.key}:
              </span>
              <span
                className="text-xs sm:text-sm"
                style={{ color: "var(--text-secondary)" }}
                dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(stat.value) }}
              />
            </div>
          ))}
        </div>
      );
    }

    case "cards":
      return <CardGrid key={index} items={block.data as CardItem[]} />;

    case "table": {
      const table = block.data as TableData;
      return <ReportTable key={index} headers={table.headers} rows={table.rows} />;
    }

    case "timeline":
      return <Timeline key={index} phases={block.data as TimelinePhase[]} />;

    case "callout": {
      const callout = block.data as CalloutData;
      return (
        <CalloutBox key={index} title={callout.label}>
          {callout.text}
        </CalloutBox>
      );
    }

    case "quote":
      return <QuoteBlock key={index}>{block.data as string}</QuoteBlock>;

    case "prose":
    default: {
      const html = renderProseMarkdown(block.data as string);
      return (
        <div
          key={index}
          className="prose-report text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
  }
}

function renderProseMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h4 class="text-base font-semibold mt-4 mb-2" style="color: var(--text-primary); font-family: var(--font-heading)">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-lg font-medium mt-5 mb-2" style="color: var(--text-primary); font-family: var(--font-heading)">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline" style="color: var(--accent)">$1</a>'
    )
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1.5 pl-1">$1</li>')
    .replace(/((?:<li class="ml-4[^>]*>.*<\/li>\n?)+)/g, '<ul class="list-disc mb-4 space-y-0.5">$1</ul>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 mb-1.5 pl-1 list-item-numbered">$1</li>')
    .replace(/((?:<li class="ml-4[^>]*list-item-numbered[^>]*>.*<\/li>\n?)+)/g, '<ol class="list-decimal mb-4 space-y-0.5">$1</ol>')
    .replace(/^(?!<[hula])([\w$"'(].+)$/gm, '<p class="mb-3">$1</p>');
}

export default function ReportView({
  sections,
  companyName,
  url,
  siteMetadata,
  questionnaire,
}: ReportViewProps) {
  const [ogImgError, setOgImgError] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const ogImage = siteMetadata?.ogImage;
  const metrics = extractMetrics(questionnaire);

  // IntersectionObserver for sticky TOC highlight
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((el, i) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(i);
        },
        { rootMargin: "-20% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections.length]);

  return (
    <div className="flex flex-col gap-0">
      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
        {ogImage && !ogImgError ? (
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
        ) : (
          <div className="absolute inset-0 z-0 bg-mesh" />
        )}

        <div className={`relative z-10 p-5 sm:p-8 md:p-10 ${ogImage && !ogImgError ? "text-white" : ""}`}>
          <p
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em]"
            style={{
              color: ogImage && !ogImgError ? "rgba(255,255,255,0.6)" : "var(--accent)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Tokenisation Report
          </p>

          <CompanyBadge url={url} companyName={companyName} favicon={siteMetadata?.favicon} size="lg" />

          {siteMetadata?.description && (
            <p
              className="mt-4 max-w-2xl text-sm leading-relaxed"
              style={{ color: ogImage && !ogImgError ? "rgba(255,255,255,0.75)" : "var(--text-secondary)" }}
            >
              {siteMetadata.description}
            </p>
          )}

          {metrics.length > 0 && (
            <div className="mt-6">
              <StatRow stats={metrics} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile TOC: horizontal pill bar (outside flex layout) ── */}
      <div className="report-toc sticky top-0 z-20 -mx-6 mt-6 mb-4 overflow-x-auto px-6 py-3 lg:hidden no-scrollbar" style={{ background: "var(--report-bg)" }}>
        <div className="flex gap-2">
          {sections.map((section, i) => (
            <a
              key={section.title}
              href={`#section-${i}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-all whitespace-nowrap"
              style={{
                color: activeSection === i ? "white" : "var(--text-secondary)",
                background: activeSection === i ? "var(--accent)" : "var(--card-tan)",
                border: activeSection === i ? "1px solid var(--accent)" : "1px solid var(--border-report)",
              }}
            >
              <span className="font-mono text-[10px]">{String(i + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          ))}
        </div>
      </div>

      {/* ── BODY: TOC sidebar + content ── */}
      <div className="mt-4 flex gap-8 lg:mt-8">
        {/* Sticky TOC (desktop only) */}
        <nav className="report-toc hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-8">
            <p
              className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--text-gray)" }}
            >
              Contents
            </p>
            <div className="flex flex-col gap-0.5">
              {sections.map((section, i) => (
                <a
                  key={section.title}
                  href={`#section-${i}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all"
                  style={{
                    color: activeSection === i ? "var(--accent)" : "var(--text-secondary)",
                    background: activeSection === i ? "rgba(0,169,165,0.06)" : "transparent",
                    fontWeight: activeSection === i ? 500 : 400,
                  }}
                >
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: activeSection === i ? "var(--accent)" : "var(--text-gray)", opacity: activeSection === i ? 1 : 0.6 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{section.title}</span>
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {sections.map((section, i) => {
            const blocks = parseContent(section.content);
            const iconName = getIconForSection(section.title);

            return (
              <section
                key={section.title}
                id={`section-${i}`}
                ref={(el) => { sectionRefs.current[i] = el; }}
                className="report-section scroll-mt-16 lg:scroll-mt-24"
              >
                {i > 0 && <Divider />}

                <div className="mb-2 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "rgba(0,169,165,0.08)" }}
                  >
                    <ReportIcon name={iconName} size={18} className="text-[var(--accent)]" />
                  </div>
                  <SectionLabel number={i + 1} label={section.title} />
                </div>

                <SectionHeading>{section.title}</SectionHeading>

                <div className="flex flex-col gap-5">
                  {blocks.map((block, bi) => renderBlock(block, bi))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
