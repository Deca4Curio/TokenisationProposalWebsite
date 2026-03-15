import { renderInlineMarkdown } from "@/lib/report-parser";

interface CardItem {
  title: string;
  description: string;
}

interface CardGridProps {
  items: CardItem[];
  columns?: 2 | 3 | 4;
}

const COL_CLASSES: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export default function CardGrid({ items, columns }: CardGridProps) {
  const cols = columns || (items.length <= 2 ? 2 : items.length <= 3 ? 3 : 2);

  return (
    <div className={`grid gap-4 ${COL_CLASSES[cols]}`}>
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl p-5"
          style={{
            background: "var(--card-tan)",
            border: "1px solid var(--border-report)",
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {i + 1}
            </span>
            <h4
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {item.title}
            </h4>
          </div>
          {item.description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item.description) }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
