# OpenFeed Frontend

The NextJS application that powers the OpenFeed user interface — authentication, feed browsing, interest management, and article display.

🚀 **Deploying the frontend is as simple as connecting your GitHub repo to Vercel and pasting in a few environment variables.** No configuration needed beyond that.

---

## Getting Started

### Option A: Deploy to production

**What you'll need:**
- A [Vercel account](https://vercel.com/signup) (free hobby plan works great)
- Your Supabase project already set up — see the [database README](../openfeed-database/README.md) if you haven't done that yet

**Steps:**

1. Push this repository to GitHub if you haven't already
2. Go to [vercel.com](https://vercel.com) and create a new project, connecting it to your GitHub repo
3. During setup, add your environment variables — see [Environment Variables](#environment-variables)
4. Click Deploy

✅ That's it! Vercel will build and deploy your frontend automatically. Any future pushes to your main branch will trigger a new deployment.

### Option B: Run locally first

For contributors or users who want to test changes before deploying.

**What you'll need:**
- [Node.js](https://nodejs.org/) (v18 or later)
- Your Supabase project already set up — see the [database README](../openfeed-database/README.md)

**Steps:**

1. Copy `.env.local.example` to `.env.local` and fill in your values — see [Environment Variables](#environment-variables)
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

✅ Open [http://localhost:3000](http://localhost:3000) in your browser to see the app. When you're ready to go live, follow Option A above.

---

## Requirements

### Option A (production only)

| Requirement                                 | What it's for                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Vercel account](https://vercel.com/signup) | Hosts and deploys the frontend (free hobby plan is sufficient)                                    |
| Supabase project                            | The database and auth provider — set up via the [database README](../openfeed-database/README.md) |

### Option B (local development — everything above plus)

| Requirement                         | What it's for                      |
| ----------------------------------- | ---------------------------------- |
| [Node.js](https://nodejs.org/) v18+ | Runs the NextJS development server |

---

## Environment Variables

| Variable                               | Where to find it                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Your Supabase project URL, found in [project settings](https://supabase.com/dashboard/project/_/settings/api)     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key, found in [project settings](https://supabase.com/dashboard/project/_/settings/api) |
| `SUPABASE_SERVICE_ROLE_KEY`            | Your Supabase service role key, found in [project settings](https://supabase.com/dashboard/project/_/settings/api) |
| `ANTHROPIC_API_KEY`                    | Your [Anthropic](https://console.anthropic.com) API key — Claude Haiku judges which articles match each interest  |
| `VOYAGE_API_KEY`                       | Your [Voyage AI](https://dashboard.voyageai.com) API key — embeds articles and interests                          |
| `CRON_SECRET`                          | Any random secret string — guards `/api/cron/fetch` and `/api/cron/match`; also stored in Supabase Vault as `cron_secret` |

**For local development** — copy `.env.local.example` to `.env.local` and fill in your values.

**For Vercel** — add these directly in the Vercel dashboard under Project Settings → Environment Variables.

---

## How it works

OpenFeed's frontend is a NextJS app that connects to your Supabase project for authentication and data storage. The feed page only reads stored articles; the work happens in a pipeline (`lib/pipeline/`) that Supabase `pg_cron` triggers every 15 minutes:

1. **Fetch** (`/api/cron/fetch`) — pulls every curated RSS feed, stores articles from the last few days, and embeds new ones with Voyage.
2. **Match** (`/api/cron/match`) — for each interest, retrieves the nearest unjudged articles by embedding similarity, then has Claude Haiku decide which the reader would want, with a one-line reason. Every decision is stored in `user_article_matches`; relevant articles go into the user's feed. The reason is shown on the article page.

Saving or editing an interest matches it immediately, so the feed fills in without waiting for the schedule. The editor's **Preview** shows what a description would match right now, including what it filters out and why.

**Tuning relevance:** the knobs (window, similarity floor, candidate count, models) are in `lib/pipeline/config.ts`, and the judge's prompt is in `lib/pipeline/judge.ts`.