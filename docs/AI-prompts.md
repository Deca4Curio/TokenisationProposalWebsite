# AI Prompts - Tokenisation Proposal Engine

## Overview

Two Claude API calls per proposal, running sequentially via `api/src/lib/claude.ts`.

---

## Call 1: Questionnaire Prefill

**Purpose:** Extract structured business info from scraped website content
**Current model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
**Planned model:** Claude Haiku 4.5 (structured extraction doesn't need Sonnet)
**Max tokens:** 2,000
**Latency:** ~5s (expected ~1s with Haiku)
**Cost:** ~2-3c (expected <0.5c with Haiku)

**Input:**
- Scraped website content from Firecrawl (up to 8,000 chars of markdown)
- Website URL

**Output:** JSON object with 9 fields:
- companyName, industry, jurisdiction
- assetTypes (array), estimatedValue, revenueModel
- targetInvestors, tokenStandard, regulatoryNotes

**Prompt approach:** Single user message asking for pure JSON output, no system prompt. Lists all field names with brief descriptions.

**Decision:** Switch to Haiku 4.5 for this call. It's a structured extraction task, quality difference is negligible, and speed/cost improvement is significant.

---

## Call 2: Report Generation

**Purpose:** Generate a comprehensive 6-section tokenisation proposal
**Model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
**Max tokens:** 6,000
**Latency:** ~20-25s
**Cost:** ~4-5c

**Input:**
- All 9 questionnaire fields (user-adjusted)
- Website URL
- System role: "senior tokenisation advisor at Deca4 Advisory"

**Output:** JSON array of 6 sections, each 300-500 words:
1. Asset Analysis
2. Token Economics
3. Regulatory Framework
4. Smart Contract Architecture
5. Go-to-Market Strategy
6. Financial Projections

**Prompt approach:** Single user message requesting JSON array output. Instructs plain text with dashes for bullets (no markdown) to avoid JSON escaping issues.

**Planned optimisation:** Stream the response to the browser so sections appear in real-time instead of waiting for the full response. Use `client.messages.stream()`.

---

## Optimisation Decisions

| Decision | Status | Impact |
|----------|--------|--------|
| Haiku 4.5 for questionnaire prefill | Planned | ~5x faster, ~10x cheaper |
| Streaming for report generation | Planned | Perceived instant (sections appear live) |
| Prompt caching (system prompt) | Considered | ~2x faster input processing on cache hits |
| Parallel section generation | Considered | Split 6 sections into 2-3 parallel calls |

---

## Cost Per Proposal

| Call | Current | After Haiku switch |
|------|---------|-------------------|
| Questionnaire prefill | ~2-3c | <0.5c |
| Report generation | ~4-5c | ~4-5c (unchanged) |
| **Total** | **~7c** | **~5c** |

---

## JSON Parsing

Claude sometimes wraps JSON in markdown code fences or produces malformed escaping. The `cleanJsonString()` helper in `claude.ts` handles this by:
1. Stripping markdown code fences
2. Extracting the first JSON object or array via regex
3. Logging raw response on parse failure for debugging
