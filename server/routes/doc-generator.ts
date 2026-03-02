import { Router } from "express";
import { eq, and, asc } from "drizzle-orm";
import { projects, projectDocs } from "../../shared/schema";
import { docGenerateSchema } from "../../shared/validators";
import { validateBody } from "../middleware/validation";
import { docGeneratorService } from "../services/doc-generator.service";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createDocGeneratorRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
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

  // POST /api/projects/:idOrSlug/docs/generate
  // Generates and saves starter project docs. Skips if docs already exist
  // unless { force: true } is passed in the body.
  router.post(
    "/",
    validateBody(docGenerateSchema),
    async (req, res, next) => {
      try {
        const project = await resolveProject(req.params.idOrSlug);
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

        const { force } = req.body as { force?: boolean };

        // Check for existing docs
        const existing = await db
          .select()
          .from(projectDocs)
          .where(eq(projectDocs.projectId, project.id))
          .limit(1);

        if (existing.length > 0 && !force) {
          return res.status(409).json({
            error:
              "Project already has docs. Pass { force: true } to regenerate.",
          });
        }

        // Map project DB row to the Project type expected by the service
        const projectForService = {
          id: project.id,
          slug: project.slug,
          displayName: project.displayName,
          description: project.description,
          githubRepo: project.githubRepo,
          githubOwner: project.githubOwner,
          defaultBranch: project.defaultBranch,
          colorPrimary: project.colorPrimary,
          colorAccent: project.colorAccent,
          colorBackground: project.colorBackground,
          iconUrl: project.iconUrl,
          iconEmoji: project.iconEmoji,
          status: project.status as
            | "active"
            | "archived"
            | "maintenance"
            | "development"
            | "planned",
          displayOrder: project.displayOrder,
          visible: project.visible,
          tags: (project.tags as string[]) || [],
          subdomainUrl: project.subdomainUrl,
          productionUrl: project.productionUrl,
          customSettings: (project.customSettings as Record<string, unknown>) || {},
          lastSyncedAt: project.lastSyncedAt
            ? project.lastSyncedAt.toISOString()
            : null,
          syncEnabled: project.syncEnabled,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        };

        const generated = docGeneratorService.generate(projectForService);

        const insertedDocs = [];
        for (let i = 0; i < generated.length; i++) {
          const { slug, title, content } = generated[i];

          // Skip if a doc with this slug already exists for the project
          const [existingDoc] = await db
            .select()
            .from(projectDocs)
            .where(
              and(
                eq(projectDocs.projectId, project.id),
                eq(projectDocs.slug, slug),
              ),
            )
            .limit(1);

          if (existingDoc && !force) {
            insertedDocs.push(existingDoc);
            continue;
          }

          if (existingDoc && force) {
            const [updated] = await db
              .update(projectDocs)
              .set({ title, content, displayOrder: i, updatedAt: new Date() })
              .where(eq(projectDocs.id, existingDoc.id))
              .returning();
            insertedDocs.push(updated);
          } else {
            const [doc] = await db
              .insert(projectDocs)
              .values({
                projectId: project.id,
                slug,
                title,
                content,
                displayOrder: i,
              })
              .returning();
            insertedDocs.push(doc);
          }
        }

        await auditService.log({
          action: "create",
          entityType: "doc_generate",
          entityId: project.id,
          entitySlug: project.slug,
          newValue: { generated: insertedDocs.length, force: !!force },
          metadata: { projectId: project.id, projectSlug: project.slug },
        });

        // Return full doc list in display order
        const allDocs = await db
          .select()
          .from(projectDocs)
          .where(eq(projectDocs.projectId, project.id))
          .orderBy(asc(projectDocs.displayOrder));

        res.status(201).json({
          docs: allDocs,
          generated: insertedDocs.length,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
