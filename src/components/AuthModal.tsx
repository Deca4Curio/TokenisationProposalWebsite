"use client";

import { useState } from "react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (userId: string) => void;
}

export default function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      onAuthenticated(data.userId);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="animate-scale-in relative z-10 w-full max-w-md rounded-2xl p-8"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Enter your email
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            We&apos;ll save your report and send you the results.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@company.com"
            autoFocus
            disabled={loading}
            className="w-full rounded-xl px-5 py-4 text-base outline-none transition-all disabled:opacity-50"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--input-focus-border)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-teal)] py-4 text-base font-semibold text-white transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Continue"}
          </button>
        </form>

        {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}

        <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          No spam. We only use your email to deliver your report.
        </p>
      </div>
    </div>
  );
}
