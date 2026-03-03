import { Router } from "express";
import { SitePlannerService } from "../services/site-planner.service";
import {
  updateCanvasStateSchema,
  insertSitePageSchema,
  updateSitePageSchema,
  insertSiteConnectionSchema,
  linkTaskToPageSchema,
} from "../../shared/validators";
import { validateBody } from "../middleware/validation";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createSitePlannerRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  const router = Router({ mergeParams: true });
  const service = new SitePlannerService(db, auditService);

  // GET /api/projects/:idOrSlug/site-plan
  router.get("/", async (req, res, next) => {
    try {
      const result = await service.getOrCreate(req.params.idOrSlug);
      if (!result) {
        return res.status(404).json({ error: "Not Found", message: "Project not found" });
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/projects/:idOrSlug/site-plan
  router.patch(
    "/",
    validateBody(updateCanvasStateSchema),
    async (req, res, next) => {
      try {
        const plan = await service.updatePlan(req.params.idOrSlug, req.body);
        if (!plan) {
          return res.status(404).json({ error: "Not Found", message: "Plan not found" });
        }
        res.json({ plan });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/projects/:idOrSlug/site-plan/pages
  router.post(
    "/pages",
    validateBody(insertSitePageSchema),
    async (req, res, next) => {
      try {
        const page = await service.createPage(req.params.idOrSlug, req.body);
        if (!page) {
          return res.status(404).json({ error: "Not Found", message: "Project/plan not found" });
        }
        res.status(201).json({ page });
      } catch (err) {
        next(err);
      }
    },
  );

  // PATCH /api/projects/:idOrSlug/site-plan/pages/:pageId
  router.patch(
    "/pages/:pageId",
    validateBody(updateSitePageSchema),
    async (req, res, next) => {
      try {
        const pageId = parseInt(req.params.pageId, 10);
        const page = await service.updatePage(pageId, req.body);
        if (!page) {
          return res.status(404).json({ error: "Not Found", message: "Page not found" });
        }
        res.json({ page });
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/projects/:idOrSlug/site-plan/pages/:pageId
  router.delete("/pages/:pageId", async (req, res, next) => {
    try {
      const pageId = parseInt(req.params.pageId, 10);
      const deleted = await service.deletePage(pageId);
      if (!deleted) {
        return res.status(404).json({ error: "Not Found", message: "Page not found" });
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/projects/:idOrSlug/site-plan/connections
  router.post(
    "/connections",
    validateBody(insertSiteConnectionSchema),
    async (req, res, next) => {
      try {
        const connection = await service.createConnection(req.params.idOrSlug, req.body);
        if (!connection) {
          return res.status(404).json({ error: "Not Found", message: "Plan not found" });
        }
        res.status(201).json({ connection });
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/projects/:idOrSlug/site-plan/connections/:connId
  router.delete("/connections/:connId", async (req, res, next) => {
    try {
      const connId = parseInt(req.params.connId, 10);
      const deleted = await service.deleteConnection(connId);
      if (!deleted) {
        return res.status(404).json({ error: "Not Found", message: "Connection not found" });
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/projects/:idOrSlug/site-plan/pages/:pageId/link-task
  router.post(
    "/pages/:pageId/link-task",
    validateBody(linkTaskToPageSchema),
    async (req, res, next) => {
      try {
        const pageId = parseInt(req.params.pageId, 10);
        const page = await service.linkTask(pageId, req.body.taskId);
        if (!page) {
          return res.status(404).json({ error: "Not Found", message: "Page not found" });
        }
        res.json({ page });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
