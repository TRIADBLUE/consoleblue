# CLAUDE.md — Console.Blue
# Last updated: 2026-04-11

---

## READ THE UNIVERSAL RULES FIRST

Before doing ANY work, read the TRIADBLUE universal rules at `~/.claude/CLAUDE.md`. If you are working remotely and need to fetch them:
```
curl -s "https://linkblue-githubproxy.up.railway.app/api/github/file?repo=.github&path=CLAUDE.md"
```
Those rules govern colors, fonts, naming, payments, and ecosystem standards. They are non-negotiable.

**This file is hand-edited, not auto-generated.** The previous version of this file was assembled by the Console.Blue Doc Planner. That assembly path must NOT be pushed to `main` anymore — this CLAUDE.md is now the source of truth, matching the businessblueprint.io process so every TRIADBLUE repo follows the same convention.

---

## PLATFORM IDENTITY

**Name:** Console.Blue
**Tagline:** Internal operations interface for the TRIADBLUE ecosystem
**Role:** Central ops panel — NOT customer-facing. Consoles are for EXECUTING, not viewing.
**Status:** 35% complete
**Stack:** React + TypeScript + Vite + Tailwind + shadcn/ui + Express + Drizzle ORM + PostgreSQL + Wouter
**Deployment:** Replit (autoscale, Node.js 20)
**Database:** PostgreSQL 16 (Replit-managed). Sessions, caching, audit logs, and binary assets all stored in DB — no Redis.
**Live URL:** https://console.blue
**Repository:** TRIADBLUE/consoleblue (`main` branch is production)
**Local path:** `/Users/deanlewis/consoleblue/consoleblue-repo`

**Subdomain to shut down:** `consoleblue.triadblue.com` is a legacy deployment that still serves TRIADBLUE parent favicons. It must be decommissioned. Do NOT push changes to it.

---

## NAMING — CONSOLE vs PANEL vs DASHBOARD

Matches the global TRIADBLUE convention:
- **Dashboard** = customer-facing — for VIEWING
- **Panel** = admin-facing — for EXECUTING
- **Console** = internal ops — for EXECUTING

Console.Blue is a **console**. Every UI decision should assume the user is Dean or a TRIADBLUE operator, not a customer.

---

## ARCHITECTURE

### The Wagon-Wheel Model

Console.Blue is the HUB. Every other TRIADBLUE site is a spoke. One change in Console.Blue should propagate across the entire ecosystem — favicons, brand colors, shared docs, AI provider configs, link health, asset URLs. If a fact lives in more than one place, that is a bug.

### OGA — Online Global Assets (the heart of the wagon wheel)

**Files:**
- `server/routes/oga.ts` — all OGA endpoints (embed.js, config, admin CRUD)
- `server/db/seed-oga-assets.ts` — bulk seed script for TRIADBLUE sites
- `shared/schema.ts` lines 740–789 — `ogaSites` + `ogaAssets` tables

**How it works:**
1. Every TRIADBLUE site embeds one line in its `<head>`:
   ```html
   <script src="https://console.blue/api/oga/embed.js?key=oga_XXXX" async></script>
   ```
2. `GET /api/oga/embed.js?key=...` returns a small JS bundle that fetches `GET /api/oga/config?key=...`, strips existing `<link rel="icon">`/apple-touch/manifest tags, and injects the OGA ones.
3. Asset types are canonical kebab-case keys: `logo-image-16px`, `logo-image-32px`, `logo-image-48px`, `logo-image-180px`, `logo-image-192px`, `logo-image-512px`, `logo-image-icon`, `theme-color`, `og-image`, `site-name`. The embed script converts them to camelCase at apply time.
4. Subdomains inherit from their parent domain unless `emancipated = true`. `extractRootDomain()` handles the split.
5. Client-side cache: sessionStorage, 5-minute TTL. Server cache headers: 5 min on `/config`, 1 hour on `/embed.js`.
6. Asset binaries live in the `assets` table (bytea) and are served via `/api/assets/file/:id`. This replaced filesystem storage (commit 483bc19).

**Valid `ogaSite.status` values:** `active`, `disabled`, `pending`. Only `active` returns config.

