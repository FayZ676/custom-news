# OpenFeed Frontend

The NextJS application that powers the OpenFeed user interface — authentication, feed browsing, interest management, and ranked article display.

🚀 **Deploying the frontend is as simple as connecting your GitHub repo to Vercel and pasting in two environment variables.** No configuration needed beyond that.

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

| Requirement                                 | What it's for                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [Vercel account](https://vercel.com/signup) | Hosts and deploys the frontend (free hobby plan is sufficient)                                   |
| Supabase project                            | The database and auth backend — set up via the [database README](../openfeed-database/README.md) |

### Option B (local development — everything above plus)

| Requirement                         | What it's for                      |
| ----------------------------------- | ---------------------------------- |
| [Node.js](https://nodejs.org/) v18+ | Runs the NextJS development server |

---

## Environment Variables

You'll need two environment variables — both come from your Supabase project settings.

| Variable                               | Where to find it                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Your Supabase project URL, found in [project settings](https://supabase.com/dashboard/project/_/settings/api)     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key, found in [project settings](https://supabase.com/dashboard/project/_/settings/api) |

**For local development** — copy `.env.local.example` to `.env.local` and fill in your values.

**For Vercel** — add these directly in the Vercel dashboard under Project Settings → Environment Variables.

---

## How it works

OpenFeed's frontend is a NextJS app that connects to your Supabase project for everything — authentication, data storage, and ranked article queries. Articles are fetched and ranked automatically by the database backend, so the frontend simply reads and displays what's already there.