# AI Prompts - Tokenisation Proposal Engine

## Overview

Two or three Claude API calls per proposal, depending on whether the user modifies the questionnaire after pre-generation.

---

## Call 1: Questionnaire Prefill

**Purpose:** Extract structured business info from scraped website content
**Current model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
**Planned model:** Claude Haiku 4.5
**Max tokens:** 2,000
**Latency:** ~5s (expected ~1s with Haiku)
**Cost:** ~2-3c (expected <0.5c with Haiku)

**When:** Immediately after Firecrawl scrape, before user sees wizard

**Input:** Scraped website markdown (up to 8K chars) + URL

**Output:** JSON with 9 fields: companyName, industry, jurisdiction, assetTypes, estimatedValue, revenueModel, targetInvestors, tokenStandard, regulatoryNotes

---

## Call 2: Report Pre-generation

**Purpose:** Start generating the full report while user fills Steps 4-5
**Model:** Claude Sonnet 4.6 (`claude-sonnet-4-6-20250627`)
**Max tokens:** 6,000
**Latency:** ~20-25s (runs in background)
**Cost:** ~4-5c

**When:** Fired in background when user clicks "Continue" after Step 3 (goals). Uses company info + goals + AI-prefilled defaults for fields the user hasn't touched yet.

**Input:** All 9 questionnaire fields (partially from user, partially defaults) + URL

**Output:** JSON array of 6 sections, each 300-500 words

---

## Call 3: Report Refinement (conditional)

**Purpose:** Update pre-generated report if user changed fields in Steps 4-5
**Model:** Claude Sonnet 4.6 (`claude-sonnet-4-6-20250627`)
**Max tokens:** 6,000
**Latency:** ~10-15s
**Cost:** ~4-5c

**When:** Only if user modified questionnaire fields between pre-generation and final submit. Skipped entirely if nothing changed (instant report).

**Input:** Existing draft report + change diff + updated questionnaire

**Output:** Updated JSON array of 6 sections

---

## Decision Flow on Final Submit

```
User clicks "Generate Proposal" on Step 5
  │
  ├─ Pre-generated report exists?
  │   ├─ YES: Compare questionnaire fields
  │   │   ├─ No changes → USE PRE-GENERATED (instant, 0s)
  │   │   └─ Changes found → REFINE (Call 3, ~10-15s)
  │   └─ NO → GENERATE FROM SCRATCH (Call 2, ~20-25s)
```

---

## Cost Per Proposal

| Scenario | Calls | Cost | User wait |
|----------|-------|------|-----------|
| User doesn't change anything | 1 + 2 | ~7c | ~0s |
| User changes a few fields | 1 + 2 + 3 | ~12c | ~10-15s |
| Pre-generation fails/not ready | 1 + 2 | ~7c | ~20-25s |
| After Haiku switch (no changes) | 1 + 2 | ~5c | ~0s |

---

## JSON Parsing

Claude sometimes wraps JSON in markdown code fences. The `cleanJsonString()` helper handles this by stripping fences and extracting JSON via regex.
