# Orbit — Conversation Handoff Context

> A continuation of the Orbit project. This document captures the infrastructure migration, AI enrichment implementation, UX sprint, and product-direction decisions made in this session. Pair it with the original project context doc.

---

## Where Things Stand (Infrastructure)

**Migrated off Railway.** The 1-month Railway free trial ended; ~£1.35 of free credits were consumed and the developer was wary of usage-based billing growing as AI workers get added. After evaluating options (Hetzner VPS, DigitalOcean + Tailscale, Google Cloud), the decision was driven by wanting **minimal ops burden** — no managing TLS, reverse proxy, firewall rules, or manual backups.

**Final stack:**
- **Database:** Neon (free tier — 100 CU-hrs/month *per project, resets monthly*; 0.5 GB storage hard cap; pgvector supported out of the box). Currently at ~0.56 CU-hrs and 0.03 GB after several days — massively within limits.
- **Backend API:** Render (free tier — 750 instance-hrs/month, spins down after 15 min inactivity, 30-60s cold start). Using a **Dockerfile** since Render has no native Bun support.
- **Frontend:** Vercel (unchanged).

**Migration was completed successfully:** `pg_dump` from Railway (had to pay $5 for one month of Railway Hobby tier to restart the stopped trial DB and extract data) → imported into Neon → API deployed to Render. Data is safe.

**Drizzle Studio:** No longer deployed as a service. Run locally via `bunx drizzle-kit studio` against the Neon connection string when needed. Neon's dashboard SQL editor covers casual browsing.

**Key decisions settled this session:**
- Render free tier is fine for now; move to $7/month Starter only when BullMQ background workers need to stay alive.
- **Rejected** the idea of pinging Render every 10 min via iOS Shortcuts to prevent cold starts — it would burn the entire 750-hr monthly allowance keeping the service awake 24/7, and iOS throttles Shortcuts automations so it'd fail silently anyway.
- **The Raspberry Pi (already running Hoarder 24/7, barely loaded) is the intended scheduler** for future cron jobs — it poke-triggers the Render API on schedule rather than keeping Render perpetually warm.

---

## AI Enrichment for Saves — BUILT & SHIPPED ✅

This was the main build of the session. The highest-leverage roadmap item, now done.

**What it does:** When a save is created, after the existing scrape completes, an async fire-and-forget pipeline calls **Claude Haiku** (`claude-haiku-4-5-20251001`) to generate enrichment.

**Provider decision:** Chose Claude Haiku over alternatives. Sarvam AI was investigated but rejected — it's built for Indic-language tasks (translation, TTS, ASR, OCR), not general structured-JSON extraction. GPT-4o-mini was a viable alternative but Haiku won for ecosystem consistency (already in the quest-parsing spec, developer has Claude Pro, Anthropic doesn't train on API data). Budget was £7-25/month for AI; actual projected cost is **under £1-2/month** at ~30 saves/day. The developer explicitly does NOT want free models (data-training concerns).

**Schema additions to `savesTable`:** `aiSummary` (text), `aiTags` (text array), `category` (text), `contentType` (text), `locationName`, `locationLat`, `locationLng` (text), `aiEnrichedAt` (timestamp).

