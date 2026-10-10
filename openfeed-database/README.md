# OpenFeed Database

This folder contains everything needed to set up OpenFeed's database. It handles storing articles, user preferences, and the logic that keeps your feed fresh and personalized.

🚀 **You can get the entire database backend up and running with a single command.** Just fill in your credentials and run `make -f Makefile.prod deploy seed` — it handles everything else automatically.

---

## Getting Started

### Option A: Deploy to production

**What you'll need:**
- Supabase CLI
- libpq
- A Supabase account with a project created

See [Requirements](#requirements) for help installing each one.

**Steps:**

1. Copy `.env.prod.example` to `.env.prod` in the parent directory and fill in your details — see [Environment Variables](#environment-variables) if you're not sure what goes where.
2. From the `supabase/` directory, run:

```bash
make -f Makefile.prod deploy seed
```

3. Tell the scheduled jobs where your frontend lives. In the Supabase SQL editor, run once:

```sql
select vault.create_secret('https://<your-app>.vercel.app', 'app_url');
select vault.create_secret('<the CRON_SECRET from your frontend env>', 'cron_secret');
```

✅ That's it! `pg_cron` now calls the frontend every 15 minutes to fetch and match articles — see [How it works](#how-it-works).

> ⚠️ **Need to rebuild the schema?** Run `make -f Makefile.prod init`. It snapshots accounts and data, wipes the database, applies the migrations, restores the snapshot, and re-seeds. `make -f Makefile.prod reset` on its own wipes everything, accounts included.

### Option B: Run locally first

If you'd like to test everything on your own computer before deploying, you'll need a few additional tools — see [Requirements](#requirements).

1. From the `supabase/` directory, run:

```bash
make -f Makefile.local init
```

Local setup needs no environment variables — it runs entirely against your local Supabase instance.

Once it's done, you can open [Supabase Studio](http://localhost:54323) in your browser to see your local database. When you're ready to go live, follow Option A above.

---

## Requirements

### Option A (production only)

| Requirement                                                          | What it's for                                              |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) | Connects to your Supabase project and manages the database |
| [libpq](https://www.postgresql.org/docs/current/libpq.html)          | Lets the deploy script talk directly to your database      |
| [Supabase account](https://supabase.com/)                            | Hosts your database, authentication, and backend logic     |

### Option B (local development — everything above plus)

| Requirement                                                         | What it's for                                      |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| [Docker](https://docs.docker.com/get-docker/)                       | Runs a local copy of the database on your computer |
| [Deno](https://docs.deno.com/runtime/getting_started/installation/) | Runs the edge functions and test scripts locally   |

---

## Environment Variables

Environment variables are settings that tell OpenFeed how to connect to your accounts. Production deploys read them from a `.env.prod` file which you create from the provided example. Local development needs no environment variables.

Copy `.env.prod.example` to `.env.prod` in the parent directory, then fill in your values.

### What goes in `.env.prod` (production)

```
PROJECT_ID=         # your Supabase project ID
PROJECT_URL=        # your Supabase project URL (e.g. https://<ref>.supabase.co)
PUBLISHABLE_KEY=    # your Supabase publishable key
ANON_KEY=           # your Supabase anon key
DATABASE_URL=       # your Supabase Session pooler connection string (dashboard → Connect → Session pooler); the direct host is IPv6-only
```

You can find your Supabase project URL, keys, and database URL in your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

---

## Available Commands

All commands are run from the `supabase/` directory.

### Local commands

| Command                       | What it does                             |
| ----------------------------- | ---------------------------------------- |
| `make -f Makefile.local init` | Sets up your local database from scratch |

### Production commands

| Command                        | What it does                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `make -f Makefile.prod deploy` | Applies any new migrations without touching existing data                           |
| `make -f Makefile.prod seed`   | Loads the seed data (feeds, settings, accounts)                                     |
| `make -f Makefile.prod init`   | Rebuilds the schema from scratch, keeping accounts and data via a snapshot           |
| `make -f Makefile.prod reset`  | Wipes the production database, accounts included — **use carefully**               |

---

## How it works

Two `pg_cron` jobs (defined in `migrations/99990000000000_schedule_pipeline.sql`) keep every feed fresh by calling the frontend's cron routes with `pg_net`, using the `app_url` and `cron_secret` Vault secrets:

| Job              | Schedule              | What it does                                                                                         |
| ---------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `fetch_articles` | every 15 minutes      | Pulls every feed in `global_feeds` into `global_articles` and embeds new articles                    |
| `match_articles` | 5 minutes after fetch | For each interest, judges the nearest unjudged articles; records every decision in `user_article_matches` and adds the relevant ones to `user_articles` |

The curated feed list lives in `seeds/shared/02_global_feeds.sql`.