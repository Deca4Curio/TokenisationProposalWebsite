import { renderInlineMarkdown } from "@/lib/report-parser";

interface ReportTableProps {
  headers: string[];
  rows: string[][];
}

export default function ReportTable({ headers, rows }: ReportTableProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-block min-w-full rounded-xl" style={{ border: "1px solid var(--border-report)" }}>
        <table className="min-w-full text-xs sm:text-sm">
          <thead>
            <tr style={{ background: "var(--card-tan)" }}>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider sm:px-4 sm:py-3 sm:text-xs"
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
                    className="px-3 py-2.5 sm:px-4 sm:py-3"
                    style={{ color: "var(--text-secondary)" }}
                    dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(cell) }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
