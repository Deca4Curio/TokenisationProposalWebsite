interface SectionHeadingProps {
  children: React.ReactNode;
  subtitle?: string;
}

export default function SectionHeading({ children, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-6">
      <h2
        className="text-[26px] font-light leading-tight"
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-heading)",
        }}
      >
        {children}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm" style={{ color: "var(--text-gray)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
