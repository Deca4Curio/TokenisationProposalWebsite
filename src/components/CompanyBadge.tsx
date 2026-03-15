"use client";

import { useState } from "react";
import { getFaviconUrl, getDomain } from "@/lib/visuals";

interface CompanyBadgeProps {
  url: string;
  companyName?: string;
  favicon?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Displays a company's favicon + name + domain.
 * Uses Google's favicon API with graceful fallback to initials.
 */
export default function CompanyBadge({ url, companyName, favicon, size = "md" }: CompanyBadgeProps) {
  const [imgError, setImgError] = useState(false);
  const faviconSrc = getFaviconUrl(url, favicon);
  const domain = getDomain(url);
  const initials = (companyName || domain).substring(0, 2).toUpperCase();

  const iconSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const nameSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  const domainSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className="flex items-center gap-3">
      {/* Favicon or initials fallback */}
      <div
        className={`${iconSize} flex shrink-0 items-center justify-center overflow-hidden rounded-lg`}
        style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
      >
        {faviconSrc && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconSrc}
            alt=""
            className="h-full w-full object-contain p-1"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
            {initials}
          </span>
        )}
      </div>

      {/* Name + domain */}
      <div className="min-w-0">
        {companyName && (
          <p className={`${nameSize} truncate font-semibold`} style={{ color: "var(--text-primary)" }}>
            {companyName}
          </p>
        )}
        <p className={`${domainSize} truncate font-mono`} style={{ color: "var(--text-muted)" }}>
          {domain}
        </p>
      </div>
    </div>
  );
}
