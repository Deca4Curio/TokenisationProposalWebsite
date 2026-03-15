import ReportIcon from "./ReportIcons";

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

interface StatRowProps {
  stats: StatItem[];
}

export default function StatRow({ stats }: StatRowProps) {
  if (stats.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-6 sm:gap-10">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "rgba(0,169,165,0.1)" }}
          >
            <ReportIcon name={stat.icon} size={16} className="text-[var(--accent)]" />
          </div>
          <div>
            <p
              className="text-lg font-light leading-tight"
              style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}
            >
              {stat.value}
            </p>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-gray)" }}>
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
