import { renderInlineMarkdown } from "@/lib/report-parser";

interface CalloutBoxProps {
  variant?: "teal" | "tan";
  title?: string;
  children: string;
}

export default function CalloutBox({ variant = "teal", title, children }: CalloutBoxProps) {
  const isTeal = variant === "teal";

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: isTeal ? "rgba(0,169,165,0.06)" : "var(--card-tan)",
        borderLeft: isTeal ? "3px solid var(--accent)" : "3px solid var(--border-report)",
      }}
    >
      {title && (
        <p
          className="mb-1 text-xs font-semibold uppercase tracking-wider"
          style={{ color: isTeal ? "var(--accent)" : "var(--text-gray)" }}
        >
          {title}
        </p>
      )}
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(children) }}
      />
    </div>
  );
}
