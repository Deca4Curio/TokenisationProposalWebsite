interface SectionLabelProps {
  number: number;
  label: string;
}

export default function SectionLabel({ number, label }: SectionLabelProps) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-[0.2em]"
      style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}
    >
      {String(number).padStart(2, "0")} {label}
    </p>
  );
}
