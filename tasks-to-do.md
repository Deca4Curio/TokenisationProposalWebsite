# Tokenisation Engine - Remaining Tasks

## Cloud Run (API)

- [ ] Set up Cloud Run via Console: connect to repo, Dockerfile at `/api/Dockerfile`, branch `main`
- [ ] Add env vars / secrets in Cloud Run:
  - `GCLOUD_PROJECT` = `deca4-curio`
  - `API_SECRET` → from Secret Manager
  - `FIRECRAWL_API_KEY` → from Secret Manager
  - `ANTHROPIC_API_KEY` → from Secret Manager
- [ ] Note the generated Cloud Run URL after deploy

## Vercel (Frontend)

- [ ] Connect repo to Vercel (root directory: `/`, framework: Next.js)
- [ ] Add env vars in Vercel:
  - `CLOUD_RUN_API_URL` = Cloud Run URL from above
  - `API_SECRET` = `cec410d2afc2fbcceafb67b59da0e5ee1ce658d7da60c692a11a64166b28accd`
- [ ] Map custom domain `tokenise.deca4.com` in Vercel

## Testing

- [ ] Test full flow: submit URL → auth modal → scraping → questionnaire → report
- [ ] Test dashboard shows proposals
- [ ] Test error handling (bad URL, API failures)

## Polish / Post-MVP

- [ ] Add Calendly embed or real link (currently placeholder)
- [ ] Add email verification / magic link auth
- [ ] Add Cloud Tasks for async scraping/generation
- [ ] Add rate limiting on API routes
- [ ] Add error tracking (Sentry or similar)

## Done

- [x] GCP project `deca4-curio` created under `online-org`
- [x] Billing linked
- [x] Firestore database created (`europe-west1`, native mode)
- [x] APIs enabled: Firestore, Cloud Run, Artifact Registry, Secret Manager
- [x] Secrets stored: `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `SESSION_SECRET`, `API_SECRET`
- [x] Cloud Run service account granted secret access
- [x] Architecture split: Vercel (frontend + BFF proxy) / Cloud Run (API)
- [x] API service: Express server with auth middleware, auth routes, proposal routes
- [x] Vercel API routes refactored to thin proxies with `X-API-Secret` header
- [x] Dashboard uses server-side proposal listing (no more localStorage)
- [x] Both builds pass cleanly (Next.js + API TypeScript)
