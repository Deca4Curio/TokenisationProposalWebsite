import { renderInlineMarkdown } from "@/lib/report-parser";

interface TimelinePhase {
  title: string;
  description: string;
}

interface TimelineProps {
  phases: TimelinePhase[];
}

/** Extract a short label from a phase title like "Phase 1 (Month 1-2): Strategic Scoping" */
function parsePhaseLabel(title: string): { number: string; timing: string; name: string } {
  // Match patterns like "Phase 1 (Month 1-2): Strategic Scoping & Legal Architecture"
  const match = title.match(/^(Phase\s+\d+)\s*\(([^)]+)\)[:\s]*(.*)$/i)
    || title.match(/^(Phase\s+\d+)[:\s]+(.+)$/i)
    || title.match(/^(Month\s+[\d–-]+)[:\s]+(.+)$/i)
    || title.match(/^(Stage\s+\d+)[:\s]+(.+)$/i);

  if (match && match.length === 4) {
    return { number: match[1], timing: match[2], name: match[3] };
  }
  if (match && match.length === 3) {
    return { number: match[1], timing: "", name: match[2] };
  }
  return { number: "", timing: "", name: title };
}

export default function Timeline({ phases }: TimelineProps) {
  const parsed = phases.map((p) => ({ ...p, ...parsePhaseLabel(p.title) }));

  return (
    <div className="flex flex-col gap-6">
      {/* ── Horizontal overview ── */}
      <div className="relative overflow-x-auto pb-2">
        <div className="flex items-start" style={{ minWidth: phases.length > 3 ? `${phases.length * 160}px` : "100%" }}>
          {parsed.map((phase, i) => (
            <div key={i} className="flex flex-1 flex-col items-center text-center" style={{ minWidth: "120px" }}>
              {/* Node + connector line */}
              <div className="relative flex w-full items-center justify-center" style={{ height: "24px" }}>
                {/* Line left */}
                {i > 0 && (
                  <div
                    className="absolute left-0 top-1/2 h-0.5"
                    style={{ width: "50%", background: "var(--accent)" }}
                  />
                )}
                {/* Line right */}
                {i < phases.length - 1 && (
                  <div
                    className="absolute right-0 top-1/2 h-0.5"
                    style={{ width: "50%", background: "var(--accent)" }}
                  />
                )}
                {/* Dot */}
                <div
                  className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {i + 1}
                </div>
              </div>
              {/* Label */}
              <p className="mt-2 text-[11px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                {phase.name || phase.number}
              </p>
              {phase.timing && (
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {phase.timing}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Detailed phases ── */}
      <div className="flex flex-col gap-4">
        {parsed.map((phase, i) => (
          <div
            key={i}
            className="rounded-xl p-5"
            style={{
              background: "var(--card-tan)",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            <div className="mb-1 flex items-baseline gap-2">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                {i + 1}
              </span>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--accent)" }}
              >
                {phase.title}
              </p>
            </div>
            {phase.description && (
              <p
                className="mt-2 text-sm leading-relaxed pl-7"
                style={{ color: "var(--text-secondary)" }}
                dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(phase.description) }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
