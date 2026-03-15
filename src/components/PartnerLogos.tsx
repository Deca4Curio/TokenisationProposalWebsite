import Image from "next/image";

export default function PartnerLogos({ dark, size = "md" }: { dark: boolean; size?: "sm" | "md" | "lg" }) {
  const h = size === "lg" ? "h-7" : size === "sm" ? "h-5" : "h-6";
  const hCurio = size === "lg" ? "h-5" : size === "sm" ? "h-3.5" : "h-4";
  const textSize = size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "";

  return (
    <div className="flex items-center gap-4">
      <Image src="/logos/deca4.svg" alt="Deca4 Advisory" width={136} height={50} className={`${h} w-auto`} priority />
      <span style={{ color: "var(--text-faint)" }} className={`font-light ${textSize}`}>x</span>
      <Image
        src="/logos/curio.svg" alt="curioInvest" width={120} height={20}
        className={`${hCurio} w-auto ${dark ? "invert" : ""}`}
        style={{ filter: dark ? "invert(1) hue-rotate(180deg)" : undefined }}
        priority
      />
    </div>
  );
}
