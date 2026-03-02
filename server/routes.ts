import type { Express } from "express";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { CacheService } from "./services/cache.service";
import { AuditService } from "./services/audit.service";
import { SyncService } from "./services/sync.service";
import { createProjectRoutes } from "./routes/projects";
import { createProjectSettingsRoutes } from "./routes/project-settings";
import { createProjectColorRoutes } from "./routes/project-colors";
import { createGithubRoutes } from "./routes/github";
import { createUserPreferencesRoutes } from "./routes/user-preferences";
import { createHealthRoutes } from "./routes/health";
import { createAuditRoutes } from "./routes/audit";
import { createAuthRoutes } from "./routes/auth";
import { createNotificationRoutes } from "./routes/notifications";
import { createSharedDocRoutes } from "./routes/shared-docs";
import { createProjectDocRoutes } from "./routes/project-docs";
import { createDocPushRoutes } from "./routes/doc-push";
import { createDocGeneratorRoutes } from "./routes/doc-generator";
import { errorHandler } from "./middleware/error-handler";

export function registerRoutes(app: Express, db: NodePgDatabase) {
  // Initialize services
  const cacheService = new CacheService(db);
  const auditService = new AuditService(db);
  const syncService = new SyncService(db, cacheService, auditService);

  // ── API Routes ─────────────────────────────────────
  // IMPORTANT: Register all API routes BEFORE the SPA catch-all

  // Auth — no auth required on these routes (they handle their own)
  app.use("/api/auth", createAuthRoutes(db));

  // Health check — no auth
  app.use("/api/health", createHealthRoutes(db, cacheService));

  // Project CRUD
  app.use("/api/projects", createProjectRoutes(db, auditService));

  // Per-project settings (nested under projects)
  app.use(
    "/api/projects/:idOrSlug/settings",
    createProjectSettingsRoutes(db, auditService),
  );

  // Per-project colors (nested under projects)
  app.use(
    "/api/projects/:idOrSlug/colors",
    createProjectColorRoutes(db, auditService),
  );

  // GitHub proxy with caching
  app.use("/api/github", createGithubRoutes(cacheService, auditService));

  // User preferences
  app.use("/api/user/preferences", createUserPreferencesRoutes(db));

  // Audit log
  app.use("/api/audit", createAuditRoutes(auditService));

  // Notifications (requires auth)
  app.use("/api/notifications", createNotificationRoutes(db));

  // Shared docs (global docs included in every CLAUDE.md push)
  app.use("/api/docs/shared", createSharedDocRoutes(db, auditService));

  // Per-project docs (nested under projects)
  app.use(
    "/api/projects/:idOrSlug/docs",
    createProjectDocRoutes(db, auditService),
  );

  // Doc push (preview, push to GitHub, history)
  app.use(
    "/api/projects/:idOrSlug/docs/push",
    createDocPushRoutes(db, auditService),
  );

  // Doc generator (starter doc generation)
  app.use(
    "/api/projects/:idOrSlug/docs/generate",
    createDocGeneratorRoutes(db, auditService),
  );

  // ── Error Handler ──────────────────────────────────
  app.use(errorHandler);

  // ── Background Sync ────────────────────────────────
  const syncInterval = parseInt(
    process.env.SYNC_INTERVAL_MINUTES || "30",
    10,
  );
  syncService.start(syncInterval);

  // Cache cleanup every 15 minutes
  setInterval(
    async () => {
      try {
        const cleaned = await cacheService.cleanup();
        if (cleaned > 0) {
          console.log(`[cache] Cleaned ${cleaned} expired entries`);
        }
      } catch (err) {
        console.warn("[cache] Cleanup error:", err);
      }
    },
    15 * 60 * 1000,
  );

  return { cacheService, auditService, syncService };
}
