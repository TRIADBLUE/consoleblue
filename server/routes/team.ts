import { Router } from "express";
import { eq } from "drizzle-orm";
import { adminUsers } from "../../shared/schema";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createTeamRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  const router = Router();

  // GET /api/team
  router.get("/", async (_req, res, next) => {
    try {
      const users = await db
        .select({
          id: adminUsers.id,
          email: adminUsers.email,
          displayName: adminUsers.displayName,
          role: adminUsers.role,
          isActive: adminUsers.isActive,
          lastLogin: adminUsers.lastLogin,
          createdAt: adminUsers.createdAt,
        })
        .from(adminUsers);

      res.json({ users });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/team/:id/role
  router.patch("/:id/role", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { role } = req.body;

      if (!role || typeof role !== "string") {
        return res
          .status(400)
          .json({ error: "Validation Error", message: "Role is required" });
      }

      const [existing] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, id))
        .limit(1);

      if (!existing) {
        return res
          .status(404)
          .json({ error: "Not Found", message: "User not found" });
      }

      const [updated] = await db
        .update(adminUsers)
        .set({ role })
        .where(eq(adminUsers.id, id))
        .returning({
          id: adminUsers.id,
          email: adminUsers.email,
          displayName: adminUsers.displayName,
          role: adminUsers.role,
          isActive: adminUsers.isActive,
        });

      await auditService.log({
        action: "update",
        entityType: "admin_user",
        entityId: id,
        previousValue: { role: existing.role },
        newValue: { role },
      });

      res.json({ user: updated });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/team/:id (deactivate)
  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);

      const [existing] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, id))
        .limit(1);

      if (!existing) {
        return res
          .status(404)
          .json({ error: "Not Found", message: "User not found" });
      }

      await db
        .update(adminUsers)
        .set({ isActive: false })
        .where(eq(adminUsers.id, id));

      await auditService.log({
        action: "update",
        entityType: "admin_user",
        entityId: id,
        metadata: { action: "deactivated" },
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
