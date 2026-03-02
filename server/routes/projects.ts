import { Router } from "express";
import { eq, asc, desc, and, SQL } from "drizzle-orm";
import { projects } from "../../shared/schema";
import {
  insertProjectSchema,
  updateProjectSchema,
  reorderProjectsSchema,
} from "../../shared/validators";
import { validateBody } from "../middleware/validation";
import { DocGeneratorService } from "../services/doc-generator.service";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createProjectRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  const router = Router();
  const docGenerator = new DocGeneratorService(db, auditService);

  // Helper: find project by ID or slug
  async function findProject(idOrSlug: string) {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const condition = isNumeric
      ? eq(projects.id, parseInt(idOrSlug, 10))
      : eq(projects.slug, idOrSlug);

    const rows = await db.select().from(projects).where(condition).limit(1);
    return rows[0] || null;
  }

  // GET /api/projects
  router.get("/", async (req, res, next) => {
    try {
      const conditions: SQL[] = [];

      if (req.query.status) {
        conditions.push(
          eq(projects.status, req.query.status as string),
        );
      }
      if (req.query.visible !== undefined) {
        conditions.push(
          eq(projects.visible, req.query.visible === "true"),
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortField = req.query.sort as string || "display_order";
      const sortOrder = req.query.order === "desc" ? desc : asc;

      const sortColumn =
        sortField === "display_name"
          ? projects.displayName
          : sortField === "updated_at"
            ? projects.updatedAt
            : sortField === "created_at"
              ? projects.createdAt
              : projects.displayOrder;

      const rows = await db
        .select()
        .from(projects)
        .where(where)
        .orderBy(sortColumn);

      // Filter by tag if specified (jsonb array contains)
      let result = rows;
      if (req.query.tag) {
        const tag = req.query.tag as string;
        result = rows.filter(
          (p) => Array.isArray(p.tags) && p.tags.includes(tag),
        );
      }

      res.json({ projects: result, total: result.length });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/projects/:idOrSlug
  router.get("/:idOrSlug", async (req, res, next) => {
    try {
      const project = await findProject(req.params.idOrSlug);
      if (!project) {
        return res.status(404).json({
          error: "Not Found",
          message: `Project "${req.params.idOrSlug}" not found`,
        });
      }

      // Include settings
      const { projectSettings } = await import("../../shared/schema");
      const settings = await db
        .select()
        .from(projectSettings)
        .where(eq(projectSettings.projectId, project.id));

      res.json({ project, settings });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/projects
  router.post(
    "/",
    validateBody(insertProjectSchema),
    async (req, res, next) => {
      try {
        // Check slug uniqueness
        const existing = await db
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.slug, req.body.slug))
          .limit(1);

        if (existing.length > 0) {
          return res.status(409).json({
            error: "Conflict",
            message: `A project with slug "${req.body.slug}" already exists`,
          });
        }

        const [project] = await db
          .insert(projects)
          .values(req.body)
          .returning();

        await auditService.log({
          action: "create",
          entityType: "project",
          entityId: project.id,
          entitySlug: project.slug,
          newValue: project,
        });

        // Auto-generate onboarding docs for the new project
        try {
          const genResult = await docGenerator.generateForNewProject(project.id);
          console.log(
            `[projects] Auto-generated ${genResult.docsCreated} docs for ${project.slug}` +
            (genResult.autoPushed ? ` (pushed to GitHub: ${genResult.commitSha?.slice(0, 7)})` : "")
          );
        } catch (docErr) {
          // Don't fail the project creation if doc generation fails
          console.error(`[projects] Doc auto-generation failed for ${project.slug}:`, docErr);
        }

        res.status(201).json({ project });
      } catch (err) {
        next(err);
      }
    },
  );

  // PUT /api/projects/:idOrSlug
  router.put(
    "/:idOrSlug",
    validateBody(updateProjectSchema),
    async (req, res, next) => {
      try {
        const existing = await findProject(req.params.idOrSlug);
        if (!existing) {
          return res.status(404).json({
            error: "Not Found",
            message: `Project "${req.params.idOrSlug}" not found`,
          });
        }

        const [updated] = await db
          .update(projects)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(projects.id, existing.id))
          .returning();

        await auditService.log({
          action: "update",
          entityType: "project",
          entityId: existing.id,
          entitySlug: existing.slug,
          previousValue: existing,
          newValue: updated,
        });

        res.json({ project: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/projects/:idOrSlug
  router.delete("/:idOrSlug", async (req, res, next) => {
    try {
      const existing = await findProject(req.params.idOrSlug);
      if (!existing) {
        return res.status(404).json({
          error: "Not Found",
          message: `Project "${req.params.idOrSlug}" not found`,
        });
      }

      const hard = req.query.hard === "true";

      if (hard) {
        await db.delete(projects).where(eq(projects.id, existing.id));
      } else {
        // Soft delete: archive and hide
        await db
          .update(projects)
          .set({
            status: "archived",
            visible: false,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, existing.id));
      }

      await auditService.log({
        action: "delete",
        entityType: "project",
        entityId: existing.id,
        entitySlug: existing.slug,
        previousValue: existing,
        metadata: { hard },
      });

      res.json({
        success: true,
        deleted: { id: existing.id, slug: existing.slug },
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/projects/reorder
  router.post(
    "/reorder",
    validateBody(reorderProjectsSchema),
    async (req, res, next) => {
      try {
        const { projectIds } = req.body as { projectIds: number[] };

        // Update display_order for each project in a transaction-like sequence
        for (let i = 0; i < projectIds.length; i++) {
          await db
            .update(projects)
            .set({ displayOrder: i, updatedAt: new Date() })
            .where(eq(projects.id, projectIds[i]));
        }

        const updated = await db
          .select()
          .from(projects)
          .orderBy(asc(projects.displayOrder));

        await auditService.log({
          action: "reorder",
          entityType: "project",
          newValue: { projectIds },
        });

        res.json({ success: true, projects: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
