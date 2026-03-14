# Tokenise Anything

AI-powered tokenisation proposal engine by Deca4 Advisory x curioInvest. Paste a company website URL, get a full tokenisation strategy in 90 seconds.

## Architecture

```
Browser → Vercel (Next.js frontend + BFF proxy)
                ↓ X-API-Secret
          Cloud Run (Express API)
            ↕         ↕         ↕
        Firestore  Firecrawl  Claude API
```

- **Frontend (Vercel):** Next.js 16, App Router, Tailwind CSS 4. API routes act as a proxy to Cloud Run.
- **API (Cloud Run):** Express server handling auth, web scraping (Firecrawl), AI analysis (Claude), and Firestore CRUD.
- **Database:** Firestore (`deca4curio-tokenisation-engine`) in `europe-west6` (Zurich).

## Project Structure

```
├── src/                    # Next.js frontend (Vercel)
│   ├── app/                # Pages + API proxy routes
│   ├── components/         # Shared UI components
│   ├── lib/                # api-client.ts, session.ts
│   └── types/              # TypeScript interfaces
├── api/                    # Express API (Cloud Run)
│   ├── src/
│   │   ├── server.ts       # Entry point
│   │   ├── middleware.ts   # API secret validation
│   │   ├── routes/         # auth.ts, proposals.ts
│   │   └── lib/            # firebase.ts, firecrawl.ts, claude.ts
│   └── Dockerfile
└── docs/                   # Architecture diagrams
```

## User Flow

1. **Landing** (`/`) - Paste a company URL
2. **Auth** - Email signup via modal
3. **Analysis** - Firecrawl scrapes the site, Claude pre-fills a questionnaire
4. **Questionnaire** (`/questionnaire/[id]`) - Review and adjust AI-prefilled data
5. **Report** (`/report/[id]`) - 6-section tokenisation proposal
6. **Dashboard** (`/dashboard`) - View all proposals

## Local Development

### Frontend (Vercel)

```bash
cp .env.local.example .env.local
# Set CLOUD_RUN_API_URL and API_SECRET
npm install
npm run dev
```

### API (Cloud Run)

```bash
cd api
cp .env.example .env
# Set GCLOUD_PROJECT, API_SECRET, FIRECRAWL_API_KEY, ANTHROPIC_API_KEY
npm install
npm run dev
```

## Environment Variables

### Vercel

| Variable | Description |
|----------|-------------|
| `CLOUD_RUN_API_URL` | Cloud Run service URL |
| `API_SECRET` | Shared secret for Vercel to Cloud Run auth |

### Cloud Run

| Variable | Description |
|----------|-------------|
| `GCLOUD_PROJECT` | GCP project ID (`deca4-curio`) |
| `API_SECRET` | Shared secret (must match Vercel) |
| `FIRECRAWL_API_KEY` | Firecrawl web scraping API key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `SESSION_SECRET` | Session token signing secret |

## Deployment

- **Frontend:** Auto-deploys via Vercel on push to `main`
- **API:** Auto-deploys via Cloud Run on push to `main` (Dockerfile at `/api/Dockerfile`)
- **Domain:** `tokenise.deca4.com`