**Tagging approach — semi-freeform:** The prompt receives save title, description, existing tags (deduplicated from all the user's saves), and existing list names. It reuses existing tags where applicable and creates new ones only when nothing fits — so the vocabulary grows organically and converges over time. List names are passed as interest context only, NOT used as tags.

**Tags stay as a `text[]` array on the saves table** — no separate tags table. Confirmed this is fine for single-user scale; deferred a dedicated table (with `usageCount`) until the vocabulary gets large enough to need pruning or top-N selection for the prompt. To get existing tags: dedupe via JS `Set` across all saves' arrays (kept separate from scraper-generated `tags`).

**Response shape:** `summary`, `tags[]`, `category` (fixed enum: cooking/tech/travel/fitness/entertainment/finance/learning/personal/other), `contentType` (tutorial/review/opinion/inspiration/news/reference/entertainment/other), `location` ({name, context} or null), `timeSensitive` (bool). Validated with **Zod**, returns `null` on failure so bad data never gets written.

**Bug fixed during this work:** The original `createSave` handler referenced `scraped.sourcePlatform` after the catch block even when `scrapeUrl` threw and left `scraped` undefined — would crash. Refactored into a separate `enrichSave()` function: insert → respond to client immediately → scrape → update → fetch existing tags+lists → AI enrich → update. Entire pipeline is non-blocking; failures are logged and the save still exists.

**Cost-control plan:** Developer will monitor usage and, if it spikes, comment out the summary portion (most tokens) and keep just tags + location. Also possible: cap existing-tags passed to the prompt at top 30-40 by frequency.

---

## UX Sprint — BUILT & SHIPPED ✅ (reviewed, judged on-scope)

The developer shipped a large batch of UX work and asked for honest feedback against the growth goal. Verdict: **none of it was rogue** — all deepened the core capture→retrieve loop rather than expanding scope.

- **Privacy mode** — Zustand app-level store, blurs Mantine text values across all pages (timeline, notes, quests, lists, saves). For shoulder-surfing protection in public; it's CSS-level, not security (acknowledged).
- **New home landing page** — replaced Quests as the landing surface. Shows 5 most recent saves (privacy-aware), today's completed/due quest counts, overdue (any older incomplete) surfacing, nav buttons. The overdue surfacing was praised as genuinely ADHD-aware (fights time blindness without nagging).
- **Unified component rendering** across List-details / Saves / Quests pages — flagged as the most valuable item: it's architecture, not a feature; future work (globe, semantic search cards) slots into it automatically.
- **Saves view revamp** — AI summary display, edit-save modal (reused in lists view).
- **List + List-details pages** — grid/list views, thumbnail + title of most recent save, more visual personality.
- **Search + filter** on saves (and lists by extension) — keyword search. Noted this does NOT reduce the urgency of semantic search; they solve different problems.
- **Unified create-new drawer** — single input, regex detects URL vs text, suggests save vs quest/remembral/note pills, conditional form fields per type, auto-preselects list when on a list-details page.
- **"Import from clipboard" button** in the drawer — flagged as the highest-leverage daily-use improvement (removes ~3 taps per capture at 30 saves/day).
- AI quest parsing quality was tuned slightly.

One caution given: that's a lot of surface area in one batch for a solo ADHD builder — watch for "mostly working" features becoming silent debt.

---

## Product Direction — IMPORTANT SHIFT

The developer articulated a clearer vision: **Orbit as an active intelligence layer, not a passive data dump.** This reframed the roadmap.

The vision includes:
1. **Insight/digest jobs** — e.g. "last week: 22 saves, 3 new tags, here's a summary." Periodic, Orbit-reaches-out-to-you.
2. **Staleness nudges** — "you haven't opened your Recipes list in 3 weeks."
3. **A floating AI chat view** — conversational retrieval: "did I save anything about Stripe tutorials?", "is there something I need to do this week I've forgotten?"

**Critical realization:** All three sit on top of **semantic search / embeddings (pgvector)**. The chat view literally cannot work without it; insights are far richer with it. So embeddings are the substrate under the entire vision.

**Capacitor iOS app de-prioritized.** Since these intelligence features are backend-jobs + notification-channel + LLM (not native-app dependent), and web notifications work on laptop too (where the developer spends a lot of time), Capacitor dropped down the priority list.

### Notification decision: Web Push, NOT Google Calendar sync

Originally leaning toward Google Calendar sync (would offload notifications entirely — calendar app handles reminders for free; Google Calendar chosen over Apple because it has a clean REST API while Apple has no real cloud API, only CalDAV/EventKit on-device). 

**But the vision changed the calculus:** Calendar sync only solves the narrow "quest due at 3:30" case — it can't deliver insight digests or staleness nudges (those aren't calendar events). Web push covers both quests AND insights, on laptop AND phone. So:
- **Build web push** (FCM or Web Push API + existing service worker — Orbit is already a PWA).
- iOS web-push caveat acknowledged: works for home-screen PWAs but is the most fragile platform; desktop Chrome/Edge is rock solid. The developer wants laptop notifications anyway, so the reliable case comes free.
- The earlier objection to web push (would be thrown away when Capacitor native push arrives) no longer holds because Capacitor is de-prioritized.

