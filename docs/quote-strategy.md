# Quote Flow Strategy

## Entry Point

"Request a Quote" button on the report page CTA section (`/report/[id]`). The quote flow lives at `/quote/[proposalId]` and uses data already collected from the report generation process.

## Architecture Decision: MVP

No DocuSign, SendGrid, or PDF generation for launch. Keep it simple:
- **Start Now (Discovery Workshop):** Log request in Firestore → email notification to Fernando → Fernando follows up manually with MOU
- **Book a Call ($500):** Stripe Payment Link (fixed $500 product) → on success redirect to Calendly
- **Join Pipeline:** Log in Firestore with success fee terms → email notification to Fernando

### Stripe Payment Link (ready):
- URL: `https://buy.stripe.com/cNicMX2Sj2sJaHzdEi48000`
- Used for "Book a Call" CTA

### Post-MVP (V2):
- DocuSign MOU automation
- Stripe checkout for Discovery Workshop (CHF 10k/25k)
- SendGrid follow-up sequences
- PDF quote generation
- Webhook from Stripe to update Firestore status

---

## Flow (3 steps)

### Step 1: Confirm Your Project
- Pre-fill from existing proposal data:
  - Company name, industry, jurisdiction, website URL
  - Contact name, email, phone, role
  - Asset class, estimated value
- User confirms or adjusts
- Additional fields needed: primary goal, asset value range (select), geography
- On submit: save to `quotes` collection in Firestore

### Step 2: Three Options

**Column A: Start Now (Discovery Workshop)**
- Badge: RECOMMENDED
- Before/After comparison:
  - Before: "Can my assets be tokenised?" → After: "Confirmed. Legal opinion included."
  - Before: "What will this cost?" → After: "Binding fees for every phase."
  - Before: "Is regulation ready?" → After: "Pathway mapped for your jurisdiction."
  - Before: "Can I show this to my board?" → After: "Go/No-Go framework delivered."
  - Before: "What if I change my mind?" → After: "Blueprint is yours. Walk away anytime."
- Price: CHF 10k early bird (7-day countdown) / CHF 25k standard
- What follows: "Work after the Discovery Workshop will be quoted based on your blueprint findings."
- DO NOT show CHF 30-50k/month retainer
- CTA: "Start Now →"

**Column B: Book a Call ($500)**
- "Not Sure Yet? Talk to Fernando first."
- 30 minutes, paid diagnostic
- $500 credited against Discovery if they proceed within 30 days
- CTA: "Book a Call — $500 →" → links directly to Stripe Payment Link
- On Stripe success: redirect to Calendly

**Column C: Join Pipeline**
- No upfront fee, success fee model
- 2% / 5% / propose your own
- Minimum CHF 50,000
- CTA: "Join Pipeline →"

### Step 3: Confirmation

**3A (Start Now):** "Your request has been received. Fernando will contact you within 24 hours with your MOU."
- Log in Firestore: status = `discovery_requested`
- Notify Fernando

**3B (Pipeline):** "You're in the pipeline." + success fee summary
- Log in Firestore: status = `pipeline_mou_pending`
- Notify Fernando

**3C (Call):** Handled entirely by Stripe → Calendly redirect. No custom confirmation page needed for MVP.

---

## Firestore: `quotes` Collection

```
quotes/{quoteId}
  proposalId        → links to the original proposal/report
  userId
  status            → discovery_requested | pipeline_mou_pending | call_booked | lost
  companyName
  companyUrl
  assetClass
  assetValueRange
  assetValueMid
  geography
  region
  primaryGoal
  recipientName
  recipientEmail
  recipientRole
  path              → priced | success | call
  discoveryPrice    → 10000 | 25000
  earlyBirdDeadline → timestamp
  successFeePct     → number | null
  successFeeAmount  → number | null
  selectedTier      → null (not shown in MVP)
  coBrand           → curioinvest | curioinvest_deca4
  createdAt
  updatedAt
```

---

## Countdown Timer

7-day early-bird window starts when user first visits Step 2. Stored in localStorage + server-side on the quote record. After 7 days, price changes from CHF 10k to CHF 25k.

---

## Notification to Fernando

For MVP: simple email via the API. Cloud Run sends a notification when:
- Discovery Workshop requested (include all company details + contact info)
- Pipeline MOU submitted (include success fee terms)
- Could use SendGrid, or just a simple fetch to a webhook/email API

---

## Reference

- Full spec: `04_CurioInvest_Quote_Flow_v1_FINAL.md` (project root)
- Original spec: `04_CurioInvest_Quote_Flow_Spec.md` (project root)
