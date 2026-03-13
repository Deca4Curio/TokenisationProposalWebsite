"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// ─── Data ────────────────────────────────────────────────────────────────────

const LIVE_FEED = [
  "Proposal #847 generated for $12M commercial real estate portfolio in 43s",
  "Token economics modelled for Dubai-based fund in 38s",
  "Regulatory framework mapped for DIFC asset manager in 51s",
  "Proposal #1,204 delivered to logistics company in 47s",
  "$85M infrastructure project analysed, 6-section proposal sent",
  "Proposal #623 generated for agricultural commodity fund in 34s",
  "Smart contract architecture designed for luxury auto dealer in 52s",
  "Proposal #991 delivered, investor structure for family office mapped",
  "$250M real estate fund tokenisation proposal in 41s",
  "Proposal #1,456 generated for carbon credit marketplace in 39s",
  "Equity tokenisation strategy created for Series B startup in 44s",
  "Proposal #738 delivered, ADGM compliance roadmap included",
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
    desc: "Our AI reads your business in seconds, identifying assets, revenue model, and jurisdiction.",
  },
  {
    step: "02",
    title: "Get a custom proposal",
    desc: "Receive a 6-section tokenisation strategy: asset analysis, token economics, regulatory roadmap, and more.",
  },
  {
    step: "03",
    title: "Book an expert call",
    desc: "Review the proposal with our blockchain advisors and begin implementation.",
  },
];

const FEATURES = [
  {
    title: "Asset Analysis",
    desc: "Identifies what you own that can be tokenised, why it makes financial sense, and the optimal structure.",
    detail: "Real estate, equity, debt instruments, commodities, IP, infrastructure",
  },
  {
    title: "Token Economics",
    desc: "Supply modelling, pricing mechanism, distribution schedule, vesting periods, and liquidity strategy.",
    detail: "ERC-20, ERC-1400, ERC-3643 token standard recommendations",
  },
  {
    title: "Regulatory Framework",
    desc: "Jurisdiction-specific compliance roadmap, entity structure, and licensing requirements.",
    detail: "DIFC, ADGM, VARA, EU MiCA, SEC, MAS frameworks covered",
  },
  {
    title: "Smart Contract Architecture",
    desc: "Technical blueprint for token standards, on-chain logic, and integration with existing systems.",
    detail: "Audit-ready specifications with security considerations",
  },
  {
    title: "Go-to-Market Strategy",
    desc: "Investor targeting, distribution channels, marketing plan, and launch timeline.",
    detail: "Primary and secondary market strategy included",
  },
  {
    title: "Financial Projections",
    desc: "Fundraise modelling, liquidity analysis, cost breakdown, and ROI scenarios.",
    detail: "3-year projections with sensitivity analysis",
  },
];

const METRICS = [
  { value: "90s", label: "avg. proposal time" },
  { value: "6", label: "proposal sections" },
  { value: "12+", label: "jurisdictions covered" },
];

// ─── Theme ───────────────────────────────────────────────────────────────────

function useTheme() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") setDark(false);
    else if (stored === "dark") setDark(true);
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border transition-all"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text-muted)" }}
    >
      {dark ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      )}
    </button>
  );
}

// ─── Logos ────────────────────────────────────────────────────────────────────

function Deca4Logo({ className }: { className?: string }) {
  return <Image src="/logos/deca4.svg" alt="Deca4 Advisory" width={136} height={50} className={className} priority />;
}

function CurioLogo({ className, dark }: { className?: string; dark: boolean }) {
  return (
    <Image
      src="/logos/curio.svg" alt="curioInvest" width={120} height={20}
      className={`${className ?? ""} ${dark ? "invert" : ""}`}
      style={{ filter: dark ? "invert(1) hue-rotate(180deg)" : undefined }}
      priority
    />
  );
}

