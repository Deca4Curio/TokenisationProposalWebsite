# Questionnaire Method

Two reference questionnaires for the tokenisation proposal engine, compared against the current 9-field implementation.

---

## Reference A: West Walk Deep-Dive (Client-Specific)

### 1. Regulatory & Financial Compliance

- Are you or your partners currently familiar with digital financial infrastructure (e.g., blockchain-based finance, token issuance, custody)?
- Do you have internal capabilities or partnerships to support KYC/AML, investor onboarding, and ongoing compliance?
- Have you engaged with the Qatar Financial Centre (QFC) or any local regulator to explore digital securities or virtual assets frameworks?
- Are you open to using Swiss financial structures (SPVs, issuance wrappers) for international investor access?

### 2. Asset Structure & Legal Readiness

- Which asset types at West Walk are you considering for tokenization? (e.g., income-generating commercial units, hospitality venues, leaseback models, fractional usage rights)
- Are those assets individually owned, under a holding company, or under a REIT/fund structure?
- Are titles or revenue rights legally transferable, or would token holders require synthetic exposure through a contractual framework?
- Do you already work with legal or notarial firms experienced in asset securitization or digital wrappers?

### 3. Technology Stack & Operations

- Do you have an in-house or partner technology team familiar with APIs, smart contracts, wallets, and token standards (e.g., ERC-3643 for permissioned tokens)?
- Is there an existing digital twin or database (e.g., BIM, ERP, or CRM) of assets that could be linked to token metadata?
- Are you interested in integrating the token issuance with existing digital systems (e.g., booking engines, loyalty platforms)?

### 4. Investor Acquisition & GTM Strategy

- What kind of investor audience are you targeting (Qatari HNWIs, GCC institutional, international retail)?
- Are you planning to sell asset exposure directly via digital platforms, or through regulated broker-dealers and private placements?
- Would you want to explore NFT-based utility tokens (e.g., VIP benefits, access passes, loyalty rewards) in parallel with security tokens?
- How do you currently handle customer acquisition, retention, and digital engagement?

### 5. Execution Strategy & Budget Alignment

- Would you prefer a modular approach (starting with a proof of concept for one asset class) or are you seeking an end-to-end proposal, including structuring, issuance, KYC, compliance, marketplace integration, and investor relations?
- What timeline and budget window are you envisioning for implementation?

---

## Reference B: Universal Intake (Generic)

### The Asset

1. What is the asset you want to tokenize? (e.g. a fund, a property, a commodity, a private company); if more than one, rank by priority.
2. What is the total value or target raise amount?
3. Do you have an existing legal structure around the asset? (e.g. SPV, fund, holding company or not yet)
4. Are there existing investors or shareholders we need to account for?

### The Offering

5. What are you selling to investors? Equity, debt, revenue share, or something else?
6. Do you have a target token price or minimum investment in mind?
7. Is there a target timeline for launch?

### Investors & Distribution

8. Who is your target investor? (institutional, accredited individuals, retail, and geography)
9. Do you have an existing investor network, or do you need help with distribution?
10. Have any investors already expressed interest?

### Regulatory & Jurisdiction

11. Where is the asset or issuing entity based?
12. Have you had any prior legal or regulatory advice on this tokenization? If yes, what was the outcome?
13. Are you targeting investors in the EU, US, Switzerland, or multiple jurisdictions?

### Your Team

14. Who is the decision-maker on this project?
15. Do you have legal counsel already engaged, or would you prefer our legal partners to lead that?

---

## Current Implementation (9 fields, all free-text)

| # | Field | Type |
|---|-------|------|
| 1 | Company Name | text |
| 2 | Industry | text |
| 3 | Asset Types | text (comma-separated) |
| 4 | Estimated Value | text |
| 5 | Revenue Model | text |
| 6 | Jurisdiction | text |
| 7 | Target Investors | text |
| 8 | Token Standard | text |
| 9 | Regulatory Notes | textarea |

---

## Gap Analysis

### Missing from current implementation

**From Reference B (essential for any proposal):**
- Existing legal structure (SPV, fund, holding company)
- Existing investors/shareholders
- Offering type (equity, debt, revenue share)
- Target token price / minimum investment
- Timeline for launch
- Existing investor network vs need distribution help
- Prior regulatory advice
- Target jurisdictions (multi-select)
- Decision-maker / team context
- Legal counsel status

**From Reference A (deeper, client-specific):**
- KYC/AML capability
- Regulator engagement status
- Openness to Swiss structures
- Legal transferability of titles/rights
- Technology readiness (APIs, smart contracts, wallets)
- Digital twin / existing data systems
- GTM channel preference (direct digital vs broker-dealers)
- Utility token interest (NFTs, loyalty, access passes)
- Modular vs end-to-end preference
- Budget window

### Current fields that should change

- **Token Standard**: too technical for most users, should be AI-recommended not user-selected
- **Regulatory Notes**: vague, should be split into specific questions
- **Revenue Model**: important but better as a select/multi-select
- **Asset Types**: should be multi-select with common options + "other"
