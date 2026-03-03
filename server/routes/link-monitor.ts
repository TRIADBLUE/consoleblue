import { Router } from "express";
import { eq, desc, and, SQL } from "drizzle-orm";
import { linkChecks, projects } from "../../shared/schema";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createLinkMonitorRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  const router = Router();

  // GET /api/link-monitor
  router.get("/", async (req, res, next) => {
    try {
      const conditions: SQL[] = [];

      if (req.query.projectId) {
        conditions.push(
          eq(linkChecks.projectId, parseInt(req.query.projectId as string, 10)),
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string, 10)
        : 0;

      const checks = await db
        .select()
        .from(linkChecks)
        .where(where)
        .orderBy(desc(linkChecks.checkedAt))
        .limit(limit)
        .offset(offset);

      const all = await db
        .select({ id: linkChecks.id })
        .from(linkChecks)
        .where(where);

      res.json({ checks, total: all.length });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/link-monitor/check
  router.post("/check", async (req, res, next) => {
    try {
      const { projectId } = req.body;

      // Get project to find its URL
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        return res
          .status(404)
          .json({ error: "Not Found", message: "Project not found" });
      }

      const urls = [project.productionUrl, project.subdomainUrl].filter(
        Boolean,
      ) as string[];

      if (urls.length === 0) {
        return res.json({ checks: [], message: "No URLs configured for this project" });
      }

      const results = [];

      for (const url of urls) {
        const startTime = Date.now();
        let statusCode: number | null = null;
        let isHealthy = false;
        let errorMessage: string | null = null;

        try {
          // Normalize URL
          const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
          const response = await fetch(normalizedUrl, {
            method: "HEAD",
            signal: AbortSignal.timeout(10000),
          });
          statusCode = response.status;
          isHealthy = response.ok;
        } catch (err: any) {
          errorMessage = err.message || "Request failed";
        }

        const responseTimeMs = Date.now() - startTime;

        const [check] = await db
          .insert(linkChecks)
          .values({
            projectId,
            url,
            statusCode,
            responseTimeMs,
            isHealthy,
            errorMessage,
          })
          .returning();

        results.push(check);
      }

      res.json({ checks: results });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
