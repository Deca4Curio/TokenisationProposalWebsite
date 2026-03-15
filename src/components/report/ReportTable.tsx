import { renderInlineMarkdown } from "@/lib/report-parser";

interface ReportTableProps {
  headers: string[];
  rows: string[][];
}

export default function ReportTable({ headers, rows }: ReportTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border-report)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--card-tan)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-primary)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                borderTop: "1px solid var(--border-report)",
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-3"
                  style={{ color: "var(--text-secondary)" }}
                  dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(cell) }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
