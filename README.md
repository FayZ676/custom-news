# OpenFeed

### Describe your interests. Get relevant news. That's it.

OpenFeed gathers articles from across the web and ranks them by what matters to you — automatically. No algorithms you didn't choose. No ads. No noise. Just write down what you care about, and OpenFeed does the rest.

---

<!-- Screenshots / demo placeholder -->
<!-- Add screenshots, a GIF, or a link to a live demo here -->

---

## Why OpenFeed?

Most apps and websites show you everything in reverse chronological order — newest first, regardless of whether it's relevant to you. Finding what actually matters means scrolling through a lot of noise.

OpenFeed is different. You describe your **interests** in plain language — *"AI research"*, *"climate policy"*, *"indie game development"* — and OpenFeed reads a curated set of quality tech publications on your behalf, keeping only the articles that genuinely match what you described. Your interests are the only thing that decides what shows up.

---

## How it works

1. **Describe your interests** — write them however you like, in your own words.
2. **OpenFeed reads the news** — every 15 minutes it pulls ~40 curated tech RSS feeds, finds the articles closest to each interest, and has an AI judge decide which ones you'd actually want — recording a one-line reason for every decision.
3. **Read what matters** — articles are categorized automatically so you can filter and search within your feed.

---

## Try it

**Hosted version** — the easiest way to get started. No setup required.
👉 [Coming soon / link to hosted version]

**Self-host** — deploy your own instance in minutes, for free. You'll need a [Supabase](https://supabase.com) account, a [Vercel](https://vercel.com) account, plus [Anthropic](https://console.anthropic.com) and [Voyage AI](https://www.voyageai.com) API keys. Running costs are a few cents a day.

---

## Cheap to host. Free to use.

OpenFeed is designed to run on free tiers, plus a few cents of AI usage:

- **Frontend** — deployed to Vercel (free hobby plan)
- **Database** — hosted on Supabase (free plan)
- **News** — read from public RSS feeds, matched with Voyage AI embeddings and judged by Claude Haiku (pennies per day)

Whether you self-host or use the managed service, OpenFeed puts you in control of your news feed.

---

## Self-Hosting

Getting your own instance of OpenFeed up and running takes just a few minutes. The project is split into two parts — a database backend and a frontend — each with their own setup guide:

1. **[Database](./openfeed-database/README.md)** — set up your Supabase project, deploy migrations, seed data, and edge functions with a single command
2. **[Frontend](./openfeed-frontend/README.md)** — connect your GitHub repo to Vercel, paste in two environment variables, and deploy

---

## Open Source

OpenFeed is fully open source. You can inspect the code, contribute, suggest new news sources, or deploy your own instance. Pull requests are welcome.

---

## Contributing

Interested in contributing? Pull requests are welcome — see the [database README](./openfeed-database/README.md) and [frontend README](./openfeed-frontend/README.md) to get a development environment running.