# OpenFeed

### Describe your interests. Get relevant news. That's it.

OpenFeed gathers articles from across the web and ranks them by what matters to you — automatically. No algorithms you didn't choose. No ads. No noise. Just write down what you care about, and OpenFeed does the rest.

---

<!-- Screenshots / demo placeholder -->
<!-- Add screenshots, a GIF, or a link to a live demo here -->

---

## Why OpenFeed?

Most apps and websites show you everything in reverse chronological order — newest first, regardless of whether it's relevant to you. Finding what actually matters means scrolling through a lot of noise.

OpenFeed is different. You start by subscribing to **categories** — curated collections of news sources organized by topic, like Technology, Science, or Finance. Then you describe your **interests** in plain language — *"AI research"*, *"climate policy"*, *"indie game development"* — and OpenFeed automatically ranks every article from your subscribed categories by how relevant it is to what you care about. The most relevant news rises to the top, without you lifting a finger.

Categories control what comes in. Interests control what rises to the top.

---

## How it works

1. **Subscribe to categories** — choose from a curated catalog of topics. Every news source within a category is automatically included.
2. **Describe your interests** — write them however you like, in your own words. These are used to rank articles from your subscribed categories by relevance.
3. **Read what matters** — your feed is automatically ranked by relevance to your interests, updated every hour.

---

## Try it

**Hosted version** — the easiest way to get started. No setup required.
👉 [Coming soon / link to hosted version]

**Self-host** — deploy your own instance in minutes, for free. You'll need a [Supabase](https://supabase.com) account and a [Vercel](https://vercel.com) account — both have free plans that are more than enough to run OpenFeed.

---

## Free to host. Free to use.

OpenFeed is designed to run entirely on free tiers:

- **Frontend** — deployed to Vercel (free hobby plan)
- **Database** — hosted on Supabase (free plan)
- **Embeddings** — powered by OpenAI at a few dollars per month at most

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

Interested in contributing? A great place to start is expanding the catalog — the more sources OpenFeed supports, the more useful it becomes for everyone. See the [database README](./openfeed-database/README.md) for details on how sources are managed.