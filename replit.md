# ConsoleBlue

Central management dashboard for the TriadBlue ecosystem. Manages multiple projects (triadblue, consoleblue, linkblue, hostsblue, swipesblue, businessblueprint, scansblue) with GitHub integration, audit logging, and magic link authentication.

## Architecture

- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS, Radix UI, TanStack Query, Wouter router
- **Backend**: Express.js + TypeScript (tsx in dev, esbuild bundle in prod)
- **Database**: PostgreSQL (Replit-managed) with Drizzle ORM
- **Auth**: Magic link login via Resend email API (admin_users table)
- **Session**: PostgreSQL-backed sessions via connect-pg-simple

## Project Structure

```
client/             # React frontend (Vite SPA)
  src/
    components/     # UI components (Radix-based)
    hooks/          # React Query hooks
    lib/            # API client, utilities
    pages/          # Route pages
  public/           # Static assets (brand icons)
server/
  db/               # Database connection, seed data
  middleware/        # Auth, validation, error handling
  routes/           # Express route handlers
  services/         # Audit, cache, GitHub sync, sync service
  scripts/          # Password reset utilities
shared/
  schema.ts         # Drizzle schema (all tables)
  types.ts          # Shared TypeScript types
  validators.ts     # Zod validation schemas
```

## Key Configuration

- **Dev command**: `NODE_ENV=development npm run dev` (uses Vite middleware)
- **Build**: `npm run build` (vite build + esbuild server bundle)
- **Production**: `NODE_ENV=production node dist/index.js` (serves from dist/public/)
- **Port**: 5000 (both dev and prod)
- **Admin login**: dashboard@console.blue (magic link via email)

## Environment Variables (Secrets)

- DATABASE_URL - PostgreSQL connection string (Replit-managed)
- SESSION_SECRET - Express session secret
- GITHUB_TOKEN - GitHub API token for repo sync
- GITHUB_OWNER / GITHUB_USERNAME - GitHub org/user
- CONSOLE_API_KEY - API key for programmatic access
- RESEND_API_KEY - Resend email service for magic links
- FRONTEND_URL - Production URL (https://console.blue)
- COOKIE_DOMAIN - Cookie domain for sessions
- PORKBUN_API_KEY / PORKBUN_SECRET_KEY - Domain management

## Database Tables

projects, project_settings, admin_users, admin_sessions, password_reset_tokens, user_preferences, github_sync_cache, audit_log, notifications, notification_preferences, shared_docs, project_docs, doc_push_log, session
