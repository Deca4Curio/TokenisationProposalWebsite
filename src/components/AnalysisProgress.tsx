"use client";

import { useState, useEffect } from "react";

const ANALYSIS_STEPS = [
  { label: "Scanning website", icon: "globe" },
  { label: "Mapping business model", icon: "chart" },
  { label: "Identifying tokenisable assets", icon: "search" },
  { label: "Modelling token economics", icon: "calc" },
  { label: "Drafting regulatory framework", icon: "shield" },
  { label: "Generating your proposal", icon: "doc" },
];

function StepIcon({ type, done }: { type: string; done: boolean }) {
  const icons: Record<string, string> = {
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9Z",
    chart: "M3 3v18h18M7 16l4-4 4 4 5-5",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
    calc: "M4 4h16v16H4zM4 10h16M10 4v16",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M16 13H8M16 17H8M10 9H8",
  };
  return (
    <svg
      className="h-5 w-5 transition-colors duration-500"
      style={{ color: done ? "var(--accent)" : "var(--text-muted)" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={icons[type] || icons.doc} />
    </svg>
  );
}

interface AnalysisProgressProps {
  url: string;
  /** If true, steps advance on a timer. If false, stays on step 0. */
  animate?: boolean;
  /** Called when all steps complete */
  onComplete?: () => void;
}

export default function AnalysisProgress({ url, animate = true, onComplete }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!animate) return;
    if (currentStep >= ANALYSIS_STEPS.length - 1) {
      const timer = setTimeout(() => onComplete?.(), 1500);
      return () => clearTimeout(timer);
    }
    const durations = [1800, 2200, 1800, 2500, 1800, 2000];
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), durations[currentStep]);
    return () => clearTimeout(timer);
  }, [animate, currentStep, onComplete]);

  return (
    <div className="flex w-full flex-col items-center gap-10">
      {/* Spinner */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full" style={{ border: "1px solid var(--spinner-track)" }} />
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-transparent border-t-[var(--color-teal)]" />
        <div
          className="absolute inset-2 animate-spin-slow rounded-full border border-transparent border-b-[var(--color-purple)]"
          style={{ animationDirection: "reverse", animationDuration: "3s" }}
        />
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {Math.min(Math.round(((currentStep + 1) / ANALYSIS_STEPS.length) * 100), 99)}%
        </span>
      </div>

      {/* Steps */}
      <div className="flex w-full flex-col gap-3">
        {ANALYSIS_STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div
              key={step.label}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-500 ${active ? "glass" : ""}`}
              style={{ opacity: active ? 1 : done ? 0.6 : 0.25 }}
            >
              {done ? (
                <div className="animate-check-pop flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-teal)]">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <StepIcon type={step.icon} done={false} />
              )}
              <span
                className="text-sm"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {step.label}
                {active && <span className="animate-pulse" style={{ color: "var(--accent)" }}>...</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* URL tag */}
      <div
        className="flex items-center gap-2 rounded-full px-4 py-2"
        style={{ background: "var(--url-tag-bg)", border: "1px solid var(--url-tag-border)" }}
      >
        <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-teal)]" />
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {url.replace(/^https?:\/\//, "")}
        </span>
      </div>
    </div>
  );
}
