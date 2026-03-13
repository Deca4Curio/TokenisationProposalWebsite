# Tokenisation Engine - Remaining Tasks

## GCP / Infrastructure

- [ ] Link billing account to `deca4-curio` project (quota increase needed, do via GCP Console)
- [ ] Enable APIs: Cloud Run, Artifact Registry, Secret Manager
- [ ] Store secrets in Secret Manager: `FIRECRAWL_API_KEY`, `ANTHROPIC_API_KEY`, `SESSION_SECRET`
- [ ] Create `.env.local` from `.env.local.example` with real keys for local dev
- [ ] Create Artifact Registry repo in `deca4-curio` (region: `europe-west1`)

## Local Testing

- [ ] Add real API keys to `.env.local` and run `npm run dev`
- [ ] Test full flow: submit URL → auth modal → scraping → questionnaire → report
- [ ] Test dashboard shows proposals with correct statuses
- [ ] Test error handling (bad URL, API failures)

## Deployment

- [ ] Build Docker image locally: `docker build -t tokenise .`
- [ ] Test Docker image: `docker run -p 8080:8080 --env-file .env.local tokenise`
- [ ] Push to Artifact Registry
- [ ] Deploy to Cloud Run (`europe-west1`, env vars from Secret Manager)
- [ ] Map custom domain `tokenise.deca4.com`

## Polish / Post-MVP

- [ ] Add Calendly embed or real link (currently placeholder `calendly.com/deca4`)
- [ ] Add server-side proposal listing endpoint (dashboard currently uses localStorage IDs)
- [ ] Add email verification / magic link auth (currently direct signup)
- [ ] Add Cloud Tasks for async scraping/generation (currently inline, fits 60s timeout)
- [ ] Add rate limiting on API routes
- [ ] Add error tracking (Sentry or similar)
- [ ] SEO: add OG images for report pages

## Done

- [x] GCP project `deca4-curio` created
- [x] Firestore database created (`europe-west1`, native mode)
- [x] Dependencies installed (`firebase-admin`, `@anthropic-ai/sdk`, `uuid`)
- [x] `next.config.ts` updated with `output: "standalone"`
- [x] Types defined (`src/types/index.ts`)
- [x] Lib layer: `firebase.ts`, `auth.ts`, `firecrawl.ts`, `claude.ts`
- [x] API routes: auth/signup, auth/me, proposals CRUD, questionnaire, report
- [x] Components: AuthModal, AnalysisProgress, QuestionnaireForm, ReportView, ProposalCard, StatusBadge
- [x] Pages: `/questionnaire/[id]`, `/report/[id]`, `/dashboard`
- [x] Landing page refactored to wire real API (auth modal, proposal creation, redirect)
- [x] Dockerfile + .dockerignore
- [x] `.env.local.example` template
- [x] Build passes cleanly (`npm run build`)