function PartnerLogos({ dark }: { dark: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <Deca4Logo className="h-7 w-auto" />
      <span style={{ color: "var(--text-faint)" }} className="text-lg font-light">x</span>
      <CurioLogo className="h-5 w-auto" dark={dark} />
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────

function LiveFeedTicker() {
  const items = [...LIVE_FEED, ...LIVE_FEED];
  return (
    <div className="relative w-full overflow-hidden py-5 no-scrollbar">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32" style={{ background: `linear-gradient(to right, var(--bg), transparent)` }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32" style={{ background: `linear-gradient(to left, var(--bg), transparent)` }} />
      <div className="flex animate-ticker gap-8 whitespace-nowrap">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-teal)] opacity-60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

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
    <svg className="h-5 w-5 transition-colors duration-500" style={{ color: done ? "var(--accent)" : "var(--text-muted)" }}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[type] || icons.doc} />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.77 14.97.5 12 .5 7.7.5 3.99 2.97 2.18 6.6l3.66 2.84c.87-2.6 3.3-4.06 6.16-4.06Z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

type FlowState = "landing" | "analysing" | "email";

export default function Home() {
  const { dark, toggle } = useTheme();
  const [flow, setFlow] = useState<FlowState>("landing");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (flow === "landing") inputRef.current?.focus();
  }, [flow]);

  // Analysis step progression → then transition to email capture
  useEffect(() => {
    if (flow !== "analysing") return;
    if (currentStep >= ANALYSIS_STEPS.length - 1) {
      // After final step completes, show email capture
      const timer = setTimeout(() => setFlow("email"), 2000);
      return () => clearTimeout(timer);
    }
    const durations = [1800, 2200, 1800, 2500, 1800, 2000];
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), durations[currentStep]);
    return () => clearTimeout(timer);
  }, [flow, currentStep]);

  const validateUrl = useCallback((raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      if (!parsed.hostname.includes(".")) return null;
      return parsed.href;
    } catch {
      return null;
    }
  }, []);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) { setError("Enter your company website"); return; }
    const parsed = validateUrl(url);
    if (!parsed) { setError("Enter a valid URL, e.g. yourcompany.com"); return; }
    setUrl(parsed);
    setCurrentStep(0);
    setFlow("analysing"); // Go straight to analysis — value before capture
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) { setError("Enter your email to receive the full proposal"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Enter a valid email address"); return; }
    // TODO: Submit to backend, deliver proposal
    alert("Proposal will be sent to " + trimmed);
  };

  // ─── Analysing (value first, no gate) ───────────────────────────────────────

  if (flow === "analysing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mesh px-6" style={{ background: "var(--bg)" }}>
        <div className="absolute right-4 top-4"><ThemeToggle dark={dark} toggle={toggle} /></div>
        <div className="animate-scale-in flex w-full max-w-md flex-col items-center gap-10">
          <PartnerLogos dark={dark} />

          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ border: "1px solid var(--spinner-track)" }} />
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-transparent border-t-[var(--color-teal)]" />
            <div className="absolute inset-2 animate-spin-slow rounded-full border border-transparent border-b-[var(--color-purple)]" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {Math.min(Math.round(((currentStep + 1) / ANALYSIS_STEPS.length) * 100), 99)}%
            </span>
          </div>

          <div className="flex w-full flex-col gap-3">
            {ANALYSIS_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.label} className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-500 ${active ? "glass" : ""}`} style={{ opacity: active ? 1 : done ? 0.6 : 0.25 }}>
                  {done ? (
                    <div className="animate-check-pop flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-teal)]">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <StepIcon type={step.icon} done={false} />
                  )}
                  <span className="text-sm" style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: active ? 500 : 400 }}>
                    {step.label}
                    {active && <span className="animate-pulse" style={{ color: "var(--accent)" }}>...</span>}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "var(--url-tag-bg)", border: "1px solid var(--url-tag-border)" }}>
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-teal)]" />
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{url.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Email Capture (after showing value) ────────────────────────────────────

  if (flow === "email") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mesh px-6" style={{ background: "var(--bg)" }}>
        <div className="absolute right-4 top-4"><ThemeToggle dark={dark} toggle={toggle} /></div>
        <div className="animate-scale-in flex w-full max-w-md flex-col items-center gap-8">
          <PartnerLogos dark={dark} />

          <div className="flex flex-col items-center gap-3 text-center">
            {/* Success badge */}
            <div className="mb-1 flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-xs font-medium text-green-500">Proposal ready</span>
            </div>

            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              Your proposal is ready.
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              We analysed{" "}
              <span className="font-mono font-medium" style={{ color: "var(--accent)" }}>
                {url.replace(/^https?:\/\//, "")}
              </span>{" "}
              and generated a 6-section tokenisation strategy.
            </p>
          </div>

          {/* Preview of what they get */}
          <div className="w-full rounded-xl p-4" style={{ background: "var(--feature-bg)", border: "1px solid var(--border)" }}>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Your proposal includes</p>
            <div className="flex flex-col gap-2">
              {["Asset Analysis", "Token Economics", "Regulatory Framework", "Smart Contract Architecture", "Go-to-Market Strategy", "Financial Projections"].map((section) => (
                <div key={section} className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-[var(--color-teal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{section}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="flex w-full flex-col gap-3">
            <input
              type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@company.com"
              autoFocus
              className="w-full rounded-xl px-5 py-4 text-base outline-none transition-all"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={(e) => e.currentTarget.style.borderColor = "var(--input-focus-border)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            />
            <button type="submit" className="w-full rounded-xl bg-[var(--color-teal)] py-4 text-base font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98]" style={{ boxShadow: "0 4px 20px var(--glow-color)" }}>
              Send My Proposal →
            </button>
            <button type="button" onClick={() => { setEmail("google-sso@placeholder.com"); }}
              className="flex w-full items-center justify-center gap-3 rounded-xl py-3.5 text-sm transition-all"
              style={{ background: "var(--google-btn-bg)", border: "1px solid var(--google-btn-border)", color: "var(--google-btn-text)" }}>
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Free · No spam · Delivered in under 60 seconds
          </p>
        </div>
      </div>
    );
  }

  // ─── Landing ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-mesh" style={{ background: "var(--bg)" }}>
      {/* Trust Banner */}
      <div className="w-full py-2.5 text-center text-xs font-medium" style={{ background: "var(--badge-bg)", borderBottom: "1px solid var(--badge-border)", color: "var(--accent)" }}>
        Powered by Deca4 Advisory FZE · Dubai World Trade Center · Trusted by institutional asset managers
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex w-full items-center justify-between px-6 py-4 backdrop-blur-lg sm:px-12" style={{ borderBottom: "1px solid var(--border)", background: dark ? "rgba(5,5,7,0.85)" : "rgba(255,255,255,0.88)" }}>
        <PartnerLogos dark={dark} />
        <div className="flex items-center gap-5">
          <a href="#how-it-works" className="hidden text-sm transition-colors hover:underline sm:block" style={{ color: "var(--text-secondary)" }}>How it works</a>
          <a href="#features" className="hidden text-sm transition-colors hover:underline sm:block" style={{ color: "var(--text-secondary)" }}>Features</a>
          <ThemeToggle dark={dark} toggle={toggle} />
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[90vh] flex-col items-center justify-center px-6 pt-8">
        <div className="flex max-w-3xl flex-col items-center gap-7 text-center">
          <h1 className="animate-fade-in-up text-5xl font-bold leading-[1.1] tracking-tight opacity-0 sm:text-7xl" style={{ color: "var(--text-primary)" }}>
            Tokenise{" "}
            <span className="bg-gradient-to-r from-[var(--color-teal)] via-[var(--color-teal-light)] to-[var(--color-teal)] bg-clip-text text-transparent">
              anything.
            </span>
          </h1>

          <p className="animate-fade-in-up max-w-xl text-lg opacity-0 delay-100 sm:text-xl" style={{ color: "var(--text-secondary)" }}>
            Paste your website. Our AI reads your business, identifies tokenisable assets, models token economics, maps the regulatory framework, and delivers a complete proposal in <strong style={{ color: "var(--text-primary)" }}>90 seconds</strong>.
          </p>

          {/* CTA Input */}
          <form onSubmit={handleUrlSubmit}
            className="animate-fade-in-up animate-pulse-glow mt-2 flex w-full max-w-xl items-center gap-0 rounded-2xl p-2 opacity-0 delay-200 backdrop-blur-sm transition-all"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
            <div className="flex flex-1 items-center gap-3 px-4">
              <svg className="h-5 w-5 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
              </svg>
              <input ref={inputRef} type="text" value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                placeholder="Paste your company's URL"
                className="w-full bg-transparent py-3.5 text-base outline-none sm:text-lg"
                style={{ color: "var(--text-primary)" }} />
            </div>
            <button type="submit"
              className="shrink-0 rounded-xl bg-[var(--color-teal)] px-6 py-3.5 text-base font-semibold text-white transition-all hover:shadow-lg active:scale-95 sm:px-8"
              style={{ boxShadow: "0 4px 20px var(--glow-color)" }}>
              Generate Proposal →
            </button>
          </form>

          {error && <p className="animate-fade-in text-sm text-red-500">{error}</p>}

          {/* 3-part objection killer */}
          <p className="animate-fade-in-up flex items-center gap-3 text-xs opacity-0 delay-300" style={{ color: "var(--text-muted)" }}>
            <span>Free</span>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span>No signup required</span>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span>Proposal in 90 seconds</span>
          </p>

          {/* Or book a demo */}
          <a href="#" className="animate-fade-in-up text-xs opacity-0 delay-400 transition-colors hover:underline" style={{ color: "var(--text-muted)" }}>
            or schedule a consultation →
          </a>
        </div>
      </section>

      {/* Live Activity Ticker */}
      <section style={{ borderTop: "1px solid var(--section-border)", borderBottom: "1px solid var(--section-border)" }}>
        <div className="flex items-center gap-3 py-1">
          <div className="shrink-0 pl-6 sm:pl-12">
            <span className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "var(--badge-bg)", color: "var(--accent)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-teal)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-teal)]" />
              </span>
              Live
            </span>
          </div>
          <LiveFeedTicker />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-28 sm:px-12">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>How it works</p>
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--text-primary)" }}>From URL to proposal in 90 seconds</h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="group relative rounded-2xl p-8 transition-all hover:translate-y-[-2px]"
              style={{ background: "var(--step-card-bg)", border: "1px solid var(--border)" }}>
              <span className="mb-4 block font-mono text-4xl font-bold transition-colors group-hover:text-[var(--color-teal)]" style={{ color: "var(--step-num)" }}>{item.step}</span>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ borderTop: "1px solid var(--section-border)" }} className="py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-12">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest" style={{ color: "var(--color-purple)" }}>Your proposal includes</p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--text-primary)" }}>AI-generated, expert-reviewed</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm" style={{ color: "var(--text-secondary)" }}>
              Each proposal contains 6 comprehensive sections covering every aspect of your tokenisation strategy.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => (
              <div key={item.title} className="group rounded-xl p-6 transition-all hover:translate-y-[-2px]"
                style={{ background: "var(--feature-bg)", border: "1px solid var(--border)" }}>
                <div className="mb-3 h-1 w-8 rounded-full bg-gradient-to-r from-[var(--color-teal)] to-[var(--color-purple)] opacity-40 transition-opacity group-hover:opacity-100" />
                <h3 className="mb-1.5 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                <p className="text-xs font-mono" style={{ color: "var(--text-faint)" }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with Metrics */}
      <section style={{ borderTop: "1px solid var(--section-border)" }} className="py-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-12 px-6 text-center">
          {/* Metrics */}
          <div className="flex w-full max-w-md justify-between">
            {METRICS.map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-1">
                <span className="font-mono text-3xl font-bold sm:text-4xl" style={{ color: "var(--accent)" }}>{m.value}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.label}</span>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Ready to tokenise your assets?
            </h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
              Get your free proposal now, or speak with our advisory team.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => inputRef.current?.focus(), 500); }}
              className="rounded-xl bg-[var(--color-teal)] px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-lg active:scale-95"
              style={{ boxShadow: "0 4px 20px var(--glow-color)" }}>
              Generate Proposal →
            </button>
            <a href="#" className="rounded-xl px-8 py-4 text-base font-medium transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}>
              Schedule a Call
            </a>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Free · No credit card · Proposal in 90 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--section-border)" }} className="px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
          <PartnerLogos dark={dark} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Deca4 Advisory FZE · Dubai World Trade Center · info@deca4.com
          </p>
        </div>
      </footer>
    </div>
  );
}
