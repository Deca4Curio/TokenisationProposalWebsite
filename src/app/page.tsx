"use client";

import { useState, useEffect, useRef } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const ASSET_TYPES = [
  "Real Estate", "Equity", "Bonds", "Funds", "Inventory",
  "Commodities", "Oil & Gas", "Shipping Vessels", "Stadiums",
  "Luxury Cars", "Art Collections", "IP & Patents", "Carbon Credits",
  "Agricultural Land", "Private Debt", "Infrastructure",
];

const ANALYSIS_STEPS = [
  { label: "Scanning website", icon: "globe" },
  { label: "Mapping business model", icon: "chart" },
  { label: "Identifying tokenisable assets", icon: "search" },
  { label: "Modelling token economics", icon: "calc" },
  { label: "Drafting regulatory framework", icon: "shield" },
  { label: "Generating your proposal", icon: "doc" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste your website",
    desc: "Our AI scans your business, financials, and asset structure in seconds.",
  },
  {
    step: "02",
    title: "Get a custom proposal",
    desc: "Receive a tokenisation strategy tailored to your assets, jurisdiction, and goals.",
  },
  {
    step: "03",
    title: "Book an expert call",
    desc: "Review the proposal with our blockchain advisors and start building.",
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const textSize = size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${textSize} font-bold tracking-tight text-[var(--color-teal)]`}>DECA</span>
      <span className={`${textSize} font-bold tracking-tight text-[var(--color-purple)]`}>4</span>
      <span className="mx-1 text-xs text-neutral-600">x</span>
      <span className={`${textSize} font-bold tracking-tight text-white`}>Curio</span>
    </div>
  );
}

function Ticker() {
  const items = [...ASSET_TYPES, ...ASSET_TYPES];
  return (
    <div className="relative w-full overflow-hidden py-6 no-scrollbar">
      <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--color-background)] to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--color-background)] to-transparent" />
      <div className="flex animate-ticker gap-6 whitespace-nowrap">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="rounded-full border border-neutral-800 bg-neutral-900/50 px-5 py-2 text-sm text-neutral-400"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepIcon({ type, done }: { type: string; done: boolean }) {
  const color = done ? "text-[var(--color-teal)]" : "text-neutral-600";
  const icons: Record<string, string> = {
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9Z",
    chart: "M3 3v18h18M7 16l4-4 4 4 5-5",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
    calc: "M4 4h16v16H4zM4 10h16M10 4v16",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M16 13H8M16 17H8M10 9H8",
  };
  return (
    <svg className={`h-5 w-5 ${color} transition-colors duration-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[type] || icons.doc} />
    </svg>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

type FlowState = "landing" | "email" | "analysing";

export default function Home() {
  const [flow, setFlow] = useState<FlowState>("landing");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus URL input on landing
  useEffect(() => {
    if (flow === "landing") inputRef.current?.focus();
  }, [flow]);

  // Analysis step progression
  useEffect(() => {
    if (flow !== "analysing") return;
    if (currentStep >= ANALYSIS_STEPS.length - 1) return;
    const durations = [2000, 2500, 2000, 3000, 2000, 2500];
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), durations[currentStep]);
    return () => clearTimeout(timer);
  }, [flow, currentStep]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = url.trim();
    if (!trimmed) { setError("Enter your company website"); return; }
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      if (!parsed.hostname.includes(".")) throw new Error();
      setUrl(parsed.href);
    } catch {
      setError("Enter a valid URL, e.g. yourcompany.com");
      return;
    }
    setFlow("email");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) { setError("We need your email to send the proposal"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Enter a valid email"); return; }
    setCurrentStep(0);
    setFlow("analysing");
  };

  // ─── Analysing State ────────────────────────────────────────────────────────

  if (flow === "analysing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mesh px-6">
        <div className="animate-scale-in flex w-full max-w-md flex-col items-center gap-10">
          <Logo size="sm" />

          {/* Spinner */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-neutral-800" />
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-transparent border-t-[var(--color-teal)]" />
            <div className="absolute inset-2 animate-spin-slow rounded-full border border-transparent border-b-[var(--color-purple)]" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
            <span className="text-xs font-mono text-neutral-500">{Math.min(Math.round(((currentStep + 1) / ANALYSIS_STEPS.length) * 100), 99)}%</span>
          </div>

          {/* Steps */}
          <div className="flex w-full flex-col gap-3">
            {ANALYSIS_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-500 ${
                    active ? "glass" : done ? "opacity-60" : "opacity-25"
                  }`}
                >
                  {done ? (
                    <div className="animate-check-pop flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-teal)]">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <StepIcon type={step.icon} done={false} />
                  )}
                  <span className={`text-sm ${active ? "text-white font-medium" : "text-neutral-400"}`}>
                    {step.label}
                    {active && <span className="animate-pulse text-[var(--color-teal)]">...</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {/* URL being analysed */}
          <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-4 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-teal)]" />
            <span className="text-xs text-neutral-500 font-mono">{url.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Email Capture State ────────────────────────────────────────────────────

  if (flow === "email") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mesh px-6">
        <div className="animate-scale-in flex w-full max-w-md flex-col items-center gap-8">
          <Logo size="sm" />

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="mb-2 flex items-center gap-2 rounded-full border border-[var(--color-teal)]/20 bg-[var(--color-teal)]/5 px-4 py-1.5">
              <div className="h-2 w-2 rounded-full bg-[var(--color-teal)]" />
              <span className="text-xs font-medium text-[var(--color-teal)]">Ready to analyse</span>
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Where should we send it?</h2>
            <p className="mt-1 text-sm text-neutral-400">
              We&apos;ll email your custom tokenisation proposal for
            </p>
            <span className="mt-1 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-1 font-mono text-sm text-[var(--color-teal)]">
              {url.replace(/^https?:\/\//, "")}
            </span>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="flex w-full flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@company.com"
              autoFocus
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-5 py-4 text-base text-white placeholder-neutral-500 outline-none transition-all focus:border-[var(--color-teal)]/50"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--color-teal)] py-4 text-base font-semibold text-white transition-all hover:bg-[var(--color-teal-dark)] hover:shadow-lg hover:shadow-[var(--color-teal)]/20 active:scale-[0.98]"
            >
              Generate My Proposal
            </button>
            {/* Google SSO placeholder */}
            <button
              type="button"
              onClick={() => { setEmail("google-sso@placeholder.com"); }}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 py-3.5 text-sm text-neutral-300 transition-all hover:border-neutral-700 hover:bg-neutral-800/50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/><path d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54Z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.77 14.97.5 12 .5 7.7.5 3.99 2.97 2.18 6.6l3.66 2.84c.87-2.6 3.3-4.06 6.16-4.06Z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
          </form>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button onClick={() => setFlow("landing")} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
            ← Different website
          </button>
        </div>
      </div>
    );
  }

  // ─── Landing State ──────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-mesh">
      {/* Nav */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 backdrop-blur-md sm:px-12">
        <Logo size="sm" />
        <a href="#how-it-works" className="text-sm text-neutral-400 transition-colors hover:text-white">
          How it works
        </a>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-16">
        <div className="flex max-w-3xl flex-col items-center gap-7 text-center">
          {/* Badge */}
          <div className="animate-fade-in-up rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-1.5 text-xs text-neutral-400 opacity-0">
            AI-powered tokenisation proposals for any business
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up text-5xl font-bold leading-[1.1] tracking-tight text-white opacity-0 delay-100 sm:text-7xl">
            Tokenise{" "}
            <span className="bg-gradient-to-r from-[var(--color-teal)] via-[var(--color-teal-light)] to-[var(--color-teal)] bg-clip-text text-transparent">
              anything.
            </span>
          </h1>

          {/* Sub */}
          <p className="animate-fade-in-up max-w-lg text-lg text-neutral-400 opacity-0 delay-200 sm:text-xl">
            Paste your website. Our AI analyses your business and generates a
            custom tokenisation proposal in minutes.
          </p>

          {/* CTA Input */}
          <form
            onSubmit={handleUrlSubmit}
            className="animate-fade-in-up animate-pulse-glow mt-2 flex w-full max-w-xl items-center gap-0 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-2 opacity-0 delay-300 backdrop-blur-sm transition-all focus-within:border-[var(--color-teal)]/40"
          >
            <div className="flex flex-1 items-center gap-3 px-4">
              <svg className="h-5 w-5 shrink-0 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                placeholder="yourcompany.com"
                className="w-full bg-transparent py-3.5 text-base text-white placeholder-neutral-500 outline-none sm:text-lg"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-[var(--color-teal)] px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-[var(--color-teal-dark)] hover:shadow-lg hover:shadow-[var(--color-teal)]/25 active:scale-95 sm:px-10"
            >
              Go
            </button>
          </form>

          {error && <p className="animate-fade-in text-sm text-red-400">{error}</p>}

          {/* Social proof */}
          <p className="animate-fade-in-up text-xs text-neutral-600 opacity-0 delay-400">
            Free instant analysis. No credit card required.
          </p>
        </div>
      </section>

      {/* Ticker: What can be tokenised */}
      <section className="border-y border-neutral-900 py-2">
        <Ticker />
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-28 sm:px-12">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[var(--color-teal)]">How it works</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">From URL to proposal in 3 steps</h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="group relative rounded-2xl border border-neutral-800/60 bg-neutral-900/30 p-8 transition-all hover:border-[var(--color-teal)]/20 hover:bg-neutral-900/50">
              <span className="mb-4 block font-mono text-4xl font-bold text-neutral-800 transition-colors group-hover:text-[var(--color-teal)]/30">
                {item.step}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What You Get */}
      <section className="border-t border-neutral-900 py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-12">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[var(--color-purple)]">Your proposal includes</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">AI-generated, expert-reviewed</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Asset Analysis", desc: "What you own that can be tokenised and why it makes sense." },
              { title: "Token Economics", desc: "Supply, pricing model, distribution, and vesting schedules." },
              { title: "Regulatory Framework", desc: "Jurisdiction-specific compliance roadmap and entity structure." },
              { title: "Smart Contract Architecture", desc: "Technical blueprint for token standards and on-chain logic." },
              { title: "Go-to-Market Strategy", desc: "Investor targeting, distribution channels, and launch timeline." },
              { title: "Financial Projections", desc: "Fundraise modelling, liquidity analysis, and cost breakdown." },
            ].map((item) => (
              <div key={item.title} className="group rounded-xl border border-neutral-800/40 bg-neutral-950/50 p-6 transition-all hover:border-neutral-700/60">
                <div className="mb-3 h-1 w-8 rounded-full bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-purple)] opacity-40 transition-opacity group-hover:opacity-100" />
                <h3 className="mb-1.5 text-base font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-neutral-900 py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to tokenise your assets?
          </h2>
          <p className="text-neutral-400">
            Get your free proposal now, or schedule a call with our advisory team.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); inputRef.current?.focus(); }}
              className="rounded-xl bg-[var(--color-teal)] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[var(--color-teal-dark)] hover:shadow-lg hover:shadow-[var(--color-teal)]/20 active:scale-95"
            >
              Get Your Proposal
            </button>
            <a
              href="#"
              className="rounded-xl border border-neutral-700 px-8 py-4 text-base font-medium text-neutral-300 transition-all hover:border-neutral-500 hover:bg-neutral-900 hover:text-white"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="sm" />
          <p className="text-xs text-neutral-600">
            Powered by <span className="text-[var(--color-teal)]">Deca4 Advisory FZE</span> &amp; <span className="text-white">Curio</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
