import { renderInlineMarkdown } from "@/lib/report-parser";

interface QuoteBlockProps {
  children: string;
}

export default function QuoteBlock({ children }: QuoteBlockProps) {
  return (
    <blockquote
      className="rounded-r-xl py-3 pl-5 pr-4 italic"
      style={{
        borderLeft: "3px solid var(--accent)",
        background: "rgba(0,169,165,0.04)",
        color: "var(--text-secondary)",
      }}
    >
      <p
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(children) }}
      />
    </blockquote>
  );
}
