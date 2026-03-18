# TODO

## Cap Articles Per Feed

Prevent feeds from dumping their entire archive into the database by capping the number of articles parsed per feed.

### Changes Required

1. **`parse_feed.ts`** — Add a `MAX_ARTICLES_PER_FEED` constant (e.g. 50) and slice `feed.items` before parsing
2. **Clean up TODOs** — Remove the existing TODO comments in `parseFeed` and `getArticles` about date filtering

### Notes

- RSS feeds themselves typically serve 20–40 items; the cap is a safety net against archival/malformed feeds
- Hourly polling ensures no articles are missed from prolific feeds since the RSS window rotates faster than the cap
- Could be made configurable per feed in the future (pairs well with per-feed fetch frequency)

---

## Per-Feed Fetch Frequency

Allow customizing how often individual feeds are polled, instead of a blanket hourly cron for all feeds.

### Changes Required

1. **Schema** — Add `fetch_interval` (default `'1 hour'`) and `last_fetched_at` columns to `global_feeds`
2. **SQL function** — Create `feeds_due_for_fetch()` RPC that returns feeds where `now() - last_fetched_at >= fetch_interval`
3. **`fetch_articles`** — Swap `loadFeeds` to call the RPC, and add `markFeedsAsFetched` after parsing
4. **Cron** — Bump schedule from `'0 * * * *'` to `'*/15 * * * *'` (or whatever the smallest desired interval is)

### Notes

- Fully additive — no breaking changes, existing feeds default to 1-hour
- Useful for high-velocity feeds (e.g. Hacker News) that rotate items faster than once per hour

---

## Email Alerts for High-Relevance Articles

Notify users via email when newly fetched articles strongly match their interest queries.

### Changes Required

1. **Schema** — Add `user_notification_preferences` table with columns for `user_id`, `alert_frequency` (enum: `immediate`, `daily`, `weekly`, `off`), `score_threshold` (e.g. 0.85), and `email`
2. **Alert detection** — After `rescoreInterests` in `fetch_articles`, identify new article scores that exceed a user's `score_threshold`
3. **Immediate alerts** — For users with `immediate` frequency, send an email (via Supabase Edge Function + a provider like Resend/SendGrid) right after scoring
4. **Batched alerts (daily/weekly)** — Store pending alerts in a `pending_notifications` table, add a separate cron job that batches and sends digests at the configured frequency
5. **Unsubscribe** — Include an unsubscribe/manage-preferences link in every email

### Notes

- Score threshold should have a sensible default (e.g. 0.85) so users get alerts out of the box without tuning
- Daily digest is probably the best default — immediate could be noisy, weekly too slow
- Consider rate-limiting immediate alerts to avoid spamming users during large fetch cycles

---

Remove embeddings model name from db

---