### Single-app Express + Vite SSR

`dev`: `tsx server/index.ts` (Vite in middleware mode).
`build`: `vite build` then `esbuild server/index.ts --bundle --platform=node --format=esm --packages=external`.
`start`: `NODE_ENV=production node dist/index.js`.

Public static dir: `dist/public`. Port: 5000.

### Authentication

Session-based via `connect-pg-simple`. Passwords hashed with bcrypt. Password reset via Resend email + `passwordResetTokens` table. All mutation routes require `createAuthMiddleware(db)`. Admin OGA endpoints sit behind the same middleware; public OGA (`/config`, `/embed.js`) does not.

### Key Files

- `server/routes.ts` — route registration
- `server/routes/oga.ts` — OGA endpoints (536 lines)
- `server/routes/projects.ts` — project CRUD
- `server/routes/tasks.ts` — task board
- `server/routes/github.ts` — cached GitHub API proxy
- `server/routes/chat.ts` — multi-provider AI chat
- `server/routes/assets.ts` — binary asset upload/fetch
- `server/services/cache.service.ts` — PostgreSQL TTL cache
- `server/services/sync.service.ts` — background GitHub sync
- `server/services/audit.service.ts` — writes to `auditLog` on every mutation
- `server/services/ai/providers/` — anthropic, openai, google, kimi, deepseek, groq
- `server/db/seed.ts` — base seed
- `server/db/seed-oga-assets.ts` — OGA asset seed (must be run AFTER `ogaSites` rows exist)
- `shared/schema.ts` — 23 Drizzle tables
- `shared/validators.ts` — Zod request schemas
- `client/src/App.tsx` — Wouter router
- `client/src/pages/OgaPage.tsx` — admin UI for managing OGA sites and assets
- `client/index.html` — Console.Blue's own favicons + OGA embed script
- `.replit` — Replit deploy config (autoscale)

### Database Tables (23)

Project management: `projects`, `projectSettings`, `projectDocs`, `sharedDocs`.
Auth: `adminUsers`, `adminSessions`, `passwordResetTokens`.
Tasks: `tasks`, `taskNotes`, `taskHighlights`.
Site planner: `sitePlans`, `sitePages`, `siteConnections`.
Notifications: `notifications`, `notificationPreferences`.
Caching/audit: `githubSyncCache`, `auditLog`, `docPushLog`.
AI chat: `chatThreads`, `chatMessages`, `aiProviderConfigs`.
Assets: `assets` (bytea binary storage).
Monitoring: `linkChecks`.
OGA: `ogaSites`, `ogaAssets`.

### Payment Rules

Same as the rest of the ecosystem: all payment processing goes through swipesblue.com only. The words "Stripe" and "NMI" must never appear in this codebase. Console.Blue does not currently process payments — if that changes, it goes through SwipesBlue.

---

## BRAND — CONSOLE.BLUE SPECIFIC

- App accent color in global rules: **#FF44CC** (the `/ post` color is currently listed as Console.Blue's primary — verify with Dean before using in new UI).
- Archivo Semi Expanded for display type. Inter for body (already loaded in `client/index.html`).
- Triad Black `#09080E`, Triad White `#E9ECF0`, Triad Gray `#808080`.
- Pure Blue `#0000FF` is NEVER used in UI — logo images only. The current `<meta name="theme-color" content="#0000FF" />` in `client/index.html` is legacy and should be moved to OGA-managed `theme-color` once Console.Blue itself is fully OGA-driven.
- Casing: **Console.Blue** as shown (dot separator, both words capped). In code/slugs: `consoleblue`.

---

## DEPLOYMENT & GIT WORKFLOW

- Current workflow: commits land on `main`, Replit autoscale picks them up.
- No staging branch exists yet. Before any destructive or high-risk change, create one.
- Every "Published your App" commit in git history is a Replit auto-commit. Treat them as deploy markers, not meaningful changes.
- `dist/` should be gitignored (verify before committing).
- NEVER tell Dean to pull until code has been pushed to origin.

---

## COMPLETED SYSTEMS

