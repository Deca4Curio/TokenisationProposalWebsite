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
    <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-10">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9"
            style={{ background: "rgba(0,169,165,0.1)" }}
          >
            <ReportIcon name={stat.icon} size={16} className="text-[var(--accent)]" />
          </div>
          <div className="min-w-0">
            <p
              className="truncate text-sm font-light leading-tight sm:text-lg"
              style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}
            >
              {stat.value}
            </p>
            <p className="text-[10px] uppercase tracking-wider sm:text-[11px]" style={{ color: "var(--text-gray)" }}>
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
