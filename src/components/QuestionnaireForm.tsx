"use client";

import { useState } from "react";
import type { Questionnaire } from "@/types";

interface QuestionnaireFormProps {
  initial: Questionnaire;
  onSubmit: (data: Questionnaire) => void;
  loading: boolean;
}

const FIELD_LABELS: Record<keyof Questionnaire, string> = {
  companyName: "Company Name",
  industry: "Industry",
  jurisdiction: "Jurisdiction",
  assetTypes: "Asset Types",
  estimatedValue: "Estimated Value",
  revenueModel: "Revenue Model",
  targetInvestors: "Target Investors",
  tokenStandard: "Token Standard",
  regulatoryNotes: "Regulatory Notes",
  businessObjectives: "Business Objectives",
  biggestChallenge: "Biggest Challenge",
};

const FIELD_DESCRIPTIONS: Record<keyof Questionnaire, string> = {
  companyName: "The legal or trading name of the company",
  industry: "Primary industry or sector",
  jurisdiction: "Where the tokenisation will be regulated",
  assetTypes: "Types of assets to tokenise (comma-separated)",
  estimatedValue: "Estimated total asset value",
  revenueModel: "How the business generates revenue",
  targetInvestors: "Who will invest in the tokens",
  tokenStandard: "Recommended blockchain token standard",
  regulatoryNotes: "Key regulatory considerations",
  businessObjectives: "What are your business objectives",
  biggestChallenge: "What is your biggest challenge today",
};

export default function QuestionnaireForm({ initial, onSubmit, loading }: QuestionnaireFormProps) {
  const [data, setData] = useState<Questionnaire>({
    ...initial,
    assetTypes: initial.assetTypes || [],
  });

  const handleChange = (key: keyof Questionnaire, value: string) => {
    if (key === "assetTypes") {
      setData((d) => ({ ...d, assetTypes: value.split(",").map((s) => s.trim()).filter(Boolean) }));
    } else {
      setData((d) => ({ ...d, [key]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  const fields = Object.keys(FIELD_LABELS) as (keyof Questionnaire)[];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {fields.map((key) => (
        <div key={key}>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {FIELD_LABELS[key]}
          </label>
          <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {FIELD_DESCRIPTIONS[key]}
          </p>
          {key === "regulatoryNotes" ? (
            <textarea
              value={typeof data[key] === "string" ? data[key] : ""}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={3}
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", resize: "vertical" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--input-focus-border)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          ) : (
            <input
              type="text"
              value={key === "assetTypes" ? (data.assetTypes || []).join(", ") : (data[key] as string) || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--input-focus-border)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-xl bg-[var(--color-teal)] py-4 text-base font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
        style={{ boxShadow: "0 4px 20px var(--glow-color)" }}
      >
        {loading ? "Generating Report..." : "Generate Report →"}
      </button>
    </form>
  );
}
