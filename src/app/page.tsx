"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import AnalysisProgress from "@/components/AnalysisProgress";
import PartnerLogos from "@/components/PartnerLogos";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

// ─── Data ────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste your URL. Get your report.",
    desc: "AI reads your business, identifies tokenisable assets, models the economics. 90 seconds.",
  },
  {
    step: "02",
    title: "See your investor page before it exists.",
    desc: "We generate a live mockup of what your crowdfunding / investor page would look like. You see the product before signing anything.",
  },
  {
    step: "03",
    title: "We build, launch, and connect you to investors.",
    desc: "Token issuance, compliance, market-making, DeFi liquidity. End-to-end.",
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
  { value: "$1B+", label: "Pipeline under MOU" },
  { value: "3", label: "New clients per month" },
  { value: "12+", label: "Jurisdictions covered" },
  { value: "90s", label: "Avg. report time" },
];

// ─── Audience Data ───────────────────────────────────────────────────────────

const AUDIENCE_TABS = [
  {
    id: "asset-manager" as const,
    label: "Asset manager",
    headline: "You manage real assets. Tokenisation gives them a capital markets layer.",
    body: "Your portfolio \u2014 mortgages, auto loans, commodities, private credit \u2014 is illiquid by default. We structure a tokenised vehicle around it so institutional investors can come in, liquidity exists, and you\u2019re not waiting years for an exit.",
    tiles: [
      { name: "Swiss mortgages", outcome: "Turn a static loan book into a liquid, investor-grade instrument." },
      { name: "Auto finance / ABS", outcome: "Your loan book is capital waiting to be unlocked." },
      { name: "Commodities", outcome: "Physical commodities with a 24/7 tradeable price signal." },
      { name: "Private credit", outcome: "Bring institutional capital into private credit \u2014 on your terms." },
      { name: "Mining rights", outcome: "Finance extraction with investors, not just project debt." },
      { name: "Other real assets", outcome: "If it produces cash flow or holds value, we can tokenise it." },
    ],
  },
  {
    id: "business-owner" as const,
    label: "Business / asset owner",
    headline: "You own the asset. We help you raise against it \u2014 without selling it.",
    body: "Whether you\u2019re expanding a business, financing a mine, or monetising a commodity portfolio \u2014 we structure a token that lets investors buy in, you retain ownership, and the capital is yours to deploy.",
    tiles: [
      { name: "Mine / extraction", outcome: "Tokenise your royalty stream or production revenue." },
      { name: "Real estate", outcome: "Fractional ownership without losing control." },
      { name: "Operating business", outcome: "Raise growth capital from global investors." },
      { name: "Physical commodities", outcome: "Physical assets with a digital capital markets layer." },
      { name: "Auto / lease portfolio", outcome: "Turn receivables into investor-grade instruments." },
      { name: "Other", outcome: "If it holds value or produces cash flow, we can structure it." },
    ],
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

type FlowState = "landing" | "auth" | "analysing";

export default function Home() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [flow, setFlow] = useState<FlowState>("landing");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Audience selector state
  const [activeTab, setActiveTab] = useState<"asset-manager" | "business-owner">("asset-manager");
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  // Check if already authenticated
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUserId(data.user.id);
          setUserEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (flow === "landing") inputRef.current?.focus();
  }, [flow]);

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

  const startProposal = useCallback(async (parsedUrl: string) => {
    setFlow("analysing");

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsedUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create report");
        setFlow("landing");
        return;
      }

      // Navigate to questionnaire
      router.push(`/questionnaire/${data.proposalId}`);
    } catch {
      setError("Network error. Please try again.");
      setFlow("landing");
    }
  }, [router]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) { setError("Enter your company website"); return; }
    const parsed = validateUrl(url);
    if (!parsed) { setError("Enter a valid URL, e.g. yourcompany.com"); return; }
    setUrl(parsed);

    if (userId) {
      startProposal(parsed);
    } else {
      setFlow("auth");
    }
  };

  const handleAuthenticated = (newUserId: string) => {
    setUserId(newUserId);
    setFlow("landing");
    const parsed = validateUrl(url);
    if (parsed) {
      startProposal(parsed);
    }
  };

  const scrollToTopAndFocus = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 500);
  };

  const currentAudience = AUDIENCE_TABS.find((t) => t.id === activeTab)!;

  // ─── Analysing ─────────────────────────────────────────────────────────────

  if (flow === "analysing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mesh px-6" style={{ background: "var(--bg)" }}>
        <div className="absolute right-4 top-4"><ThemeToggle dark={dark} toggle={toggle} /></div>
        <div className="animate-scale-in flex w-full max-w-md flex-col items-center gap-10">
          <PartnerLogos dark={dark} size="lg" />
          <AnalysisProgress url={url} animate={true} />
        </div>
      </div>
    );
  }

  // ─── Landing ──────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-mesh" style={{ background: "var(--bg)" }}>
      {/* Auth Modal */}
      <AuthModal
        open={flow === "auth"}
        onClose={() => setFlow("landing")}
        onAuthenticated={handleAuthenticated}
      />

      {/* Trust Banner */}
      <a
        href="https://forbes.swiss/forbes-assetization-leaders-list/listmaker/fernando-verboonenceo-curioinvest-curio-capital-ag"
        target="_blank" rel="noopener noreferrer"
        className="group flex w-full items-center justify-center gap-2 py-2.5 text-center text-xs font-medium transition-all hover:opacity-80"
        style={{ background: "var(--badge-bg)", borderBottom: "1px solid var(--badge-border)", color: "var(--accent)" }}
      >
        <svg className="h-3 w-3 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span>Featured on <strong>Forbes Assetization Leaders List</strong> · $1B+ tokenisation pipeline · Deca4 Advisory x curioInvest</span>
        <svg className="h-3 w-3 opacity-40 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
      </a>

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex w-full items-center justify-between px-6 py-4 backdrop-blur-lg sm:px-12" style={{ borderBottom: "1px solid var(--border)", background: dark ? "rgba(5,5,7,0.85)" : "rgba(255,255,255,0.88)" }}>
        <PartnerLogos dark={dark} size="lg" />
        <div className="flex items-center gap-5">
          {userId ? (
            <>
              <button onClick={() => router.push("/dashboard")} className="hidden text-sm transition-colors hover:underline sm:block" style={{ color: "var(--text-secondary)" }}>
                Dashboard
              </button>
              <span className="hidden text-xs sm:block" style={{ color: "var(--text-muted)" }}>
                {userEmail}
              </span>
            </>
          ) : (
            <button onClick={() => setFlow("auth")} className="hidden text-sm font-medium transition-colors hover:underline sm:block" style={{ color: "var(--accent)" }}>
              Sign in
            </button>
          )}
          <button
            onClick={scrollToTopAndFocus}
            className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95 sm:block"
            style={{ background: "var(--color-teal)" }}
          >
            Get your report &rarr;
          </button>
          <a
            href="https://calend.ly/rfv"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium transition-all sm:block"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}
          >
            Book a call
          </a>
          <ThemeToggle dark={dark} toggle={toggle} />
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[90vh] flex-col items-center justify-center px-6 pt-8">
        <div className="flex max-w-3xl flex-col items-center gap-7 text-center">
          <h1 className="animate-fade-in-up text-5xl font-bold leading-[1.1] tracking-tight opacity-0 sm:text-7xl" style={{ color: "var(--text-primary)" }}>
            Real assets.
            <br />
            <span className="bg-gradient-to-r from-[var(--color-teal)] via-[var(--color-teal-light)] to-[var(--color-teal)] bg-clip-text text-transparent">
              Global capital.
            </span>
          </h1>

          <p className="animate-fade-in-up max-w-xl text-lg opacity-0 delay-100 sm:text-xl" style={{ color: "var(--text-secondary)" }}>
            Need better access to capital or new revenue streams from your inventory? Get your report and find out how tokenisation can benefit you.
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
              Get your free report &rarr;
            </button>
          </form>

          {error && <p className="animate-fade-in text-sm text-red-500">{error}</p>}

          <p className="animate-fade-in-up flex items-center gap-3 text-xs opacity-0 delay-300" style={{ color: "var(--text-muted)" }}>
            <span>Free</span>
            <span style={{ color: "var(--text-faint)" }}>&middot;</span>
            <span>No crypto knowledge required</span>
            <span style={{ color: "var(--text-faint)" }}>&middot;</span>
            <span>Report in 90 seconds</span>
          </p>

          <a href="https://calend.ly/rfv" target="_blank" rel="noopener noreferrer" className="animate-fade-in-up text-xs opacity-0 delay-400 transition-colors hover:underline" style={{ color: "var(--text-muted)" }}>
            or schedule a consultation &rarr;
          </a>
        </div>
      </section>

      {/* Audience Selector */}
      <section style={{ borderTop: "1px solid var(--section-border)" }} className="py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-12">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>What best describes you?</p>
          </div>

          {/* Tabs */}
          <div className="mb-10 flex justify-center gap-2">
            {AUDIENCE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedTile(null); }}
                className="rounded-xl px-6 py-3 text-sm font-semibold transition-all"
                style={{
                  background: activeTab === tab.id ? "var(--color-teal)" : "var(--bg-card)",
                  color: activeTab === tab.id ? "#ffffff" : "var(--text-secondary)",
                  border: activeTab === tab.id ? "1px solid var(--color-teal)" : "1px solid var(--border)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mb-10 text-center">
            <h3 className="mb-4 text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              {currentAudience.headline}
            </h3>
            <p className="mx-auto max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {currentAudience.body}
            </p>
          </div>

          {/* Industry Tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentAudience.tiles.map((tile, i) => (
              <button
                key={tile.name}
                onClick={() => setSelectedTile(selectedTile === i ? null : i)}
                className="group rounded-xl p-6 text-left transition-all hover:translate-y-[-2px]"
                style={{
                  background: selectedTile === i ? "var(--bg-card)" : "var(--feature-bg)",
                  border: selectedTile === i ? "1px solid var(--color-teal)" : "1px solid var(--border)",
                }}
              >
                <h4 className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{tile.name}</h4>
                {selectedTile === i && (
                  <div
                    className="animate-fade-in mt-3 border-l-2 pl-4 text-sm leading-relaxed"
                    style={{ borderColor: "var(--color-teal)", color: "var(--text-secondary)" }}
                  >
                    {tile.outcome}
                  </div>
                )}
                {selectedTile !== i && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Click to learn more</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-28 sm:px-12">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>How it works</p>
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--text-primary)" }}>From URL to report in 90 seconds</h2>
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

      {/* Live Proof */}
      <section style={{ borderTop: "1px solid var(--section-border)" }} className="py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-12">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "var(--badge-bg)", color: "var(--accent)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-teal)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-teal)]" />
              </span>
              Live proof
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl p-8" style={{ background: "var(--step-card-bg)", border: "1px solid var(--border)" }}>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>XAUH</p>
              <h3 className="mb-3 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Swiss gold token (first live client)</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Physical LBMA gold, Swiss vault, on TON + EVM. Listed on CapitalDEX and Biconomy.
              </p>
            </div>

            <div className="rounded-2xl p-8" style={{ background: "var(--step-card-bg)", border: "1px solid var(--border)" }}>
              <p className="mb-1 font-mono text-3xl font-bold" style={{ color: "var(--accent)" }}>$1B+</p>
              <h3 className="mb-3 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Pipeline under MOU</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Swiss mortgages, industrial commodities, auto leases. Institutional grade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ borderTop: "1px solid var(--section-border)" }} className="py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-12">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest" style={{ color: "var(--color-purple)" }}>Your report includes</p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--text-primary)" }}>Comprehensive, expert-reviewed</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm" style={{ color: "var(--text-secondary)" }}>
              Each report contains 6 comprehensive sections covering every aspect of your tokenisation strategy.
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

      {/* Forbes Social Proof */}
      <section style={{ borderTop: "1px solid var(--section-border)" }} className="py-20">
        <div className="mx-auto max-w-3xl px-6 sm:px-12">
          <div className="flex flex-col items-center gap-8 text-center">
            <a
              href="https://forbes.swiss/forbes-assetization-leaders-list/listmaker/fernando-verboonenceo-curioinvest-curio-capital-ag"
              target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-80"
              style={{ background: "var(--badge-bg)", border: "1px solid var(--badge-border)", color: "var(--accent)" }}
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Forbes Assetization Leaders List
              <svg className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>

            <blockquote className="max-w-xl">
              <p className="text-xl font-light italic leading-relaxed sm:text-2xl" style={{ color: "var(--text-primary)" }}>
                &ldquo;We started with a $1.1M Ferrari, now we&apos;re reaching 1 billion users through Telegram.&rdquo;
              </p>
            </blockquote>

            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Fernando Verboonen</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>CEO, curioInvest / Curio Capital AG</p>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center">
                <span className="font-mono text-lg font-bold" style={{ color: "var(--accent)" }}>$1B+</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>pipeline under MOU</span>
              </div>
              <div style={{ width: 1, height: 32, background: "var(--border)" }} />
              <div className="flex flex-col items-center">
                <span className="font-mono text-lg font-bold" style={{ color: "var(--accent)" }}>$3M+</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>assets tokenised</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar + Final CTA */}
      <section style={{ borderTop: "1px solid var(--section-border)" }} className="py-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-12 px-6 text-center">
          <div className="flex w-full max-w-lg justify-between">
            {METRICS.map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-1">
                <span className="font-mono text-3xl font-bold sm:text-4xl" style={{ color: "var(--accent)" }}>{m.value}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.label}</span>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Ready to see what your assets are worth?
            </h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
              Get your free report now, or speak with our advisory team.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={scrollToTopAndFocus}
              className="rounded-xl bg-[var(--color-teal)] px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-lg active:scale-95"
              style={{ boxShadow: "0 4px 20px var(--glow-color)" }}>
              Get your free report &rarr;
            </button>
            <a href="https://calend.ly/rfv" target="_blank" rel="noopener noreferrer" className="rounded-xl px-8 py-4 text-base font-medium transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}>
              Schedule a Call
            </a>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Free &middot; No crypto knowledge required &middot; Report in 90 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--section-border)" }} className="px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
          <PartnerLogos dark={dark} size="lg" />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Deca4 Advisory FZE &middot; Dubai World Trade Center &middot; info@deca4.com
          </p>
        </div>
      </footer>
    </div>
  );
}