---

## AGREED PRIORITY ORDER (current)

1. **Semantic search + embeddings (pgvector on Neon)** — THE substrate. Next major build. Everything futuristic depends on it. Use `text-embedding-3-small` (1536d) on AI summaries + tags.
2. **Insight job engine** — weekly cron computing "your week in review." Start in-app display only, no notifications yet. Triggered by the Raspberry Pi on schedule.
3. **Web push** — delivery layer, once there are insights worth pushing.
4. **Chat view** — last; most complex, leans hardest on embeddings being solid.

**Named anti-pattern / risk:** The chat view and notifications are the *exciting* parts; embeddings are the *plumbing*. ADHD-builder temptation will be to build the visible chat UI first — but a chat view with no embeddings is an empty shell. **Build the substrate first.**

### Side features being pushed alongside major builds (developer's stated approach)
- **Saved views** — quick nav items (e.g. "yt-saves") that open a page with pre-filled url/search params; user can pin a limited number to the nav bar. Low effort, high daily value, approved.
- **Last week's summary box** on the dashboard — non-AI, basic data aggregation, as a base to upgrade later. Plus a cron that emails it. Approved as good incremental groundwork.

---

## How to Work With This Developer (reminders that held true this session)

- **Be direct; challenge before confirming.** He explicitly wants pushback so he doesn't "act rogue." Pushed back successfully on: Google Cloud (wrong complexity), the iOS-Shortcuts keep-warm hack (backwards economics), building quest-parsing as a standalone (correctly identified by HIM as low-value without notifications), and AI list-suggestions before enrichment existed.
- **He course-corrects well and reasons about tradeoffs** — treat him as a collaborator, not someone to direct. Several of the best calls this session were his (web-push-over-calendar reasoning, semi-freeform tags, Pi-as-scheduler was a shared conclusion).
- **Protect scope, but he's been staying in-scope** — the UX sprint was all core-loop deepening.
- **Watch the ADHD pattern:** large multi-feature batches risk silent debt; exciting-vs-plumbing temptation is real. Keep him on the substrate (embeddings) before the magic (chat).
- **Cost-conscious:** prefers free tiers, monitors usage, wants honest sustainability math. Don't hand-wave costs — give concrete numbers.
- The **TypeScript-permanent** decision and **don't-become-Notion** scope discipline from the original doc still govern.

---

## Current Tech Stack (updated)

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Backend | Hono |
| ORM | Drizzle |
| Database | **PostgreSQL on Neon** (was Railway) |
| AI | **Claude Haiku** (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk` |
| Validation | Zod |
| Auth | Clerk |
| Frontend | React 18+ / Mantine v7 / @mantine/tiptap |
| Server state | TanStack Query |
| Client state | Zustand (persistent) |
| Deploy — backend | **Render** (Dockerfile, free tier) |
| Deploy — frontend | Vercel |
| Scheduler (planned) | **Raspberry Pi** (already runs Hoarder 24/7) |
| Background jobs (planned) | BullMQ + Redis (needs Render $7 tier or Pi) |
| Notifications (planned) | **Web Push** (PWA service worker) — NOT calendar sync |
| Vector search (next build) | pgvector on Neon + `text-embedding-3-small` |

---
