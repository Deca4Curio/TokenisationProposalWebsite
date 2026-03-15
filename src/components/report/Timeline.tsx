import { renderInlineMarkdown } from "@/lib/report-parser";

interface TimelinePhase {
  title: string;
  description: string;
}

interface TimelineProps {
  phases: TimelinePhase[];
}

export default function Timeline({ phases }: TimelineProps) {
  return (
    <div className="flex flex-col gap-4">
      {phases.map((phase, i) => (
        <div
          key={i}
          className="rounded-xl p-5"
          style={{
            background: "var(--card-tan)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <div className="mb-1 flex items-center gap-2.5">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
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
              className="mt-2 text-sm leading-relaxed pl-[34px]"
              style={{ color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(phase.description) }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
