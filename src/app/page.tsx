"use client";

import { useState } from "react";

const STEPS = [
  { label: "Scanning website", duration: 2000 },
  { label: "Analysing business model", duration: 2500 },
  { label: "Identifying tokenisable assets", duration: 2000 },
  { label: "Building token economics", duration: 3000 },
  { label: "Generating proposal", duration: 2500 },
];

function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <span className="text-lg font-bold tracking-tight text-[var(--color-teal)]">
        DECA
      </span>
      <span className="text-lg font-bold tracking-tight text-[var(--color-purple)]">
        4
      </span>
      <span className="mx-1 text-sm text-neutral-500">x</span>
      <span className="text-lg font-bold tracking-tight text-white">Curio</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="relative h-10 w-10">
      <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
      <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-[var(--color-teal)]" />
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a website URL");
      return;
    }

    // Basic URL validation
    let parsed: URL;
    try {
      parsed = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
      );
      if (!parsed.hostname.includes(".")) throw new Error();
    } catch {
      setError("Please enter a valid website URL");
      return;
    }

    setUrl(parsed.href);
    setLoading(true);
    setCurrentStep(0);

    // Simulate step progression
    let step = 0;
    const advance = () => {
      step++;
      if (step < STEPS.length) {
        setCurrentStep(step);
        setTimeout(advance, STEPS[step].duration);
      }
    };
    setTimeout(advance, STEPS[0].duration);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="animate-fade-in-up flex flex-col items-center gap-8">
          <Logo />

          <Spinner />

          <div className="flex flex-col items-center gap-3">
            <p className="text-lg font-medium text-white">
              {STEPS[currentStep].label}
              <span className="animate-pulse">...</span>
            </p>
            <p className="text-sm text-neutral-500">{url}</p>
          </div>

          {/* Step indicators */}
          <div className="flex flex-col gap-2">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full transition-all duration-500 ${
                    i < currentStep
                      ? "bg-[var(--color-teal)]"
                      : i === currentStep
                        ? "bg-[var(--color-teal)] animate-pulse"
                        : "bg-neutral-700"
                  }`}
                />
                <span
                  className={`text-sm transition-colors duration-300 ${
                    i <= currentStep ? "text-neutral-300" : "text-neutral-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Hero section */}
      <div className="animate-fade-in-up flex max-w-2xl flex-col items-center gap-8 text-center">
        <Logo className="animate-float" />

        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Tokenise
            <span className="bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-teal-light)] bg-clip-text text-transparent">
              {" "}
              anything.
            </span>
          </h1>
          <p className="text-lg text-neutral-400 sm:text-xl">
            Paste your website. Get a tokenisation proposal in minutes.
          </p>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="animate-pulse-glow flex w-full max-w-lg items-center gap-0 rounded-full border border-neutral-800 bg-neutral-900/80 p-1.5 backdrop-blur-sm transition-all focus-within:border-[var(--color-teal)]/50"
        >
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="yourcompany.com"
            className="flex-1 bg-transparent px-5 py-3 text-base text-white placeholder-neutral-500 outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--color-teal)] px-7 py-3 text-base font-semibold text-white transition-all hover:bg-[var(--color-teal-dark)] hover:shadow-lg hover:shadow-[var(--color-teal)]/20 active:scale-95"
          >
            Go
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-neutral-600">
          <span>Blockchain strategy</span>
          <span className="text-neutral-700">|</span>
          <span>Token economics</span>
          <span className="text-neutral-700">|</span>
          <span>Regulatory framework</span>
          <span className="text-neutral-700">|</span>
          <span>Smart contract architecture</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-neutral-600">
        Powered by{" "}
        <span className="text-[var(--color-teal)]">Deca4 Advisory</span> &{" "}
        <span className="text-white">Curio</span>
      </footer>
    </div>
  );
}
