import { Router } from "express";
import { eq, and, asc } from "drizzle-orm";
import { projects, projectDocs } from "../../shared/schema";
import {
  insertProjectDocSchema,
  updateProjectDocSchema,
  reorderDocsSchema,
} from "../../shared/validators";
import { validateBody } from "../middleware/validation";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createProjectDocRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  // Use mergeParams so we can access :idOrSlug from the parent mount
  const router = Router({ mergeParams: true });

  // Helper: resolve project from :idOrSlug
  async function resolveProject(idOrSlug: string) {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const condition = isNumeric
      ? eq(projects.id, parseInt(idOrSlug, 10))
      : eq(projects.slug, idOrSlug);

    const rows = await db.select().from(projects).where(condition).limit(1);
    return rows[0] || null;
  }

  // GET /api/projects/:idOrSlug/docs
  router.get("/", async (req, res, next) => {
    try {
      const project = await resolveProject(req.params.idOrSlug);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const docs = await db
        .select()
        .from(projectDocs)
        .where(eq(projectDocs.projectId, project.id))
        .orderBy(asc(projectDocs.displayOrder));

      res.json({ docs });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/projects/:idOrSlug/docs
  router.post(
    "/",
    validateBody(insertProjectDocSchema),
    async (req, res, next) => {
      try {
        const project = await resolveProject(req.params.idOrSlug);
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

        // Check slug uniqueness within project
        const existing = await db
          .select()
          .from(projectDocs)
          .where(
            and(
              eq(projectDocs.projectId, project.id),
              eq(projectDocs.slug, req.body.slug),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          return res.status(409).json({
            error: `Project doc with slug "${req.body.slug}" already exists for this project`,
          });
        }

        const [doc] = await db
          .insert(projectDocs)
          .values({ ...req.body, projectId: project.id })
          .returning();

        await auditService.log({
          action: "create",
          entityType: "project_doc",
          entityId: doc.id,
          entitySlug: doc.slug,
          newValue: doc,
          metadata: { projectId: project.id, projectSlug: project.slug },
        });

        res.status(201).json({ doc });
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/projects/:idOrSlug/docs/:docId
  router.get("/:docId", async (req, res, next) => {
    try {
      const project = await resolveProject(req.params.idOrSlug);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const docId = parseInt(req.params.docId, 10);
      if (isNaN(docId)) {
        return res.status(400).json({ error: "Invalid doc ID" });
      }

      const [doc] = await db
        .select()
        .from(projectDocs)
        .where(
          and(
            eq(projectDocs.id, docId),
            eq(projectDocs.projectId, project.id),
          ),
        )
        .limit(1);

      if (!doc) {
        return res.status(404).json({ error: "Project doc not found" });
      }

      res.json({ doc });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/projects/:idOrSlug/docs/:docId
  router.put(
    "/:docId",
    validateBody(updateProjectDocSchema),
    async (req, res, next) => {
      try {
        const project = await resolveProject(req.params.idOrSlug);
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

        const docId = parseInt(req.params.docId, 10);
        if (isNaN(docId)) {
          return res.status(400).json({ error: "Invalid doc ID" });
        }

        const [existing] = await db
          .select()
          .from(projectDocs)
          .where(
            and(
              eq(projectDocs.id, docId),
              eq(projectDocs.projectId, project.id),
            ),
          )
          .limit(1);

        if (!existing) {
          return res.status(404).json({ error: "Project doc not found" });
        }

        const [updated] = await db
          .update(projectDocs)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(projectDocs.id, docId))
          .returning();

        await auditService.log({
          action: "update",
          entityType: "project_doc",
          entityId: docId,
          entitySlug: updated.slug,
          previousValue: existing,
          newValue: updated,
          metadata: { projectId: project.id, projectSlug: project.slug },
        });

        res.json({ doc: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/projects/:idOrSlug/docs/:docId
  router.delete("/:docId", async (req, res, next) => {
    try {
      const project = await resolveProject(req.params.idOrSlug);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const docId = parseInt(req.params.docId, 10);
      if (isNaN(docId)) {
        return res.status(400).json({ error: "Invalid doc ID" });
      }

      const [deleted] = await db
        .delete(projectDocs)
        .where(
          and(
            eq(projectDocs.id, docId),
            eq(projectDocs.projectId, project.id),
          ),
        )
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Project doc not found" });
      }

      await auditService.log({
        action: "delete",
        entityType: "project_doc",
        entityId: docId,
        entitySlug: deleted.slug,
        previousValue: deleted,
        metadata: { projectId: project.id, projectSlug: project.slug },
      });

      res.json({ success: true, deleted: { id: docId, slug: deleted.slug } });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/projects/:idOrSlug/docs/reorder
  router.post(
    "/reorder",
    validateBody(reorderDocsSchema),
    async (req, res, next) => {
      try {
        const project = await resolveProject(req.params.idOrSlug);
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

        const { docIds } = req.body as { docIds: number[] };

        for (let i = 0; i < docIds.length; i++) {
          await db
            .update(projectDocs)
            .set({ displayOrder: i, updatedAt: new Date() })
            .where(
              and(
                eq(projectDocs.id, docIds[i]),
                eq(projectDocs.projectId, project.id),
              ),
            );
        }

        const docs = await db
          .select()
          .from(projectDocs)
          .where(eq(projectDocs.projectId, project.id))
          .orderBy(asc(projectDocs.displayOrder));

        await auditService.log({
          action: "reorder",
          entityType: "project_doc",
          newValue: { docIds },
          metadata: { projectId: project.id, projectSlug: project.slug },
        });

        res.json({ success: true, docs });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
