"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProposalCard from "@/components/ProposalCard";
import type { Proposal, User } from "@/types";

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

export default function DashboardPage() {
  const router = useRouter();
  const { dark } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Check auth
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        if (!authData.user) {
          router.push("/");
          return;
        }
        setUser(authData.user);

        const listRes = await fetch("/api/proposals/list");
        if (listRes.ok) {
          const listData = await listRes.json();
          setProposals(listData.proposals || []);
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="animate-spin-slow h-10 w-10 rounded-full border-2 border-transparent border-t-[var(--color-teal)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logos/deca4.svg" alt="Deca4" width={136} height={50} className="h-6 w-auto" priority />
            <span style={{ color: "var(--text-faint)" }} className="font-light">x</span>
            <Image
              src="/logos/curio.svg" alt="Curio" width={120} height={20}
              className={`h-4 w-auto ${dark ? "invert" : ""}`}
              style={{ filter: dark ? "invert(1) hue-rotate(180deg)" : undefined }}
              priority
            />
          </div>
          {user && (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Your Proposals
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-[var(--color-teal)] px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
          >
            New Proposal
          </button>
        </div>

        {/* Proposals list */}
        {proposals.length === 0 ? (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
            style={{ background: "var(--feature-bg)", border: "1px solid var(--border)" }}
          >
            <svg
              className="h-12 w-12"
              style={{ color: "var(--text-faint)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p style={{ color: "var(--text-muted)" }}>No proposals yet</p>
            <button
              onClick={() => router.push("/")}
              className="mt-2 rounded-xl bg-[var(--color-teal)] px-6 py-3 text-sm font-semibold text-white"
            >
              Create Your First Proposal →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