- Core project management CRUD with filtering, reordering, color picker ✓
- Admin auth: login, sessions, password reset, account locking ✓
- GitHub API proxy with PostgreSQL cache layer (configurable TTL per endpoint) ✓
- Task management with Kanban board, notes, code highlights, hierarchical parent tasks ✓
- Site planner with drag-and-drop diagram editor (`@dnd-kit`) ✓
- Multi-provider AI chat: Anthropic, OpenAI, Google, Kimi, Deepseek, Groq, Replit, Claude Code ✓
- Doc system: shared docs + per-project docs + Doc Planner assembly + push to GitHub repo ✓
- Asset manager: binary storage in PostgreSQL `assets` table ✓
- Audit logging on every mutation with before/after snapshots ✓
- Notifications with per-user preferences ✓
- Link health monitor (`linkChecks`) ✓
- OGA system — schema, admin CRUD, embed script, config endpoint, seed script for businessblueprint.io, swipesblue.com, hostsblue.com ✓
- Security hardening: global auth enforcement, cleaned logs, working password change (commit fb4cef2) ✓
- Asset storage migration — filesystem → database (commit 483bc19) ✓

## PENDING

- **BROKEN: businessblueprint.io favicon** — site loads OGA embed but shows `data:,` blank icon. Root cause: either the `ogaSites` row for `businessblueprint.io` doesn't exist in production DB, or its assets weren't seeded, or the embed key in the live site doesn't match the DB. Needs diagnosis against production DB.
- **BROKEN: Console.Blue's own OGA embed** — `client/index.html` line 42 references `OGA_KEY_CONSOLEBLUE` as a literal placeholder, not a real key. Must be replaced with a real key (generated by creating a `ogaSites` row for `console.blue`) or a build-time env var injected by Vite (`import.meta.env.VITE_OGA_KEY_CONSOLEBLUE`).
- **SHUTDOWN: consoleblue.triadblue.com** — legacy subdomain still live, serving TRIADBLUE parent favicons from `/favicons/triadblue/`. Must be decommissioned. Deployment source is unknown — likely a Replit project separate from this one.
- **Favicon audit across ecosystem** — hostsblue.com has only one `<link rel="icon">` and no apple-touch/og:image/manifest. scansblue.com, swipesblue.com, TRIADBLUE.COM all have relative `og:image` paths that break social preview cards. Once OGA is proven working on businessblueprint.io, roll the fix to every site.
- **No OGA seed data for `ogaSites`** — `seed-oga-assets.ts` assumes site rows already exist. Needs a companion seed that creates rows for businessblueprint.io, swipesblue.com, hostsblue.com, scansblue.com, linkblue.systems, triadblue.com, and console.blue (emancipated=true for the last).
- **Doc Planner auto-push to CLAUDE.md** — previously overwrote this file with assembled content. Disable or redirect that flow so hand-edited CLAUDE.md is authoritative.
- **Staging environment** — no staging branch or environment exists. Every change goes straight to main → autoscale.
- **OGA asset type registry** — kebab-case → camelCase conversion is implicit in `oga.ts`. Should be a shared enum in `shared/schema.ts` so client and server agree on valid keys.
- **OGA health endpoint** — `/api/oga/health?key=...` that returns `{ ok: true, site: "console.blue", assetCount: 12 }` to make debugging easier.
- **Seed script improvements** — `seed-oga-assets.ts` currently O(n²) (refetches all assets per asset). Fine for now, but note it.
- **OG image absolute-URL audit** — every TRIADBLUE site has some form of broken social preview because `og:image` paths are relative. OGA should enforce absolute URLs.

---

## CURRENT STATE CHANGELOG

| Date | Changes |
|------|---------|
| 2026-04-11 | CLAUDE.md rewritten in businessblueprint.io format. Replaces Doc-Planner-generated version. Documents OGA system as the wagon-wheel hub. Catalogs known browser-icon failures across the ecosystem. |

**AGENTS: Update this section on every commit. Your work is not done until this changelog reflects it.**
**AGENTS: Do not re-enable the Doc Planner auto-push to this file. If you do, Dean will lose his hand edits.**
