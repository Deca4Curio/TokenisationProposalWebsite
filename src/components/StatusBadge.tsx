import type { ProposalStatus } from "@/types";

const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; bg: string }> = {
  scraping: { label: "Scanning", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  questionnaire_ready: { label: "Review", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  generating: { label: "Generating", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  report_ready: { label: "Complete", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  error: { label: "Error", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default function StatusBadge({ status }: { status: ProposalStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}33` }}
    >
      {(status === "scraping" || status === "generating") && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: config.color }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: config.color }} />
        </span>
      )}
      {config.label}
    </span>
  );
}
