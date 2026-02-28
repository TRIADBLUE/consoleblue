import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { sharedDocs } from "../../shared/schema";
import {
  insertSharedDocSchema,
  updateSharedDocSchema,
  reorderDocsSchema,
} from "../../shared/validators";
import { validateBody } from "../middleware/validation";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createSharedDocRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  const router = Router();

  // GET /api/docs/shared
  router.get("/", async (_req, res, next) => {
    try {
      const docs = await db
        .select()
        .from(sharedDocs)
        .orderBy(asc(sharedDocs.displayOrder));
      res.json({ docs });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/docs/shared
  router.post(
    "/",
    validateBody(insertSharedDocSchema),
    async (req, res, next) => {
      try {
        // Check slug uniqueness
        const existing = await db
          .select()
          .from(sharedDocs)
          .where(eq(sharedDocs.slug, req.body.slug))
          .limit(1);

        if (existing.length > 0) {
          return res
            .status(409)
            .json({ error: `Shared doc with slug "${req.body.slug}" already exists` });
        }

        const [doc] = await db.insert(sharedDocs).values(req.body).returning();

        await auditService.log({
          action: "create",
          entityType: "shared_doc",
          entityId: doc.id,
          entitySlug: doc.slug,
          newValue: doc,
        });

        res.status(201).json({ doc });
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/docs/shared/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid doc ID" });
      }

      const [doc] = await db
        .select()
        .from(sharedDocs)
        .where(eq(sharedDocs.id, id))
        .limit(1);

      if (!doc) {
        return res.status(404).json({ error: "Shared doc not found" });
      }

      res.json({ doc });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/docs/shared/:id
  router.put(
    "/:id",
    validateBody(updateSharedDocSchema),
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid doc ID" });
        }

        const [existing] = await db
          .select()
          .from(sharedDocs)
          .where(eq(sharedDocs.id, id))
          .limit(1);

        if (!existing) {
          return res.status(404).json({ error: "Shared doc not found" });
        }

        const [updated] = await db
          .update(sharedDocs)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(sharedDocs.id, id))
          .returning();

        await auditService.log({
          action: "update",
          entityType: "shared_doc",
          entityId: id,
          entitySlug: updated.slug,
          previousValue: existing,
          newValue: updated,
        });

        res.json({ doc: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/docs/shared/:id
  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid doc ID" });
      }

      const [deleted] = await db
        .delete(sharedDocs)
        .where(eq(sharedDocs.id, id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Shared doc not found" });
      }

      await auditService.log({
        action: "delete",
        entityType: "shared_doc",
        entityId: id,
        entitySlug: deleted.slug,
        previousValue: deleted,
      });

      res.json({ success: true, deleted: { id, slug: deleted.slug } });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/docs/shared/reorder
  router.post(
    "/reorder",
    validateBody(reorderDocsSchema),
    async (req, res, next) => {
      try {
        const { docIds } = req.body as { docIds: number[] };

        for (let i = 0; i < docIds.length; i++) {
          await db
            .update(sharedDocs)
            .set({ displayOrder: i, updatedAt: new Date() })
            .where(eq(sharedDocs.id, docIds[i]));
        }

        const docs = await db
          .select()
          .from(sharedDocs)
          .orderBy(asc(sharedDocs.displayOrder));

        await auditService.log({
          action: "reorder",
          entityType: "shared_doc",
          newValue: { docIds },
        });

        res.json({ success: true, docs });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
