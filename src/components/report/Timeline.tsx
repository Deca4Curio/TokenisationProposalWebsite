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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {phases.map((phase, i) => (
        <div
          key={i}
          className="rounded-xl p-5"
          style={{
            background: "var(--card-tan)",
            borderTop: "3px solid var(--accent)",
          }}
        >
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--accent)" }}
          >
            {phase.title}
          </p>
          {phase.description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(phase.description) }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
